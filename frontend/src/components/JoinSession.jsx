import React, {useState} from 'react'
import { LocalAPI } from '../services/localStorageService'

export default function JoinSession({code, onJoined}){
  const [name, setName] = useState('')
  const [cash, setCash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function join(){
    if(!name) return alert('Informe seu nome')
    setLoading(true)
    setError('')
    
    try {
      const result = await LocalAPI.addMember(code, { 
        name, 
        cash: Number(cash) || 0 
      })
      
      if(result.ok){
        onJoined(result.member)
      } else {
        setError(result.error || 'Erro ao entrar na mesa')
        alert(result.error || 'Erro ao entrar na mesa')
      }
    } catch (err) {
      console.error('Erro ao entrar:', err)
      setError('Erro ao entrar na mesa')
      alert('Erro ao entrar na mesa')
    } finally {
      setLoading(false)
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
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
    </div>
  )
}
