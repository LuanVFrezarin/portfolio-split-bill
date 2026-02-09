import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ParticipantDetailsModal({ member, session, onClose }) {
  if (!member || !session) return null

  const expenses = session.expenses || []
  const itemsPaid = expenses.filter(e => e.paid_by === member.id)
  const itemsConsumed = expenses
    .filter(e => Array.isArray(e.consumers) && e.consumers.includes(member.id))
    .map(e => ({
      ...e,
      perPerson: e.consumers.length > 0 ? e.value / e.consumers.length : e.value
    }))

  const totalPaid = itemsPaid.reduce((s, e) => s + e.value, 0)
  const totalConsumed = itemsConsumed.reduce((s, e) => s + e.perPerson, 0)
  const balance = totalPaid - totalConsumed

  return (
    <AnimatePresence>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} className="fixed top-0 right-0 w-full max-w-md h-full bg-black/90 backdrop-blur-md z-50 shadow-2xl p-8 flex flex-col overflow-y-auto">
        <button onClick={onClose} className="mb-4 text-white text-lg font-bold self-end hover:text-red-400 transition">✖</button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4 text-emerald-300 flex items-center gap-2">👤 {member.name}</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-900/40 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400">Total pago</div>
              <div className="text-lg font-bold text-green-300">R$ {totalPaid.toFixed(2)}</div>
            </div>
            <div className="bg-red-900/40 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400">Total consumido</div>
              <div className="text-lg font-bold text-red-300">R$ {totalConsumed.toFixed(2)}</div>
            </div>
          </div>

          <div className={`mb-6 p-3 rounded-lg text-center font-bold ${balance > 0.01 ? 'bg-green-900/30 text-green-300' : balance < -0.01 ? 'bg-red-900/30 text-red-300' : 'bg-yellow-900/30 text-yellow-200'}`}>
            {balance > 0.01 ? `Recebe R$ ${balance.toFixed(2)}` : balance < -0.01 ? `Deve R$ ${Math.abs(balance).toFixed(2)}` : 'Saldo zerado'}
          </div>

          <div className="mb-4">
            <div className="font-semibold text-emerald-300 mb-2">Itens pagos:</div>
            <ul className="text-sm text-gray-200 space-y-1">
              {itemsPaid.length > 0 ? itemsPaid.map(i => (
                <li key={i.id} className="flex justify-between bg-white/5 rounded px-2 py-1">
                  <span>{i.item}</span>
                  <span className="text-green-300">R$ {i.value.toFixed(2)}</span>
                </li>
              )) : <li className="text-gray-500">Nenhum item</li>}
            </ul>
          </div>

          <div>
            <div className="font-semibold text-sky-300 mb-2">Itens consumidos:</div>
            <ul className="text-sm text-gray-200 space-y-1">
              {itemsConsumed.length > 0 ? itemsConsumed.map(i => (
                <li key={i.id} className="flex justify-between bg-white/5 rounded px-2 py-1">
                  <span>{i.item}</span>
                  <span className="text-red-300">
                    R$ {i.perPerson.toFixed(2)}
                    {i.consumers.length > 1 && <span className="text-gray-500 ml-1 text-xs">(÷{i.consumers.length})</span>}
                  </span>
                </li>
              )) : <li className="text-gray-500">Nenhum item</li>}
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
