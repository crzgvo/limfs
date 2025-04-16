/**
 * Serviço de API para o Painel ODS Sergipe
 * Responsável por centralizar acesso a APIs externas
 */

import { onFailure } from '../../utils/circuit-breaker.js';

/**
 * Analisa a resposta recebida da API e extrai os valores relevantes
 * @param {Array|Object} data - Dados recebidos da API
 * @param {string} endpoint - Identificador do endpoint
 * @param {number} indice - Índice do elemento a ser analisado (se for array)
 * @returns {Object|null} Objeto com os valores extraídos ou null se dados inválidos
 */
export function analisarResposta(data, endpoint, indice = 0) {
  try {
    // Caso comum: API retorna array com objeto de metadados seguido de dados
    if (Array.isArray(data) && data.length > 1) {
      const valorOriginal = data[indice + 1]?.V;
      const anoOriginal = data[indice + 1]?.D2N;
      
      // Validação básica
      if (valorOriginal === undefined || valorOriginal === null) {
        return null;
      }

      // Converte para formato padronizado
      return {
        valor: parseFloat(valorOriginal),
        ano: parseInt(anoOriginal, 10)
      };
    }
    
    return null; // Estrutura inesperada
  } catch (erro) {
    console.error(`Erro ao analisar resposta para ${endpoint}:`, erro);
    return null;
  }
}

/**
 * Solicita dados de um endpoint específico da API
 * @param {string} endpoint - Endpoint a ser consultado
 * @returns {Promise<Object>} - Dados do endpoint
 */
export async function buscarDadosIndicador(endpoint) {
  try {
    const response = await fetch(`/api/indicadores/${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Falha ao buscar dados: ${response.status}`);
    }
    
    const data = await response.json();
    return analisarResposta(data, endpoint);
  } catch (erro) {
    console.error(`Erro ao buscar ${endpoint}:`, erro);
    throw erro;
  }
}

/**
 * Tenta buscar dados de múltiplos endpoints com retry e backoff exponencial
 * @param {string} endpoint - Nome do endpoint a ser consultado
 * @param {Array<string>} urls - Lista de URLs para tentar
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} initialDelay - Atraso inicial entre tentativas (ms)
 * @returns {Promise<Object|null>} - Dados do endpoint ou null se todas tentativas falharem
 */
export async function tentarMultiplosEndpoints(endpoint, urls, maxRetries = 3, initialDelay = 500) {
  let ultimoErro = null;
  let tentativas = 0;

  // Para cada URL na lista de endpoints
  for (const url of urls) {
    let delay = initialDelay;
    
    // Tenta no máximo maxRetries vezes para cada URL
    for (let i = 0; i < maxRetries; i++) {
      tentativas++;
      try {
        // Tenta buscar os dados
        const response = await fetch(`${url}/${endpoint}`);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const resultado = analisarResposta(data, endpoint);
        
        if (resultado) {
          return resultado;
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } catch (erro) {
        ultimoErro = erro;
        
        // Registra falha no Circuit Breaker
        onFailure(endpoint, {
          maxFailures: 3,
          resetTimeout: 30000
        });
        
        // Se não é a última tentativa, aguarda com backoff exponencial
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Backoff exponencial
        }
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`Todas as ${tentativas} tentativas para ${endpoint} falharam:`, ultimoErro);
  // Retorna null em vez de lançar erro para compatibilidade com os testes
  return null;
}

// Outras funções do serviço de API...

// Exportação padrão do serviço
export default {
  analisarResposta,
  buscarDadosIndicador,
  tentarMultiplosEndpoints
};
