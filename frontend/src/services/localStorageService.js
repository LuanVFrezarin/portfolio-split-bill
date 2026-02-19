// Serviço que integra com backend via API REST
// Fallback para localStorage quando backend não está disponível

import { API_URL } from '../config'

const STORAGE_KEY = 'racha_data'

// Gera ID único (para offline fallback)
function genId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

// Carrega dados do localStorage (fallback)
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { bars: {}, sessions: {} }
  } catch (e) {
    return { bars: {}, sessions: {} }
  }
}

// Salva dados no localStorage (fallback)
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

// API com fallback para localStorage
export const LocalAPI = {
  // Criar/logar bar
  async createBar({ name, password, email, phone }) {
    try {
      const res = await fetch(`${API_URL}/api/bars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, email, phone })
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao criar bar via API, usando localStorage:', e)
      // Fallback
      const data = loadData()
      if (data.bars[name]) {
        return { ok: false, error: 'Bar já existe' }
      }
      data.bars[name] = { password, email, phone }
      saveData(data)
      return { ok: true }
    }
  },

  async login({ name, password }) {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao fazer login via API, usando localStorage:', e)
      // Fallback
      const data = loadData()
      if (!data.bars[name] || data.bars[name].password !== password) {
        return { ok: false, error: 'Credenciais inválidas' }
      }
      return { ok: true, bar: name }
    }
  },

  // Criar sessão/mesa
  async createSession({ name }) {
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao criar sessão via API, usando localStorage:', e)
      // Fallback
      const data = loadData()
      const existing = Object.values(data.sessions).find(s => s.name === name)
      if (existing) {
        return { ok: true, session: existing, existing: true }
      }
      return { ok: false, error: 'Sessão não encontrada - desconectado da API' }
    }
  },

  // Listar sessões
  async getSessions() {
    try {
      const res = await fetch(`${API_URL}/api/sessions`)
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao listar sessões via API, usando localStorage:', e)
      // Fallback
      const data = loadData()
      const sessions = Object.values(data.sessions).map(s => ({
        code: s.code,
        name: s.name,
        created_at: s.created_at,
        memberCount: s.members.length
      }))
      return { ok: true, sessions }
    }
  },

  // Buscar sessão específica
  async getSession(code) {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${code}`)
      const data = await res.json()
      console.log('[API] getSession resultado:', data)
      return data
    } catch (e) {
      console.error('[API] Erro ao buscar sessão:', e)
      console.error('[API] Tentando localStorage como fallback...')
      // Fallback
      const data = loadData()
      const session = data.sessions[code]
      if (!session) {
        return { ok: false, error: 'Sessão não encontrada' }
      }
      return { ok: true, session }
    }
  },

  // Adicionar membro
  async addMember(code, { name, cash }) {
    try {
      console.log('[API] addMember para mesa:', code, 'nome:', name)
      const res = await fetch(`${API_URL}/api/sessions/${code}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cash: cash || 0 })
      })
      const data = await res.json()
      console.log('[API] addMember resultado:', data)
      if (!data.ok) {
        console.error('[API] Erro na resposta:', data)
      }
      return data
    } catch (e) {
      console.error('[API] Erro ao adicionar membro:', e)
      console.error('[API] Tentando localStorage como fallback...')
      // Fallback
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
      recalcBalances(session)
      saveData(data)
      return { ok: true, member, session }
    }
  },

  // Adicionar despesa
  async addExpense(code, { item, value, paid_by, consumers }) {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${code}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, value, paid_by, consumers })
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao adicionar despesa via API:', e)
      // Fallback
      const data = loadData()
      const session = data.sessions[code]
      if (!session) {
        return { ok: false, error: 'Sessão não encontrada' }
      }

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
    }
  },

  // Remover despesa
  async deleteExpense(code, expenseId) {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${code}/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao remover despesa via API:', e)
      // Fallback
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
    }
  },

  // Resetar sessão
  async resetSession(code) {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${code}/reset`, {
        method: 'POST'
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao resetar sessão via API:', e)
      // Fallback
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
    }
  },

  // Deletar todas as sessões
  async deleteAllSessions(password = 'admin') {
    try {
      const res = await fetch(`${API_URL}/api/sessions/admin/delete-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao deletar sessões via API:', e)
      // Fallback
      if (password !== 'admin') {
        return { ok: false, error: 'Senha incorreta' }
      }
      const data = loadData()
      data.sessions = {}
      saveData(data)
      return { ok: true }
    }
  },

  // Alterar modo (split/free)
  async updateMode(code, mode) {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${code}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })
      const data = await res.json()
      return data
    } catch (e) {
      console.error('Erro ao atualizar modo via API:', e)
      // Fallback
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
