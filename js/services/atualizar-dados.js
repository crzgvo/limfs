/**
 * Serviço de Atualização de Dados - LIMFS
 * Responsável por manter os dados dos indicadores ODS atualizados
 */

import { adicionarAlerta } from './monitoramento.js';

// Configurações do serviço
const CONFIG = {
    caminhos_dados: {
        pobreza: '../../dados/indicadores/pobreza.json',
        educacao: '../../dados/indicadores/educacao.json',
        saneamento: '../../dados/indicadores/saneamento.json',
        mortalidade_infantil: '../../dados/indicadores/mortalidade_infantil.json',
        energia_solar: '../../dados/indicadores/energia_solar.json',
        residuos_reciclados: '../../dados/indicadores/residuos_reciclados.json'
    },
    intervalo_atualizacao: 43200000, // 12 horas em milissegundos
    timeout_requisicao: 10000, // 10 segundos
};

/**
 * Buscar dados atualizados de um indicador específico
 * @param {string} indicador - O código do indicador a ser atualizado
 * @returns {Promise<Object>} Os dados do indicador
 */
async function buscarDados(indicador) {
    // Verificar se o indicador é válido
    if (!CONFIG.caminhos_dados[indicador]) {
        throw new Error(`Indicador desconhecido: ${indicador}`);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout_requisicao);

        const resposta = await fetch(CONFIG.caminhos_dados[indicador], {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        clearTimeout(timeoutId);

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar dados: ${resposta.status}`);
        }

        return await resposta.json();
    } catch (erro) {
        console.error(`Erro ao atualizar dados de ${indicador}:`, erro);
        
        // Registrar alerta no sistema de monitoramento
        adicionarAlerta({
            tipo: 'erro_dados',
            status: 'alerta',
            mensagem: `Falha na atualização dos dados do indicador ${indicador}`,
            detalhes: erro.message
        });
        
        // Retornar objeto com erro para tratamento na interface
        return {
            erro: true,
            mensagem: `Não foi possível atualizar os dados de ${indicador}. Usando dados em cache.`,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Atualizar todos os dados dos indicadores
 * @returns {Promise<Object>} Resultado da operação de atualização
 */
async function atualizarTodosDados() {
    console.log('Iniciando atualização de todos os indicadores...');
    
    const resultados = {};
    const indicadores = Object.keys(CONFIG.caminhos_dados);
    
    try {
        // Buscar todos os dados em paralelo
        const promessas = indicadores.map(indicador => 
            buscarDados(indicador)
                .then(dados => {
                    resultados[indicador] = {
                        sucesso: !dados.erro,
                        dados: dados
                    };
                    return { indicador, sucesso: !dados.erro };
                })
                .catch(erro => {
                    console.error(`Erro na atualização de ${indicador}:`, erro);
                    resultados[indicador] = {
                        sucesso: false,
                        erro: erro.message
                    };
                    return { indicador, sucesso: false };
                })
        );
        
        await Promise.allSettled(promessas);
        
        // Verificar se houve falhas
        const falhas = indicadores.filter(ind => !resultados[ind]?.sucesso);
        
        if (falhas.length > 0) {
            adicionarAlerta({
                tipo: 'atualizacao_parcial',
                status: 'alerta',
                mensagem: `Atualização parcial dos dados. ${falhas.length} indicador(es) com falha.`,
                detalhes: `Falhas em: ${falhas.join(', ')}`
            });
        } else {
            console.log('Todos os indicadores foram atualizados com sucesso!');
        }
        
        // Registro de data de atualização
        localStorage.setItem('ultima_atualizacao', new Date().toISOString());
        
        return {
            sucesso: falhas.length === 0,
            atualizados: indicadores.length - falhas.length,
            falhas: falhas.length,
            detalhes: resultados
        };
    } catch (erro) {
        console.error('Erro geral na atualização de dados:', erro);
        
        adicionarAlerta({
            tipo: 'atualizacao_falha',
            status: 'critico',
            mensagem: 'Falha crítica na atualização dos dados dos indicadores',
            detalhes: erro.message
        });
        
        return {
            sucesso: false,
            erro: erro.message,
            detalhes: resultados
        };
    }
}

/**
 * Iniciar o serviço de atualização periódica
 */
function iniciarServico() {
    console.log('Serviço de atualização de dados iniciado');
    
    // Verificar a última atualização
    const ultimaAtualizacao = localStorage.getItem('ultima_atualizacao');
    const agora = new Date();
    
    if (!ultimaAtualizacao || (agora - new Date(ultimaAtualizacao)) > CONFIG.intervalo_atualizacao) {
        console.log('Necessário atualizar os dados...');
        atualizarTodosDados();
    } else {
        console.log('Dados já atualizados recentemente.');
    }
    
    // Configurar atualização periódica
    setInterval(atualizarTodosDados, CONFIG.intervalo_atualizacao);
}

// Exportar funções para uso em outros módulos
export {
    buscarDados,
    atualizarTodosDados,
    iniciarServico
};