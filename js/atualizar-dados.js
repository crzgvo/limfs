/**
 * Script de atualização automática de dados para o Painel ODS Sergipe
 * 
 * Este script faz requisições às APIs oficiais (IBGE, ANEEL, etc.)
 * e salva os dados atualizados em arquivos JSON para uso no painel.
 */

// Carrega as variáveis do arquivo .env
require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');
const alertas = require('./alertas'); // Importa o módulo de alertas

// Configurações
const DIRETORIO_DADOS = path.join(__dirname, '..', 'dados');
const TIMEOUT_REQUISICAO = 15000; // 15 segundos
const DATA_HOJE = new Date().toISOString().split('T')[0];
const MAX_TENTATIVAS = 3; // Número máximo de tentativas para cada API

// Verificar e criar diretório de dados se não existir
if (!fs.existsSync(DIRETORIO_DADOS)) {
    fs.mkdirSync(DIRETORIO_DADOS, { recursive: true });
    console.log(`Diretório de dados criado em: ${DIRETORIO_DADOS}`);
}

/**
 * Função para fazer requisições HTTP com suporte a timeout e retry
 * @param {string} url - URL da API a ser consultada
 * @param {number} tentativaAtual - Número da tentativa atual (para retry)
 * @returns {Promise<Object>} - Promessa com os dados da API
 */
function fazerRequisicao(url, tentativaAtual = 1) {
    return new Promise((resolve, reject) => {
        console.log(`Tentativa ${tentativaAtual} de acessar: ${url}`);
        
        const request = https.get(url, response => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                const error = new Error(`Status Code: ${response.statusCode}`);
                // Se não for a última tentativa, tenta novamente
                if (tentativaAtual < MAX_TENTATIVAS) {
                    console.log(`Tentativa ${tentativaAtual} falhou. Tentando novamente...`);
                    // Espera um tempo entre tentativas (exponential backoff)
                    setTimeout(() => {
                        fazerRequisicao(url, tentativaAtual + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000 * Math.pow(2, tentativaAtual - 1)); // 1s, 2s, 4s...
                    return;
                }
                return reject(error);
            }

            const data = [];
            response.on('data', chunk => data.push(chunk));
            response.on('end', () => {
                try {
                    const resposta = JSON.parse(Buffer.concat(data).toString());
                    resolve(resposta);
                } catch (error) {
                    reject(new Error(`Erro ao analisar JSON: ${error.message}`));
                }
            });
        });

        // Configurar timeout
        request.setTimeout(TIMEOUT_REQUISICAO, () => {
            request.abort();
            if (tentativaAtual < MAX_TENTATIVAS) {
                console.log(`Timeout na tentativa ${tentativaAtual}. Tentando novamente...`);
                setTimeout(() => {
                    fazerRequisicao(url, tentativaAtual + 1)
                        .then(resolve)
                        .catch(reject);
                }, 1000 * Math.pow(2, tentativaAtual - 1));
                return;
            }
            reject(new Error(`Timeout ao acessar: ${url}`));
        });

        request.on('error', (error) => {
            if (tentativaAtual < MAX_TENTATIVAS) {
                console.log(`Erro na tentativa ${tentativaAtual}: ${error.message}. Tentando novamente...`);
                setTimeout(() => {
                    fazerRequisicao(url, tentativaAtual + 1)
                        .then(resolve)
                        .catch(reject);
                }, 1000 * Math.pow(2, tentativaAtual - 1));
                return;
            }
            reject(error);
        });
    });
}

/**
 * Salva dados em arquivo JSON
 * @param {string} nomeArquivo - Nome do arquivo sem extensão
 * @param {Object} dados - Dados a serem salvos
 */
function salvarDados(nomeArquivo, dados) {
    const caminho = path.join(DIRETORIO_DADOS, `${nomeArquivo}.json`);
    
    try {
        // Adicionar metadados
        const dadosComMetadados = {
            fonte: nomeArquivo,
            ultimaAtualizacao: DATA_HOJE,
            dados: dados
        };

        fs.writeFileSync(caminho, JSON.stringify(dadosComMetadados, null, 2));
        console.log(`✅ Dados de ${nomeArquivo} atualizados com sucesso!`);
        return true;
    } catch (erro) {
        console.error(`❌ Erro ao salvar dados de ${nomeArquivo}:`, erro);
        alertas.registrarFalha(`${nomeArquivo}-salvamento`, erro); // Registra o erro no sistema de alertas
        return false;
    }
}

/**
 * Endpoints alternativos para APIs (fallback)
 */
const ENDPOINTS_ALTERNATIVOS = {
    // Múltiplas opções de endpoints para cada indicador
    pobreza: [
        'https://servicodados.ibge.gov.br/api/v3/agregados/6691/periodos/-1/variaveis/1836?localidades=N6[28]',
        'https://apisidra.ibge.gov.br/values/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201',
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/10/periodos/2022/indicadores/1836/resultados/28'
    ],
    educacao: [
        'https://servicodados.ibge.gov.br/api/v3/agregados/7218/periodos/-1/variaveis/1641?localidades=N6[28]',
        'https://apisidra.ibge.gov.br/values/t/7218/n6/28/v/1641/p/last',
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/34/periodos/2023/indicadores/1641/resultados/28'
    ],
    saneamento: [
        'https://servicodados.ibge.gov.br/api/v3/agregados/1393/periodos/-1/variaveis/1000096?localidades=N6[28]',
        'https://apisidra.ibge.gov.br/values/t/1393/n6/28/v/1000096/p/last',
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/23/periodos/2022/indicadores/1000096/resultados/28'
    ],
    mortalidade_infantil: [
        'https://servicodados.ibge.gov.br/api/v3/agregados/793/periodos/-1/variaveis/104?localidades=N6[28]',
        'https://apisidra.ibge.gov.br/values/t/793/n6/28/v/104/p/last',
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/18/periodos/2022/indicadores/104/resultados/28'
    ],
    energia_solar: [
        'https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=b1bd71e7-d0ad-4214-9053-cbd58e9564a7&q=Sergipe',
        'https://dadosabertos.aneel.gov.br/dataset/b1bd71e7-d0ad-4214-9053-cbd58e9564a7/resource/b1bd71e7-d0ad-4214-9053-cbd58e9564a7/download/geracao-distribuida.csv'
    ]
};

/**
 * Tenta acessar múltiplos endpoints para um indicador
 * @param {string} indicador - Nome do indicador
 * @returns {Promise<Object|null>} - Dados da API ou null se falhar
 */
async function acessarEndpointsAlternativos(indicador) {
    const endpoints = ENDPOINTS_ALTERNATIVOS[indicador] || [];
    
    for (let i = 0; i < endpoints.length; i++) {
        try {
            console.log(`Tentando endpoint #${i+1} para ${indicador}: ${endpoints[i]}`);
            const resposta = await fazerRequisicao(endpoints[i]);
            console.log(`✅ Endpoint #${i+1} para ${indicador} funcionou!`);
            return { resposta, endpointUsado: i };
        } catch (erro) {
            console.error(`❌ Endpoint #${i+1} para ${indicador} falhou: ${erro.message}`);
            // Registra o erro no sistema de alertas
            alertas.registrarFalha(`${indicador}-endpoint-${i+1}`, erro);
            // Continua para o próximo endpoint
        }
    }
    
    console.error(`❌ Todos os endpoints para ${indicador} falharam.`);
    // Registra uma falha grave no sistema de alertas quando todos os endpoints falham
    alertas.registrarFalha(`${indicador}-todos-endpoints`, new Error("Todos os endpoints falharam"));
    return null;
}

/**
 * Processadores específicos para cada fonte de dados
 */
const processadores = {
    // IBGE - Taxa de Extrema Pobreza
    async pobreza() {
        try {
            const resultado = await acessarEndpointsAlternativos('pobreza');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            // Lógica para extrair dados conforme o endpoint usado
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                // Formato da API servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2022'] || '0'),
                    ano: 2022
                };
            } else if (endpointUsado === 1) {
                // Formato da API SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) {
                // Formato da API servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }
            
            // Se o valor ainda for nulo, utilize dado estático
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 8.1, ano: 2024 };
                console.log('⚠️ Usando dados estáticos para pobreza');
                alertas.registrarFalha('pobreza-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            return salvarDados('pobreza', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de pobreza:', erro);
            // Registra o erro no sistema de alertas
            alertas.registrarFalha('pobreza', erro);
            // Salva dados estáticos como última opção
            return salvarDados('pobreza', { valor: 8.1, ano: 2024 });
        }
    },

    // IBGE - Taxa de Alfabetização
    async educacao() {
        try {
            const resultado = await acessarEndpointsAlternativos('educacao');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            // Lógica para extrair dados conforme o endpoint usado
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                // Formato da API servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2023'] || '0'),
                    ano: 2023
                };
            } else if (endpointUsado === 1) {
                // Formato da API SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2023
                };
            } else if (endpointUsado === 2) {
                // Formato da API servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2023'] || '0'),
                    ano: 2023
                };
            }
            
            // Se o valor ainda for nulo, utilize dado estático
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 88.8, ano: 2023 };
                console.log('⚠️ Usando dados estáticos para educação');
                alertas.registrarFalha('educacao-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            return salvarDados('educacao', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de educação:', erro);
            // Registra o erro no sistema de alertas
            alertas.registrarFalha('educacao', erro);
            // Salva dados estáticos como última opção
            return salvarDados('educacao', { valor: 88.8, ano: 2023 });
        }
    },

    // IBGE - Cobertura de Saneamento
    async saneamento() {
        try {
            const resultado = await acessarEndpointsAlternativos('saneamento');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            // Lógica para extrair dados conforme o endpoint usado
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                // Formato da API servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2022'] || '0'),
                    ano: 2022
                };
            } else if (endpointUsado === 1) {
                // Formato da API SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) {
                // Formato da API servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }
            
            // Se o valor ainda for nulo, utilize dado estático
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 54.2, ano: 2022 };
                console.log('⚠️ Usando dados estáticos para saneamento');
                alertas.registrarFalha('saneamento-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            return salvarDados('saneamento', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de saneamento:', erro);
            // Registra o erro no sistema de alertas
            alertas.registrarFalha('saneamento', erro);
            // Salva dados estáticos como última opção
            return salvarDados('saneamento', { valor: 54.2, ano: 2022 });
        }
    },

    // IBGE - Mortalidade Infantil
    async mortalidade_infantil() {
        try {
            const resultado = await acessarEndpointsAlternativos('mortalidade_infantil');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            // Lógica para extrair dados conforme o endpoint usado
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                // Formato da API servicodados v3
                const periodo = Object.keys(resposta[0]?.resultados[0]?.series[0]?.serie || {}).pop() || '2022';
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie[periodo] || '0'),
                    ano: parseInt(periodo)
                };
            } else if (endpointUsado === 1) {
                // Formato da API SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) {
                // Formato da API servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }
            
            // Se o valor ainda for nulo, utilize dado estático
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 12.8, ano: 2022 };
                console.log('⚠️ Usando dados estáticos para mortalidade infantil');
                alertas.registrarFalha('mortalidade_infantil-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            return salvarDados('mortalidade_infantil', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de mortalidade infantil:', erro);
            // Registra o erro no sistema de alertas
            alertas.registrarFalha('mortalidade_infantil', erro);
            // Salva dados estáticos como última opção
            return salvarDados('mortalidade_infantil', { valor: 12.8, ano: 2022 });
        }
    },

    // ANEEL - Energia Solar 
    async energia_solar() {
        try {
            const resultado = await acessarEndpointsAlternativos('energia_solar');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta } = resultado;
            
            // Processamento para dados da ANEEL
            // Cálculo simplificado para demonstração
            const dadosProcessados = resposta.result?.records || [];
            const totalInstalacoes = dadosProcessados.length;
            const capacidadeTotal = dadosProcessados.reduce((acc, item) => 
                acc + parseFloat(item.Potência || 0), 0);
            
            // Se não conseguiu obter dados reais, use valor estático
            if (totalInstalacoes === 0) {
                console.log('⚠️ Usando dados estáticos para energia solar');
                alertas.registrarFalha('energia_solar-dados-vazios', new Error("API retornou array vazio de instalações"));
                return salvarDados('energia_solar', { 
                    valor: 11.3, 
                    capacidadeKW: 355000,
                    instalacoes: 14200,
                    ano: 2024
                });
            }
            
            const dados = {
                valor: parseFloat(((totalInstalacoes / 20000) * 100).toFixed(1)),
                capacidadeKW: capacidadeTotal,
                instalacoes: totalInstalacoes,
                ano: new Date().getFullYear()
            };
            
            return salvarDados('energia_solar', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de energia solar:', erro);
            // Registra o erro no sistema de alertas
            alertas.registrarFalha('energia_solar', erro);
            // Salva dados estáticos como última opção
            return salvarDados('energia_solar', { 
                valor: 11.3, 
                capacidadeKW: 355000,
                instalacoes: 14200,
                ano: 2024
            });
        }
    },

    // SNIS - Resíduos Reciclados
    async residuos_reciclados() {
        try {
            // NOTA: Usar dado estático para resíduos reciclados (SNIS não tem API facilmente acessível)
            const dados = {
                valor: 6.2,
                ano: 2024
            };
            
            return salvarDados('residuos_reciclados', dados);
        } catch (erro) {
            console.error('Erro ao atualizar dados de resíduos reciclados:', erro);
            alertas.registrarFalha('residuos_reciclados', erro);
            return false;
        }
    }
};

/**
 * Executa a atualização de todos os dados
 */
async function atualizarTodosDados() {
    console.log('🔄 Iniciando atualização de dados...');
    const inicio = Date.now();
    
    // Lista todos os processadores disponíveis
    const fontes = Object.keys(processadores);
    
    // Executa cada processador e coleta resultados
    const resultados = await Promise.allSettled(
        fontes.map(fonte => processadores[fonte]())
    );
    
    // Conta sucessos e falhas
    const sucessos = resultados.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const falhas = fontes.length - sucessos;
    
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    
    // Registra sucesso ou falha geral no sistema de alertas
    if (falhas === 0) {
        alertas.registrarSucesso();
        console.log('✅ Todos os dados foram atualizados com sucesso!');
    } else {
        alertas.registrarFalha('atualizacao-geral', new Error(`${falhas} indicadores falharam na atualização`));
        console.log(`⚠️ Atenção: ${falhas} indicadores falharam na atualização.`);
    }
    
    // Gera e salva o relatório de status do sistema
    const relatorioPath = alertas.salvarRelatorioStatus();
    console.log(`📊 Relatório de status salvo em: ${relatorioPath}`);
    
    console.log(`
📊 Relatório de Atualização de Dados:
------------------------------------
✅ Processados com sucesso: ${sucessos}/${fontes.length}
❌ Falhas: ${falhas}
⏱️ Tempo de execução: ${duracao} segundos
📅 Data da atualização: ${DATA_HOJE}
    `);
}

// Executar a atualização
atualizarTodosDados();