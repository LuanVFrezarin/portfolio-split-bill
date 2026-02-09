import React, { useMemo, useState } from 'react'

export default function SpendTracker({ session, currentMember }){
  const [filter, setFilter] = useState('all')

  const totals = useMemo(()=>{
    const map = {}
    session.members.forEach(m=> map[m.id] = 0)
    session.expenses.forEach(e=>{
      if(map[e.paid_by] !== undefined) map[e.paid_by] += e.value
    })
    return session.members.map(m=> ({ ...m, total: map[m.id] || 0 }))
  }, [session])

  const sorted = [...totals].sort((a,b)=> b.total - a.total)

  return (
    <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-lg shadow-inner">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">Modo: <span className="font-semibold">Sem Racha</span></h3>
        <div className="text-sm text-gray-300">Top: <span className="font-medium">{sorted[0]?.name || '—'}</span></div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {totals.map(m=> (
          <div key={m.id} className="p-3 bg-gray-700 rounded shadow-md">
            <div className="flex justify-between items-baseline">
              <div className="font-bold">{m.name}{currentMember?.id===m.id? ' (você)':''}</div>
              <div className="text-sm">R$ {m.total.toFixed(2)}</div>
            </div>
            <div className="h-3 bg-black/20 mt-3 rounded overflow-hidden">
              <div className="h-3 rounded" style={{ width: `${Math.min(100, (m.total / (sorted[0]?.total || 1))*100)}%`, background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }} />
            </div>
            <div className="mt-2 text-xs text-gray-400">% do total: {((m.total / (sorted[0]?.total || 1))*100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="mb-2">Despesas</h4>
        <ul className="space-y-2">
          {session.expenses.map(ex=> (
            <li key={ex.id} className="p-2 bg-gray-700 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{ex.item}</div>
                <div className="text-sm text-gray-400">Pago por: {session.members.find(m=>m.id===ex.paid_by)?.name || '—'}</div>
              </div>
              <div className="text-right font-semibold">R$ {ex.value.toFixed(2)}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
