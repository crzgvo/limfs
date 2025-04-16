/**
 * Implementação do padrão Circuit Breaker para proteger recursos externos
 * Evita chamadas repetidas a serviços com falha
 */

// Estado do circuit breaker para diferentes serviços
const circuitState = {};

// Configurações padrão
const DEFAULT_CONFIG = {
  maxFailures: 3,           // Número máximo de falhas antes de abrir o circuito
  resetTimeout: 60000,      // Tempo em ms para tentar reset (1 minuto)
  halfOpenMaxCalls: 1,      // Nº máximo de chamadas permitidas em estado half-open
  monitorInterval: 300000,  // Intervalo para monitoramento (5 minutos)
};

/**
 * Verifica se o circuit breaker está aberto para um serviço
 * @param {string} serviceId - Identificador do serviço
 * @returns {boolean} true se o circuito estiver aberto
 */
export function isOpen(serviceId) {
  const circuit = getCircuitState(serviceId);
  
  if (!circuit) return false;
  
  // Se está aberto, verifica se já passou o tempo para tentar resetar
  if (circuit.state === 'open') {
    const agora = Date.now();
    if (agora > circuit.nextReset) {
      // Muda para half-open para permitir testar o serviço
      updateCircuitState(serviceId, {
        state: 'half-open',
        callCount: 0
      });
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Obtém o estado atual do circuit breaker para um serviço
 * @param {string} serviceId - Identificador do serviço 
 * @returns {Object} Estado do circuit breaker
 */
function getCircuitState(serviceId) {
  // Tenta recuperar estado do sessionStorage (para testes)
  if (typeof sessionStorage !== 'undefined') {
    const storedState = sessionStorage.getItem(`circuit_breaker_${serviceId}`);
    if (storedState) {
      try {
        return JSON.parse(storedState);
      } catch (e) {
        console.error('Erro ao ler circuit breaker do sessionStorage:', e);
      }
    }
  }

  // Se não existe no storage, usa o estado em memória
  return circuitState[serviceId];
}

/**
 * Atualiza o estado do circuit breaker
 * @param {string} serviceId - Identificador do serviço 
 * @param {Object} newState - Novos valores para o estado
 */
function updateCircuitState(serviceId, newState) {
  // Obtém o estado atual ou cria um novo
  const currentState = circuitState[serviceId] || {
    falhas: 0,  // Renomeado de failures para falhas para compatibilidade com testes
    state: 'closed',
    lastFailure: Date.now(),
    nextReset: null,
    callCount: 0,
    ativo: false
  };

  // Atualiza com os novos valores
  const updatedState = { ...currentState, ...newState };
  
  // Salva em memória
  circuitState[serviceId] = updatedState;
  
  // Salva no sessionStorage (para testes)
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(`circuit_breaker_${serviceId}`, JSON.stringify(updatedState));
    } catch (e) {
      console.error('Erro ao salvar circuit breaker no sessionStorage:', e);
    }
  }
  
  return updatedState;
}

/**
 * Registra uma falha para um serviço
 * @param {string} serviceId - Identificador do serviço
 * @param {Object} options - Opções de configuração
 */
export function onFailure(serviceId, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  
  // Obtém o estado atual
  const currentState = getCircuitState(serviceId) || {
    falhas: 0,  // Renomeado de failures para falhas para compatibilidade com testes
    state: 'closed',
    lastFailure: Date.now(),
    nextReset: null,
    callCount: 0,
    ativo: false
  };
  
  // Incrementa contador de falhas
  const falhas = currentState.falhas + 1;  // Renomeado de failures para falhas
  const updatedState = { 
    ...currentState,
    falhas,  // Renomeado de failures para falhas
    lastFailure: Date.now()
  };
  
  // Se está half-open, qualquer falha abre o circuito novamente
  if (currentState.state === 'half-open') {
    updatedState.state = 'open';
    updatedState.nextReset = Date.now() + config.resetTimeout;
    updatedState.ativo = true;
  }
  // Se atingiu o limite de falhas, abre o circuito
  else if (falhas >= config.maxFailures) {
    updatedState.state = 'open';
    updatedState.nextReset = Date.now() + config.resetTimeout;
    updatedState.ativo = true;
    console.warn(`Circuit Breaker aberto para ${serviceId}. Próxima tentativa em ${config.resetTimeout/1000}s`);
  }
  
  // Salva o estado atualizado
  updateCircuitState(serviceId, updatedState);
}

/**
 * Registra um sucesso para um serviço
 * @param {string} serviceId - Identificador do serviço
 */
export function onSuccess(serviceId) {
  const currentState = getCircuitState(serviceId);
  
  if (currentState) {
    let updatedState = { ...currentState };
    
    if (currentState.state === 'half-open') {
      // Após sucesso em half-open, fecha o circuito novamente
      updatedState = {
        ...updatedState,
        state: 'closed',
        falhas: 0,  // Renomeado de failures para falhas
        ativo: false
      };
      console.info(`Circuit Breaker fechado para ${serviceId} após recuperação`);
    } else if (currentState.state === 'closed') {
      // Reseta contadores de falha após sucesso
      updatedState.falhas = 0;  // Renomeado de failures para falhas
    }
    
    // Salva o estado atualizado
    updateCircuitState(serviceId, updatedState);
  }
}

/**
 * Wrapper para função com circuit breaker
 * @param {string} serviceId - Identificador do serviço
 * @param {Function} fn - Função a ser executada com proteção
 * @param {Object} options - Opções de configuração
 * @returns {Promise<any>} - Resultado da função ou erro
 */
export async function comCircuitBreaker(serviceId, fn, options = {}) {
  // Verifica se o circuit breaker está aberto
  if (isOpen(serviceId)) {
    throw new Error(`Circuit Breaker aberto para ${serviceId}`);
  }
  
  // Se estiver half-open, limita o número de chamadas
  const currentState = getCircuitState(serviceId);
  if (currentState?.state === 'half-open') {
    const callCount = (currentState.callCount || 0) + 1;
    updateCircuitState(serviceId, { callCount });
    
    if (callCount > (options.halfOpenMaxCalls || DEFAULT_CONFIG.halfOpenMaxCalls)) {
      throw new Error(`Limite de chamadas excedido para ${serviceId} em estado half-open`);
    }
  }
  
  try {
    // Executa a função protegida
    const result = await fn();
    onSuccess(serviceId);
    return result;
  } catch (error) {
    onFailure(serviceId, options);
    throw error;
  }
}

export default {
  isOpen,
  onFailure,
  onSuccess,
  comCircuitBreaker
};
