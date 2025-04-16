/**
 * Serviço para carregamento de dados de indicadores ODS
 */
import { logger, relatarErro } from '../monitoring.js';
import { API_TIMEOUT_MS, CACHE_CONFIG, ENDPOINTS } from '../../constants/api.js';

// Cache local para evitar requisições repetidas
let cacheLocal = {};

/**
 * Busca dados de um indicador, com suporte a cache e fallback
 * @param {string} endpoint - Identificador do endpoint a ser consultado
 * @param {Object} opcoesCache - Opções adicionais de cache
 * @returns {Promise<Object>} Dados do indicador
 */
export async function buscarDadosAPI(endpoint, opcoesCache = {}) {
  const urlCompleta = ENDPOINTS[endpoint] || endpoint;
  const cacheKey = `dados_${endpoint}`;
  
  try {
    // Verifica cache primeiro
    const dadosCache = obterDoCache(cacheKey);
    if (dadosCache) {
      logger.debug(`Usando cache para ${endpoint}`);
      return dadosCache;
    }
    
    logger.info(`Buscando dados para ${endpoint}`);
    
    // Configura timeout para evitar requisições muito longas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    
    // Faz requisição com timeout
    try {
      const resposta = await fetch(urlCompleta, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Limpa o timeout
      
      if (!resposta.ok) {
        throw new Error(`Erro na requisição: ${resposta.status} ${resposta.statusText}`);
      }
      
      const dados = await resposta.json();
      
      // Guarda no cache para futuras requisições
      guardarNoCache(cacheKey, dados, opcoesCache.ttl);
      
      return dados;
    } catch (erro) {
      if (erro.name === 'AbortError') {
        throw new Error(`Timeout ao buscar dados para ${endpoint}`);
      }
      throw erro;
    }
  } catch (erro) {
    relatarErro(erro, `buscarDadosAPI(${endpoint})`, { urlCompleta });
    
    // Em caso de erro, busca dados de fallback
    return buscarDadosFallback(endpoint);
  }
}

/**
 * Busca dados de fallback (históricos ou mock) quando API falha
 * @param {string} endpoint - Identificador do endpoint
 * @returns {Object} Dados de fallback
 */
async function buscarDadosFallback(endpoint) {
  try {
    logger.warn(`Usando fallback para ${endpoint}`);
    
    // Tenta buscar de um arquivo JSON local
    const fallbackUrl = `/data/${endpoint.toLowerCase()}.json`;
    const resposta = await fetch(fallbackUrl);
    
    if (!resposta.ok) {
      throw new Error(`Arquivo de fallback não encontrado: ${fallbackUrl}`);
    }
    
    return await resposta.json();
  } catch (erro) {
    logger.error(`Erro ao buscar fallback para ${endpoint}:`, erro);
    
    // Último recurso: retorna dados mínimos
    return {
      valor: 'N/D',
      ano: 'N/A',
      usouFallback: true,
      endpoint
    };
  }
}

/**
 * Obtém dados do cache local
 * @param {string} chave - Chave de identificação no cache
 * @returns {Object|null} Dados do cache ou null se não encontrado/expirado
 */
function obterDoCache(chave) {
  try {
    const chaveCompleta = `${CACHE_CONFIG.STORAGE_KEY_PREFIX}${chave}`;
    
    // Tenta buscar do localStorage primeiro
    const dadosString = localStorage.getItem(chaveCompleta);
    
    if (!dadosString) {
      // Verifica cache em memória
      return cacheLocal[chaveCompleta]?.dados || null;
    }
    
    const cacheItem = JSON.parse(dadosString);
    
    // Verifica se o cache expirou
    if (cacheItem.expira && cacheItem.expira < Date.now()) {
      localStorage.removeItem(chaveCompleta);
      return null;
    }
    
    return cacheItem.dados;
  } catch (erro) {
    logger.debug(`Erro ao acessar cache: ${erro.message}`);
    return null;
  }
}

/**
 * Guarda dados no cache local
 * @param {string} chave - Chave de identificação no cache
 * @param {Object} dados - Dados a serem armazenados
 * @param {number} ttl - Tempo de vida em milissegundos (opcional)
 */
function guardarNoCache(chave, dados, ttl = CACHE_CONFIG.TTL_DEFAULT) {
  try {
    const chaveCompleta = `${CACHE_CONFIG.STORAGE_KEY_PREFIX}${chave}`;
    const agora = Date.now();
    const expira = agora + ttl;
    
    const cacheItem = {
      dados,
      expira,
      criado: agora
    };
    
    // Armazena em memória
    cacheLocal[chaveCompleta] = { ...cacheItem };
    
    // Tenta armazenar no localStorage para persistência
    try {
      localStorage.setItem(chaveCompleta, JSON.stringify(cacheItem));
    } catch (erroStorage) {
      logger.warn(`Erro ao salvar no localStorage: ${erroStorage.message}`);
      // Continua mesmo se localStorage falhar (usa apenas cache em memória)
    }
  } catch (erro) {
    logger.error(`Erro ao guardar no cache: ${erro.message}`);
  }
}

/**
 * Limpa todo o cache relacionado aos indicadores
 */
export function limparCache() {
  try {
    logger.info('Limpando cache de indicadores');
    
    // Limpa cache em memória
    cacheLocal = {};
    
    // Limpa localStorage
    const prefixo = CACHE_CONFIG.STORAGE_KEY_PREFIX;
    Object.keys(localStorage).forEach(chave => {
      if (chave.startsWith(prefixo)) {
        localStorage.removeItem(chave);
      }
    });
    
    return true;
  } catch (erro) {
    logger.error(`Erro ao limpar cache: ${erro.message}`);
    return false;
  }
}
