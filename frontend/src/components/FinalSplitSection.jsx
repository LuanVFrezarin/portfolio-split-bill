import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Ícones SVG embutidos (evita dependência externa)
function UserIcon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="currentColor" />
      <path d="M4 20c0-2.761 4.477-5 8-5s8 2.239 8 5v1H4v-1z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function ArrowRightIcon({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoinsIcon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="12" cy="6" rx="7" ry="3" fill="currentColor" opacity="0.95" />
      <path d="M5 6v6c0 1.657 3.134 3 7 3s7-1.343 7-3V6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

// Função para calcular transferências diretas baseadas no consumo
function calcularTransferencias(participantes) {
  const devedores = [];
  const credores = [];

  participantes.forEach((p) => {
    const owed = p.itemsConsumed.reduce((s, e) => s + e.value, 0);
    const balance = p.pagou - owed;
    if (balance < -0.01) devedores.push({ nome: p.nome, valor: Math.abs(balance) });
    if (balance > 0.01) credores.push({ nome: p.nome, valor: balance });
  });

  const transacoes = [];
  for (const d of devedores) {
    let valorRestante = d.valor;
    for (const c of credores) {
      if (c.valor <= 0 || valorRestante <= 0) continue;
      const transferir = Math.min(valorRestante, c.valor);
      transacoes.push({ de: d.nome, para: c.nome, valor: transferir });
      c.valor -= transferir;
      valorRestante -= transferir;
    }
  }
  return transacoes;
}

const cardColors = {
  recebe: "from-green-500/30 to-green-700/30",
  paga: "from-red-500/30 to-red-700/30",
  neutro: "from-yellow-500/20 to-yellow-700/20",
};

export default function FinalSplitSection({ totalMesa, participantes }) {
  const transacoes = useMemo(() => calcularTransferencias(participantes), [participantes]);

  // Calcula status individual baseado no consumo
  const status = participantes.map((p) => {
    const owed = p.itemsConsumed.reduce((s, e) => s + e.value, 0);
    const balance = p.pagou - owed;
    return {
      ...p,
      balance,
      status: balance > 0.01 ? "recebe" : balance < -0.01 ? "paga" : "neutro",
    };
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto mt-6 mb-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg"
    >
      {/* Cabeçalho */}
      <div className="mb-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-bold text-white mb-2"
        >
          🧮 Resultado Final da Mesa
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-1"
        >
          <motion.span className="text-lg text-yellow-200 font-semibold">
            Total: R$ {totalMesa.toFixed(2)}
          </motion.span>
        </motion.div>
      </div>

      {/* Tabela de Transferências */}
      <div className="mb-8">
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-white mb-3"
        >
          💰 Transferências sugeridas
        </motion.h3>
        <AnimatePresence>
          {transacoes.length === 0 ? (
            <motion.div
              key="nada"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-green-300"
            >
              Tudo certo! Ninguém deve nada.
            </motion.div>
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.18 } },
              }}
              className="space-y-2"
            >
              {transacoes.map((t, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-white/10 to-white/5 rounded-lg px-4 py-2 shadow"
                >
                  <span className="text-red-300 font-medium flex items-center gap-1">
                    <UserIcon size={18} className="text-current" /> {t.de}
                  </span>
                  <motion.span
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    className="flex items-center"
                  >
                    <ArrowRightIcon className="text-yellow-200 animate-pulse" size={22} />
                  </motion.span>
                  <span className="text-green-300 font-medium flex items-center gap-1">
                    <UserIcon size={18} className="text-current" /> {t.para}
                  </span>
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="ml-2 text-yellow-100 font-bold flex items-center gap-1"
                  >
                    <CoinsIcon size={18} className="text-current" /> R$ {Number(t.valor).toFixed(2)}
                  </motion.span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Resumo individual */}
      <div>
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-semibold text-white mb-3"
        >
          🟢 Resumo individual
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {status.map((p, i) => (
            <motion.div
              key={p.nome}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, type: "spring", stiffness: 200, damping: 20 }}
              className={`bg-gradient-to-br ${cardColors[p.status]} backdrop-blur-md rounded-xl p-4 shadow-md flex flex-col gap-2 hover:scale-[1.03] hover:shadow-lg transition-transform`}
            >
                <div className="flex items-center gap-2 mb-1">
                <UserIcon size={22} className={p.status === "recebe" ? "text-green-300" : p.status === "paga" ? "text-red-300" : "text-yellow-200"} />
                <span className="font-bold text-white text-lg">{p.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <CoinsIcon size={18} className="text-yellow-100" />
                <span className="text-yellow-100">Pagou: R$ {p.pagou.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                {p.status === "recebe" && <span className="text-green-300">Recebe: R$ {Math.abs(p.balance).toFixed(2)}</span>}
                {p.status === "paga" && <span className="text-red-300">Paga: R$ {Math.abs(p.balance).toFixed(2)}</span>}
                {p.status === "neutro" && <span className="text-yellow-200">Saldo: R$ {p.balance.toFixed(2)}</span>}
              </div>
              <div className="mt-2 text-sm text-white/80">
                <div className="font-semibold text-gray-200">Itens pagos:</div>
                <ul className="text-xs text-gray-300 ml-2">
                  {p.itemsPaid && p.itemsPaid.length > 0 ? p.itemsPaid.map(it => (<li key={it.id}>{it.item} — R$ {it.value.toFixed(2)}</li>)) : <li className="text-gray-500">Nenhum item</li>}
                </ul>
                <div className="font-semibold text-gray-200 mt-2">Itens consumidos:</div>
                <ul className="text-xs text-gray-300 ml-2">
                  {p.itemsConsumed && p.itemsConsumed.length > 0 ? p.itemsConsumed.map(it => (
                    <li key={it.id}>
                      {it.item} — R$ {it.value.toFixed(2)}
                      {it.valorTotal && Math.abs(it.valorTotal - it.value) > 0.01 && (
                        <span className="text-gray-500 ml-1">(÷{it.consumers?.length} de R$ {it.valorTotal.toFixed(2)})</span>
                      )}
                    </li>
                  )) : <li className="text-gray-500">Nenhum</li>}
                </ul>
                <div className="font-semibold text-yellow-200 mt-2">
                  Total consumido: R$ {p.itemsConsumed ? p.itemsConsumed.reduce((s,e)=>s+e.value,0).toFixed(2) : '0.00'}
                </div>
              </div>
              {/* Detalhes de transferências individuais */}
              <div className="mt-2 text-xs text-white/80">
                {p.status === "recebe" && (
                  <>
                    Recebe de: {transacoes.filter(t => t.para === p.nome).map(t => `${t.de} (R$ ${Number(t.valor).toFixed(2)})`).join(", ") || "-"}
                  </>
                )}
                {p.status === "paga" && (
                  <>
                    Paga para: {transacoes.filter(t => t.de === p.nome).map(t => `${t.para} (R$ ${Number(t.valor).toFixed(2)})`).join(", ") || "-"}
                  </>
                )}
                {p.status === "neutro" && "Sem transferências."}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
