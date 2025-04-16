/**
 * Utilitário de cache para o Painel ODS Sergipe
 * Gerencia armazenamento temporário de dados com TTL
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

/**
 * Verifica se há dados em cache válidos
 * @param {string} chave - Identificador do cache
 * @returns {Object|null} Dados do cache se válidos
 */
export function verificarCacheLocal(chave) {
    try {
        const dado = localStorage.getItem(chave);
        if (!dado) return null;

        const cache = JSON.parse(dado);
        const agora = new Date().getTime();
        
        // Cache válido apenas se timestamp existir e estiver dentro do TTL
        if (cache.timestamp && (agora - cache.timestamp) < CACHE_TTL) {
            return cache;
        }
        
        // Remove cache expirado automaticamente
        localStorage.removeItem(chave);
        return null;
    } catch (erro) {
        console.warn(`Erro ao verificar cache para ${chave}:`, erro);
        return null;
    }
}

/**
 * Armazena dados em cache com timestamp
 * @param {string} chave - Identificador do cache
 * @param {Object} dados - Dados a serem armazenados
 */
export function armazenarCacheLocal(chave, dados) {
    try {
        const cache = {
            ...dados,
            timestamp: Date.now()
        };
        
        localStorage.setItem(chave, JSON.stringify(cache));
    } catch (erro) {
        console.warn(`Erro ao armazenar cache para ${chave}:`, erro);
    }
}

/**
 * Limpa todos os caches expirados no localStorage
 */
export function limparCacheExpirado() {
    try {
        const agora = new Date().getTime();
        
        Object.keys(localStorage)
            .filter(chave => chave.startsWith('ods_sergipe_'))
            .forEach(chave => {
                try {
                    const cache = JSON.parse(localStorage.getItem(chave));
                    if (cache && cache.timestamp && (agora - cache.timestamp) >= CACHE_TTL) {
                        localStorage.removeItem(chave);
                    }
                } catch (e) {
                    // Ignora erros de parsing em itens individuais
                    localStorage.removeItem(chave);
                }
            });
    } catch (erro) {
        console.warn('Erro ao limpar cache expirado:', erro);
    }
}