/**
 * Implementa o padrão Circuit Breaker para resiliência de chamadas HTTP.
 * @module circuit-breaker
 */

const CIRCUIT_BREAKER_CONFIG = {
    FALHAS_MAX: 5,
    PERIODO_PAUSA: 300000, // 5 minutos
    PERIODO_VERIFICACAO: 60000 // 1 minuto
};

const circuitStates = new Map();

/**
 * Executa uma função com proteção de Circuit Breaker.
 * @param {string} chave - Identificador único do circuito
 * @param {Function} fn - Função a ser executada
 * @returns {Promise<*>} Resultado da função ou null se circuito aberto
 */
export async function comCircuitBreaker(chave, fn) {
    const circuito = getCircuitState(chave);
    
    if (circuito.ativo && !isCircuitoExpirado(circuito)) {
        throw new Error('Circuit Breaker ativo');
    }

    try {
        const resultado = await fn();
        resetCircuit(chave);
        return resultado;
    } catch (erro) {
        registrarFalha(chave);
        throw erro;
    }
}

/**
 * Obtém o estado atual do circuito.
 * @private
 */
function getCircuitState(chave) {
    if (!circuitStates.has(chave)) {
        circuitStates.set(chave, {
            falhas: 0,
            ativo: false,
            ultimaFalha: null,
            pausaAte: null
        });
    }
    return circuitStates.get(chave);
}

/**
 * Registra uma falha no circuito.
 * @private
 */
function registrarFalha(chave) {
    const circuito = getCircuitState(chave);
    circuito.falhas++;
    circuito.ultimaFalha = new Date();
    
    if (circuito.falhas >= CIRCUIT_BREAKER_CONFIG.FALHAS_MAX) {
        circuito.ativo = true;
        circuito.pausaAte = new Date(Date.now() + CIRCUIT_BREAKER_CONFIG.PERIODO_PAUSA);
    }
}

/**
 * Verifica se o período de pausa do circuito expirou.
 * @private
 */
function isCircuitoExpirado(circuito) {
    return circuito.pausaAte && new Date() >= circuito.pausaAte;
}

/**
 * Reseta o estado do circuito após sucesso.
 * @private
 */
function resetCircuit(chave) {
    circuitStates.set(chave, {
        falhas: 0,
        ativo: false,
        ultimaFalha: null,
        pausaAte: null
    });
}

/**
 * Retorna o estado atual de um circuito.
 * @param {string} chave - Identificador único do circuito
 * @returns {Object} Estado atual do circuito
 */
export function getEstadoCircuito(chave) {
    return { ...getCircuitState(chave) };
}