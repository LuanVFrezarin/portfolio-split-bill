import React from 'react'
import ReactQRCode from 'react-qr-code'
import { motion } from 'framer-motion'

export default function QRCodeModal({url, code, onClose, existing = false, onGo, onReset}){
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <motion.div initial={{ y: -50, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg z-10 text-center shadow-2xl border border-white/5 max-w-sm w-full">
        <h3 className="mb-2 text-xl font-semibold">Mesa: {code}</h3>
        {existing && <p className="mb-2 text-yellow-300 font-medium">Mesa já existe! Use o QR para entrar.</p>}
        <div className="inline-block bg-white p-4 rounded relative mb-4">
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="absolute inset-0 rounded border-2 border-white/10 pointer-events-none" />
          <ReactQRCode value={url} size={180} />
        </div>
        <p className="mt-3 text-sm text-gray-300 mb-4">Link: <span className="break-all">{url}</span></p>
        <div className="flex gap-2 justify-center flex-wrap">
          {onGo && <motion.button whileTap={{ scale: 0.97 }} onClick={onGo} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium shadow">Ir para mesa</motion.button>}
          {existing && onReset && <motion.button whileTap={{ scale: 0.97 }} onClick={() => { onReset(); onClose(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium shadow">Resetar mesa</motion.button>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-medium shadow">Fechar</motion.button>
        </div>
      </motion.div>
    </div>
  )
}
