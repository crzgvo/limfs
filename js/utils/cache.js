/**
 * Gerencia o cache local dos dados do painel ODS.
 * @module cache
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

/**
 * Verifica se há dados em cache válidos para um indicador.
 * @param {string} chave - Identificador único do indicador
 * @returns {Object|null} Dados do cache se válidos, null caso contrário
 */
export function verificarCache(chave) {
    try {
        const cacheStr = localStorage.getItem(`ods_cache_${chave}`);
        if (!cacheStr) return null;

        const cache = JSON.parse(cacheStr);
        const agora = new Date().getTime();
        
        if ((agora - cache.timestamp) < CACHE_TTL) {
            return cache.dados;
        }
        
        localStorage.removeItem(`ods_cache_${chave}`);
        return null;
    } catch (erro) {
        console.warn(`Erro ao verificar cache para ${chave}:`, erro);
        return null;
    }
}

/**
 * Armazena dados em cache com TTL.
 * @param {string} chave - Identificador único do indicador
 * @param {Object} dados - Dados a serem armazenados
 */
export function salvarCache(chave, dados) {
    try {
        const cache = {
            timestamp: new Date().getTime(),
            dados: dados
        };
        
        localStorage.setItem(`ods_cache_${chave}`, JSON.stringify(cache));
    } catch (erro) {
        console.warn(`Erro ao salvar cache para ${chave}:`, erro);
    }
}

/**
 * Limpa todos os caches expirados.
 */
export function limparCacheExpirado() {
    try {
        const agora = new Date().getTime();
        
        Object.keys(localStorage)
            .filter(key => key.startsWith('ods_cache_'))
            .forEach(key => {
                const cache = JSON.parse(localStorage.getItem(key));
                if ((agora - cache.timestamp) >= CACHE_TTL) {
                    localStorage.removeItem(key);
                }
            });
    } catch (erro) {
        console.warn('Erro ao limpar cache expirado:', erro);
    }
}