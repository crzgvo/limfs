/**
 * Implementa estratégia de retry com backoff exponencial.
 * @module retry
 */

const RETRY_CONFIG = {
    MAX_TENTATIVAS: 3,
    DELAY_INICIAL: 1000,
    MAX_DELAY: 30000
};

/**
 * Executa uma função com retry e backoff exponencial.
 * @param {Function} fn - Função assíncrona a ser executada
 * @param {Object} [options] - Opções de configuração
 * @param {number} [options.maxTentativas=3] - Número máximo de tentativas
 * @param {number} [options.delayInicial=1000] - Delay inicial em ms
 * @param {number} [options.maxDelay=30000] - Delay máximo em ms
 * @returns {Promise<*>} Resultado da função executada
 */
export async function comRetry(fn, options = {}) {
    const config = { ...RETRY_CONFIG, ...options };
    let ultimoErro;
    
    for (let tentativa = 1; tentativa <= config.MAX_TENTATIVAS; tentativa++) {
        try {
            return await fn();
        } catch (erro) {
            ultimoErro = erro;
            
            if (tentativa === config.MAX_TENTATIVAS) {
                throw erro;
            }
            
            const delay = Math.min(
                config.DELAY_INICIAL * Math.pow(2, tentativa - 1),
                config.MAX_DELAY
            );
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw ultimoErro;
}

/**
 * Calcula o tempo de espera para a próxima tentativa.
 * @param {number} tentativa - Número da tentativa atual
 * @param {number} delayInicial - Delay inicial em ms
 * @param {number} maxDelay - Delay máximo em ms
 * @returns {number} Tempo de espera em ms
 */
export function calcularBackoff(tentativa, delayInicial = RETRY_CONFIG.DELAY_INICIAL, maxDelay = RETRY_CONFIG.MAX_DELAY) {
    return Math.min(delayInicial * Math.pow(2, tentativa - 1), maxDelay);
}