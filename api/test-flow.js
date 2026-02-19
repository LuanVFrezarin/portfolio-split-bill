// Teste de fluxo completo
const api = require('./index.js');

const makeRequest = (method, pathname, body = null) => {
  return new Promise((resolve) => {
    const res = {
      status: (code) => ({
        json: (data) => {
          resolve({ code, data, ok: data?.ok });
          return res;
        },
        end: () => {
          resolve({ code, data: null });
          return res;
        }
      }),
      json: (data) => {
        resolve({ code: 200, data, ok: data?.ok });
        return res;
      },
      setHeader: () => res,
    };
    
    const req = {
      method,
      url: pathname,
      headers: { host: 'localhost' },
      body: body ? JSON.stringify(body) : null,
    };
    
    api(req, res);
  });
};

(async () => {
  console.log('=== TESTE DE FLUXO COMPLETO ===\n');
  
  // 1. Criar uma session
  console.log('1. Criando sessão...');
  const sessaoResp = await makeRequest('POST', '/api/sessions', { name: 'Teste Mesa' });
  console.log('Resposta:', sessaoResp.code, sessaoResp.ok ? '✓' : '✗');
  const sessionCode = sessaoResp.data?.session?.code;
  console.log('Session Code:', sessionCode, '\n');
  
  // 2. GET da sessão
  console.log('2. Buscando sessão criada...');
  const getResp = await makeRequest('GET', `/api/sessions/${sessionCode}`);
  console.log('Resposta:', getResp.code, getResp.ok ? '✓' : '✗');
  console.log('Session encontrada:', getResp.data?.session?.code, '\n');
  
  // 3. Adicionar membro
  console.log('3. Adicionando membro à sessão...');
  const memberResp = await makeRequest('POST', `/api/sessions/${sessionCode}/members`, { name: 'João', cash: 100 });
  console.log('Resposta:', memberResp.code, memberResp.ok ? '✓' : '✗');
  console.log('Membro adicionado:', memberResp.data?.member?.name, '\n');
  
  // 4. GET novamente para verificar
  console.log('4. Verificando se membro foi adicionado...');
  const finalResp = await makeRequest('GET', `/api/sessions/${sessionCode}`);
  console.log('Resposta:', finalResp.code, finalResp.ok ? '✓' : '✗');
  console.log('Total de membros:', finalResp.data?.session?.members?.length);
  
  console.log('\n=== FIM DO TESTE ===');
})().catch(console.error);
