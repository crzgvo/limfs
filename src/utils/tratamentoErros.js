/**
 * Módulo para tratamento padronizado de erros no Painel ODS
 * Centraliza funções de exibição e registro de erros
 * 
 * @module tratamentoErros
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

/**
 * Exibe uma mensagem de erro na interface do usuário
 * 
 * @param {string} mensagem - A mensagem de erro a ser exibida
 * @param {Object} [opcoes] - Configurações para exibição do erro
 * @param {HTMLElement} [opcoes.container] - Elemento container onde exibir o erro (usa #error-message se não especificado)
 * @param {boolean} [opcoes.persistente=false] - Se o erro deve permanecer visível ou sumir automaticamente
 * @param {number} [opcoes.tempoExibicao=5000] - Tempo em ms para exibição do erro (se não for persistente)
 * @param {string} [opcoes.tipo='error'] - Tipo de erro: 'error', 'warning' ou 'info'
 */
export function exibirErro(mensagem, opcoes = {}) {
  try {
    // Define opções padrão
    const config = {
      container: document.getElementById('error-message'),
      persistente: opcoes.persistente !== undefined ? opcoes.persistente : false,
      tempoExibicao: opcoes.tempoExibicao || 5000,
      tipo: opcoes.tipo || 'error'
    };
    
    // Se não houver container especificado ou encontrado, tenta criar um
    if (!config.container) {
      const containerId = 'error-message-dinamico';
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'error';
        container.setAttribute('role', 'alert');
        container.setAttribute('aria-live', 'assertive');
        document.body.appendChild(container);
      }
      
      config.container = container;
    }
    
    // Define a classe CSS baseada no tipo de erro
    const classesCSS = {
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    
    // Remove todas as classes possíveis e adiciona a correta
    config.container.classList.remove('error', 'warning', 'info');
    config.container.classList.add(classesCSS[config.tipo]);
    
    // Prepara o ícone adequado para o tipo de mensagem
    let icone = '';
    switch (config.tipo) {
      case 'error':
        icone = '<i class="fas fa-exclamation-circle" aria-hidden="true"></i> ';
        break;
      case 'warning':
        icone = '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i> ';
        break;
      case 'info':
        icone = '<i class="fas fa-info-circle" aria-hidden="true"></i> ';
        break;
    }
    
    // Define o conteúdo com ícone e mensagem
    config.container.innerHTML = icone + mensagem;
    config.container.style.display = 'block';
    
    // Se não for persistente, configura o timer para ocultar
    if (!config.persistente) {
      setTimeout(() => {
        config.container.style.opacity = '0';
        
        // Após a transição de opacidade, oculta completamente
        setTimeout(() => {
          config.container.style.display = 'none';
          config.container.style.opacity = '1';
        }, 300); // Tempo da transição CSS
      }, config.tempoExibicao);
    }
    
    // Registra o erro no console também
    const nivelLog = {
      error: 'error',
      warning: 'warn',
      info: 'info'
    };
    console[nivelLog[config.tipo]](`[${config.tipo.toUpperCase()}] ${mensagem}`);
    
  } catch (erro) {
    // Fallback se algo der errado na exibição do erro
    console.error('Erro ao exibir mensagem de erro:', erro);
    console.error('Mensagem original:', mensagem);
    
    // Tenta uma abordagem mais simples
    try {
      alert(`Erro: ${mensagem}`);
    } catch (alertErro) {
      // Se até o alert falhar, só logamos no console
      console.error('Falha completa no sistema de exibição de erros.');
    }
  }
}

/**
 * Registra erros no localStorage para persistência e análise posterior
 * 
 * @param {string} categoria - Categoria do erro (ex: 'api', 'renderizacao', 'dados')
 * @param {Error|string} erro - Objeto de erro ou mensagem de erro
 * @param {Object} [metadados] - Dados adicionais sobre o contexto do erro
 */
export function registrarErro(categoria, erro, metadados = {}) {
  const chave = 'ods_sergipe_erros';
  const MAX_ERROS_ARMAZENADOS = 50;

  try {
    // Formata o erro para armazenamento
    const erroFormatado = {
      categoria,
      mensagem: erro instanceof Error ? erro.message : String(erro),
      stack: erro instanceof Error ? erro.stack : null,
      metadados,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Recupera erros anteriores ou inicia um array vazio
    let errosAtuais = [];
    const errosSalvos = localStorage.getItem(chave);
    
    if (errosSalvos) {
      try {
        errosAtuais = JSON.parse(errosSalvos);
        if (!Array.isArray(errosAtuais)) errosAtuais = [];
      } catch (e) {
        console.warn("Erro ao parsear erros persistentes do localStorage. Resetando.");
        errosAtuais = [];
      }
    }

    // Adiciona o novo erro ao array
    errosAtuais.push(erroFormatado);

    // Mantém apenas os últimos X erros
    if (errosAtuais.length > MAX_ERROS_ARMAZENADOS) {
      errosAtuais = errosAtuais.slice(errosAtuais.length - MAX_ERROS_ARMAZENADOS);
    }

    // Salva o array atualizado
    localStorage.setItem(chave, JSON.stringify(errosAtuais));
    
    // Envia o erro para o sistema de monitoramento, se configurado
    if (window.monitoramento && typeof window.monitoramento.reportarErro === 'function') {
      window.monitoramento.reportarErro(categoria, erro, metadados);
    }

  } catch (storageError) {
    console.warn("Não foi possível registrar erro persistente:", storageError);
  }
}

/**
 * Recupera o log de erros registrados
 * 
 * @returns {Array} Array com os erros registrados
 */
export function obterLogErros() {
  try {
    const errosSalvos = localStorage.getItem('ods_sergipe_erros');
    if (errosSalvos) {
      const erros = JSON.parse(errosSalvos);
      return Array.isArray(erros) ? erros : [];
    }
  } catch (e) {
    console.warn("Erro ao recuperar log de erros:", e);
  }
  
  return [];
}

/**
 * Limpa o log de erros registrados
 */
export function limparLogErros() {
  try {
    localStorage.removeItem('ods_sergipe_erros');
    return true;
  } catch (e) {
    console.warn("Erro ao limpar log de erros:", e);
    return false;
  }
}

/**
 * Envia o log de erros para uma API de monitoramento
 * 
 * @param {string} endpointAPI - URL da API para enviar os erros
 * @returns {Promise<Object>} Resposta da API
 */
export async function enviarLogErros(endpointAPI) {
  const erros = obterLogErros();
  
  if (!erros.length) {
    return { success: true, message: 'Nenhum erro para enviar', sent: 0 };
  }
  
  try {
    const response = await fetch(endpointAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        erros,
        timestamp: new Date().toISOString(),
        origem: window.location.href,
        userAgent: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const resultado = await response.json();
    
    if (resultado.success) {
      limparLogErros();
    }
    
    return {
      ...resultado,
      sent: erros.length
    };
  } catch (erro) {
    console.error("Erro ao enviar log de erros:", erro);
    return { 
      success: false, 
      message: `Falha ao enviar: ${erro.message}`,
      sent: 0
    };
  }
}

/**
 * Implementa um Circuit Breaker para chamadas de API
 * Previne sobrecarga em serviços indisponíveis
 */
export class CircuitBreaker {
  /**
   * @param {string} nome - Nome identificador do circuit breaker
   * @param {Object} [opcoes] - Opções de configuração
   * @param {number} [opcoes.maxFalhas=3] - Máximo de falhas antes de abrir o circuito
   * @param {number} [opcoes.tempoBloqueio=300000] - Tempo de bloqueio em ms (padrão: 5min)
   * @param {number} [opcoes.percentualTentativa=10] - % de chamadas que tentarão passar quando semi-aberto
   */
  constructor(nome, opcoes = {}) {
    this.nome = nome;
    this.maxFalhas = opcoes.maxFalhas || 3;
    this.tempoBloqueio = opcoes.tempoBloqueio || 5 * 60 * 1000; // 5 minutos
    this.percentualTentativa = opcoes.percentualTentativa || 10;
    
    this.estado = 'fechado'; // fechado, aberto, semi-aberto
    this.falhas = 0;
    this.proximaTentativa = 0;
    this.chaveStorage = `circuit_breaker_${this.nome}`;
    
    this._carregarEstado();
  }
  
  /**
   * Carrega o estado salvo do circuit breaker
   * @private
   */
  _carregarEstado() {
    try {
      const estadoSalvo = sessionStorage.getItem(this.chaveStorage);
      if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        this.estado = estado.estado;
        this.falhas = estado.falhas;
        this.proximaTentativa = estado.proximaTentativa;
        
        // Se o tempo de bloqueio já passou, muda para semi-aberto
        if (this.estado === 'aberto' && Date.now() >= this.proximaTentativa) {
          this.estado = 'semi-aberto';
          this._salvarEstado();
        }
      }
    } catch (e) {
      console.warn(`Erro ao recuperar estado do CircuitBreaker ${this.nome}:`, e);
    }
  }
  
  /**
   * Salva o estado atual do circuit breaker
   * @private
   */
  _salvarEstado() {
    try {
      const estado = {
        estado: this.estado,
        falhas: this.falhas,
        proximaTentativa: this.proximaTentativa
      };
      sessionStorage.setItem(this.chaveStorage, JSON.stringify(estado));
    } catch (e) {
      console.warn(`Erro ao salvar estado do CircuitBreaker ${this.nome}:`, e);
    }
  }
  
  /**
   * Verifica se a chamada pode passar pelo circuit breaker
   * @returns {boolean} true se pode passar, false se bloqueada
   */
  podeChamar() {
    this._carregarEstado();
    
    switch (this.estado) {
      case 'fechado':
        return true;
      
      case 'aberto':
        if (Date.now() >= this.proximaTentativa) {
          this.estado = 'semi-aberto';
          this._salvarEstado();
          return true;
        }
        return false;
      
      case 'semi-aberto':
        // Permite uma porcentagem das chamadas tentar novamente
        const randomVal = Math.random() * 100;
        return randomVal <= this.percentualTentativa;
      
      default:
        return true;
    }
  }
  
  /**
   * Registra sucesso em uma chamada
   * Fecha o circuito se estiver semi-aberto
   */
  registrarSucesso() {
    if (this.estado === 'semi-aberto') {
      this.estado = 'fechado';
      this.falhas = 0;
      this.proximaTentativa = 0;
      this._salvarEstado();
    }
  }
  
  /**
   * Registra falha em uma chamada
   * Incrementa contador e possivelmente abre o circuito
   */
  registrarFalha() {
    this.falhas++;
    
    if (this.falhas >= this.maxFalhas || this.estado === 'semi-aberto') {
      this.estado = 'aberto';
      this.proximaTentativa = Date.now() + this.tempoBloqueio;
    }
    
    this._salvarEstado();
  }
  
  /**
   * Reseta o circuit breaker para o estado fechado
   */
  reset() {
    this.estado = 'fechado';
    this.falhas = 0;
    this.proximaTentativa = 0;
    this._salvarEstado();
  }
  
  /**
   * Executa uma função com proteção do circuit breaker
   * 
   * @template T
   * @param {function(): Promise<T>} funcao - Função assíncrona a executar
   * @returns {Promise<T>} Resultado da função se bem-sucedida
   * @throws {Error} Erro original ou Error("Circuit open") se bloqueado
   */
  async executar(funcao) {
    if (!this.podeChamar()) {
      throw new Error(`Circuit breaker ${this.nome} está aberto. Tente novamente mais tarde.`);
    }
    
    try {
      const resultado = await funcao();
      this.registrarSucesso();
      return resultado;
    } catch (erro) {
      this.registrarFalha();
      throw erro;
    }
  }
}

/**
 * Implementa retry com backoff exponencial para operações com falha
 * 
 * @param {Function} funcao - Função assíncrona a ser executada
 * @param {Object} [opcoes] - Opções de configuração
 * @param {number} [opcoes.maxTentativas=3] - Número máximo de tentativas
 * @param {number} [opcoes.delayInicial=500] - Delay inicial em ms
 * @param {number} [opcoes.fatorMultiplicacao=2] - Fator de multiplicação para backoff
 * @param {Function} [opcoes.condicaoRetry] - Função que recebe o erro e retorna se deve tentar novamente
 * @returns {Promise<any>} Resultado da função
 * @throws {Error} Último erro após todas as tentativas falharem
 */
export async function retryComBackoff(funcao, opcoes = {}) {
  const maxTentativas = opcoes.maxTentativas || 3;
  const delayInicial = opcoes.delayInicial || 500;
  const fatorMultiplicacao = opcoes.fatorMultiplicacao || 2;
  const condicaoRetry = opcoes.condicaoRetry || (() => true);
  
  let ultimoErro;
  
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      return await funcao();
    } catch (erro) {
      ultimoErro = erro;
      
      // Verifica se deve tentar novamente com base na condição
      if (tentativa >= maxTentativas || !condicaoRetry(erro)) {
        break;
      }
      
      // Calcula delay com backoff exponencial
      const delay = delayInicial * Math.pow(fatorMultiplicacao, tentativa - 1);
      
      console.warn(`Tentativa ${tentativa} falhou, tentando novamente em ${delay}ms...`, erro);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  throw ultimoErro;
}

// Exporta uma função de erro genérica para uso rápido
export const erroUI = {
  error: (mensagem) => exibirErro(mensagem, { tipo: 'error' }),
  warning: (mensagem) => exibirErro(mensagem, { tipo: 'warning' }),
  info: (mensagem) => exibirErro(mensagem, { tipo: 'info' }),
  
  temporary: (mensagem, tipo = 'info', tempo = 3000) => 
    exibirErro(mensagem, { tipo, persistente: false, tempoExibicao: tempo })
};