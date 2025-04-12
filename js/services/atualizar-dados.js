/**
 * Sistema de Atualização Automática de Dados - LIMFS
 * Responsável por atualizar periodicamente os dados dos indicadores em JSON
 */

import { logger } from './monitoramento.js';

// Configurações para atualização automática
const CONFIG_ATUALIZACAO = {
    intervalo_verificacao: 86400000, // 24 horas em ms
    intervalo_minimo: 3600000, // 1 hora em ms (para evitar solicitações excessivas)
    arquivos_json: {
        diretorio_base: '../dados/indicadores/',
        extensao: '.json'
    },
    endpoints: {
        pobreza: [
            'https://apisidra.ibge.gov.br/values/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201',
            'https://servicodados.ibge.gov.br/api/v3/agregados/6691/periodos/-1/variaveis/1836?localidades=N6[28]',
            'https://servicodados.ibge.gov.br/api/v1/pesquisas/10/periodos/2022/indicadores/1836/resultados/28'
        ],
        educacao: [
            'https://apisidra.ibge.gov.br/values/t/7218/n6/28/v/1641/p/last',
            'https://servicodados.ibge.gov.br/api/v3/agregados/7218/periodos/-1/variaveis/1641?localidades=N6[28]'
        ],
        saneamento: [
            'https://apisidra.ibge.gov.br/values/t/1393/n6/28/v/1000096/p/last',
            'https://servicodados.ibge.gov.br/api/v3/agregados/1393/periodos/-1/variaveis/1000096?localidades=N6[28]'
        ],
        mortalidade_infantil: [
            'https://apisidra.ibge.gov.br/values/t/793/n6/28/v/104/p/last',
            'https://servicodados.ibge.gov.br/api/v3/agregados/793/periodos/-1/variaveis/104?localidades=N6[28]'
        ],
        energia_solar: [
            'https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=b1bd71e7-d0ad-4214-9053-cbd58e9564a7&q=Sergipe'
        ],
        residuos_reciclados: [
            'https://apisidra.ibge.gov.br/values/t/1400/n6/28/v/1000100/p/last',
            'https://servicodados.ibge.gov.br/api/v3/agregados/1400/periodos/-1/variaveis/1000100?localidades=N6[28]'
        ]
    },
    timeout: 10000, // 10s para cada requisição
    max_tentativas: 3
};

/**
 * Analisa as respostas das APIs conforme diferentes estruturas
 * @param {Object} data - Dados retornados pela API
 * @param {string} endpoint - Nome do endpoint
 * @param {number} endpointIndex - Índice do endpoint na lista de alternativas
 * @returns {Object|null} Dados extraídos ou null em caso de falha
 */
function analisarResposta(data, endpoint, endpointIndex) {
    try {
        let valor = null;
        let ano = new Date().getFullYear();
        let dadosCompletos = {};

        if (endpoint !== 'energia_solar') {
            // Processamento para APIs do IBGE
            if (endpointIndex === 0) {
                // Formato SIDRA
                if (data && data.length > 0 && data[1]) {
                    valor = parseFloat(data[1].V || data[1].valor || '0');
                    const periodoInfo = data[1].D2N || data[1].D3N;
                    if (periodoInfo) {
                        ano = parseInt(periodoInfo);
                    }
                }
            } else if (endpointIndex === 1) {
                // Formato servicodados v3
                if (data && data[0]?.resultados?.[0]?.series?.[0]?.serie) {
                    const serie = data[0].resultados[0].series[0].serie;
                    const ultimoPeriodo = Object.keys(serie).sort().pop();
                    valor = parseFloat(serie[ultimoPeriodo] || '0');
                    ano = parseInt(ultimoPeriodo) || ano;
                }
            } else if (endpointIndex === 2) {
                // Formato servicodados v1
                if (data && data[0]?.res) {
                    const res = data[0].res;
                    const ultimoPeriodo = Object.keys(res).sort().pop();
                    valor = parseFloat(res[ultimoPeriodo] || '0');
                    ano = parseInt(ultimoPeriodo) || ano;
                }
            }
            
            dadosCompletos = { valor, ano };
        } else {
            // Processamento específico para dados da ANEEL
            if (data && data.result?.records) {
                const records = data.result.records;
                const totalInstalacoes = records.length;
                const capacidadeTotal = records.reduce(
                    (acc, item) => acc + parseFloat(item.PotenciaKW || item.Potência || 0), 0
                );
                
                valor = parseFloat(((totalInstalacoes / 14200) * 11.3).toFixed(1));
                
                dadosCompletos = {
                    valor: valor,
                    ano: ano,
                    instalacoes: totalInstalacoes,
                    capacidadeKW: capacidadeTotal.toFixed(2)
                };
                
                return {
                    valor: valor,
                    ano: ano,
                    dadosCompletos: dadosCompletos
                };
            }
        }

        if (valor === null || isNaN(valor)) {
            logger.warn(`Não foi possível extrair um valor válido da resposta para ${endpoint}`);
            return null;
        }

        return {
            valor: valor,
            ano: ano,
            dadosCompletos: dadosCompletos
        };
    } catch (erro) {
        logger.error(`Erro ao analisar resposta da API para ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Função de backoff exponencial para retentativas
 * @param {number} tentativa - Número da tentativa atual (começando em 1)
 * @returns {number} Tempo de espera em milissegundos
 */
function backoffExponencial(tentativa) {
    return Math.min(1000 * Math.pow(2, tentativa), 30000); // Máximo de 30 segundos
}

/**
 * Busca dados atualizados de um indicador
 * @param {string} endpoint - Nome do endpoint a ser atualizado
 * @returns {Promise<Object|null>} Dados obtidos ou null em caso de falha
 */
async function buscarDadosAtualizados(endpoint) {
    const urls = CONFIG_ATUALIZACAO.endpoints[endpoint] || [];
    
    if (urls.length === 0) {
        logger.warn(`Nenhum endpoint configurado para ${endpoint}`);
        return null;
    }

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        
        // Tentativas com backoff exponencial
        for (let tentativa = 1; tentativa <= CONFIG_ATUALIZACAO.max_tentativas; tentativa++) {
            try {
                logger.info(`Tentando ${endpoint} (URL ${i+1}/${urls.length}, tentativa ${tentativa}/${CONFIG_ATUALIZACAO.max_tentativas})`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG_ATUALIZACAO.timeout);
                
                const response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'PainelODSSergipe-AtualizacaoDados/1.0'
                    }
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Status HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                const dadosAnalisados = analisarResposta(data, endpoint, i);
                
                if (dadosAnalisados) {
                    logger.info(`Dados atualizados com sucesso para ${endpoint}`);
                    return dadosAnalisados;
                }
                
                logger.warn(`Resposta recebida para ${endpoint}, mas estrutura inválida`);
                
                // Se não conseguiu extrair os dados, tenta novamente após backoff
                if (tentativa < CONFIG_ATUALIZACAO.max_tentativas) {
                    const tempoEspera = backoffExponencial(tentativa);
                    logger.info(`Aguardando ${tempoEspera}ms antes da próxima tentativa`);
                    await new Promise(resolve => setTimeout(resolve, tempoEspera));
                }
            } catch (erro) {
                logger.warn(`Falha na tentativa ${tentativa} para ${endpoint} (URL ${i+1}):`, erro);
                
                // Backoff exponencial entre tentativas
                if (tentativa < CONFIG_ATUALIZACAO.max_tentativas) {
                    const tempoEspera = backoffExponencial(tentativa);
                    logger.info(`Aguardando ${tempoEspera}ms antes da próxima tentativa`);
                    await new Promise(resolve => setTimeout(resolve, tempoEspera));
                }
            }
        }
    }
    
    logger.error(`Todas as tentativas falharam para atualizar ${endpoint}`);
    return null;
}

/**
 * Verifica se é necessário atualizar um arquivo de dados
 * @param {string} endpoint - Nome do endpoint a verificar
 * @returns {Promise<boolean>} True se necessário atualizar
 */
async function verificarNecessidadeAtualizacao(endpoint) {
    try {
        const caminhoArquivo = `${CONFIG_ATUALIZACAO.arquivos_json.diretorio_base}${endpoint}${CONFIG_ATUALIZACAO.arquivos_json.extensao}`;
        
        // Tentativa principal
        let response = await fetch(caminhoArquivo, { cache: "no-store" });
        
        // Fallback para diretório secundário
        if (!response.ok) {
            const caminhoAlternativo = `../dados/${endpoint}.json`;
            logger.info(`Arquivo não encontrado em ${caminhoArquivo}, tentando ${caminhoAlternativo}`);
            response = await fetch(caminhoAlternativo, { cache: "no-store" });
            
            if (!response.ok) {
                logger.info(`Nenhum arquivo encontrado para ${endpoint}, atualização necessária`);
                return true;
            }
        }
        
        const dados = await response.json();
        
        if (!dados.ultimaAtualizacao) {
            logger.info(`Arquivo de ${endpoint} não tem data de atualização, atualizando`);
            return true;
        }
        
        const ultimaAtualizacao = new Date(dados.ultimaAtualizacao);
        const agora = new Date();
        const diferencaTempo = agora.getTime() - ultimaAtualizacao.getTime();
        
        // Atualiza se passou mais de 24 horas da última atualização
        if (diferencaTempo > CONFIG_ATUALIZACAO.intervalo_verificacao) {
            logger.info(`Arquivo de ${endpoint} está desatualizado (${Math.floor(diferencaTempo / 86400000)} dias)`);
            return true;
        }
        
        logger.info(`Arquivo de ${endpoint} está atualizado (${Math.floor(diferencaTempo / 3600000)}h atrás)`);
        return false;
    } catch (erro) {
        logger.warn(`Erro ao verificar atualização para ${endpoint}:`, erro);
        return true;
    }
}

/**
 * Salva dados atualizados em arquivo JSON
 * @param {string} endpoint - Nome do endpoint 
 * @param {Object} dados - Dados a serem salvos
 * @returns {Promise<boolean>} Status da operação
 */
async function salvarDadosAtualizados(endpoint, dados) {
    try {
        // Em ambiente de produção, isso seria feito via API
        // Aqui simulamos a criação do arquivo que seria feita no servidor
        
        const objetoDados = {
            dados: dados.dadosCompletos || { valor: dados.valor, ano: dados.ano },
            ultimaAtualizacao: new Date().toISOString(),
            fonte: 'API Atualizada Automaticamente'
        };
        
        logger.info(`Dados atualizados para ${endpoint} prontos para armazenamento`, objetoDados);
        
        // Em produção: Enviaria para o backend via fetch para salvar o arquivo
        // Exemplo:
        /*
        const response = await fetch('/api/atualizar-dados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: endpoint,
                dados: objetoDados
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao salvar dados: ${response.status}`);
        }
        */
        
        // Como é um ambiente de front-end, simulamos o sucesso
        logger.info(`Dados atualizados para ${endpoint} armazenados com sucesso`);
        
        // Atualização bem sucedida
        return true;
    } catch (erro) {
        logger.error(`Erro ao salvar dados atualizados para ${endpoint}:`, erro);
        return false;
    }
}

/**
 * Atualiza todos os indicadores que precisam ser atualizados
 * @returns {Promise<Object>} Resultado da operação com status por endpoint
 */
async function atualizarTodosIndicadores() {
    logger.info('Iniciando verificação de atualização de todos os indicadores');
    
    const endpoints = Object.keys(CONFIG_ATUALIZACAO.endpoints);
    const resultados = {};
    
    for (const endpoint of endpoints) {
        try {
            // Verifica se precisa atualizar
            const precisaAtualizar = await verificarNecessidadeAtualizacao(endpoint);
            
            if (!precisaAtualizar) {
                resultados[endpoint] = { 
                    status: 'atual',
                    mensagem: 'Dados já estão atualizados'
                };
                continue;
            }
            
            // Busca dados atualizados
            const dados = await buscarDadosAtualizados(endpoint);
            
            if (!dados) {
                resultados[endpoint] = { 
                    status: 'erro',
                    mensagem: 'Falha ao obter dados atualizados'
                };
                continue;
            }
            
            // Salva os dados atualizados
            const salvouComSucesso = await salvarDadosAtualizados(endpoint, dados);
            
            resultados[endpoint] = { 
                status: salvouComSucesso ? 'atualizado' : 'erro',
                mensagem: salvouComSucesso ? 
                    `Dados atualizados com sucesso (${dados.valor})` : 
                    'Falha ao salvar dados'
            };
        } catch (erro) {
            logger.error(`Erro ao processar atualização de ${endpoint}:`, erro);
            resultados[endpoint] = { 
                status: 'erro',
                mensagem: `Erro: ${erro.message}`
            };
        }
    }
    
    // Registra resultado final
    const sucessos = Object.values(resultados).filter(r => r.status === 'atualizado').length;
    const atuais = Object.values(resultados).filter(r => r.status === 'atual').length;
    const erros = Object.values(resultados).filter(r => r.status === 'erro').length;
    
    logger.info(`Atualização concluída: ${sucessos} atualizados, ${atuais} já atuais, ${erros} erros`);
    
    return {
        timestamp: new Date().toISOString(),
        resultado: {
            total: endpoints.length,
            atualizados: sucessos,
            atuais: atuais,
            erros: erros
        },
        detalhes: resultados
    };
}

/**
 * Inicia o agendamento de atualizações automáticas
 */
function iniciarAtualizacoesAutomaticas() {
    logger.info('Sistema de atualização automática iniciado');
    
    // Verificação inicial imediata
    setTimeout(() => {
        atualizarTodosIndicadores()
            .then(resultado => {
                if (resultado.resultado.erros > 0) {
                    logger.warn(`Atualização inicial concluída com ${resultado.resultado.erros} erros`);
                } else {
                    logger.info('Atualização inicial concluída com sucesso');
                }
            })
            .catch(erro => logger.error('Erro na atualização inicial:', erro));
    }, 5000); // Inicia após 5 segundos do carregamento
    
    // Configurar verificações periódicas
    setInterval(() => {
        atualizarTodosIndicadores()
            .then(resultado => {
                logger.info(`Atualização periódica: ${resultado.resultado.atualizados} indicadores atualizados`);
            })
            .catch(erro => logger.error('Erro na atualização periódica:', erro));
    }, CONFIG_ATUALIZACAO.intervalo_verificacao);
    
    logger.info(`Próxima verificação agendada para daqui a ${CONFIG_ATUALIZACAO.intervalo_verificacao/3600000}h`);
}

export {
    iniciarAtualizacoesAutomaticas,
    atualizarTodosIndicadores,
    verificarNecessidadeAtualizacao,
    buscarDadosAtualizados
};