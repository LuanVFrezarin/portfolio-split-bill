import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LocalAPI } from '../services/localStorageService'

export default function Login({ onLogin }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit() {
    const data = isRegister 
      ? LocalAPI.createBar({ name, password, email, phone })
      : LocalAPI.login({ name, password })
    
    if (data.ok) {
      localStorage.setItem('bar', name)
      onLogin(name)
    } else {
      setError(data.error)
    }
  }

  function handleForgotPassword() {
    alert('Para recuperar a senha, entre em contato com o suporte: suporte@racha2.com')
  }

  function handleRecruiterAccess() {
    // Criar conta de recrutador automaticamente se não existir
    const recruiterName = 'Recrutador Demo'
    const recruiterPassword = 'demo123'
    
    // Tenta criar, se já existe não reclama
    LocalAPI.createBar({ 
      name: recruiterName, 
      password: recruiterPassword, 
      email: 'recruiter@demo.com', 
      phone: '(00) 00000-0000' 
    })
    
    // Faz login
    localStorage.setItem('bar', recruiterName)
    onLogin(recruiterName)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 right-10 w-40 h-40 bg-sky-500/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-500/5 to-yellow-500/5 rounded-full blur-2xl"
        />
      </div>

      {/* Header with site title */}
      <header className="absolute top-0 w-full p-4 z-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span role="img" aria-label="dinheiro" className="text-4xl">💸</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-sky-400 drop-shadow-lg">
              Racha <span className="text-3xl md:text-4xl">2.0</span>
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Sistema de Gerenciamento para Bares</p>
        </motion.div>
      </header>

      {/* Main content centered */}
      <div className="flex items-center justify-center min-h-screen pt-24">

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-black/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            🍻
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold text-white mb-2"
          >
            {isRegister ? 'Cadastrar Bar' : 'Bem-vindo de Volta'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-gray-300"
          >
            {isRegister ? 'Crie sua conta de bar' : 'Faça login para continuar'}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-4"
        >
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <span>🏷️</span> Nome do Bar
          </label>
          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            className="w-full p-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all backdrop-blur-sm"
            placeholder="Ex: Bar do João"
          />
        </motion.div>

        {isRegister && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-4"
          >
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <span>📧</span> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              className="w-full p-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all backdrop-blur-sm"
              placeholder="bar@email.com"
            />
          </motion.div>
        )}

        {isRegister && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.05 }}
            className="mb-4"
          >
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <span>📱</span> Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              className="w-full p-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all backdrop-blur-sm"
              placeholder="(11) 99999-9999"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: isRegister ? 1.1 : 1.0 }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <span>🔒</span> Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full p-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all backdrop-blur-sm"
            placeholder="Digite sua senha"
          />
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-400 mb-4 text-center bg-red-900/20 p-3 rounded-lg border border-red-500/30"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          {isRegister ? '🚀 Cadastrar' : '🎉 Entrar'}
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRecruiterAccess}
          className="w-full py-4 mt-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          👔 Entrar como Recrutador
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-6"
        >
          {!isRegister && (
            <p className="text-gray-400 mb-2">
              <button
                onClick={handleForgotPassword}
                className="text-sky-400 hover:text-sky-300 underline"
              >
                Esqueceu a senha?
              </button>
            </p>
          )}
          <p className="text-gray-400">
            {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setIsRegister(!isRegister)}
              className="text-emerald-400 hover:text-emerald-300 ml-2 font-medium transition-colors"
            >
              {isRegister ? 'Fazer login' : 'Cadastrar'}
            </motion.button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  </div>
  )
}