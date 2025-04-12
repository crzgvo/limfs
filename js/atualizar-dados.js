/**
 * Script de atualização automática de dados para o Painel ODS Sergipe
 * Responsável por buscar dados nas APIs oficiais e manter os arquivos JSON atualizados
 */

require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');
const alertas = require('./alertas');

// Configurações globais
const DIRETORIO_DADOS = path.join(__dirname, '..', 'dados');
const DIRETORIO_CACHE = path.join(__dirname, '..', 'dados', 'cache');
const TIMEOUT_REQUISICAO = 15000; 
const DATA_HOJE = new Date().toISOString().split('T')[0];
const MAX_TENTATIVAS = 3;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

// Verificar e criar diretórios necessários
if (!fs.existsSync(DIRETORIO_DADOS)) {
    fs.mkdirSync(DIRETORIO_DADOS, { recursive: true });
    console.log(`Diretório de dados criado em: ${DIRETORIO_DADOS}`);
}

if (!fs.existsSync(DIRETORIO_CACHE)) {
    fs.mkdirSync(DIRETORIO_CACHE, { recursive: true });
    console.log(`Diretório de cache criado em: ${DIRETORIO_CACHE}`);
}

/**
 * Verifica e utiliza cache se disponível e válido
 */
function verificarCache(indicador) {
    try {
        const caminhoCache = path.join(DIRETORIO_CACHE, `${indicador}.json`);
        
        if (!fs.existsSync(caminhoCache)) {
            return null;
        }
        
        const conteudoCache = fs.readFileSync(caminhoCache, 'utf8');
        const dadosCache = JSON.parse(conteudoCache);
        
        const dataCache = new Date(dadosCache.timestamp);
        const agora = new Date();
        
        if ((agora - dataCache) < CACHE_TTL) {
            console.log(`✅ Usando dados em cache para ${indicador} (${dadosCache.timestamp})`);
            return dadosCache.dados;
        } else {
            console.log(`⚠️ Cache para ${indicador} está expirado, buscando dados frescos...`);
            return null;
        }
    } catch (erro) {
        console.warn(`⚠️ Erro ao verificar cache para ${indicador}:`, erro);
        return null;
    }
}

/**
 * Armazena dados em cache para minimizar requisições às APIs
 */
function salvarCache(indicador, dados) {
    try {
        const caminhoCache = path.join(DIRETORIO_CACHE, `${indicador}.json`);
        const dadosCache = {
            timestamp: new Date().toISOString(),
            dados: dados
        };
        
        fs.writeFileSync(caminhoCache, JSON.stringify(dadosCache, null, 2));
        console.log(`✅ Cache atualizado para ${indicador}`);
        return true;
    } catch (erro) {
        console.warn(`⚠️ Erro ao salvar cache para ${indicador}:`, erro);
        return false;
    }
}

/**
 * Valida a estrutura dos dados recebidos das APIs
 * Crucial para detectar mudanças nos formatos de resposta das APIs externas
 */
function validarDados(indicador, dados, endpointUsado) {
    console.log(`🔍 Validando dados recebidos para ${indicador} do endpoint #${endpointUsado + 1}`);
    console.log(`Tipo de dados recebidos: ${typeof dados}`);
    
    if (!dados) {
        console.error(`❌ Dados inválidos para ${indicador} - dados são null ou undefined`);
        return null;
    }
    
    try {
        // Validação específica para cada formato de API e indicador
        switch (indicador) {
            case 'pobreza':
                if (endpointUsado === 0) {
                    // API servicodados v3
                    if (!dados[0]?.resultados?.[0]?.series?.[0]?.serie) {
                        console.error(`❌ Estrutura de dados inválida para pobreza (endpoint #1): Faltando series ou serie`);
                        console.error(`Estrutura recebida: ${JSON.stringify(dados).substring(0, 200)}...`);
                        return null;
                    }
                } else if (endpointUsado === 1) {
                    // API SIDRA
                    if (!dados[1]?.V && !dados[1]?.valor) {
                        console.error(`❌ Estrutura de dados inválida para pobreza (endpoint #2): Faltando V ou valor`);
                        console.error(`Estrutura recebida: ${JSON.stringify(dados).substring(0, 200)}...`);
                        return null;
                    }
                } else if (endpointUsado === 2) {
                    // API servicodados v1
                    if (!dados[0]?.res) {
                        console.error(`❌ Estrutura de dados inválida para pobreza (endpoint #3): Faltando res`);
                        console.error(`Estrutura recebida: ${JSON.stringify(dados).substring(0, 200)}...`);
                        return null;
                    }
                }
                break;
                
            case 'educacao':
            case 'saneamento':
            case 'mortalidade_infantil':
                if (endpointUsado === 0 && !dados[0]?.resultados?.[0]?.series?.[0]?.serie) {
                    console.error(`❌ Estrutura de dados inválida para ${indicador} (endpoint #1)`);
                    console.error(`Estrutura recebida: ${JSON.stringify(dados).substring(0, 200)}...`);
                    return null;
                } else if (endpointUsado === 1 && !dados[1]?.V && !dados[1]?.valor) {
                    console.error(`❌ Estrutura de dados inválida para ${indicador} (endpoint #2)`);
                    console.error(`Estrutura recebida: ${JSON.stringify(dados).substring(0, 200)}...`);
                    return null;
                }
                break;
                
            case 'energia_solar':
                if (!dados.result?.records) {
                    console.error(`❌ Estrutura de dados inválida para energia_solar: Faltando result.records`);
                    console.error(`Estrutura recebida: ${JSON.stringify(dados).substring(0, 200)}...`);
                    return null;
                }
                break;
        }
        
        console.log(`✅ Dados validados com sucesso para ${indicador}`);
        return dados;
    } catch (erro) {
        console.error(`❌ Erro durante a validação de dados para ${indicador}:`, erro);
        return null;
    }
}

/**
 * Realiza requisições HTTP com suporte a timeout e retry com backoff exponencial
 */
function fazerRequisicao(url, tentativaAtual = 1) {
    return new Promise((resolve, reject) => {
        console.log(`Tentativa ${tentativaAtual} de acessar: ${url}`);
        
        const request = https.get(url, response => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                const error = new Error(`Status Code: ${response.statusCode}`);
                if (tentativaAtual < MAX_TENTATIVAS) {
                    console.log(`Tentativa ${tentativaAtual} falhou. Tentando novamente...`);
                    setTimeout(() => {
                        fazerRequisicao(url, tentativaAtual + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000 * Math.pow(2, tentativaAtual - 1)); // Backoff exponencial: 1s, 2s, 4s...
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
                    const conteudoTexto = Buffer.concat(data).toString().substring(0, 500);
                    console.error(`❌ Falha ao analisar JSON. Conteúdo recebido: ${conteudoTexto}...`);
                    
                    reject(new Error(`Erro ao analisar JSON: ${error.message}`));
                }
            });
        });

        // Configuração de timeout
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
 * Salva dados em arquivo JSON com metadados
 */
function salvarDados(nomeArquivo, dados) {
    const caminho = path.join(DIRETORIO_DADOS, `${nomeArquivo}.json`);
    
    try {
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
        alertas.registrarFalha(`${nomeArquivo}-salvamento`, erro);
        return false;
    }
}

/**
 * Endpoints alternativos para APIs - estratégia de fallback
 */
const ENDPOINTS_ALTERNATIVOS = {
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
 * Tenta acessar múltiplos endpoints para um indicador até encontrar um que funcione
 */
async function acessarEndpointsAlternativos(indicador) {
    const endpoints = ENDPOINTS_ALTERNATIVOS[indicador] || [];
    
    for (let i = 0; i < endpoints.length; i++) {
        try {
            console.log(`Tentando endpoint #${i+1} para ${indicador}: ${endpoints[i]}`);
            const resposta = await fazerRequisicao(endpoints[i]);
            const dadosValidados = validarDados(indicador, resposta, i);
            if (dadosValidados) {
                console.log(`✅ Endpoint #${i+1} para ${indicador} funcionou!`);
                return { resposta: dadosValidados, endpointUsado: i };
            }
        } catch (erro) {
            console.error(`❌ Endpoint #${i+1} para ${indicador} falhou: ${erro.message}`);
            alertas.registrarFalha(`${indicador}-endpoint-${i+1}`, erro);
        }
    }
    
    console.error(`❌ Todos os endpoints para ${indicador} falharam.`);
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
            const cache = verificarCache('pobreza');
            if (cache) {
                return salvarDados('pobreza', cache);
            }

            const resultado = await acessarEndpointsAlternativos('pobreza');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            // Extração de dados conforme o formato do endpoint usado
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                // API servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2022'] || '0'),
                    ano: 2022
                };
            } else if (endpointUsado === 1) {
                // API SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) {
                // API servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }
            
            // Fallback para dados estáticos
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 8.1, ano: 2024 };
                console.log('⚠️ Usando dados estáticos para pobreza');
                alertas.registrarFalha('pobreza-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            salvarCache('pobreza', dados);
            return salvarDados('pobreza', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de pobreza:', erro);
            alertas.registrarFalha('pobreza', erro);
            return salvarDados('pobreza', { valor: 8.1, ano: 2024 });
        }
    },

    // Implementações similares para outros indicadores
    async educacao() {
        try {
            const cache = verificarCache('educacao');
            if (cache) {
                return salvarDados('educacao', cache);
            }

            const resultado = await acessarEndpointsAlternativos('educacao');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2023'] || '0'),
                    ano: 2023
                };
            } else if (endpointUsado === 1) {
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2023
                };
            } else if (endpointUsado === 2) {
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2023'] || '0'),
                    ano: 2023
                };
            }
            
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 88.8, ano: 2023 };
                console.log('⚠️ Usando dados estáticos para educação');
                alertas.registrarFalha('educacao-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            salvarCache('educacao', dados);
            return salvarDados('educacao', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de educação:', erro);
            alertas.registrarFalha('educacao', erro);
            return salvarDados('educacao', { valor: 88.8, ano: 2023 });
        }
    },

    async saneamento() {
        try {
            const cache = verificarCache('saneamento');
            if (cache) {
                return salvarDados('saneamento', cache);
            }

            const resultado = await acessarEndpointsAlternativos('saneamento');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2022'] || '0'),
                    ano: 2022
                };
            } else if (endpointUsado === 1) {
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) {
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }
            
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 54.2, ano: 2022 };
                console.log('⚠️ Usando dados estáticos para saneamento');
                alertas.registrarFalha('saneamento-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            salvarCache('saneamento', dados);
            return salvarDados('saneamento', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de saneamento:', erro);
            alertas.registrarFalha('saneamento', erro);
            return salvarDados('saneamento', { valor: 54.2, ano: 2022 });
        }
    },

    async mortalidade_infantil() {
        try {
            const cache = verificarCache('mortalidade_infantil');
            if (cache) {
                return salvarDados('mortalidade_infantil', cache);
            }

            const resultado = await acessarEndpointsAlternativos('mortalidade_infantil');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta, endpointUsado } = resultado;
            
            let dados = { valor: null, ano: null };
            
            if (endpointUsado === 0) {
                const periodo = Object.keys(resposta[0]?.resultados[0]?.series[0]?.serie || {}).pop() || '2022';
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie[periodo] || '0'),
                    ano: parseInt(periodo)
                };
            } else if (endpointUsado === 1) {
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) {
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }
            
            if (dados.valor === null || isNaN(dados.valor)) {
                dados = { valor: 12.8, ano: 2022 };
                console.log('⚠️ Usando dados estáticos para mortalidade infantil');
                alertas.registrarFalha('mortalidade_infantil-dados-invalidos', new Error("Dados retornados pela API são inválidos ou nulos"));
            }
            
            salvarCache('mortalidade_infantil', dados);
            return salvarDados('mortalidade_infantil', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de mortalidade infantil:', erro);
            alertas.registrarFalha('mortalidade_infantil', erro);
            return salvarDados('mortalidade_infantil', { valor: 12.8, ano: 2022 });
        }
    },

    async energia_solar() {
        try {
            const cache = verificarCache('energia_solar');
            if (cache) {
                return salvarDados('energia_solar', cache);
            }

            const resultado = await acessarEndpointsAlternativos('energia_solar');
            if (!resultado) {
                throw new Error('Todos os endpoints falharam');
            }
            
            const { resposta } = resultado;
            
            // Processamento específico para ANEEL
            const dadosProcessados = resposta.result?.records || [];
            const totalInstalacoes = dadosProcessados.length;
            const capacidadeTotal = dadosProcessados.reduce((acc, item) => 
                acc + parseFloat(item.Potência || 0), 0);
            
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
            
            salvarCache('energia_solar', dados);
            return salvarDados('energia_solar', dados);
            
        } catch (erro) {
            console.error('Erro ao atualizar dados de energia solar:', erro);
            alertas.registrarFalha('energia_solar', erro);
            return salvarDados('energia_solar', { 
                valor: 11.3, 
                capacidadeKW: 355000,
                instalacoes: 14200,
                ano: 2024
            });
        }
    },

    // SNIS - Resíduos Reciclados (dados estáticos apenas)
    async residuos_reciclados() {
        try {
            // Não há API disponível, usando dados estáticos
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
 * Função principal que executa a atualização de todos os dados
 */
async function atualizarTodosDados() {
    console.log('🔄 Iniciando atualização de dados...');
    const inicio = Date.now();
    
    const fontes = Object.keys(processadores);
    
    const resultados = await Promise.allSettled(
        fontes.map(fonte => processadores[fonte]())
    );
    
    const sucessos = resultados.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const falhas = fontes.length - sucessos;
    
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    
    if (falhas === 0) {
        alertas.registrarSucesso();
        console.log('✅ Todos os dados foram atualizados com sucesso!');
    } else {
        alertas.registrarFalha('atualizacao-geral', new Error(`${falhas} indicadores falharam na atualização`));
        console.log(`⚠️ Atenção: ${falhas} indicadores falharam na atualização.`);
    }
    
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