import React, {useState} from 'react'
import { LocalAPI } from '../services/localStorageService'

export default function JoinSession({code, onJoined}){
  const [name, setName] = useState('')
  const [cash, setCash] = useState('')
  const [loading, setLoading] = useState(false)

  function join(){
    if(!name) return alert('Informe seu nome')
    setLoading(true)
    
    const result = LocalAPI.addMember(code, { 
      name, 
      cash: Number(cash) || 0 
    })
    
    setLoading(false)
    if(result.ok){
      onJoined(result.member)
    } else {
      alert('Erro ao entrar na mesa')
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h3 className="mb-2">Entrar na mesa</h3>
      <input value={name} onChange={e=>setName(e.target.value)} className="p-2 rounded bg-gray-700 w-full mb-2" placeholder="Seu nome" />
      <input value={cash} onChange={e=>setCash(e.target.value)} className="p-2 rounded bg-gray-700 w-full mb-2" placeholder="Quanto tem (opcional)" />
      <div className="flex gap-2">
        <button onClick={join} disabled={loading} className="px-3 py-2 bg-sky-500 rounded">{loading? 'Entrando...' : 'Entrar'}</button>
      </div>
    </div>
  )
}
