/**
 * Serviço para validação de dados de indicadores ODS
 */
import { logger } from '../monitoring.js';

// Schemas básicos para validação de indicadores
const schemas = {
  // Schema para indicadores de pobreza (ODS1)
  POBREZA: {
    type: 'object',
    required: ['valor', 'ano', 'regiao'],
    properties: {
      valor: { type: 'number', minimum: 0, maximum: 100 },
      ano: { type: 'string', pattern: '^[0-9]{4}$' },
      regiao: { type: 'string', minLength: 1 }
    }
  },
  
  // Schema para indicadores de educação (ODS4)
  EDUCACAO: {
    type: 'object',
    required: ['valor', 'ano', 'categoria'],
    properties: {
      valor: { type: 'number', minimum: 0, maximum: 100 },
      ano: { type: 'string', pattern: '^[0-9]{4}$' },
      categoria: { type: 'string', minLength: 1 },
      segmentos: {
        type: 'array',
        items: {
          type: 'object',
          required: ['nome', 'valor'],
          properties: {
            nome: { type: 'string', minLength: 1 },
            valor: { type: 'number', minimum: 0, maximum: 100 }
          }
        }
      }
    }
  },
  
  // Schema padrão para outros indicadores
  DEFAULT: {
    type: 'object',
    required: ['valor', 'ano'],
    properties: {
      valor: { oneOf: [
        { type: 'number' },
        { type: 'string', minLength: 1 }
      ]},
      ano: { type: 'string', minLength: 1 }
    }
  }
};

/**
 * Valida os dados de um indicador contra seu schema
 * @param {string} endpoint - Identificador do indicador
 * @param {Object} dados - Dados a serem validados
 * @returns {boolean} - True se válido, lança erro se inválido
 */
export function validarIndicador(endpoint, dados) {
  // Seleciona o schema apropriado ou usa o padrão
  const schema = schemas[endpoint] || schemas.DEFAULT;
  
  try {
    // Valida propriedades obrigatórias
    schema.required.forEach(prop => {
      if (dados[prop] === undefined || dados[prop] === null) {
        throw new Error(`Propriedade obrigatória ausente: ${prop}`);
      }
    });
    
    // Valida tipos e restrições
    Object.entries(schema.properties).forEach(([prop, config]) => {
      if (dados[prop] !== undefined) {
        validarPropriedade(prop, dados[prop], config);
      }
    });
    
    return true;
  } catch (erro) {
    logger.warn(`Validação falhou para ${endpoint}: ${erro.message}`, dados);
    throw erro;
  }
}

/**
 * Valida uma propriedade específica
 * @param {string} nome - Nome da propriedade
 * @param {any} valor - Valor da propriedade
 * @param {Object} config - Configuração de validação
 */
function validarPropriedade(nome, valor, config) {
  // Validação de tipo
  if (config.type === 'number' && typeof valor !== 'number') {
    throw new Error(`${nome} deve ser um número, recebeu ${typeof valor}`);
  }
  
  if (config.type === 'string' && typeof valor !== 'string') {
    throw new Error(`${nome} deve ser uma string, recebeu ${typeof valor}`);
  }
  
  if (config.type === 'array' && !Array.isArray(valor)) {
    throw new Error(`${nome} deve ser um array, recebeu ${typeof valor}`);
  }
  
  // Validação de ranges numéricos
  if (typeof valor === 'number') {
    if (config.minimum !== undefined && valor < config.minimum) {
      throw new Error(`${nome} deve ser maior ou igual a ${config.minimum}`);
    }
    
    if (config.maximum !== undefined && valor > config.maximum) {
      throw new Error(`${nome} deve ser menor ou igual a ${config.maximum}`);
    }
  }
  
  // Validação de tamanho de string
  if (typeof valor === 'string') {
    if (config.minLength !== undefined && valor.length < config.minLength) {
      throw new Error(`${nome} deve ter pelo menos ${config.minLength} caracteres`);
    }
    
    if (config.maxLength !== undefined && valor.length > config.maxLength) {
      throw new Error(`${nome} deve ter no máximo ${config.maxLength} caracteres`);
    }
    
    // Validação de padrão (regex)
    if (config.pattern && !new RegExp(config.pattern).test(valor)) {
      throw new Error(`${nome} não corresponde ao padrão esperado`);
    }
  }
  
  // Validação de arrays
  if (Array.isArray(valor) && config.items) {
    valor.forEach((item, index) => {
      try {
        // Validação recursiva para itens de array
        if (config.items.type === 'object') {
          config.items.required.forEach(prop => {
            if (item[prop] === undefined || item[prop] === null) {
              throw new Error(`Propriedade obrigatória ausente: ${prop}`);
            }
          });
          
          Object.entries(config.items.properties).forEach(([prop, propConfig]) => {
            if (item[prop] !== undefined) {
              validarPropriedade(`${nome}[${index}].${prop}`, item[prop], propConfig);
            }
          });
        }
      } catch (erro) {
        throw new Error(`Erro no item ${index} do array ${nome}: ${erro.message}`);
      }
    });
  }
}

/**
 * Sanitiza dados de entrada para evitar problemas de segurança
 * @param {Object} dados - Dados brutos a serem sanitizados
 * @param {string} endpoint - Identificador do indicador
 * @returns {Object} Dados sanitizados
 */
export function sanitizarDadosIndicador(dados, endpoint) {
  if (!dados || typeof dados !== 'object') {
    logger.warn(`Dados inválidos para sanitização: ${typeof dados}`);
    return { valor: 'N/D', ano: 'N/A', endpoint };
  }
  
  const resultado = { ...dados };
  
  // Sanitiza strings para prevenir XSS
  Object.entries(resultado).forEach(([chave, valor]) => {
    if (typeof valor === 'string') {
      resultado[chave] = sanitizarString(valor);
    }
  });
  
  return resultado;
}

/**
 * Sanitiza uma string para prevenir XSS
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
function sanitizarString(str) {
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Verifica consistência dos dados com base em histórico
 * @param {Object} dados - Dados atuais
 * @param {Array} historico - Histórico de dados anteriores
 * @param {string} endpoint - Identificador do indicador
 * @returns {Object} Resultado da verificação
 */
export function verificarConsistenciaDados(dados, historico = [], endpoint) {
  const resultado = {
    consistente: true,
    alertas: []
  };
  
  // Se não há histórico ou valor atual não é número, não podemos verificar consistência
  if (!Array.isArray(historico) || historico.length === 0 || typeof dados.valor !== 'number') {
    return resultado;
  }
  
  try {
    // Verifica variação percentual excessiva (anomalias)
    const ultimoDado = historico.slice(-1)[0];
    if (ultimoDado && typeof ultimoDado.valor === 'number' && ultimoDado.valor !== 0) {
      const variacao = Math.abs((dados.valor - ultimoDado.valor) / ultimoDado.valor * 100);
      
      // Define limites de variação aceitável com base no tipo de indicador
      let limiteVariacao = 30; // 30% padrão
      
      // Ajusta limite com base no indicador específico
      if (endpoint === 'ENERGIA_SOLAR') {
        // Energia solar pode ter variações maiores (crescimento rápido)
        limiteVariacao = 50;
      } else if (endpoint === 'POBREZA' || endpoint === 'MORTALIDADE_INFANTIL') {
        // Indicadores sociais críticos normalmente têm variações menores
        limiteVariacao = 20;
      }
      
      if (variacao > limiteVariacao) {
        resultado.consistente = false;
        resultado.alertas.push(`Variação de ${variacao.toFixed(1)}% é maior que o esperado (${limiteVariacao}%)`);
      }
    }
    
    // Verifica se o valor está fora da tendência histórica (3 desvios padrão)
    if (historico.length >= 3) {
      const valoresHistoricos = historico.map(item => item.valor).filter(val => typeof val === 'number');
      const media = valoresHistoricos.reduce((soma, val) => soma + val, 0) / valoresHistoricos.length;
      const desvioPadrao = Math.sqrt(
        valoresHistoricos.reduce((soma, val) => soma + Math.pow(val - media, 2), 0) / valoresHistoricos.length
      );
      
      const limiteInferior = media - (3 * desvioPadrao);
      const limiteSuperior = media + (3 * desvioPadrao);
      
      if (dados.valor < limiteInferior || dados.valor > limiteSuperior) {
        resultado.consistente = false;
        resultado.alertas.push(`Valor ${dados.valor} está fora de 3 desvios padrão da média histórica (${media.toFixed(2)} ± ${(3 * desvioPadrao).toFixed(2)})`);
      }
    }
  } catch (erro) {
    logger.error(`Erro ao verificar consistência: ${erro.message}`, { endpoint, dados });
  }
  
  return resultado;
}
