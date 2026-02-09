import React, { useState, useEffect } from 'react'
import QRCodeModal from './QRCodeModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LocalAPI } from '../services/localStorageService'

export default function CreateSession(){
  const [name, setName] = useState('')
  const [session, setSession] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState(false)
  const [sessions, setSessions] = useState([])
  const [search, setSearch] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchSessions()
  }, [])

  function fetchSessions() {
    const data = LocalAPI.getSessions()
    if(data.ok) setSessions(data.sessions)
  }

  function resetSession(code) {
    LocalAPI.resetSession(code)
    fetchSessions() // refresh the list
  }

  function deleteAllSessions() {
    const data = LocalAPI.deleteAllSessions(deletePassword)
    if(data.ok) {
      fetchSessions()
      setShowDeleteModal(false)
      setDeletePassword('')
      setDeleteError('')
    } else {
      setDeleteError(data.error || 'Erro ao deletar')
    }
  }

  function create(){
    if(!name) {
      setError('Digite o número da mesa!')
      return
    }
    setLoading(true)
    setError('')
    
    const data = LocalAPI.createSession({ name })
    if(data.ok && data.session) {
      setSession(data.session)
      setExisting(!!data.existing)
      setShowQR(true)
      fetchSessions() // refresh the list after creating
    } else {
      setError(data.error || 'Erro ao criar mesa!')
    }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="bg-black/40 rounded-xl p-6 shadow-2xl border border-white/10" onClick={(e) => { if (e.target === e.currentTarget) document.activeElement.blur(); }}>
      <label className="block mb-2 text-gray-300 font-semibold flex items-center gap-2 text-lg">
        <span role="img" aria-label="mesa">🪑</span> Número da mesa
      </label>
      <div className="relative mb-4">
        <input value={name} onChange={e=>setName(e.target.value.replace(/\D/g, ''))}
          className="p-4 rounded-lg w-full border-2 border-emerald-400 bg-gray-900 text-white text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-400/50 focus:border-emerald-300 transition-all placeholder:text-gray-500 shadow-inner shadow-emerald-400/20"
          placeholder="Digite um número (ex: 123)" />
        <motion.div animate={{ opacity: name ? 1 : 0.3, scale: name ? 1.1 : 1 }} className="absolute right-4 top-4 text-emerald-400 text-3xl pointer-events-none">
          {name ? '✅' : '🔢'}
        </motion.div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-2 text-red-400 font-bold">
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: '0 0 16px #34d399' }}
        whileTap={{ scale: 0.97 }}
        onClick={create}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 rounded-xl text-white font-bold text-xl shadow-lg border-emerald-400 border-2 transition-all flex items-center justify-center gap-2"
      >
        <span role="img" aria-label="criar">✨</span> {loading ? 'Criando...' : 'Criar Mesa'}
      </motion.button>
      {session && showQR && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <QRCodeModal url={window.location.origin + '/mesa/' + session.code} code={session.code} onClose={()=>setShowQR(false)} existing={existing} onGo={() => navigate('/mesa/' + session.code)} onReset={() => resetSession(session.code)} />
        </motion.div>
      )}
      {sessions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-3">Mesas existentes</h4>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 rounded-lg border-2 border-emerald-400 bg-gray-900 text-white text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-gray-500 mb-4"
            placeholder="Pesquisar por número da mesa..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessions.filter(s => s.name.includes(search)).map(s => (
              <motion.div
                key={s.code}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSession({ code: s.code, name: s.name }); setExisting(true); setShowQR(true); }}
                className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 shadow-lg border border-white/10 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-pink-600/40 rounded-lg p-3 mb-3 border border-blue-500/50 shadow-inner">
                  <h5 className="text-white font-bold text-3xl text-center drop-shadow-md">{s.name}</h5>
                </div>
                <p className="text-green-400 font-medium text-center">{s.memberCount} membros</p>
                <p className="text-gray-400 text-sm text-center">Criada em {new Date(s.created_at).toLocaleDateString('pt-BR')}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold shadow-lg"
        >
          Apagar todas as mesas
        </motion.button>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)}></div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-800 p-6 rounded-lg z-10 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Confirmar exclusão</h3>
            <p className="text-gray-300 mb-4">Digite a senha de administrador para apagar todas as mesas e dados:</p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="w-full p-3 rounded border border-gray-600 bg-gray-700 text-white mb-4"
              placeholder="Senha"
            />
            {deleteError && <p className="text-red-400 mb-4">{deleteError}</p>}
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }} className="px-4 py-2 bg-gray-600 rounded text-white">Cancelar</button>
              <button onClick={deleteAllSessions} className="px-4 py-2 bg-red-600 rounded text-white">Confirmar</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
