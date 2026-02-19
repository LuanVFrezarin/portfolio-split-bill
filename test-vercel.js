// Script para testar a API em produção
const http = require('http');

const BASE_URL = 'https://portfolio-racha-q98j.vercel.app/api';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      headers: {},
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.data = JSON.stringify(body);
    }

    let req;
    if (BASE_URL.startsWith('https')) {
      req = require('https').request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ 
              status: res.statusCode, 
              data: JSON.parse(data || '{}') 
            });
          } catch (e) {
            resolve({ status: res.statusCode, data: { raw: data } });
          }
        });
      });
    } else {
      req = require('http').request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ 
              status: res.statusCode, 
              data: JSON.parse(data || '{}') 
            });
          } catch (e) {
            resolve({ status: res.statusCode, data: { raw: data } });
          }
        });
      });
    }

    req.on('error', reject);
    if (options.data) req.write(options.data);
    req.end();
  });
}

(async () => {
  console.log('\n=== TESTE DE API VERCEL ===\n');

  try {
    // 1. Criar sessão
    console.log('1️⃣ Criando sessão...');
    const createRes = await makeRequest('POST', '/sessions', { 
      name: 'VERCEL_TEST_' + Date.now() 
    });
    console.log(`Status: ${createRes.status}`, createRes.status === 200 ? '✓' : '✗');
    const code = createRes.data?.session?.code;
    console.log(`Código: ${code}\n`);

    if (!code) {
      console.error('Erro: Código não foi retornado', createRes.data);
      return;
    }

    // Espera um pouco
    await new Promise(r => setTimeout(r, 500));

    // 2. Buscar sessão
    console.log('2️⃣ Buscando sessão criada...');
    const getRes = await makeRequest('GET', `/sessions/${code}`);
    console.log(`Status: ${getRes.status}`, getRes.status === 200 ? '✓' : '✗');
    console.log(`Encontrada: ${!!getRes.data?.session}`, getRes.data?.session?.code ? '✓' : '✗\n`);

    if (!getRes.data?.session) {
      console.error('Erro: Sessão não foi encontrada!');
      console.error('Resposta completa:', getRes.data);
      return;
    }

    // 3. Adicionar membro
    console.log('3️⃣ Adicionando membro...');
    const memberRes = await makeRequest('POST', `/sessions/${code}/members`, {
      name: 'Teste User',
      cash: 50
    });
    console.log(`Status: ${memberRes.status}`, memberRes.status === 200 ? '✓' : '✗');
    console.log(`Membro adicionado: ${memberRes.data?.member?.name || 'ERRO'}\n`);

    // 4. Verificar novamente
    console.log('4️⃣ Verificando sessão com membro...');
    const finalRes = await makeRequest('GET', `/sessions/${code}`);
    console.log(`Status: ${finalRes.status}`, finalRes.status === 200 ? '✓' : '✗');
    console.log(`Total de membros: ${finalRes.data?.session?.members?.length || 0}`);
    console.log(finalRes.data?.session?.members?.[0] ? `✓ Membro encontrado: ${finalRes.data.session.members[0].name}` : '✗ Nenhum membro');

    console.log('\n✅ TESTE COMPLETO!\n');

  } catch (error) {
    console.error('\n❌ Erro durante teste:', error.message);
  }
})();
