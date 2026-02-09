# Deploy na Vercel - Racha 2.0 Frontend Only

## 🎉 O que mudou?

O sistema foi **simplificado** para rodar 100% no frontend, sem necessidade de backend!

### Mudanças principais:

- ✅ **Sem backend**: Tudo roda no navegador usando `localStorage`
- ✅ **QR Codes funcionam**: Geram automaticamente com a URL da Vercel
- ✅ **Persistência durante o uso**: Dados ficam salvos no navegador
- ✅ **Sincronização local**: Atualizações em tempo real via eventos customizados
- ❌ **Sem Socket.IO**: Removido (não precisa mais)
- ❌ **Sem API externa**: Nenhuma chamada HTTP para backend

### ⚠️ Limitações (ideal para portfólio):

- Dados são locais ao navegador (não compartilham entre dispositivos diferentes)
- Se limpar o cache/dados do site, os dados são perdidos
- Ideal para **demonstração** e **portfólio**, não para produção com múltiplos usuários simultâneos em dispositivos diferentes

---

## 🚀 Como fazer deploy na Vercel

### Opção 1: Via site da Vercel (mais fácil)

1. **Acesse** [vercel.com](https://vercel.com) e faça login com GitHub
2. **Clique** em "Add New Project"
3. **Selecione** o repositório do projeto
4. **Configure** o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Clique** em "Deploy"
6. **Aguarde** o build e pronto! Seu site estará no ar

### Opção 2: Via terminal (Vercel CLI)

```bash
# 1. Instalar Vercel CLI (globalmente)
npm install -g vercel

# 2. Navegar para a pasta frontend
cd frontend

# 3. Fazer login na Vercel
vercel login

# 4. Deploy
vercel

# 5. Para deploy em produção
vercel --prod
```

---

## 📦 Estrutura de arquivos importantes

```
frontend/
├── src/
│   ├── services/
│   │   └── localStorageService.js  ← NOVO! Substitui backend
│   ├── components/
│   ├── pages/
│   └── config.js                    ← Simplificado
├── vercel.json                      ← Config do Vercel
├── package.json
└── vite.config.js
```

---

## 🧪 Testar localmente antes do deploy

```bash
# 1. Navegar para a pasta frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Rodar em modo desenvolvimento
npm run dev

# 4. OU fazer build e preview (simula produção)
npm run build
npm run preview
```

Abra `http://localhost:5173` (ou a porta mostrada) e teste!

---

## 🔧 Opcional: Limpar dependências não usadas

Se quiser reduzir o tamanho do projeto, você pode remover o Socket.IO:

```bash
cd frontend
npm uninstall socket.io-client
```

Isso é **opcional**, não afeta o funcionamento (já não está sendo usado).

---

## 🎨 Personalizar para seu portfólio

### 1. Trocar o nome do projeto

Edite o `package.json`:

```json
{
  "name": "seu-projeto-racha"
}
```

### 2. Adicionar domínio customizado na Vercel

- Acesse o projeto no dashboard da Vercel
- Vá em "Settings" → "Domains"
- Adicione seu domínio customizado (ex: `racha.seusite.com`)

### 3. Adicionar analytics (opcional)

No dashboard da Vercel, vá em "Analytics" para ver estatísticas de acesso.

---

## 🐛 Troubleshooting

### QR Code não aparece

- Verifique se o modal está sendo aberto corretamente
- Teste em outro navegador

### Dados não salvam

- Verifique se o localStorage não está bloqueado no navegador
- Teste em modo de navegação normal (não anônimo)

### Erro no build

- Certifique-se de estar na pasta `frontend`
- Delete `node_modules` e rode `npm install` novamente
- Verifique a versão do Node (recomendado: 18+)

---

## 📝 Senha de administrador

Para **deletar todas as mesas** na interface:

- Senha padrão: `admin`
- Você pode alterar isso em [localStorageService.js](src/services/localStorageService.js) na função `deleteAllSessions()`

---

## ✅ Pronto!

Agora seu projeto está **super simples** e pronto para subir na Vercel. O sistema de QR Code funcionará automaticamente com a URL do domínio da Vercel!

**Link de exemplo:** `https://seu-projeto.vercel.app`

Qualquer dúvida, verifique a [documentação da Vercel](https://vercel.com/docs).
