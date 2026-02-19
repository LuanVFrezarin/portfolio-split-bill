// Config do Racha 2.0
export const APP_VERSION = "2.0-api";

// URL da API - detecta ambiente
const isDevelopment = !window.location.hostname.includes('vercel');
export const API_URL = isDevelopment 
  ? 'http://localhost:4000'
  : 'https://racha-backend.vercel.app'; // Ajuste para sua URL de produção

console.log('Racha 2.0 - Ambiente:', isDevelopment ? 'Development' : 'Production', '- API:', API_URL);
