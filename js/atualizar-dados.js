/**
 * Script de atualização automática de dados para o Painel ODS Sergipe.
 * Busca dados em APIs e mantém arquivos JSON locais atualizados.
 */

require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');
const alertas = require('./alertas');

// --- Configurações ---
const DIRETORIO_DADOS = path.join(__dirname, '..', 'dados');
const DIRETORIO_CACHE = path.join(__dirname, '..', 'dados', 'cache');
const TIMEOUT_REQUISICAO = 15000; // ms
const DATA_HOJE = new Date().toISOString().split('T')[0];
const MAX_TENTATIVAS = 3; // Para requisições HTTP
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em ms

// Cria diretórios se não existirem
if (!fs.existsSync(DIRETORIO_DADOS)) {
    fs.mkdirSync(DIRETORIO_DADOS, { recursive: true });
    console.log(`Diretório de dados criado em: ${DIRETORIO_DADOS}`);
}

if (!fs.existsSync(DIRETORIO_CACHE)) {
    fs.mkdirSync(DIRETORIO_CACHE, { recursive: true });
    console.log(`Diretório de cache criado em: ${DIRETORIO_CACHE}`);
}

/**
 * Verifica se existe cache válido para o indicador.
 * @param {string} indicador - Nome do indicador.
 * @returns {object|null} Dados do cache ou null se inválido/inexistente.
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
 * Salva os dados do indicador no cache.
 * @param {string} indicador - Nome do indicador.
 * @param {object} dados - Dados a serem cacheados.
 * @returns {boolean} True se o cache foi salvo com sucesso.
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
 * Valida a estrutura dos dados recebidos das APIs.
 * Essencial para detectar mudanças inesperadas no formato das respostas.
 * @param {string} indicador - Nome do indicador.
 * @param {any} dados - Dados recebidos da API.
 * @param {number} endpointUsado - Índice do endpoint que retornou os dados.
 * @returns {object|null} Dados validados ou null se inválidos.
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
                if (endpointUsado === 0) { // API servicodados v3
                    if (!dados[0]?.resultados?.[0]?.series?.[0]?.serie) {
                        console.error(`❌ Estrutura inválida para pobreza (endpoint #1)`);
                        return null;
                    }
                } else if (endpointUsado === 1) { // API SIDRA
                    if (!dados[1]?.V && !dados[1]?.valor) { // Aceita 'V' ou 'valor'
                        console.error(`❌ Estrutura inválida para pobreza (endpoint #2)`);
                        return null;
                    }
                } else if (endpointUsado === 2) { // API servicodados v1
                    if (!dados[0]?.res) {
                        console.error(`❌ Estrutura inválida para pobreza (endpoint #3)`);
                        return null;
                    }
                }
                break;
                
            case 'educacao':
            case 'saneamento':
            case 'mortalidade_infantil':
                if (endpointUsado === 0 && !dados[0]?.resultados?.[0]?.series?.[0]?.serie) {
                    console.error(`❌ Estrutura de dados inválida para ${indicador} (endpoint #1)`);
                    return null;
                } else if (endpointUsado === 1 && !dados[1]?.V && !dados[1]?.valor) {
                    console.error(`❌ Estrutura de dados inválida para ${indicador} (endpoint #2)`);
                    return null;
                }
                break;
                
            case 'energia_solar': // API ANEEL (formato diferente)
                if (!dados.result?.records) {
                    console.error(`❌ Estrutura inválida para energia_solar: Faltando result.records`);
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
 * Realiza requisição HTTPS com timeout e retry com backoff exponencial.
 * @param {string} url - URL da API.
 * @param {number} tentativaAtual - Número da tentativa atual.
 * @returns {Promise<object>} Promessa resolvida com os dados da API.
 */
function fazerRequisicao(url, tentativaAtual = 1) {
    return new Promise((resolve, reject) => {
        console.log(`Tentativa ${tentativaAtual} de acessar: ${url}`);
        
        const request = https.get(url, response => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                const error = new Error(`Status Code: ${response.statusCode}`);
                if (tentativaAtual < MAX_TENTATIVAS) {
                    console.log(`Tentativa ${tentativaAtual} falhou (${response.statusCode}). Tentando novamente...`);
                    // Backoff exponencial: 1s, 2s, 4s...
                    const delay = 1000 * Math.pow(2, tentativaAtual - 1);
                    setTimeout(() => {
                        fazerRequisicao(url, tentativaAtual + 1)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                    return;
                }
                return reject(error); // Rejeita após MAX_TENTATIVAS
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
                const delay = 1000 * Math.pow(2, tentativaAtual - 1);
                setTimeout(() => {
                    fazerRequisicao(url, tentativaAtual + 1)
                        .then(resolve)
                        .catch(reject);
                }, delay);
                return;
            }
            reject(new Error(`Timeout ao acessar: ${url}`)); // Rejeita após MAX_TENTATIVAS
        });

        // Tratamento de erro na requisição
        request.on('error', (error) => {
            if (tentativaAtual < MAX_TENTATIVAS) {
                console.log(`Erro na tentativa ${tentativaAtual}: ${error.message}. Tentando novamente...`);
                const delay = 1000 * Math.pow(2, tentativaAtual - 1);
                setTimeout(() => {
                    fazerRequisicao(url, tentativaAtual + 1)
                        .then(resolve)
                        .catch(reject);
                }, delay);
                return;
            }
            reject(error); // Rejeita após MAX_TENTATIVAS
        });
    });
}

/**
 * Salva os dados processados em arquivo JSON, incluindo metadados.
 * @param {string} nomeArquivo - Nome base do arquivo (sem extensão).
 * @param {object} dados - Dados a serem salvos.
 * @returns {boolean} True se os dados foram salvos com sucesso.
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
 * Endpoints alternativos para cada indicador (estratégia de fallback).
 * A ordem importa: o primeiro endpoint funcional será usado.
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
 * Tenta acessar múltiplos endpoints para um indicador até obter sucesso.
 * Percorre a lista de endpoints alternativos definida em `ENDPOINTS_ALTERNATIVOS`.
 * @param {string} indicador - Nome do indicador.
 * @returns {Promise<object|null>} Objeto com { resposta, endpointUsado } ou null se todos falharem.
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
            // Se a validação falhar, loga o erro mas continua para o próximo endpoint
            console.warn(`⚠️ Endpoint #${i+1} para ${indicador} retornou dados inválidos.`);
            alertas.registrarFalha(`${indicador}-endpoint-${i+1}-validacao`, new Error("Dados inválidos retornados pela API"));
        } catch (erro) {
            console.error(`❌ Endpoint #${i+1} para ${indicador} falhou: ${erro.message}`);
            alertas.registrarFalha(`${indicador}-endpoint-${i+1}`, erro);
            // Continua para o próximo endpoint em caso de erro de requisição
        }
    }
    
    console.error(`❌ Todos os endpoints para ${indicador} falharam.`);
    alertas.registrarFalha(`${indicador}-todos-endpoints`, new Error("Todos os endpoints falharam"));
    return null; // Retorna null se nenhum endpoint funcionar
}

/**
 * Processadores específicos para buscar, validar e formatar dados de cada indicador.
 * Utiliza cache, fallback de endpoints e dados estáticos se necessário.
 */
const processadores = {
    // Processador para o indicador de Pobreza
    async pobreza() {
        const indicador = 'pobreza';
        try {
            const cache = verificarCache(indicador);
            if (cache) return salvarDados(indicador, cache);

            const resultado = await acessarEndpointsAlternativos(indicador);
            if (!resultado) throw new Error('Todos os endpoints falharam');

            const { resposta, endpointUsado } = resultado;

            // Extração de dados baseada no endpoint que funcionou
            let dados = { valor: null, ano: null };
            if (endpointUsado === 0) { // servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2022'] || '0'),
                    ano: 2022
                };
            } else if (endpointUsado === 1) { // SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022 // Usa o ano da API ou fallback
                };
            } else if (endpointUsado === 2) { // servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }

            // Fallback para dados estáticos se a API retornar valor inválido
            if (dados.valor === null || isNaN(dados.valor)) {
                console.warn(`⚠️ Dados inválidos da API para ${indicador}. Usando fallback estático.`);
                alertas.registrarFalha(`${indicador}-dados-invalidos`, new Error("Dados retornados pela API são inválidos ou nulos"));
                dados = { valor: 8.1, ano: 2024 }; // Valor estático de fallback
            }

            salvarCache(indicador, dados);
            return salvarDados(indicador, dados);

        } catch (erro) {
            console.error(`Erro ao atualizar dados de ${indicador}:`, erro);
            alertas.registrarFalha(indicador, erro);
            // Salva dados estáticos em caso de erro total
            return salvarDados(indicador, { valor: 8.1, ano: 2024 });
        }
    },

    // Processador para o indicador de Educação (estrutura similar ao de Pobreza)
    async educacao() {
        const indicador = 'educacao';
        try {
            const cache = verificarCache(indicador);
            if (cache) return salvarDados(indicador, cache);

            const resultado = await acessarEndpointsAlternativos(indicador);
            if (!resultado) throw new Error('Todos os endpoints falharam');

            const { resposta, endpointUsado } = resultado;

            let dados = { valor: null, ano: null };
            if (endpointUsado === 0) { // servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2023'] || '0'),
                    ano: 2023
                };
            } else if (endpointUsado === 1) { // SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2023
                };
            } else if (endpointUsado === 2) { // servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2023'] || '0'),
                    ano: 2023
                };
            }

            if (dados.valor === null || isNaN(dados.valor)) {
                console.warn(`⚠️ Dados inválidos da API para ${indicador}. Usando fallback estático.`);
                alertas.registrarFalha(`${indicador}-dados-invalidos`, new Error("Dados retornados pela API são inválidos ou nulos"));
                dados = { valor: 88.8, ano: 2023 };
            }

            salvarCache(indicador, dados);
            return salvarDados(indicador, dados);

        } catch (erro) {
            console.error(`Erro ao atualizar dados de ${indicador}:`, erro);
            alertas.registrarFalha(indicador, erro);
            return salvarDados(indicador, { valor: 88.8, ano: 2023 });
        }
    },

    // Processador para Saneamento
    async saneamento() {
        const indicador = 'saneamento';
        try {
            const cache = verificarCache(indicador);
            if (cache) return salvarDados(indicador, cache);

            const resultado = await acessarEndpointsAlternativos(indicador);
            if (!resultado) throw new Error('Todos os endpoints falharam');

            const { resposta, endpointUsado } = resultado;

            let dados = { valor: null, ano: null };
            if (endpointUsado === 0) { // servicodados v3
                dados = {
                    valor: parseFloat(resposta[0]?.resultados[0]?.series[0]?.serie['2022'] || '0'),
                    ano: 2022
                };
            } else if (endpointUsado === 1) { // SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) { // servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }

            if (dados.valor === null || isNaN(dados.valor)) {
                console.warn(`⚠️ Dados inválidos da API para ${indicador}. Usando fallback estático.`);
                alertas.registrarFalha(`${indicador}-dados-invalidos`, new Error("Dados retornados pela API são inválidos ou nulos"));
                dados = { valor: 54.2, ano: 2022 };
            }

            salvarCache(indicador, dados);
            return salvarDados(indicador, dados);

        } catch (erro) {
            console.error(`Erro ao atualizar dados de ${indicador}:`, erro);
            alertas.registrarFalha(indicador, erro);
            return salvarDados(indicador, { valor: 54.2, ano: 2022 });
        }
    },

    // Processador para Mortalidade Infantil
    async mortalidade_infantil() {
        const indicador = 'mortalidade_infantil';
        try {
            const cache = verificarCache(indicador);
            if (cache) return salvarDados(indicador, cache);

            const resultado = await acessarEndpointsAlternativos(indicador);
            if (!resultado) throw new Error('Todos os endpoints falharam');

            const { resposta, endpointUsado } = resultado;

            let dados = { valor: null, ano: null };
            if (endpointUsado === 0) { // servicodados v3 - Pega o último período disponível dinamicamente
                const serie = resposta[0]?.resultados[0]?.series[0]?.serie || {};
                const periodo = Object.keys(serie).pop() || '2022'; // Último ano na série ou fallback
                dados = {
                    valor: parseFloat(serie[periodo] || '0'),
                    ano: parseInt(periodo)
                };
            } else if (endpointUsado === 1) { // SIDRA
                dados = {
                    valor: parseFloat(resposta[1]?.V || resposta[1]?.valor || '0'),
                    ano: parseInt(resposta[1]?.D2N) || 2022
                };
            } else if (endpointUsado === 2) { // servicodados v1
                dados = {
                    valor: parseFloat(resposta[0]?.res?.['2022'] || '0'),
                    ano: 2022
                };
            }

            if (dados.valor === null || isNaN(dados.valor)) {
                console.warn(`⚠️ Dados inválidos da API para ${indicador}. Usando fallback estático.`);
                alertas.registrarFalha(`${indicador}-dados-invalidos`, new Error("Dados retornados pela API são inválidos ou nulos"));
                dados = { valor: 12.8, ano: 2022 };
            }

            salvarCache(indicador, dados);
            return salvarDados(indicador, dados);

        } catch (erro) {
            console.error(`Erro ao atualizar dados de ${indicador}:`, erro);
            alertas.registrarFalha(indicador, erro);
            return salvarDados(indicador, { valor: 12.8, ano: 2022 });
        }
    },

    // Processador para Energia Solar (API ANEEL)
    async energia_solar() {
        const indicador = 'energia_solar';
        try {
            const cache = verificarCache(indicador);
            if (cache) return salvarDados(indicador, cache);

            const resultado = await acessarEndpointsAlternativos(indicador);
            // Endpoint 2 (CSV) não é processado aqui, apenas o JSON (endpoint 1)
            if (!resultado || resultado.endpointUsado !== 0) {
                 // Se o endpoint JSON falhar ou não for o usado, tenta o fallback
                throw new Error('Endpoint JSON da ANEEL falhou ou retornou dados inválidos');
            }

            const { resposta } = resultado;

            // Processamento específico para ANEEL (JSON)
            const dadosProcessados = resposta.result?.records || [];
            const totalInstalacoes = dadosProcessados.length;
            // Soma a potência, tratando possíveis valores não numéricos
            const capacidadeTotal = dadosProcessados.reduce((acc, item) =>
                acc + (parseFloat(item.Potência) || 0), 0);

            if (totalInstalacoes === 0) {
                console.warn(`⚠️ API da ANEEL retornou zero instalações para ${indicador}. Usando fallback estático.`);
                alertas.registrarFalha(`${indicador}-dados-vazios`, new Error("API retornou array vazio de instalações"));
                // Usa dados estáticos se a API retornar vazio
                return salvarDados(indicador, {
                    valor: 11.3, // Valor percentual estático
                    capacidadeKW: 355000,
                    instalacoes: 14200,
                    ano: 2024
                });
            }

            const dados = {
                // Calcula valor percentual baseado em uma meta hipotética (ajustar se necessário)
                valor: parseFloat(((totalInstalacoes / 20000) * 100).toFixed(1)),
                capacidadeKW: capacidadeTotal,
                instalacoes: totalInstalacoes,
                ano: new Date().getFullYear() // Usa o ano atual
            };

            salvarCache(indicador, dados);
            return salvarDados(indicador, dados);

        } catch (erro) {
            console.error(`Erro ao atualizar dados de ${indicador}:`, erro);
            alertas.registrarFalha(indicador, erro);
            // Salva dados estáticos em caso de erro total
            return salvarDados(indicador, {
                valor: 11.3,
                capacidadeKW: 355000,
                instalacoes: 14200,
                ano: 2024
            });
        }
    },

    // Processador para Resíduos Reciclados (usa apenas dados estáticos)
    async residuos_reciclados() {
        const indicador = 'residuos_reciclados';
        try {
            // Não há API pública confiável identificada, usando dados estáticos.
            // Se uma API for encontrada, implementar lógica similar aos outros processadores.
            console.log(`ℹ️ Usando dados estáticos para ${indicador}.`);
            const dados = {
                valor: 6.2,
                ano: 2024
            };

            // Não há necessidade de cache ou fallback complexo aqui
            return salvarDados(indicador, dados);
        } catch (erro) {
            // Erro pode ocorrer apenas no salvamento do arquivo
            console.error(`Erro ao salvar dados estáticos de ${indicador}:`, erro);
            alertas.registrarFalha(`${indicador}-salvamento`, erro);
            return false;
        }
    }
};

/**
 * Função principal: executa a atualização para todos os indicadores definidos nos processadores.
 * Registra sucesso ou falha geral e gera relatório de status.
 */
async function atualizarTodosDados() {
    console.log('🔄 Iniciando atualização de dados...');
    const inicio = Date.now();
    
    const fontes = Object.keys(processadores);
    
    // Executa todos os processadores em paralelo
    const resultados = await Promise.allSettled(
        fontes.map(fonte => processadores[fonte]())
    );
    
    let sucessos = 0;
    let falhas = 0;
    
    resultados.forEach((resultado, index) => {
        const fonte = fontes[index];
        if (resultado.status === 'fulfilled' && resultado.value === true) {
            sucessos++;
            // Registrar sucesso individual (opcional, já que resetamos no geral)
            // alertas.registrarSucessoIndividual(fonte);
        } else {
            falhas++;
            // O erro já foi registrado dentro do processador ou em acessarEndpointsAlternativos
            console.error(`❌ Falha ao processar ${fonte}: ${resultado.reason || 'Salvo com erro/fallback'}`);
        }
    });
    
    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    
    if (falhas === 0) {
        alertas.registrarSucesso(); // Reseta contador de falhas consecutivas gerais
        console.log(`✅ Todos os ${fontes.length} indicadores foram atualizados com sucesso!`);
    } else {
        // A falha já foi registrada individualmente, mas podemos registrar uma falha geral
        // para garantir que o contador de consecutivas aumente se houver qualquer falha.
        alertas.registrarFalha('atualizacao-geral', new Error(`${falhas} indicador(es) falharam na atualização`));
        console.warn(`⚠️ Atenção: ${falhas} de ${fontes.length} indicadores falharam ou usaram fallback.`);
    }
    
    // Gera e salva o relatório de status HTML
    const relatorioPath = alertas.salvarRelatorioStatus();
    if (relatorioPath) {
        console.log(`📊 Relatório de status salvo em: ${relatorioPath}`);
    } else {
        console.error('❌ Falha ao gerar o relatório de status.');
    }
    
    console.log(`
📊 Relatório Final da Atualização:
------------------------------------
✅ Sucessos (API/Cache/JSON): ${sucessos}/${fontes.length}
❌ Falhas / Fallbacks: ${falhas}/${fontes.length}
⏱️ Tempo total: ${duracao} segundos
📅 Data: ${DATA_HOJE}
    `);
}

// Executa a função principal de atualização
atualizarTodosDados();