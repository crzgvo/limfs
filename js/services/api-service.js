/**
 * Serviço centralizado para chamadas de API com resiliência.
 * @module api-service
 */

import { comRetry } from '../utils/retry.js';
import { comCircuitBreaker } from '../utils/circuit-breaker.js';
import { verificarCache, salvarCache } from '../utils/cache.js';
import { logger } from './monitoramento.js';

const API_CONFIG = {
    endpoints: {
        pobreza: [
            'https://apisidra.ibge.gov.br/values/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201',
            'https://servicodados.ibge.gov.br/api/v3/agregados/6691/periodos/-1/variaveis/1836?localidades=N6[28]'
        ],
        educacao: [
            'https://apisidra.ibge.gov.br/values/t/7218/n6/28/v/1641/p/last',
            'https://servicodados.ibge.gov.br/api/v3/agregados/7218/periodos/-1/variaveis/1641?localidades=N6[28]'
        ],
        saneamento: [
            'https://apisidra.ibge.gov.br/values/t/1393/n6/28/v/1000096/p/last',
            'https://servicodados.ibge.gov.br/api/v3/agregados/1393/periodos/-1/variaveis/1000096?localidades=N6[28]'
        ]
    },
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'User-Agent': 'PainelODSSergipe/1.0'
    }
};

/**
 * Busca dados de um indicador com resiliência.
 * @param {string} indicador - Nome do indicador
 * @returns {Promise<Object>} Dados do indicador
 */
export async function buscarDadosIndicador(indicador) {
    const dadosCache = verificarCache(indicador);
    if (dadosCache) return dadosCache;

    const urls = API_CONFIG.endpoints[indicador];
    if (!urls?.length) {
        throw new Error(`Endpoint não configurado para ${indicador}`);
    }

    for (const url of urls) {
        try {
            const dados = await comCircuitBreaker(
                `${indicador}-${url}`,
                () => comRetry(async () => {
                    const response = await fetch(url, {
                        headers: API_CONFIG.headers,
                        signal: AbortSignal.timeout(API_CONFIG.timeout)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return response.json();
                })
            );

            const dadosProcessados = processarDados(dados, indicador);
            if (dadosProcessados) {
                salvarCache(indicador, dadosProcessados);
                return dadosProcessados;
            }
        } catch (erro) {
            logger.warn(`Falha ao buscar ${indicador} em ${url}:`, erro);
            continue;
        }
    }

    throw new Error(`Todos os endpoints falharam para ${indicador}`);
}

/**
 * Processa dados brutos da API conforme o tipo de indicador.
 * @private
 */
function processarDados(dados, indicador) {
    try {
        let valor = null;
        let ano = new Date().getFullYear();

        if (dados[1]?.V) {
            // Formato SIDRA
            valor = parseFloat(dados[1].V);
            ano = parseInt(dados[1].D2N) || ano;
        } else if (dados[0]?.resultados?.[0]?.series?.[0]?.serie) {
            // Formato servicodados
            const serie = dados[0].resultados[0].series[0].serie;
            const ultimoPeriodo = Object.keys(serie).sort().pop();
            valor = parseFloat(serie[ultimoPeriodo]);
            ano = parseInt(ultimoPeriodo) || ano;
        }

        if (valor === null || isNaN(valor)) {
            return null;
        }

        return { valor, ano };
    } catch (erro) {
        logger.error(`Erro ao processar dados de ${indicador}:`, erro);
        return null;
    }
}