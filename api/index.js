const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = '/tmp/racha-data.json'; // Usar /tmp pois é persistente na Vercel

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Erro ao salvar dados:', e);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const app = express();
app.use(cors({
  origin: FRONTEND_URL === '*' ? true : FRONTEND_URL.split(',').map(s => s.trim()),
  credentials: true
}));
app.use(express.json());

let DB = loadData();
DB.bars = DB.bars || {};

function genCode(name) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const base = (name || 'MESA').replace(/[^A-Z0-9]/gi, '').slice(0,6).toUpperCase() || 'MESA';
  return `${base}-${rand}`;
}

app.post('/api/bars', (req, res) => {
  const { name, password, email, phone } = req.body;
  if (DB.bars[name]) return res.status(400).json({ ok: false, error: 'Bar já existe' });
  DB.bars[name] = { password, email, phone, sessions: [] };
  saveData(DB);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  if (!DB.bars[name] || DB.bars[name].password !== password) return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
  res.json({ ok: true, bar: name });
});

app.post('/api/sessions', (req, res) => {
  const { name } = req.body;
  const existing = Object.values(DB).find(s => s.name === name && s.code);
  if (existing) {
    return res.json({ ok: true, session: existing, existing: true });
  }
  const code = genCode(name);
  if (Object.values(DB).some(s => s.code === code)) {
    return res.status(400).json({ ok: false, error: 'Código gerado já existe, tente novamente!' });
  }
  const session = {
    id: uuidv4(),
    code,
    name: name || code,
    created_at: new Date().toISOString(),
    members: [],
    expenses: [],
    history: [],
    mode: 'split'
  };
  DB[code] = session;
  saveData(DB);
  res.json({ ok: true, session });
});

app.get('/api/sessions', (req, res) => {
  const sessions = Object.values(DB).filter(s => s.code).map(s => ({ code: s.code, name: s.name, created_at: s.created_at, memberCount: s.members.length }));
  res.json({ ok: true, sessions });
});

app.get('/api/sessions/:code', (req, res) => {
  const { code } = req.params;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
  res.json({ ok: true, session });
});

app.post('/api/sessions/:code/members', (req, res) => {
  const { code } = req.params;
  const { name, cash } = req.body;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
  const member = { id: uuidv4(), name, cash: cash||0, paid: 0, balance: 0 };
  session.members.push(member);
  saveData(DB);
  res.json({ ok: true, member, session });
});

function recalcBalances(session) {
  const members = session.members;
  if (members.length > 0) {
    members.forEach(m => {
      const paid = session.expenses.filter(e => e.paid_by === m.id).reduce((s, e) => s + e.value, 0);
      const consumed = session.expenses
        .filter(e => Array.isArray(e.consumers) && e.consumers.includes(m.id))
        .reduce((s, e) => s + (e.consumers.length > 0 ? e.value / e.consumers.length : e.value), 0);
      m.balance = Number((paid - consumed).toFixed(2));
    });
  }
}

app.post('/api/sessions/:code/expenses', (req, res) => {
  const { code } = req.params;
  const { item, value, paid_by, consumers } = req.body;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
  const finalConsumers = Array.isArray(consumers) && consumers.length > 0 ? consumers : session.members.map(m => m.id);
  const expense = { id: uuidv4(), item, value: Number(value), paid_by, consumers: finalConsumers, created_at: new Date().toISOString() };
  session.expenses.push(expense);
  recalcBalances(session);
  saveData(DB);
  res.json({ ok: true, expense, session });
});

app.delete('/api/sessions/:code/expenses/:expenseId', (req, res) => {
  const { code, expenseId } = req.params;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
  const idx = session.expenses.findIndex(e => e.id === expenseId);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Gasto não encontrado' });
  session.expenses.splice(idx, 1);
  recalcBalances(session);
  saveData(DB);
  res.json({ ok: true, session });
});

app.post('/api/sessions/:code/reset', (req, res) => {
  const { code } = req.params;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
  session.members = [];
  session.expenses = [];
  session.history = [];
  saveData(DB);
  res.json({ ok: true, session });
});

app.post('/api/sessions/admin/delete-all', (req, res) => {
  const { password } = req.body;
  if (password !== 'admin') return res.status(403).json({ ok: false, error: 'Senha incorreta' });
  const keys = Object.keys(DB);
  for (let key of keys) {
    if (DB[key].code) {
      delete DB[key];
    }
  }
  saveData(DB);
  res.json({ ok: true });
});

app.post('/api/sessions/:code/mode', (req, res) => {
  const { code } = req.params;
  const { mode } = req.body;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
  session.mode = mode === 'free' ? 'free' : 'split';
  saveData(DB);
  res.json({ ok: true, session });
});

module.exports = app;
