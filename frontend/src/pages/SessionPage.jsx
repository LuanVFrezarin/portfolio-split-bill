import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
import JoinSession from '../components/JoinSession'
import SpendTracker from '../components/SpendTracker'
import { motion } from 'framer-motion'
import BarBackground from '../components/BarBackground'
import QRCodeModal from '../components/QRCodeModal'
import ParticipantDetailsModal from '../components/ParticipantDetailsModal'
import FinalSplitSection from '../components/FinalSplitSection'
import { LocalAPI, useRealtimeSession } from '../services/localStorageService'

export default function SessionPage(){
  const { code } = useParams()
  const [session, setSession] = useState(null)
  const [currentMember, setCurrentMember] = useState(null)
  const [item, setItem] = useState('')
  const [value, setValue] = useState('')
  const [payerId, setPayerId] = useState(null)
  const [consumers, setConsumers] = useState([])
  const [showQR, setShowQR] = useState(false)
  const [showAddManual, setShowAddManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualCash, setManualCash] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(()=>{
    // Carrega sessão inicial
    console.log('SessionPage carregando para código:', code)
    
    const loadSession = async () => {
      try {
        const data = await LocalAPI.getSession(code)
        console.log('Resultado getSession:', data)
        if(data.ok) {
          setSession(data.session)
        } else {
          console.error('Erro ao carregar sessão:', data.error)
          alert(data.error || 'Mesa não encontrada')
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err)
        alert('Erro ao carregar mesa')
      }
    }

    loadSession()

    // Escuta mudanças em tempo real (simula Socket.IO)
    const cleanup = useRealtimeSession(code, (updatedSession) => {
      setSession(updatedSession)
    })

    // load stored member for this session (if exists)
    try{
      const stored = localStorage.getItem(`racha_member_${code}`)
      if(stored) {
        const m = JSON.parse(stored)
        setCurrentMember(m)
        setPayerId(m.id)
      }
    }catch(e){ }

    return cleanup
  },[code])

  // Called when user joins via JoinSession component
  function handleJoined(member){
    localStorage.setItem(`racha_member_${code}`, JSON.stringify(member))
    setCurrentMember(member)
    setPayerId(member.id)
  }

  function addExpense(){
    if(!item || !value || !payerId) return alert('Preencha o item, valor e quem pagou')
    const parsedValue = Number(value)
    if(isNaN(parsedValue) || parsedValue <= 0) return alert('Valor inválido')
    // Se nenhum consumidor selecionado, dividir entre todos
    const selectedConsumers = consumers.length > 0 ? consumers : session.members.map(m => m.id)
    
    LocalAPI.addExpense(code, { 
      item, 
      value: parsedValue, 
      paid_by: payerId, 
      consumers: selectedConsumers 
    }).then(result => {
      if(result.ok) {
        setItem('')
        setValue('')
        setConsumers([])
      }
    })
  }

  function addManualMember(){
    if(!manualName) return alert('Preencha o nome')
    
    LocalAPI.addMember(code, { 
      name: manualName, 
      cash: Number(manualCash)||0 
    }).then(result => {
      if(result.ok) {
        setManualName('')
        setManualCash('')
        setShowAddManual(false)
      } else {
        alert('Erro ao adicionar pessoa')
      }
    })
  }

  function racharAll(){
    LocalAPI.updateMode(code, 'split').then(result => {
      if(!result.ok) {
        alert('Erro ao aplicar racha')
      }
    })
  }

  function deleteExpense(expenseId) {
    if(!confirm('Remover este gasto?')) return
    
    LocalAPI.deleteExpense(code, expenseId).then(result => {
      if(!result.ok) {
        alert('Erro ao remover gasto')
      }
    })
  }

  return (
    <div>
      <BarBackground />
      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold text-white drop-shadow mb-2 flex items-center gap-2">
          <span role="img" aria-label="cheers">🍻</span> Mesa: {code}
        </h2>
        <div className="mb-6 text-gray-300 text-lg font-medium flex items-center gap-2">
          <span role="img" aria-label="bar">🏷️</span> Compartilhe o QR Code com a galera para entrar na mesa!
        </div>

        {!currentMember && (
          <div className="mt-4">
            <JoinSession code={code} onJoined={handleJoined} />
          </div>
        )}

        {currentMember && (
          <>
          <div className="flex flex-col md:flex-row gap-6 mt-6">
            {/* Participantes */}
            <div className="flex-1 bg-black/40 rounded-xl p-6 shadow-xl border border-white/10 order-1 md:order-1">
              <h3 className="text-xl font-bold mb-4 text-emerald-300 flex items-center gap-2">
                <span role="img" aria-label="user">👤</span> Participantes <span className="ml-2 text-gray-400 text-base">({session?.members?.length || 0})</span>
              </h3>
              <ul className="space-y-3 mb-4">
                {session?.members?.map(m=> {
                  const totalPago = session.expenses?.filter(e=>e.paid_by===m.id).reduce((s,e)=>s+e.value,0) || 0;
                  const totalConsumo = session.expenses?.filter(e=>Array.isArray(e.consumers)&&e.consumers.includes(m.id)).reduce((s,e)=>s+(e.consumers.length>0?e.value/e.consumers.length:e.value),0) || 0;
                  const saldo = totalPago - totalConsumo;
                  return (
                  <li key={m.id} onClick={()=>setSelectedMember(m)} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-emerald-700/40 transition ${m.id===currentMember.id? 'bg-emerald-800/60 text-white' : 'bg-gray-800/60 text-gray-200'}`}>
                    <span className="text-lg">{m.id===currentMember.id? '🟢' : '⚪'}</span>
                    <span className="font-semibold">{m.name}{m.id===currentMember.id? ' (você)': ''}</span>
                    <div className="ml-auto text-right text-sm">
                      <div className="text-green-400">Pagou: R$ {totalPago.toFixed(2)}</div>
                      <div className={saldo > 0.01 ? 'text-green-300 text-xs' : saldo < -0.01 ? 'text-red-300 text-xs' : 'text-yellow-200 text-xs'}>
                        {saldo > 0.01 ? `Recebe R$ ${saldo.toFixed(2)}` : saldo < -0.01 ? `Deve R$ ${Math.abs(saldo).toFixed(2)}` : 'Zerado'}
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
              <button onClick={()=>setShowAddManual(true)} className="w-full py-2 bg-gradient-to-r from-yellow-400 to-emerald-400 rounded text-black font-bold shadow hover:scale-105 transition mb-2">Adicionar pessoa manualmente</button>
              {showAddManual && (
                <div className="bg-gray-900 p-4 rounded-xl shadow-xl border border-emerald-400 mt-2">
                  <h4 className="text-lg font-bold mb-2 text-emerald-300">Nova pessoa</h4>
                  <input value={manualName} onChange={e=>setManualName(e.target.value)} className="p-2 rounded bg-gray-700 w-full mb-2 border border-gray-600" placeholder="Nome" />
                  <input value={manualCash} onChange={e=>setManualCash(e.target.value)} className="p-2 rounded bg-gray-700 w-full mb-2 border border-gray-600" placeholder="Saldo inicial (opcional)" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={addManualMember} className="px-4 py-2 bg-emerald-500 rounded text-white font-bold">Adicionar</button>
                    <button onClick={()=>setShowAddManual(false)} className="px-4 py-2 bg-gray-600 rounded text-white">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
            {/* Gastos */}
            <div className="flex-1 bg-black/40 rounded-xl p-6 shadow-xl border border-white/10 order-3 md:order-2">
              <h3 className="text-xl font-bold mb-4 text-sky-300 flex items-center gap-2">
                <span role="img" aria-label="money">💸</span> Adicionar gasto
              </h3>
              <input value={item} onChange={e=>setItem(e.target.value)} className="p-3 rounded bg-gray-700 w-full mb-2 border border-gray-600" placeholder="Item (ex: Cerveja)" />
              <input value={value} onChange={e=>setValue(e.target.value)} className="p-3 rounded bg-gray-700 w-full mb-2 border border-gray-600" placeholder="Valor (ex: 25)" />
              <label className="block text-sm mb-2 text-gray-300">Pago por</label>
              <select value={payerId||''} onChange={e=>setPayerId(e.target.value)} className="p-3 rounded bg-gray-700 w-full mb-4 border border-gray-600">
                <option value="">Selecione</option>
                {session?.members?.map(m=> (
                  <option key={m.id} value={m.id}>{m.name}{m.id===currentMember.id? ' (você)':''}</option>
                ))}
              </select>
              <label className="block text-sm mb-2 text-gray-300">Consumido por</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={()=>setConsumers(session?.members?.map(m=>m.id)||[])} className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 rounded text-white transition">Todos</button>
                <button type="button" onClick={()=>setConsumers([])} className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white transition">Nenhum</button>
                {consumers.length === 0 && <span className="text-xs text-yellow-400 self-center">Nenhum selecionado = divide entre todos</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {session?.members?.map(m=> (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 rounded p-1 transition">
                    <input type="checkbox" checked={consumers.includes(m.id)} onChange={e=>{
                      if(e.target.checked) setConsumers(prev=>[...prev, m.id])
                      else setConsumers(prev=>prev.filter(id=>id!==m.id))
                    }} className="w-4 h-4 accent-emerald-500" />
                    <span className="text-gray-200">{m.name}</span>
                  </label>
                ))}
              </div>
              <button onClick={addExpense} className="w-full py-3 bg-gradient-to-r from-emerald-400 to-sky-500 rounded text-white font-bold text-lg shadow hover:scale-105 transition">Adicionar</button>
              <div className="mt-8">
                <h4 className="text-lg font-bold mb-2 text-gray-200 flex items-center gap-2">🧾 Gastos da Mesa</h4>
                <ul className="space-y-2">
                  {session?.expenses?.map((ex, idx) => (
                    <motion.li key={ex.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="flex items-center gap-2 p-3 rounded-lg bg-gray-800/70 shadow border-l-4 border-emerald-400">
                      <div className="w-28 text-emerald-300 font-bold">{session.members.find(m=>m.id===ex.paid_by)?.name || '—'}</div>
                      <div className="flex-1">
                        <div className="font-medium">{ex.item}</div>
                        <div className="text-xs text-gray-400">
                          Consumido por: {ex.consumers && ex.consumers.length>0 ? ex.consumers.map(id=>session.members.find(m=>m.id===id)?.name||'—').join(', ') : '—'}
                          {ex.consumers && ex.consumers.length > 1 && <span className="text-yellow-400 ml-1">(÷{ex.consumers.length} = R$ {(ex.value / ex.consumers.length).toFixed(2)}/pessoa)</span>}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="font-bold text-white">R$ {ex.value.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">{new Date(ex.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                        <button onClick={()=>deleteExpense(ex.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded p-1 transition" title="Remover gasto">✕</button>
                      </div>
                    </motion.li>
                  ))}
                  {(!session?.expenses || session.expenses.length === 0) && <li className="text-gray-500">Nenhum gasto ainda</li>}
                </ul>
                <div className="mt-4 text-right text-lg text-gray-200 font-bold">Subtotal: R$ {session?.expenses?.reduce((s,e)=>s+e.value,0).toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            {/* Resultado final do racha com transferências diretas */}
            {session && session.members && session.expenses && (
              <React.Suspense fallback={<div className="text-white">Carregando resultado...</div>}>
                <FinalSplitSection
                  totalMesa={session.expenses.reduce((s,e)=>s+e.value,0)}
                  participantes={session.members.map(m=>{
                    const paidExpenses = session.expenses.filter(e=>e.paid_by===m.id);
                    const consumedExpenses = session.expenses.filter(e=>Array.isArray(e.consumers) && e.consumers.includes(m.id));
                    return {
                      id: m.id,
                      nome: m.name,
                      pagou: paidExpenses.reduce((s,e)=>s+e.value,0),
                      itemsPaid: paidExpenses,
                      itemsConsumed: consumedExpenses.map(e=>({
                        ...e,
                        valorTotal: e.value,
                        value: e.consumers.length > 0 ? e.value / e.consumers.length : e.value
                      }))
                    };
                  })}
                />
              </React.Suspense>
            )}
          </div>
          </>
        )}

        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          <button onClick={racharAll} className="mb-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-lg font-bold hover:scale-105 transition">Rachar (dividir igual)</button>
          <button onClick={()=>setShowQR(true)} className="bg-gradient-to-r from-emerald-400 to-sky-500 text-white rounded-full shadow-lg p-4 text-3xl border-4 border-white/30 hover:scale-110 transition">
            <span role="img" aria-label="qr">� QR</span>
          </button>
        </div>
        {showQR && (
          <QRCodeModal url={window.location.origin + '/mesa/' + code} code={code} onClose={()=>setShowQR(false)} />
        )}
        {selectedMember && (
          <ParticipantDetailsModal member={selectedMember} session={session} onClose={()=>setSelectedMember(null)} />
        )}
      </div>
    </div>
  )
}
