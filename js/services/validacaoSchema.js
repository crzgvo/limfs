/**
 * Serviço de validação de esquemas JSON para o Painel ODS Sergipe
 * Garante integridade dos dados e conformidade com os formatos esperados.
 * 
 * Este módulo implementa práticas avançadas de validação que contribuem com o
 * ODS 16 (Paz, Justiça e Instituições Eficazes), ao garantir a qualidade
 * e transparência dos dados públicos.
 * 
 * @module validacaoSchema
 * @version 1.0.0
 */

import { logger } from './monitoramento.js';

// Schema base para indicadores ODS
const schemaIndicadorBase = {
  type: 'object',
  required: ['valor', 'ano'],
  properties: {
    valor: { 
      oneOf: [
        { type: 'number' },
        { type: 'string', enum: ['N/D'] }
      ]
    },
    ano: { 
      oneOf: [
        { type: 'number', minimum: 2000, maximum: 2050 },
        { type: 'string', pattern: '^[0-9]{4}$' }
      ]
    },
    timestamp: { type: 'number' },
    usouFallback: { type: 'boolean' },
    erro: { type: 'boolean' }
  }
};

// Schema para séries históricas
const schemaSerieHistorica = {
  type: 'array',
  items: {
    type: 'object',
    required: ['ano', 'valor'],
    properties: {
      ano: {
        oneOf: [
          { type: 'number', minimum: 2000, maximum: 2050 },
          { type: 'string', pattern: '^[0-9]{4}$' }
        ]
      },
      valor: { 
        oneOf: [
          { type: 'number' },
          { type: 'string', enum: ['N/D'] }
        ]
      },
      mes: { type: 'number', minimum: 1, maximum: 12 },
      trimestre: { type: 'number', minimum: 1, maximum: 4 }
    }
  }
};

// Coleção de schemas específicos para cada indicador ODS
const schemasIndicadores = {
  // ODS 1 - Erradicação da Pobreza
  pobreza: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 100 },
      limite_pobreza: { type: 'number' },
      fonte: { type: 'string' }
    }
  },
  
  // ODS 4 - Educação de Qualidade
  educacao: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 100 },
      grupo_idade: { type: 'string' }
    }
  },
  
  // ODS 6 - Água Potável e Saneamento
  saneamento: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 100 }
    }
  },
  
  // ODS 3 - Saúde e Bem-Estar
  mortalidade_infantil: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 100 }
    }
  },
  
  // ODS 7 - Energia Limpa e Acessível
  energia_solar: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 100 },
      instalacoes: { type: 'number' },
      capacidade_kw: { type: 'number' }
    }
  },
  
  // ODS 11 - Cidades e Comunidades Sustentáveis
  residuos_reciclados: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 100 },
      volume_toneladas: { type: 'number' }
    }
  },
  
  // ODS 10 - Redução das Desigualdades
  desigualdade: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 1 },
      coeficiente_gini: { type: 'number', minimum: 0, maximum: 1 }
    }
  },
  
  // ODS 16 - Paz, Justiça e Instituições Eficazes
  transparencia: {
    ...schemaIndicadorBase,
    properties: {
      ...schemaIndicadorBase.properties,
      valor: { type: 'number', minimum: 0, maximum: 10 },
      ranking_nacional: { type: 'number' },
      itens_avaliados: { type: 'number' }
    }
  }
};

// Erro de validação personalizado
class ErroValidacaoSchema extends Error {
  constructor(mensagem, errosDetalhados = null, dados = null, schema = null) {
    super(mensagem);
    this.name = 'ErroValidacaoSchema';
    this.errosDetalhados = errosDetalhados;
    this.dados = dados;
    this.schema = schema;
  }
}

/**
 * Valida dados contra um schema específico
 * @param {Object|Array} dados - Dados a serem validados
 * @param {Object} schema - Schema para validação (JSON Schema)
 * @returns {boolean} Resultado da validação
 * @throws {ErroValidacaoSchema} Erro detalhado se a validação falhar
 */
function validarContraSchema(dados, schema) {
  // Implementação simplificada - em produção usar uma biblioteca como Ajv
  
  // Função recursiva para validação
  function validar(valor, esquema, caminho = '') {
    const erros = [];
    
    // Validação de tipo
    if (esquema.type) {
      const tipo = Array.isArray(valor) ? 'array' : typeof valor;
      
      if (esquema.type === 'number' && tipo === 'string') {
        // Tenta converter string para número
        const num = Number(valor);
        if (!isNaN(num)) {
          valor = num;
        } else {
          erros.push(`${caminho}: valor '${valor}' não é do tipo ${esquema.type}`);
        }
      } else if (esquema.type !== tipo) {
        if (!(esquema.type === 'number' && tipo === 'number')) {
          erros.push(`${caminho}: valor é do tipo ${tipo}, esperava ${esquema.type}`);
        }
      }
    }
    
    // Validação de array
    if (Array.isArray(valor) && esquema.items) {
      valor.forEach((item, index) => {
        const errosItem = validar(item, esquema.items, `${caminho}[${index}]`);
        erros.push(...errosItem);
      });
    }
    
    // Validação de objeto
    if (valor && typeof valor === 'object' && !Array.isArray(valor) && esquema.properties) {
      // Verifica propriedades obrigatórias
      if (esquema.required) {
        for (const prop of esquema.required) {
          if (!(prop in valor)) {
            erros.push(`${caminho}: propriedade obrigatória '${prop}' ausente`);
          }
        }
      }
      
      // Valida cada propriedade com seu schema
      for (const [prop, valorProp] of Object.entries(valor)) {
        if (esquema.properties[prop]) {
          const errosProp = validar(valorProp, esquema.properties[prop], `${caminho}.${prop}`);
          erros.push(...errosProp);
        }
      }
    }
    
    // Validação de enum
    if (esquema.enum && !esquema.enum.includes(valor)) {
      erros.push(`${caminho}: valor '${valor}' não está entre os valores permitidos: ${esquema.enum.join(', ')}`);
    }
    
    // Validação de padrão (regex)
    if (esquema.pattern && typeof valor === 'string') {
      const regex = new RegExp(esquema.pattern);
      if (!regex.test(valor)) {
        erros.push(`${caminho}: valor '${valor}' não corresponde ao padrão ${esquema.pattern}`);
      }
    }
    
    // Validação de número mínimo e máximo
    if (typeof valor === 'number') {
      if (esquema.minimum !== undefined && valor < esquema.minimum) {
        erros.push(`${caminho}: valor ${valor} é menor que o mínimo permitido (${esquema.minimum})`);
      }
      if (esquema.maximum !== undefined && valor > esquema.maximum) {
        erros.push(`${caminho}: valor ${valor} é maior que o máximo permitido (${esquema.maximum})`);
      }
    }
    
    // Validação oneOf
    if (esquema.oneOf) {
      const validacoesOneOf = esquema.oneOf.map(subEsquema => validar(valor, subEsquema, caminho));
      const passouEmAlgum = validacoesOneOf.some(errosList => errosList.length === 0);
      
      if (!passouEmAlgum) {
        erros.push(`${caminho}: valor não corresponde a nenhum dos esquemas permitidos`);
      }
    }
    
    return erros;
  }
  
  // Executa a validação
  const erros = validar(dados, schema);
  
  // Se houver erros, lança exceção
  if (erros.length > 0) {
    throw new ErroValidacaoSchema(
      `Erro de validação: ${erros.length} problemas encontrados`,
      erros,
      dados,
      schema
    );
  }
  
  return true;
}

/**
 * Valida dados de um indicador ODS específico
 * @param {string} indicador - Nome do indicador (ex: 'pobreza', 'educacao')
 * @param {Object} dados - Dados do indicador a serem validados
 * @returns {boolean} Resultado da validação
 * @throws {ErroValidacaoSchema} Erro detalhado se a validação falhar
 */
export function validarIndicador(indicador, dados) {
  try {
    // Seleciona o schema adequado
    const schema = schemasIndicadores[indicador] || schemaIndicadorBase;
    
    // Executa a validação
    return validarContraSchema(dados, schema);
  } catch (erro) {
    // Captura e registra o erro
    if (erro instanceof ErroValidacaoSchema) {
      logger.warn(
        `Erro na validação do indicador ${indicador}: ${erro.message}`,
        erro.errosDetalhados
      );
      throw erro;
    } else {
      // Erro inesperado
      logger.error(`Erro inesperado na validação do indicador ${indicador}:`, erro);
      throw new ErroValidacaoSchema(
        `Erro inesperado ao validar ${indicador}`, 
        [erro.message], 
        dados
      );
    }
  }
}

/**
 * Valida série histórica de um indicador
 * @param {Array} serieHistorica - Array com os dados históricos do indicador
 * @returns {boolean} Resultado da validação
 * @throws {ErroValidacaoSchema} Erro detalhado se a validação falhar
 */
export function validarSerieHistorica(serieHistorica) {
  try {
    return validarContraSchema(serieHistorica, schemaSerieHistorica);
  } catch (erro) {
    if (erro instanceof ErroValidacaoSchema) {
      logger.warn(
        `Erro na validação da série histórica: ${erro.message}`,
        erro.errosDetalhados
      );
      throw erro;
    } else {
      logger.error(`Erro inesperado na validação da série histórica:`, erro);
      throw new ErroValidacaoSchema(
        `Erro inesperado ao validar série histórica`, 
        [erro.message], 
        serieHistorica
      );
    }
  }
}

/**
 * Sanitiza dados de um indicador para garantir tipos corretos
 * @param {Object} dados - Dados brutos a serem sanitizados
 * @param {string} indicador - Nome do indicador
 * @returns {Object} Dados sanitizados
 */
export function sanitizarDadosIndicador(dados, indicador) {
  if (!dados) return null;
  
  try {
    const resultado = { ...dados };
    
    // Conversão de tipos básicos
    if (resultado.valor !== undefined && resultado.valor !== 'N/D') {
      resultado.valor = Number(resultado.valor);
      
      // Garante que percentagens estão no formato correto (0-100)
      if (['pobreza', 'educacao', 'saneamento', 'energia_solar', 'residuos_reciclados'].includes(indicador)) {
        // Se o valor estiver entre 0-1, converte para 0-100
        if (resultado.valor > 0 && resultado.valor < 1) {
          resultado.valor = resultado.valor * 100;
        }
      }
    }
    
    if (resultado.ano !== undefined && typeof resultado.ano === 'string') {
      const ano = parseInt(resultado.ano);
      if (!isNaN(ano)) {
        resultado.ano = ano;
      }
    }
    
    if (resultado.timestamp !== undefined && typeof resultado.timestamp === 'string') {
      const timestamp = Date.parse(resultado.timestamp);
      if (!isNaN(timestamp)) {
        resultado.timestamp = timestamp;
      }
    }
    
    return resultado;
  } catch (erro) {
    logger.error(`Erro ao sanitizar dados do indicador ${indicador}:`, erro);
    return dados; // Retorna os dados originais se ocorrer erro
  }
}

/**
 * Verifica a consistência dos dados para detectar anomalias
 * @param {Object} dados - Dados do indicador
 * @param {Array} historico - Dados históricos para comparação
 * @param {string} indicador - Nome do indicador
 * @returns {Object} Resultado da verificação com possíveis alertas
 */
export function verificarConsistenciaDados(dados, historico, indicador) {
  try {
    const resultado = {
      consistente: true,
      alertas: [],
      nivel: 'info'
    };
    
    // Sem histórico para comparar
    if (!Array.isArray(historico) || historico.length === 0) {
      return resultado;
    }
    
    // Dados inválidos
    if (!dados || typeof dados.valor !== 'number') {
      resultado.consistente = false;
      resultado.alertas.push('Dados inválidos ou incompletos');
      resultado.nivel = 'warn';
      return resultado;
    }
    
    // Obtém valores históricos para comparação
    const valoresHistoricos = historico
      .map(item => typeof item.valor === 'number' ? item.valor : null)
      .filter(valor => valor !== null);
    
    if (valoresHistoricos.length === 0) {
      return resultado;
    }
    
    // Calcula estatísticas básicas
    const media = valoresHistoricos.reduce((acc, val) => acc + val, 0) / valoresHistoricos.length;
    const max = Math.max(...valoresHistoricos);
    const min = Math.min(...valoresHistoricos);
    const amplitude = max - min;
    
    // Verifica se o valor está além de 2 desvios padrão da média
    const desvioPadrao = Math.sqrt(
      valoresHistoricos.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valoresHistoricos.length
    );
    
    const limiteInferior = media - 2 * desvioPadrao;
    const limiteSuperior = media + 2 * desvioPadrao;
    
    // Anomalias e alertas
    if (dados.valor < limiteInferior) {
      resultado.consistente = false;
      resultado.alertas.push(`Valor ${dados.valor} está abaixo do esperado (limite: ${limiteInferior.toFixed(2)})`);
      resultado.nivel = 'warn';
    }
    
    if (dados.valor > limiteSuperior) {
      resultado.consistente = false;
      resultado.alertas.push(`Valor ${dados.valor} está acima do esperado (limite: ${limiteSuperior.toFixed(2)})`);
      resultado.nivel = 'warn';
    }
    
    // Verifica variação muito abrupta em relação ao último valor
    const ultimoValor = valoresHistoricos[valoresHistoricos.length - 1];
    const variacaoPorcentagem = Math.abs((dados.valor - ultimoValor) / ultimoValor) * 100;
    
    if (variacaoPorcentagem > 30) {
      resultado.alertas.push(`Variação de ${variacaoPorcentagem.toFixed(1)}% em relação ao último valor (${ultimoValor})`);
      
      if (variacaoPorcentagem > 50) {
        resultado.consistente = false;
        resultado.nivel = 'warn';
      }
    }
    
    return resultado;
  } catch (erro) {
    logger.error(`Erro ao verificar consistência dos dados do indicador ${indicador}:`, erro);
    return {
      consistente: true,
      alertas: [`Erro na verificação de consistência: ${erro.message}`],
      nivel: 'error'
    };
  }
}