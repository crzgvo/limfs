/**
 * Implementa estratégia de retentativas com backoff exponencial
 * Essencial para aumentar a resiliência nas chamadas de API
 */

const RETRY_CONFIG = {
    MAX_TENTATIVAS: 3,    // Número máximo de tentativas
    DELAY_INICIAL: 1000,  // Delay base em ms (1 segundo)
    MAX_DELAY: 30000      // Delay máximo em ms (30 segundos)
};

/**
 * Executa uma função com retentativas em caso de falha
 * @param {Function} fn - Função assíncrona a ser executada
 * @param {Object} options - Opções de configuração (opcional)
 * @returns {Promise<*>} Resultado da função ou erro após tentativas esgotadas
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
                throw erro; // Esgotou tentativas, propaga o erro
            }
            
            // Calcula delay com backoff exponencial
            const delay = calcularBackoff(tentativa, config.DELAY_INICIAL, config.MAX_DELAY);
            
            // Aguarda antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw ultimoErro;
}

/**
 * Calcula o tempo de espera para a próxima tentativa usando backoff exponencial
 * @param {number} tentativa - Número da tentativa atual
 * @param {number} delayInicial - Delay base em ms
 * @param {number} maxDelay - Delay máximo em ms
 * @returns {number} Delay calculado em ms
 */
export function calcularBackoff(tentativa, delayInicial = RETRY_CONFIG.DELAY_INICIAL, maxDelay = RETRY_CONFIG.MAX_DELAY) {
    // Fórmula: delay_inicial * (2^(tentativa-1))
    return Math.min(delayInicial * Math.pow(2, tentativa - 1), maxDelay);
}