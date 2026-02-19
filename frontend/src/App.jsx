import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import SessionPage from './pages/SessionPage'
import Login from './components/Login'
import DebugPanel from './components/DebugPanel'
import { motion } from 'framer-motion'

function AppContent({ bar, setBar }) {
  const location = useLocation()
  
  // Permite acesso a /mesa/:code sem estar logado (via QR code)
  const isMesaPage = location.pathname.startsWith('/mesa/')
  
  if (!bar && !isMesaPage) {
    return <Login onLogin={setBar} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="w-full flex flex-col items-center mb-8 mt-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 select-none">
              <span role="img" aria-label="dinheiro" className="text-4xl">💸</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-sky-400 drop-shadow-lg">Racha <span className="text-3xl md:text-4xl">2.0</span></span>
            </motion.div>
            {bar && <p className="text-gray-400 mt-2">{bar}</p>}
          </div>
          <nav className="space-x-4">
            {bar && <button onClick={() => { localStorage.removeItem('bar'); setBar(null); }} className="text-sm text-red-400 hover:text-red-300">Sair</button>}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/mesa/:code" element={<SessionPage/>} />
        </Routes>
      </main>
      <DebugPanel />
    </div>
  )
}

export default function App(){
  const [bar, setBar] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('bar')
    if (stored) setBar(stored)
  }, [])

  return (
    <BrowserRouter>
      <AppContent bar={bar} setBar={setBar} />
    </BrowserRouter>
  )
}
