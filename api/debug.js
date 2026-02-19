// Script para testar persistência
const fs = require('fs');

const testFile = '/tmp/test-persistence.txt';

console.log('=== TESTE DE PERSISTÊNCIA ===');
console.log('Tentando escrever em:', testFile);

try {
  fs.writeFileSync(testFile, `Teste escrito em ${new Date().toISOString()}\n`);
  console.log('✓ Arquivo escrito com sucesso');
} catch (e) {
  console.error('✗ Erro ao escrever:', e.message);
}

try {
  const content = fs.readFileSync(testFile, 'utf-8');
  console.log('✓ Arquivo lido:', content.trim());
} catch (e) {
  console.error('✗ Erro ao ler:', e.message);
}

// Teste com JSON
const jsonFile = '/tmp/test-data.json';
const testData = { message: 'Hello', timestamp: Date.now() };

try {
  fs.writeFileSync(jsonFile, JSON.stringify(testData, null, 2));
  console.log('✓ JSON escrito');
  
  const read = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  console.log('✓ JSON lido:', read);
} catch (e) {
  console.error('✗ Erro com JSON:', e.message);
}
