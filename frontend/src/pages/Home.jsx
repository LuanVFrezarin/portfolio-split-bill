import React from 'react'
import CreateSession from '../components/CreateSession'

export default function Home(){
  return (
    <div className="max-w-3xl mx-auto">
      <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl mb-4 text-center">Criar ou entrar em uma mesa</h2>
        <CreateSession />
      </section>
    </div>
  )
}
