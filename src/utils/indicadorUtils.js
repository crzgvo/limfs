/**
 * Utilitários para processamento e agregação de dados dos indicadores ODS
 * Implementa funções de transformação, agregação e análise de tendências
 * 
 * @module indicadorUtils
 * @version 1.0.0
 */

import { logger } from '../services/monitoramento.js';

/**
 * Agrega dados históricos por período (mês, trimestre, ano)
 * Útil para reduzir volume de dados em séries históricas longas
 * 
 * @param {Array} dadosHistoricos - Array com dados históricos (cada item deve ter propriedades 'ano' e 'valor')
 * @param {string} periodoPorcentagem - Período de agregação ('mes', 'trimestre', 'ano')
 * @returns {Array} Dados agregados
 */
export function agregarDadosPorPeriodo(dadosHistoricos, periodo = 'ano') {
  if (!Array.isArray(dadosHistoricos) || dadosHistoricos.length === 0) {
    logger.warn('agregarDadosPorPeriodo: dadosHistoricos inválido ou vazio');
    return [];
  }

  // Se já estiver agregado por ano (ou período inválido), retorna os dados originais
  if (periodo !== 'mes' && periodo !== 'trimestre') {
    return dadosHistoricos;
  }

  try {
    // Organiza dados por ano e período
    const dadosAgrupados = {};

    dadosHistoricos.forEach(item => {
      if (!item.ano || typeof item.valor !== 'number') {
        return; // Ignora itens com formato inválido
      }

      const ano = parseInt(item.ano);
      let periodoKey;

      if (periodo === 'mes' && item.mes) {
        periodoKey = `${ano}-${item.mes.toString().padStart(2, '0')}`;
      } else if (periodo === 'trimestre' && item.mes) {
        const trimestre = Math.ceil(item.mes / 3);
        periodoKey = `${ano}-T${trimestre}`;
      } else {
        periodoKey = ano.toString();
      }

      if (!dadosAgrupados[periodoKey]) {
        dadosAgrupados[periodoKey] = {
          valores: [],
          totalPeso: 0
        };
      }

      // Adiciona valor ao grupo, considerando peso se disponível
      const peso = item.peso || 1;
      dadosAgrupados[periodoKey].valores.push(item.valor * peso);
      dadosAgrupados[periodoKey].totalPeso += peso;
    });

    // Calcula valor agregado para cada período
    const dadosAgregados = Object.entries(dadosAgrupados).map(([periodoKey, dados]) => {
      const valorAgregado = dados.valores.reduce((acc, val) => acc + val, 0) / dados.totalPeso;
      
      // Extrai informações do período
      let ano, periodoInfo;
      
      if (periodo === 'mes') {
        [ano, periodoInfo] = periodoKey.split('-');
        return { 
          ano: parseInt(ano), 
          mes: parseInt(periodoInfo),
          valor: valorAgregado,
          rotulo: `${periodoInfo}/${ano}`
        };
      } else if (periodo === 'trimestre') {
        [ano, periodoInfo] = periodoKey.split('-');
        return { 
          ano: parseInt(ano), 
          trimestre: parseInt(periodoInfo.substring(1)),
          valor: valorAgregado,
          rotulo: `${periodoInfo}/${ano}`
        };
      } else {
        return {
          ano: parseInt(periodoKey),
          valor: valorAgregado,
          rotulo: periodoKey
        };
      }
    });

    // Ordena por ano e período
    return dadosAgregados.sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      if (a.mes && b.mes) return a.mes - b.mes;
      if (a.trimestre && b.trimestre) return a.trimestre - b.trimestre;
      return 0;
    });

  } catch (erro) {
    logger.error('Erro ao agregar dados por período:', erro);
    return dadosHistoricos; // Retorna dados originais em caso de erro
  }
}

/**
 * Analisa a tendência dos dados com base nos últimos períodos
 * @param {Array} dadosHistoricos - Array com dados históricos
 * @param {number} periodosAnalise - Número de períodos para análise (padrão: 3)
 * @returns {Object} Objeto com informações sobre a tendência
 */
export function analisarTendencia(dadosHistoricos, periodosAnalise = 3) {
  if (!Array.isArray(dadosHistoricos) || dadosHistoricos.length < 2) {
    return { 
      direcao: 'estável',
      percentualVariacao: 0,
      confianca: 'baixa'
    };
  }

  try {
    // Ordena dados por ano/período
    const dadosOrdenados = [...dadosHistoricos].sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      if (a.mes && b.mes) return a.mes - b.mes;
      if (a.trimestre && b.trimestre) return a.trimestre - b.trimestre;
      return 0;
    });

    // Limita aos últimos N períodos para análise
    const dadosRecentes = dadosOrdenados.slice(-Math.min(periodosAnalise, dadosOrdenados.length));

    if (dadosRecentes.length < 2) {
      return { 
        direcao: 'estável',
        percentualVariacao: 0,
        confianca: 'baixa'
      };
    }

    // Calcula a variação percentual entre o período mais recente e o anterior
    const valorAtual = dadosRecentes[dadosRecentes.length - 1].valor;
    const valorAnterior = dadosRecentes[dadosRecentes.length - 2].valor;
    
    let percentualVariacao = 0;
    if (valorAnterior !== 0) {
      percentualVariacao = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
    }

    // Determina a direção da tendência
    let direcao = 'estável';
    if (percentualVariacao > 1) {
      direcao = 'crescente';
    } else if (percentualVariacao < -1) {
      direcao = 'decrescente';
    }

    // Analisa consistência da tendência nos períodos avaliados
    let confianca = 'média';
    if (dadosRecentes.length >= 3) {
      const tendenciasConsistentes = dadosRecentes
        .slice(1)
        .every((dado, index) => {
          const anterior = dadosRecentes[index];
          if (direcao === 'crescente' && dado.valor > anterior.valor) return true;
          if (direcao === 'decrescente' && dado.valor < anterior.valor) return true;
          if (direcao === 'estável' && Math.abs(dado.valor - anterior.valor) / anterior.valor < 0.01) return true;
          return false;
        });

      confianca = tendenciasConsistentes ? 'alta' : 'média';
    }

    return {
      direcao,
      percentualVariacao: percentualVariacao.toFixed(2),
      confianca,
      valorAtual,
      valorAnterior
    };

  } catch (erro) {
    logger.error('Erro ao analisar tendência:', erro);
    return { 
      direcao: 'estável',
      percentualVariacao: 0,
      confianca: 'baixa',
      erro: true
    };
  }
}

/**
 * Calcula estatísticas principais para um conjunto de dados
 * @param {Array} dados - Array com dados numéricos ou objetos com propriedade 'valor'
 * @returns {Object} Estatísticas calculadas
 */
export function calcularEstatisticasIndicador(dados) {
  if (!Array.isArray(dados) || dados.length === 0) {
    return {
      media: 0,
      mediana: 0,
      minimo: 0,
      maximo: 0,
      desvioPadrao: 0,
      quantidadePeriodos: 0
    };
  }

  try {
    // Extrai valores numéricos
    const valores = dados.map(item => {
      if (typeof item === 'number') return item;
      if (typeof item === 'object' && typeof item.valor === 'number') return item.valor;
      return null;
    }).filter(valor => valor !== null);

    if (valores.length === 0) {
      return {
        media: 0,
        mediana: 0,
        minimo: 0,
        maximo: 0,
        desvioPadrao: 0,
        quantidadePeriodos: 0
      };
    }

    // Calcula estatísticas
    const soma = valores.reduce((acc, val) => acc + val, 0);
    const media = soma / valores.length;
    
    // Ordena para calcular mediana
    const valoresOrdenados = [...valores].sort((a, b) => a - b);
    let mediana;
    
    const meio = Math.floor(valoresOrdenados.length / 2);
    if (valoresOrdenados.length % 2 === 0) {
      mediana = (valoresOrdenados[meio - 1] + valoresOrdenados[meio]) / 2;
    } else {
      mediana = valoresOrdenados[meio];
    }

    // Min, max e desvio padrão
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    
    const desvioPadrao = Math.sqrt(
      valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length
    );

    return {
      media: media.toFixed(2),
      mediana: mediana.toFixed(2),
      minimo: minimo.toFixed(2),
      maximo: maximo.toFixed(2),
      desvioPadrao: desvioPadrao.toFixed(2),
      quantidadePeriodos: valores.length
    };

  } catch (erro) {
    logger.error('Erro ao calcular estatísticas:', erro);
    return {
      media: 0,
      mediana: 0,
      minimo: 0,
      maximo: 0,
      desvioPadrao: 0,
      quantidadePeriodos: 0,
      erro: true
    };
  }
}

/**
 * Enriquece dados de um indicador com contexto e metadados para ODS
 * Particularmente útil para ODS 4, 10, 16 e 17
 * 
 * @param {Object} indicador - Dados do indicador
 * @param {Array} dadosHistoricos - Série histórica do indicador
 * @returns {Object} Indicador enriquecido com metadados
 */
export function enriquecerDadosIndicador(indicador, dadosHistoricos) {
  if (!indicador || !indicador.endpoint) {
    return indicador;
  }

  // Clone o objeto para não modificar o original
  const indicadorEnriquecido = { ...indicador };

  try {
    // Adiciona estatísticas calculadas
    if (Array.isArray(dadosHistoricos) && dadosHistoricos.length > 0) {
      indicadorEnriquecido.estatisticas = calcularEstatisticasIndicador(dadosHistoricos);
    }

    // Adiciona análise de tendência
    indicadorEnriquecido.tendenciaAnalise = analisarTendencia(dadosHistoricos);

    // Adiciona metadados específicos por ODS
    switch (indicador.endpoint) {
      case 'educacao':
        // ODS 4 - Educação de Qualidade
        indicadorEnriquecido.metadadosODS = {
          ods: 4,
          titulo: 'Educação de Qualidade',
          descricaoODS: 'Assegurar a educação inclusiva, equitativa e de qualidade',
          impactoSocial: 'Melhora nas oportunidades de emprego e redução da desigualdade social',
          metaGlobal: '4.6 - Garantir que todos os jovens e a maioria dos adultos estejam alfabetizados',
          fonteDados: 'IBGE - Pesquisa Nacional por Amostra de Domicílios Contínua (PNAD)',
          ultimaAtualizacao: new Date().toISOString()
        };
        break;

      case 'desigualdade':
      case 'gini':
        // ODS 10 - Redução das Desigualdades
        indicadorEnriquecido.metadadosODS = {
          ods: 10,
          titulo: 'Redução das Desigualdades',
          descricaoODS: 'Reduzir a desigualdade dentro dos países e entre eles',
          impactoSocial: 'Maior igualdade de oportunidades e distribuição de renda',
          metaGlobal: '10.1 - Alcançar progressivamente e sustentar o crescimento da renda dos 40% mais pobres',
          fonteDados: 'IBGE - Pesquisa Nacional por Amostra de Domicílios Contínua (PNAD)',
          ultimaAtualizacao: new Date().toISOString()
        };
        break;

      case 'residuos_reciclados':
        // ODS 11 - Cidades e Comunidades Sustentáveis
        indicadorEnriquecido.metadadosODS = {
          ods: 11,
          titulo: 'Cidades e Comunidades Sustentáveis',
          descricaoODS: 'Tornar as cidades inclusivas, seguras, resilientes e sustentáveis',
          impactoSocial: 'Melhoria na qualidade de vida urbana e redução do impacto ambiental',
          metaGlobal: '11.6 - Reduzir o impacto ambiental negativo per capita das cidades',
          fonteDados: 'SNIS - Sistema Nacional de Informações sobre Saneamento',
          ultimaAtualizacao: new Date().toISOString()
        };
        break;

      case 'transparencia':
        // ODS 16 - Paz, Justiça e Instituições Eficazes
        indicadorEnriquecido.metadadosODS = {
          ods: 16,
          titulo: 'Paz, Justiça e Instituições Eficazes',
          descricaoODS: 'Promover sociedades pacíficas e inclusivas para o desenvolvimento sustentável',
          impactoSocial: 'Aumento da confiança nas instituições públicas e participação cidadã',
          metaGlobal: '16.6 - Desenvolver instituições eficazes, responsáveis e transparentes',
          fonteDados: 'CGU - Escala Brasil Transparente',
          ultimaAtualizacao: new Date().toISOString()
        };
        break;

      case 'parcerias':
        // ODS 17 - Parcerias e Meios de Implementação
        indicadorEnriquecido.metadadosODS = {
          ods: 17,
          titulo: 'Parcerias e Meios de Implementação',
          descricaoODS: 'Fortalecer os meios de implementação e revitalizar a parceria global',
          impactoSocial: 'Cooperação internacional e regional para desenvolvimento sustentável',
          metaGlobal: '17.17 - Incentivar e promover parcerias públicas, público-privadas e com a sociedade civil',
          fonteDados: 'Secretaria de Planejamento de Sergipe',
          ultimaAtualizacao: new Date().toISOString()
        };
        break;

      default:
        // Para outros indicadores, adiciona metadados básicos
        indicadorEnriquecido.metadadosODS = {
          ultimaAtualizacao: new Date().toISOString()
        };
        break;
    }

    return indicadorEnriquecido;

  } catch (erro) {
    logger.error('Erro ao enriquecer dados do indicador:', erro);
    return indicador;
  }
}