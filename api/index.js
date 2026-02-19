const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Tenta usar /tmp se disponível (local), caso contrário usa um arquivo em /tmp como fallback
const DATA_FILE = process.env.VERCEL ? '/tmp/racha-data.json' : path.join('/tmp', 'racha-data.json');

// Cache em memória como fallback para Vercel
let IN_MEMORY_DB = null;

function loadData() {
  try {
    // Primeiro tenta ler do arquivo
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw || '{}');
      IN_MEMORY_DB = data; // Atualiza cache
      return data;
    }
  } catch (e) {
    console.warn('[API] Erro ao ler arquivo de dados:', e.message);
  }
  
  // Se falhar na leitura do arquivo, retorna cache em memória se disponível
  if (IN_MEMORY_DB) {
    console.log('[API] Usando cache em memória');
    return IN_MEMORY_DB;
  }
  
  return {};
}

function saveData(data) {
  try {
    // Sempre salva no cache em memória
    IN_MEMORY_DB = data;
    
    // Tenta salvar no arquivo
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('[API] Dados salvos com sucesso');
  } catch (e) {
    console.warn('[API] Erro ao salvar no arquivo (usando cache em memória):', e.message);
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
  // Recarrega DB a cada requisição para garantir dados atualizados
  DB = loadData();
  DB.bars = DB.bars || {};
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method, url, headers } = req;
  const pathname = new URL(url, `http://${req.headers.host}`).pathname;
  
  // Parse body se necessário
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  
  const dbKeys = Object.keys(DB).filter(k => DB[k].code); // Sessions apenas
  const dbSize = dbKeys.length;
  console.log('[API] [' + new Date().toISOString() + ']', method, pathname);
  console.log('[API] DB Sessions:', dbSize, 'Keys:', dbKeys.join(', '));

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
    if (existing) {
      console.log('[API] Session já existe:', existing.code);
      return res.json({ ok: true, session: existing, existing: true });
    }
    const code = genCode(name);
    if (Object.values(DB).some(s => s.code === code)) {
      console.log('[API] Erro: Código duplicado:', code);
      return res.status(400).json({ ok: false, error: 'Código duplicado' });
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
    console.log('[API] ✓ Session criada:', code);
    console.log('[API] ✓ DB agora tem keys:', Object.keys(DB).filter(k => DB[k].code).join(', '));
    return res.json({ ok: true, session });
  }

  // GET /api/sessions
  if (method === 'GET' && pathname === '/api/sessions') {
    const sessions = Object.values(DB).filter(s => s.code).map(s => ({ code: s.code, name: s.name, created_at: s.created_at, memberCount: s.members.length }));
    console.log('[API] GET /api/sessions retornando', sessions.length, 'sessões');
    return res.json({ ok: true, sessions });
  }

  // GET /api/sessions/:code
  const codeMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (method === 'GET' && codeMatch) {
    const code = codeMatch[1];
    const session = DB[code];
    const allKeys = Object.keys(DB).filter(k => DB[k].code);
    console.log('[API] GET session:', code);
    console.log('[API] Procurando por:', code, 'Encontrado:', !!session);
    console.log('[API] Session keys disponíveis:', allKeys.join(', '));
    if (!session) {
      console.log('[API] ✗ Sessão NÃO encontrada:', code);
      return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    }
    console.log('[API] ✓ Sessão encontrada:', code, 'com', session.members.length, 'membros');
    return res.json({ ok: true, session });
  }

  // POST /api/sessions/:code/members
  const memberMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/members$/);
  if (method === 'POST' && memberMatch) {
    const code = memberMatch[1];
    const { name, cash } = body;
    const session = DB[code];
    const allKeys = Object.keys(DB).filter(k => DB[k].code);
    console.log('[API] POST addMember:', code, 'name:', name);
    console.log('[API] Session keys disponíveis:', allKeys.join(', '));
    if (!session) {
      console.log('[API] ✗ Sessão NÃO encontrada para addMember:', code);
      return res.status(404).json({ ok: false, error: 'Sessão não encontrada' });
    }
    const member = { id: uuidv4(), name, cash: cash || 0, balance: 0 };
    session.members.push(member);
    saveData(DB);
    console.log('[API] ✓ Membro adicionado:', member.id, 'a sessão:', code);
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

  console.log('[API] 404:', method, pathname);
  return res.status(404).json({ ok: false, error: 'Rota não encontrada' });
};
