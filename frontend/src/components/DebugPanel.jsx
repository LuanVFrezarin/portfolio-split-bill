import React, { useState, useRef } from 'react';
import LocalAPI from '../services/localStorageService';

export default function DebugPanel() {
  const [log, setLog] = useState([]);
  const [sessionCode, setSessionCode] = useState('');
  const logRef = useRef([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    logRef.current = [...logRef.current, entry];
    setLog([...logRef.current]);
  };

  const handleCreateSession = async () => {
    try {
      addLog('Criando sessão...');
      const result = await LocalAPI.createSession('DEBUG_MESA');
      addLog(`Session criada: ${result.code}`, 'success');
      setSessionCode(result.code);
    } catch (e) {
      addLog(`Erro ao criar session: ${e.message}`, 'error');
    }
  };

  const handleGetSession = async () => {
    if (!sessionCode) {
      addLog('Informe um código de sessão', 'error');
      return;
    }
    try {
      addLog(`Buscando sessão: ${sessionCode}...`);
      const result = await LocalAPI.getSession(sessionCode);
      addLog(`Session encontrada com ${result.members?.length || 0} membros`, 'success');
    } catch (e) {
      addLog(`Erro ao buscar session: ${e.message}`, 'error');
    }
  };

  const handleAddMember = async () => {
    if (!sessionCode) {
      addLog('Informe um código de sessão', 'error');
      return;
    }
    try {
      addLog(`Adicionando membro à sessão ${sessionCode}...`);
      const result = await LocalAPI.addMember(sessionCode, {
        name: `Teste ${Date.now()}`,
        cash: 0
      });
      addLog(`Membro adicionado: ${result.member?.name}`, 'success');
    } catch (e) {
      addLog(`Erro ao adicionar membro: ${e.message}`, 'error');
    }
  };

  const clearLog = () => {
    logRef.current = [];
    setLog([]);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: '400px',
      maxHeight: '400px',
      backgroundColor: '#1a1a1a',
      color: '#00ff00',
      border: '2px solid #00ff00',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🐛 DEBUG PANEL
      </div>

      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="Session Code"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value)}
          style={{
            width: '100%',
            padding: '4px',
            backgroundColor: '#222',
            color: '#00ff00',
            border: '1px solid #00ff00',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            marginBottom: '4px'
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button onClick={handleCreateSession} style={buttonStyle}>
            Create
          </button>
          <button onClick={handleGetSession} style={buttonStyle}>
            Get
          </button>
          <button onClick={handleAddMember} style={buttonStyle}>
            Add Member
          </button>
          <button onClick={clearLog} style={{ ...buttonStyle, gridColumn: '1 / -1' }}>
            Clear Log
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#000',
        padding: '4px',
        borderRadius: '4px',
        maxHeight: '320px'
      }}>
        {log.map((entry, i) => (
          <div key={i} style={{
            color: entry.includes('[ERROR]') ? '#ff0000' : 
                   entry.includes('[SUCCESS]') ? '#00ff00' : '#00aaff'
          }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '4px 8px',
  backgroundColor: '#00ff00',
  color: '#000',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 'bold',
  transition: 'all 0.2s',
};
