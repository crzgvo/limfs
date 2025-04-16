/**
 * Utilitário para gerenciamento de cache no navegador
 * Fornece funções para armazenar e recuperar dados em cache
 */

const CACHE_PREFIX = 'limfs_ods_cache_';
const DEFAULT_TTL = 3600000; // 1 hora em milissegundos

/**
 * Verifica se existe um dado em cache e se ainda é válido
 * @param {string} chave - Identificador do item em cache
 * @returns {any|null} Dados do cache ou null se não existir/expirado
 */
export function verificarCache(chave) {
  try {
    const chaveCompleta = `${CACHE_PREFIX}${chave}`;
    
    // Tenta buscar do localStorage
    const itemStr = localStorage.getItem(chaveCompleta);
    if (!itemStr) return null;
    
    // Converte de volta para objeto
    const item = JSON.parse(itemStr);
    
    // Verifica se o item expirou
    if (item.expira && new Date().getTime() > item.expira) {
      localStorage.removeItem(chaveCompleta);
      return null;
    }
    
    return item.dados;
  } catch (erro) {
    console.warn(`Erro ao acessar cache para ${chave}:`, erro);
    return null;
  }
}

/**
 * Salva um dado no cache
 * @param {string} chave - Identificador do item em cache
 * @param {any} dados - Dados a serem armazenados 
 * @param {number} ttl - Tempo de vida em milissegundos
 * @returns {boolean} True se armazenado com sucesso, false caso contrário
 */
export function salvarCache(chave, dados, ttl = DEFAULT_TTL) {
  try {
    const chaveCompleta = `${CACHE_PREFIX}${chave}`;
    const agora = new Date().getTime();
    
    // Estrutura do item em cache com metadados
    const item = {
      dados,
      criado: agora,
      expira: agora + ttl
    };
    
    // Armazena no localStorage
    localStorage.setItem(chaveCompleta, JSON.stringify(item));
    return true;
  } catch (erro) {
    console.warn(`Erro ao salvar em cache para ${chave}:`, erro);
    return false;
  }
}

/**
 * Limpa itens expirados do cache
 * @returns {number} Número de itens removidos
 */
export function limparCacheExpirado() {
  try {
    const agora = new Date().getTime();
    let removidos = 0;
    
    // Percorre todos os itens do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      
      // Verifica se pertence ao nosso cache
      if (chave && chave.startsWith(CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(chave));
          
          // Remove se expirado
          if (item.expira && agora > item.expira) {
            localStorage.removeItem(chave);
            removidos++;
          }
        } catch (erro) {
          // Em caso de erro com um item específico, remove-o
          localStorage.removeItem(chave);
          removidos++;
        }
      }
    }
    
    return removidos;
  } catch (erro) {
    console.error('Erro ao limpar cache expirado:', erro);
    return 0;
  }
}

export default {
  verificarCache,
  salvarCache,
  limparCacheExpirado,
  CACHE_PREFIX,
  DEFAULT_TTL
};
