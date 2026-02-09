// Serviço que simula backend usando localStorage
// Todos os dados são salvos localmente no navegador durante o uso

const STORAGE_KEY = 'racha_data'

// Gera código único para mesa
function genCode(name) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  const base = (name || 'MESA').replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase() || 'MESA'
  return `${base}-${rand}`
}

// Gera ID único
function genId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

// Carrega dados do localStorage
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { bars: {}, sessions: {} }
  } catch (e) {
    return { bars: {}, sessions: {} }
  }
}

// Salva dados no localStorage
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  // Dispara evento customizado para atualizar componentes em tempo real
  window.dispatchEvent(new CustomEvent('racha:update', { detail: data }))
}

// Recalcula saldos dos membros
function recalcBalances(session) {
  const members = session.members
  if (members.length > 0) {
    members.forEach(m => {
      const paid = session.expenses.filter(e => e.paid_by === m.id).reduce((s, e) => s + e.value, 0)
      const consumed = session.expenses
        .filter(e => Array.isArray(e.consumers) && e.consumers.includes(m.id))
        .reduce((s, e) => s + (e.consumers.length > 0 ? e.value / e.consumers.length : e.value), 0)
      m.balance = Number((paid - consumed).toFixed(2))
    })
  }
}

// API simulada
export const LocalAPI = {
  // Criar/logar bar
  createBar({ name, password, email, phone }) {
    const data = loadData()
    if (data.bars[name]) {
      return { ok: false, error: 'Bar já existe' }
    }
    data.bars[name] = { password, email, phone }
    saveData(data)
    return { ok: true }
  },

  login({ name, password }) {
    const data = loadData()
    if (!data.bars[name] || data.bars[name].password !== password) {
      return { ok: false, error: 'Credenciais inválidas' }
    }
    return { ok: true, bar: name }
  },

  // Criar sessão/mesa
  createSession({ name }) {
    const data = loadData()
    
    // Verifica se mesa com mesmo nome já existe
    const existing = Object.values(data.sessions).find(s => s.name === name)
    if (existing) {
      return { ok: true, session: existing, existing: true }
    }

    const code = genCode(name)
    
    // Impede código duplicado
    if (data.sessions[code]) {
      return { ok: false, error: 'Código gerado já existe, tente novamente!' }
    }

    const session = {
      id: genId(),
      code,
      name: name || code,
      created_at: new Date().toISOString(),
      members: [],
      expenses: [],
      history: [],
      mode: 'split'
    }

    data.sessions[code] = session
    saveData(data)
    return { ok: true, session }
  },

  // Listar sessões
  getSessions() {
    const data = loadData()
    const sessions = Object.values(data.sessions).map(s => ({
      code: s.code,
      name: s.name,
      created_at: s.created_at,
      memberCount: s.members.length
    }))
    return { ok: true, sessions }
  },

  // Buscar sessão específica
  getSession(code) {
    const data = loadData()
    const session = data.sessions[code]
    if (!session) {
      return { ok: false, error: 'Sessão não encontrada' }
    }
    return { ok: true, session }
  },

  // Adicionar membro
  addMember(code, { name, cash }) {
    const data = loadData()
    const session = data.sessions[code]
    if (!session) {
      return { ok: false, error: 'Sessão não encontrada' }
    }

    const member = {
      id: genId(),
      name,
      cash: cash || 0,
      paid: 0,
      balance: 0
    }

    session.members.push(member)
    
    // IMPORTANTE: Adicione o novo membro retroativamente às despesas que não tinham consumidores específicos
    // Se uma despesa tem "todos os membros" como consumidores, não precisa atualizar
    // Mas se foi criada antes dele entrar, ele não tá lá
    session.expenses.forEach(expense => {
      // Se o número de consumidores é igual ao número de membros ANTES dele entrar
      // Significa que foi "dividir entre todos"
      // Agora que ele entrou, precisa ser incluído
      if (expense.consumers.length === session.members.length - 1) {
        expense.consumers.push(member.id)
      }
    })
    
    recalcBalances(session)
    saveData(data)
    return { ok: true, member, session }
  },

  // Adicionar despesa
  addExpense(code, { item, value, paid_by, consumers }) {
    const data = loadData()
    const session = data.sessions[code]
    if (!session) {
      return { ok: false, error: 'Sessão não encontrada' }
    }

    // Se nenhum consumidor selecionado, dividir entre todos
    const finalConsumers = Array.isArray(consumers) && consumers.length > 0
      ? consumers
      : session.members.map(m => m.id)

    const expense = {
      id: genId(),
      item,
      value: Number(value),
      paid_by,
      consumers: finalConsumers,
      created_at: new Date().toISOString()
    }

    session.expenses.push(expense)
    recalcBalances(session)
    saveData(data)
    return { ok: true, expense, session }
  },

  // Remover despesa
  deleteExpense(code, expenseId) {
    const data = loadData()
    const session = data.sessions[code]
    if (!session) {
      return { ok: false, error: 'Sessão não encontrada' }
    }

    const idx = session.expenses.findIndex(e => e.id === expenseId)
    if (idx === -1) {
      return { ok: false, error: 'Gasto não encontrado' }
    }

    session.expenses.splice(idx, 1)
    recalcBalances(session)
    saveData(data)
    return { ok: true, session }
  },

  // Resetar sessão
  resetSession(code) {
    const data = loadData()
    const session = data.sessions[code]
    if (!session) {
      return { ok: false, error: 'Sessão não encontrada' }
    }

    session.members = []
    session.expenses = []
    session.history = []
    saveData(data)
    return { ok: true, session }
  },

  // Deletar todas as sessões
  deleteAllSessions(password = 'admin') {
    if (password !== 'admin') {
      return { ok: false, error: 'Senha incorreta' }
    }
    const data = loadData()
    data.sessions = {}
    saveData(data)
    return { ok: true }
  },

  // Alterar modo (split/free)
  updateMode(code, mode) {
    const data = loadData()
    const session = data.sessions[code]
    if (!session) {
      return { ok: false, error: 'Sessão não encontrada' }
    }

    session.mode = mode
    recalcBalances(session)
    saveData(data)
    return { ok: true, session }
  }
}

// Hook para escutar mudanças em tempo real (simula Socket.IO)
export function useRealtimeSession(code, onUpdate) {
  const handler = (e) => {
    if (e.detail && e.detail.sessions && e.detail.sessions[code]) {
      onUpdate(e.detail.sessions[code])
    }
  }

  window.addEventListener('racha:update', handler)
  return () => window.removeEventListener('racha:update', handler)
}
