/**
 * Componente para renderização de páginas específicas de ODS
 * Este módulo gerencia o carregamento e exibição de dados para cada ODS individual
 */

// Mapeamento de ODS para arquivos de dados específicos
const ODS_ENDPOINTS = {
  'ods1': 'ods1_pobreza.json',
  'ods2': 'ods2_fome_zero.json',
  'ods3': 'ods3_saude.json',
  'ods4': 'ods4_educacao.json',
  'ods5': 'ods5_genero.json',
  'ods6': 'ods6_agua.json',
  'ods7': 'ods7_energia.json',
  'ods8': 'ods8_trabalho.json',
  'ods9': 'ods9_industria.json',
  'ods10': 'ods10_desigualdade.json',
  'ods11': 'ods11_cidades.json',
  'ods12': 'ods12_consumo.json',
  'ods13': 'ods13_clima.json',
  'ods14': 'ods14_vida_na_agua.json',
  'ods15': 'ods15_vida_na_terra.json',
  'ods16': 'ods16_paz.json',
  'ods17': 'ods17_parcerias.json'
};

/**
 * Carrega os dados específicos de um ODS
 * @param {string} odsId - Identificador do ODS (ex: 'ods1', 'ods10')
 * @returns {Promise<Object>} - Dados do ODS específico
 */
export async function carregarDadosODS(odsId) {
  // Verifica se o ODS é suportado
  if (!ODS_ENDPOINTS[odsId]) {
    throw new Error(`ODS não suportado: ${odsId}`);
  }
  
  try {
    const endpoint = ODS_ENDPOINTS[odsId];
    // Busca os dados no arquivo JSON correspondente
    const response = await fetch(`/dados/indicadores/${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar dados: ${response.status}`);
    }
    
    const dados = await response.json();
    return dados;
  } catch (erro) {
    console.error(`Erro ao carregar dados do ${odsId}:`, erro);
    throw erro;
  }
}

// Exporta outras funções relacionadas a páginas específicas de ODS
export default {
  carregarDadosODS,
  ODS_ENDPOINTS
};
