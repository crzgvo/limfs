/**
 * Constantes relacionadas às APIs e endpoints do sistema
 */

export const API_CONFIG = {
  BASE_URL: 'https://api.limfs.sergipe.gov.br/v1',
  ENDPOINTS: {
    INDICADORES: '/indicadores',
    ODS: '/ods',
    EDUCACAO: '/educacao',
    ENERGIA: '/energia-solar',
    POBREZA: '/pobreza',
    SANEAMENTO: '/saneamento',
    SAUDE: '/mortalidade-infantil',
    TRABALHO: '/trabalho',
    RESIDUOS: '/residuos-reciclados',
  },
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  CACHE_TIME: {
    DEFAULT: 3600000, // 1 hora
    INDICADORES: 86400000, // 24 horas
    CONFIGS: 604800000 // 7 dias
  }
};

export default API_CONFIG;
