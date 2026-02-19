const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = '/tmp/racha-data.json';

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw || '{}');
    }
    return {};
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Erro ao salvar:', e);
  }
}

let DB = loadData();
DB.bars = DB.bars || {};

function genCode(name) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const base = (name || 'MESA').replace(/[^A-Z0-9]/gi, '').slice(0,6).toUpperCase() || 'MESA';
  return `${base}-${rand}`;
}

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

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method, url, body } = req;
  const pathname = new URL(url, `http://${req.headers.host}`).pathname;

  // POST /api/bars
  if (method === 'POST' && pathname === '/api/bars') {
    const { name, password, email, phone } = body;
    if (DB.bars[name]) return res.status(400).json({ ok: false, error: 'Bar já existe' });
    DB.bars[name] = { password, email, phone };
    saveData(DB);
    return res.json({ ok: true });
  }

  // POST /api/login
  if (method === 'POST' && pathname === '/api/login') {
    const { name, password } = body;
    if (!DB.bars[name] || DB.bars[name].password !== password) return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
    return res.json({ ok: true, bar: name });
  }

  // POST /api/sessions
  if (method === 'POST' && pathname === '/api/sessions') {
    const { name } = body;
    const existing = Object.values(DB).find(s => s.name === name && s.code);
    if (existing) return res.json({ ok: true, session: existing, existing: true });
    const code = genCode(name);
    if (Object.values(DB).some(s => s.code === code)) return res.status(400).json({ ok: false, error: 'Código duplicado' });
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
    return res.json({ ok: true, session });
  }

  // GET /api/sessions
  if (method === 'GET' && pathname === '/api/sessions') {
    const sessions = Object.values(DB).filter(s => s.code).map(s => ({ code: s.code, name: s.name, created_at: s.created_at, memberCount: s.members.length }));
    return res.json({ ok: true, sessions });
  }

  // GET /api/sessions/:code
  const codeMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (method === 'GET' && codeMatch) {
    const code = codeMatch[1];
    const session = DB[code];
    if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    return res.json({ ok: true, session });
  }

  // POST /api/sessions/:code/members
  const memberMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/members$/);
  if (method === 'POST' && memberMatch) {
    const code = memberMatch[1];
    const { name, cash } = body;
    const session = DB[code];
    if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    const member = { id: uuidv4(), name, cash: cash || 0, balance: 0 };
    session.members.push(member);
    saveData(DB);
    return res.json({ ok: true, member, session });
  }

  // POST /api/sessions/:code/expenses
  const expenseMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/expenses$/);
  if (method === 'POST' && expenseMatch) {
    const code = expenseMatch[1];
    const { item, value, paid_by, consumers } = body;
    const session = DB[code];
    if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    const finalConsumers = Array.isArray(consumers) && consumers.length > 0 ? consumers : session.members.map(m => m.id);
    const expense = { id: uuidv4(), item, value: Number(value), paid_by, consumers: finalConsumers, created_at: new Date().toISOString() };
    session.expenses.push(expense);
    recalcBalances(session);
    saveData(DB);
    return res.json({ ok: true, expense, session });
  }

  // DELETE /api/sessions/:code/expenses/:expenseId
  const delMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/expenses\/([^/]+)$/);
  if (method === 'DELETE' && delMatch) {
    const code = delMatch[1];
    const expenseId = delMatch[2];
    const session = DB[code];
    if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    const idx = session.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Gasto não encontrado' });
    session.expenses.splice(idx, 1);
    recalcBalances(session);
    saveData(DB);
    return res.json({ ok: true, session });
  }

  // POST /api/sessions/:code/reset
  const resetMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/reset$/);
  if (method === 'POST' && resetMatch) {
    const code = resetMatch[1];
    const session = DB[code];
    if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    session.members = [];
    session.expenses = [];
    session.history = [];
    saveData(DB);
    return res.json({ ok: true, session });
  }

  // POST /api/sessions/admin/delete-all
  if (method === 'POST' && pathname === '/api/sessions/admin/delete-all') {
    const { password } = body;
    if (password !== 'admin') return res.status(403).json({ ok: false, error: 'Senha incorreta' });
    const keys = Object.keys(DB);
    for (let key of keys) {
      if (DB[key].code) delete DB[key];
    }
    saveData(DB);
    return res.json({ ok: true });
  }

  // POST /api/sessions/:code/mode
  const modeMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/mode$/);
  if (method === 'POST' && modeMatch) {
    const code = modeMatch[1];
    const { mode } = body;
    const session = DB[code];
    if (!session) return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    session.mode = mode === 'free' ? 'free' : 'split';
    saveData(DB);
    return res.json({ ok: true, session });
  }

  return res.status(404).json({ ok: false, error: 'Rota não encontrada' });
};
