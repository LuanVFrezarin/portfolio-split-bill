import React from 'react'

export default function BarBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] opacity-95" />
      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" alt="bar" className="absolute top-0 left-0 w-full h-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-400/20 via-sky-400/10 to-indigo-500/10 blur-3xl animate-pulse" />
      </div>
    </div>
  )
}
