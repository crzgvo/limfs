/**
 * @file integradorODS.js
 * @description Módulo para integração estratégica e correlação entre indicadores dos ODS
 * @version 1.0.0
 */

import { carregarDadosODS } from './carregadorDados.js';

/**
 * Gera uma matriz de correlação entre indicadores de diferentes ODS
 * @param {Array<string>} odsLista - Lista de identificadores dos ODS para correlacionar
 * @returns {Promise<Object>} - Matriz de correlação entre os ODS
 */
export async function gerarMatrizCorrelacao(odsLista) {
  try {
    const dados = await Promise.all(odsLista.map(id => carregarDadosODS(id)));
    const matriz = {};
      
    odsLista.forEach((idA, indexA) => {
      matriz[idA] = {};
      odsLista.forEach((idB, indexB) => {
        matriz[idA][idB] = calcularCorrelacao(dados[indexA].valores, dados[indexB].valores);
      });
    });
    
    // Registra log para monitoramento de performance
    console.info(`Matriz de correlação gerada para ${odsLista.length} ODS`);
    
    return matriz;
  } catch (error) {
    console.error('Erro ao gerar matriz de correlação:', error);
    throw new Error('Falha ao correlacionar indicadores ODS');
  }
}

/**
 * Calcula o coeficiente de correlação de Pearson entre dois conjuntos de dados
 * @param {Array<number>} arrayA - Primeiro conjunto de valores
 * @param {Array<number>} arrayB - Segundo conjunto de valores
 * @returns {number} - Coeficiente de correlação entre -1 e 1
 */
function calcularCorrelacao(arrayA, arrayB) {
  // Verifica se os arrays têm o mesmo tamanho
  if (arrayA.length !== arrayB.length) {
    console.warn('Arrays com tamanhos diferentes para correlação');
    return 0;
  }
  
  // Se algum array estiver vazio, retorna 0
  if (arrayA.length === 0 || arrayB.length === 0) {
    return 0;
  }

  // Implementação do coeficiente de correlação de Pearson
  const n = arrayA.length;
  const somaA = arrayA.reduce((a, b) => a + b, 0);
  const somaB = arrayB.reduce((a, b) => a + b, 0);
  const somaQuadradoA = arrayA.reduce((a, b) => a + b ** 2, 0);
  const somaQuadradoB = arrayB.reduce((a, b) => a + b ** 2, 0);
  const somaProduto = arrayA.reduce((a, b, i) => a + b * arrayB[i], 0);

  const numerador = (n * somaProduto) - (somaA * somaB);
  const denominador = Math.sqrt((n * somaQuadradoA - somaA ** 2) * (n * somaQuadradoB - somaB ** 2));

  // Evitar divisão por zero
  return denominador === 0 ? 0 : numerador / denominador;
}

/**
 * Identifica ODS relacionados com base em limiares de correlação
 * @param {string} odsId - ID do ODS principal 
 * @param {Object} matrizCorrelacao - Matriz de correlação entre ODS
 * @param {number} limiar - Valor mínimo de correlação para considerar como relacionado
 * @returns {Array<Object>} - Lista de ODS relacionados com seus coeficientes
 */
export function identificarODSRelacionados(odsId, matrizCorrelacao, limiar = 0.5) {
  if (!matrizCorrelacao || !matrizCorrelacao[odsId]) {
    return [];
  }
  
  const relacionados = [];
  
  for (const outroOds in matrizCorrelacao[odsId]) {
    if (outroOds !== odsId) {
      const correlacao = matrizCorrelacao[odsId][outroOds];
      
      if (Math.abs(correlacao) >= limiar) {
        relacionados.push({
          id: outroOds,
          correlacao: correlacao,
          tipoRelacao: correlacao > 0 ? 'positiva' : 'negativa'
        });
      }
    }
  }
  
  // Ordena do mais correlacionado para o menos
  return relacionados.sort((a, b) => Math.abs(b.correlacao) - Math.abs(a.correlacao));
}

/**
 * Gera recomendações de políticas integradas com base nas correlações
 * @param {Array<Object>} odsRelacionados - Lista de ODS relacionados
 * @returns {Array<string>} - Lista de recomendações de políticas
 */
export function gerarRecomendacoesIntegradas(odsRelacionados) {
  if (!odsRelacionados || odsRelacionados.length === 0) {
    return [];
  }
  
  const recomendacoes = [];
  
  // Mapa de possíveis recomendações baseadas em correlações entre ODS
  const recomendacoesBase = {
    'ods1+ods4': 'Implementar programas de bolsas de estudo focadas em famílias de baixa renda',
    'ods3+ods6': 'Expandir infraestrutura de saneamento básico em áreas com altos índices de doenças transmissíveis',
    'ods5+ods8': 'Criar incentivos fiscais para empresas que promovam equidade de gênero em cargos de liderança',
    'ods7+ods13': 'Investir em programas de energia renovável com foco em mitigação de emissões de carbono',
    // Novas correlações integradas - Expansão de recomendações
    'ods2+ods15': 'Implementar técnicas agrícolas sustentáveis que protejam a biodiversidade e garantam segurança alimentar',
    'ods4+ods10': 'Expandir programas educacionais que reduzam desigualdades socioeconômicas',
    'ods6+ods14': 'Desenvolver sistemas de tratamento de efluentes que reduzam a poluição de ambientes aquáticos',
    'ods8+ods12': 'Fomentar a economia circular e consumo responsável em setores produtivos',
    'ods9+ods11': 'Investir em infraestrutura sustentável e resiliente para cidades inteligentes',
    'ods10+ods16': 'Fortalecer instituições de justiça para reduzir desigualdades e discriminação',
    'ods11+ods13': 'Implementar planos urbanos resilientes às mudanças climáticas',
    'ods15+ods17': 'Estabelecer parcerias internacionais para proteção de ecossistemas terrestres',
    'ods17+ods18': 'Criar parcerias estratégicas para reduzir desigualdades raciais e promover inclusão'
  };
  
  // Gera recomendações com base nos ODS relacionados
  odsRelacionados.forEach(ods => {
    // Para cada par de ODS, verifica se há recomendação específica
    const chavePositiva = `ods${ods.id.substring(3)}+ods${ods.id.substring(3)}`;
    const chaveNegativa = `ods${ods.id.substring(3)}-ods${ods.id.substring(3)}`;
    
    if (ods.tipoRelacao === 'positiva' && recomendacoesBase[chavePositiva]) {
      recomendacoes.push(recomendacoesBase[chavePositiva]);
    } else if (ods.tipoRelacao === 'negativa' && recomendacoesBase[chaveNegativa]) {
      recomendacoes.push(recomendacoesBase[chaveNegativa]);
    } else {
      // Recomendação genérica baseada no tipo de correlação
      const recomendacao = ods.tipoRelacao === 'positiva'
        ? `Fortalecer políticas integradas entre os ODS ${ods.id} para amplificar resultados positivos`
        : `Implementar medidas compensatórias para equilibrar os impactos negativos entre políticas dos ODS ${ods.id}`;
      
      recomendacoes.push(recomendacao);
    }
  });
  
  return [...new Set(recomendacoes)]; // Remove duplicatas
}