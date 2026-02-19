// Config do Racha 2.0
export const APP_VERSION = "2.0-api";

// URL da API - detecta ambiente
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isDevelopment 
  ? 'http://localhost:4000'
  : ''; // Em produção, usar a mesma origem (Vercel serve API em /api)

console.log('Racha 2.0 - Ambiente:', isDevelopment ? 'Development' : 'Production', '- API:', API_URL || 'same-origin');
