/**
 * Implementa o padrão Circuit Breaker para chamadas de API
 * Protege contra falhas persistentes e evita sobrecarga em serviços instáveis
 */

const CIRCUIT_BREAKER_CONFIG = {
    FALHAS_MAX: 5,          // Número máximo de falhas consecutivas antes de abrir o circuito
    PERIODO_PAUSA: 300000,  // 5 minutos em ms - Período em que o circuito permanece aberto
    PERIODO_VERIFICACAO: 60000 // 1 minuto em ms - Período para verificação parcial
};

// Armazena estado de todos os circuitos
const circuitStates = new Map();

/**
 * Executa uma função com proteção de Circuit Breaker
 * @param {string} chave - Identificador único do circuito
 * @param {Function} fn - Função a ser executada
 * @returns {Promise<*>} Resultado da função ou erro se o circuito estiver aberto
 */
export async function comCircuitBreaker(chave, fn) {
    const circuito = getCircuitState(chave);
    
    // Se o circuito estiver aberto e não expirado, rejeita imediatamente
    if (circuito.ativo && !isCircuitoExpirado(circuito)) {
        throw new Error(`Circuit Breaker ativo para ${chave}`);
    }

    try {
        // Tenta executar a função protegida
        const resultado = await fn();
        resetCircuit(chave); // Sucesso: reseta o circuito
        return resultado;
    } catch (erro) {
        registrarFalha(chave); // Falha: incrementa contador
        throw erro; // Propaga o erro original
    }
}

/**
 * Recupera ou inicializa o estado de um circuito
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
 * Registra uma falha e possivelmente abre o circuito
 * @private
 */
function registrarFalha(chave) {
    const circuito = getCircuitState(chave);
    circuito.falhas++;
    circuito.ultimaFalha = new Date();
    
    // Abre o circuito se atingir o limite de falhas consecutivas
    if (circuito.falhas >= CIRCUIT_BREAKER_CONFIG.FALHAS_MAX) {
        circuito.ativo = true;
        circuito.pausaAte = new Date(Date.now() + CIRCUIT_BREAKER_CONFIG.PERIODO_PAUSA);
    }
}

/**
 * Verifica se o período de pausa do circuito expirou
 * @private
 */
function isCircuitoExpirado(circuito) {
    return circuito.pausaAte && new Date() >= circuito.pausaAte;
}

/**
 * Reseta o estado do circuito após sucesso
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
 * Recupera o estado atual de um circuito para monitoramento
 * @param {string} chave - Identificador único do circuito
 * @returns {Object} Estado atual do circuito
 */
export function getEstadoCircuito(chave) {
    return { ...getCircuitState(chave) };
}