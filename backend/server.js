const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const app = express();
app.use(cors({
  origin: FRONTEND_URL === '*' ? true : FRONTEND_URL.split(',').map(s => s.trim()),
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL === '*' ? true : FRONTEND_URL.split(',').map(s => s.trim()),
    credentials: true
  }
});

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
  // verifica se mesa com mesmo nome já existe
  const existing = Object.values(DB).find(s => s.name === name);
  if (existing) {
    return res.json({ ok: true, session: existing, existing: true });
  }
  const code = genCode(name);
  // impede código duplicado (embora improvável)
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
    mode: 'split' // 'split' (default) or 'free' (sem racha)
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
  if (!session) return res.status(404).json({ ok: false });
  res.json({ ok: true, session });
});

app.post('/api/sessions/:code/members', (req, res) => {
  const { code } = req.params;
  const { name, cash } = req.body;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false });
  const member = { id: uuidv4(), name, cash: cash||0, paid: 0, balance: 0 };
  session.members.push(member);
  saveData(DB);
  io.to(code).emit('session:update', session);
  res.json({ ok: true, member });
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
  if (!session) return res.status(404).json({ ok: false });
  // Se nenhum consumidor selecionado, dividir entre todos
  const finalConsumers = Array.isArray(consumers) && consumers.length > 0 ? consumers : session.members.map(m => m.id);
  const expense = { id: uuidv4(), item, value: Number(value), paid_by, consumers: finalConsumers, created_at: new Date().toISOString() };
  session.expenses.push(expense);
  recalcBalances(session);
  saveData(DB);
  io.to(code).emit('session:update', session);
  res.json({ ok: true, expense, session });
});

app.delete('/api/sessions/:code/expenses/:expenseId', (req, res) => {
  const { code, expenseId } = req.params;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false });
  const idx = session.expenses.findIndex(e => e.id === expenseId);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Gasto não encontrado' });
  session.expenses.splice(idx, 1);
  recalcBalances(session);
  saveData(DB);
  io.to(code).emit('session:update', session);
  res.json({ ok: true, session });
});

app.post('/api/sessions/:code/close', (req, res) => {
  const { code } = req.params;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false });
  // create history item
  const total = session.expenses.reduce((s,e)=>s+e.value,0);
  const balances = session.members.map(m => ({ name: m.name, paid: session.expenses.filter(e=>e.paid_by===m.id).reduce((s,e)=>s+e.value,0) }));
  const top = balances.sort((a,b)=>b.paid - a.paid)[0];
  const hist = { id: uuidv4(), total, winner: top ? top.name : null, created_at: new Date().toISOString() };
  session.history = session.history || [];
  session.history.push(hist);
  saveData(DB);
  io.to(code).emit('session:closed', { session, hist });
  res.json({ ok: true, hist });
});

// Update session mode (split or free)
app.post('/api/sessions/:code/mode', (req, res) => {
  const { code } = req.params;
  const { mode } = req.body; // expected 'split' or 'free'
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false });
  session.mode = mode === 'free' ? 'free' : 'split';
  saveData(DB);
  io.to(code).emit('session:update', session);
  res.json({ ok: true, mode: session.mode });
});

app.post('/api/sessions/:code/reset', (req, res) => {
  const { code } = req.params;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false });
  session.members = [];
  session.expenses = [];
  session.history = [];
  saveData(DB);
  io.to(code).emit('session:reset', session);
  res.json({ ok: true });
});

app.post('/api/sessions/admin/delete-all', (req, res) => {
  const { password } = req.body;
  if (password !== 'admin') return res.status(403).json({ ok: false, error: 'Senha incorreta' });
  // Delete all sessions but keep bars
  const keys = Object.keys(DB);
  for (let key of keys) {
    if (DB[key].code) { // it's a session, not bars
      delete DB[key];
    }
  }
  saveData(DB);
  res.json({ ok: true });
});

app.patch('/api/sessions/:code/members/:memberId/paid', (req, res) => {
  const { code, memberId } = req.params;
  const { paid } = req.body;
  const session = DB[code];
  if (!session) return res.status(404).json({ ok: false });
  const member = session.members.find(m => m.id === memberId);
  if (!member) return res.status(404).json({ ok: false });
  member.paid = Number(paid);
  saveData(DB);
  io.to(code).emit('session:update', session);
  res.json({ ok: true, member });
});

io.on('connection', (socket) => {
  socket.on('join', (code) => {
    socket.join(code);
    const session = DB[code];
    if (session) socket.emit('session:update', session);
  });
});

// Serve frontend em producao
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, ()=>{
  console.log('Server running on', PORT);
});
