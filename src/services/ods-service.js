/**
 * Serviço para acesso centralizado aos dados dos Objetivos de Desenvolvimento Sustentável (ODS)
 * Permite carregar configurações e dados de indicadores de forma padronizada
 */

import errorLogging from '../utils/error-logging.js';
import cache from '../utils/cache.js';
import circuitBreaker from '../utils/circuit-breaker.js';
import retryBackoff from '../utils/retry-backoff.js';

// Configuração central do serviço
const SERVICE_CONFIG = {
    API_BASE_URL: 'https://limfs-api.gov.br/api/v1',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 horas em milissegundos
    MAX_RETRIES: 3,
    TIMEOUT: 5000 // 5 segundos
};

// Para armazenar dados históricos dos indicadores
const DADOS_HISTORICOS = {};

/**
 * Busca a configuração completa de um ODS específico
 * @param {string} odsId - Identificador do ODS (ex: 'ods1', 'ods10')
 * @returns {Promise<Object>} - Objeto com a configuração do ODS
 */
async function getODS(odsId) {
    try {
        // Primeiro tenta buscar do cache
        const cachedConfig = cache.get(`ods_config_${odsId}`);
        if (cachedConfig) {
            console.log(`[ODS Service] Usando configuração em cache para ${odsId}`);
            return cachedConfig;
        }

        // Se não estiver em cache, busca do arquivo de configuração
        console.log(`[ODS Service] Buscando configuração para ${odsId}`);
        
        const response = await fetch(`/dados/ods-config.json`);
        if (!response.ok) {
            throw new Error(`Falha ao buscar configuração do ODS: ${response.status}`);
        }

        const allConfigs = await response.json();
        const odsConfig = allConfigs.find(ods => ods.id === odsId);

        if (!odsConfig) {
            throw new Error(`ODS ${odsId} não encontrado na configuração`);
        }

        // Armazena em cache
        cache.set(`ods_config_${odsId}`, odsConfig, SERVICE_CONFIG.CACHE_DURATION);
        
        return odsConfig;
    } catch (error) {
        errorLogging.logError('getODS', error, { odsId });
        throw new Error(`Erro ao carregar configuração do ODS ${odsId}: ${error.message}`);
    }
}

/**
 * Busca os dados históricos de um indicador específico
 * @param {string} endpoint - Endpoint do indicador
 * @returns {Promise<Array>} - Array com os dados históricos do indicador
 */
async function getDadosHistoricos(endpoint) {
    try {
        // Tenta buscar do cache
        const cachedData = cache.get(`historico_${endpoint}`);
        if (cachedData) {
            console.log(`[ODS Service] Usando dados históricos em cache para ${endpoint}`);
            DADOS_HISTORICOS[endpoint] = cachedData;
            return cachedData;
        }

        // Tentativa de buscar do arquivo local
        console.log(`[ODS Service] Buscando dados históricos para ${endpoint}`);
        
        const response = await fetch(`/dados/indicadores/${endpoint}.json`);
        if (!response.ok) {
            throw new Error(`Falha ao buscar dados históricos: ${response.status}`);
        }

        const dadosHistoricos = await response.json();
        
        // Valida a estrutura dos dados
        if (!Array.isArray(dadosHistoricos) || dadosHistoricos.length === 0) {
            throw new Error(`Dados históricos inválidos para ${endpoint}`);
        }

        // Ordena por ano (crescente)
        dadosHistoricos.sort((a, b) => a.ano - b.ano);

        // Armazena em cache e no objeto de dados históricos
        cache.set(`historico_${endpoint}`, dadosHistoricos, SERVICE_CONFIG.CACHE_DURATION);
        DADOS_HISTORICOS[endpoint] = dadosHistoricos;
        
        return dadosHistoricos;
    } catch (error) {
        errorLogging.logError('getDadosHistoricos', error, { endpoint });
        console.error(`Erro ao carregar dados históricos para ${endpoint}:`, error);
        
        // Tenta usar dados estáticos de fallback se disponíveis
        try {
            const dadosFallback = await getFallbackData(endpoint);
            if (dadosFallback && Array.isArray(dadosFallback)) {
                DADOS_HISTORICOS[endpoint] = dadosFallback;
                return dadosFallback;
            }
        } catch (fallbackError) {
            console.error('Erro ao carregar dados de fallback:', fallbackError);
        }
        
        return [];
    }
}

/**
 * Busca os dados mais recentes de um indicador da API
 * @param {string} endpoint - Endpoint do indicador
 * @returns {Promise<Object>} - Dados do indicador
 */
async function buscarDadosAPI(endpoint) {
    // Verifica se o circuit breaker está aberto para este endpoint
    if (circuitBreaker.isOpen(endpoint)) {
        console.warn(`[ODS Service] Circuit breaker aberto para ${endpoint}. Usando dados de fallback.`);
        return await usarDadosFallback(endpoint);
    }

    try {
        // Implementa retry com backoff exponencial
        const fetchWithRetry = retryBackoff.retry(
            async () => {
                // Adiciona timeout para a requisição
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), SERVICE_CONFIG.TIMEOUT);
                
                try {
                    const response = await fetch(`${SERVICE_CONFIG.API_BASE_URL}/indicadores/${endpoint}`, {
                        signal: controller.signal,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Client-Version': '2.0.0'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`Falha na resposta da API: ${response.status}`);
                    }
                    
                    return await response.json();
                } finally {
                    clearTimeout(timeoutId);
                }
            },
            {
                maxRetries: SERVICE_CONFIG.MAX_RETRIES,
                baseDelay: 1000
            }
        );
        
        console.log(`[ODS Service] Buscando dados da API para ${endpoint}`);
        const dados = await fetchWithRetry();
        
        // Tratamento de validação dos dados
        if (!dados || typeof dados !== 'object' || dados.valor === undefined) {
            throw new Error('Formato de dados inválido na resposta');
        }
        
        // Reseta o circuit breaker após sucesso
        circuitBreaker.onSuccess(endpoint);
        
        // Armazena em cache
        cache.set(`ods_sergipe_${endpoint}`, dados, SERVICE_CONFIG.CACHE_DURATION);
        
        // Atualiza os dados históricos se necessário
        if (dados.valor !== 'N/D' && typeof dados.valor === 'number' && dados.ano) {
            await atualizarDadosHistoricos(endpoint, dados);
        }
        
        return dados;
    } catch (error) {
        // Registra a falha no circuit breaker
        circuitBreaker.onFailure(endpoint);
        
        // Registra o erro
        errorLogging.logError('buscarDadosAPI', error, { endpoint });
        
        console.error(`[ODS Service] Erro ao buscar dados para ${endpoint}:`, error);
        
        // Usa dados de fallback
        return await usarDadosFallback(endpoint);
    }
}

/**
 * Busca dados de fallback de um arquivo local
 * @param {string} endpoint 
 * @returns {Promise<Object>}
 */
async function getFallbackData(endpoint) {
    try {
        const response = await fetch(`/dados/${endpoint}.json`);
        if (!response.ok) {
            throw new Error(`Arquivo de fallback não encontrado: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar dados de fallback para ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Usa dados de fallback quando a API falha
 * @param {string} endpoint 
 * @returns {Promise<Object>}
 */
async function usarDadosFallback(endpoint) {
    try {
        // Verifica se temos dados em cache
        const cachedData = cache.get(`ods_sergipe_${endpoint}`);
        if (cachedData) {
            console.log(`[ODS Service] Usando dados em cache para ${endpoint}`);
            return { ...cachedData, usouFallback: true };
        }
        
        // Tenta carregar dados históricos
        const dadosHistoricos = await getDadosHistoricos(endpoint);
        if (dadosHistoricos && dadosHistoricos.length > 0) {
            // Usa o dado mais recente como fallback
            const dadoMaisRecente = dadosHistoricos[dadosHistoricos.length - 1];
            
            const dadosFallback = {
                valor: dadoMaisRecente.valor,
                ano: dadoMaisRecente.ano,
                fonte: 'IBGE (offline)',
                usouFallback: true
            };
            
            return dadosFallback;
        }
        
        // Se não houver dados históricos, retorna dados indisponíveis
        return {
            valor: 'N/D',
            ano: '',
            fonte: 'Dados indisponíveis',
            usouFallback: true
        };
    } catch (error) {
        errorLogging.logError('usarDadosFallback', error, { endpoint });
        return {
            valor: 'N/D',
            ano: '',
            fonte: 'Erro ao carregar dados',
            usouFallback: true,
            erro: true
        };
    }
}

/**
 * Atualiza os dados históricos com novos dados recebidos
 * @param {string} endpoint 
 * @param {Object} novoDado 
 */
async function atualizarDadosHistoricos(endpoint, novoDado) {
    try {
        // Carrega os dados históricos existentes
        let dadosHistoricos = await getDadosHistoricos(endpoint);
        if (!dadosHistoricos) dadosHistoricos = [];
        
        // Verifica se o novo dado já existe no histórico
        const dadoExistente = dadosHistoricos.find(dado => dado.ano === novoDado.ano);
        
        if (!dadoExistente) {
            // Adiciona o novo dado e reordena
            dadosHistoricos.push({
                ano: novoDado.ano,
                valor: novoDado.valor
            });
            
            // Ordena por ano
            dadosHistoricos.sort((a, b) => a.ano - b.ano);
            
            // Atualiza o cache e o objeto de dados históricos
            cache.set(`historico_${endpoint}`, dadosHistoricos, SERVICE_CONFIG.CACHE_DURATION);
            DADOS_HISTORICOS[endpoint] = dadosHistoricos;
        }
    } catch (error) {
        errorLogging.logError('atualizarDadosHistoricos', error, { endpoint });
        console.error(`Erro ao atualizar dados históricos para ${endpoint}:`, error);
    }
}

// Objeto do serviço ODS para exportação
const odsService = {
    getODS,
    getDadosHistoricos,
    buscarDadosAPI,
    DADOS_HISTORICOS,
    SERVICE_CONFIG
};

// Exporta o serviço tanto como módulo ES6 quanto como objeto global
export default odsService;

// Para compatibilidade com código não-modular
if (typeof window !== 'undefined') {
    window.odsService = odsService;
}