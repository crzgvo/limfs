/**
 * Arquivo principal de inicialização do Painel ODS Sergipe
 * Responsável por carregar os módulos e configurar a aplicação
 * 
 * @module main
 * @version 2.0.0
 */

// Importações de serviços e módulos
import { logger, monitorPerformance } from './services/monitoramento.js';
import { INDICADORES, DADOS_HISTORICOS } from './services/dados-service.js';
import { buscarDadosAPI } from './modules/carregadorDados.js';
import { renderizarIndicador } from './components/indicadores.js';
import { gerarGraficoComparativo } from './painel-ods.js';

// Novos imports
import { inicializarAcessibilidadeAvancada } from './modules/acessibilidadeAvancada.js';
import { validarIndicador, sanitizarDadosIndicador, verificarConsistenciaDados } from './services/validacaoSchema.js';
import { agregarDadosPorPeriodo, enriquecerDadosIndicador } from './utils/indicadorUtils.js';

/**
 * Configura CSP (Content Security Policy) mais restritiva
 * Contribui para o ODS 16 (Instituições Eficazes) garantindo segurança
 */
function configurarCSPRestritiva() {
    try {
        // Configura meta tag CSP no runtime (como backup da configuração do servidor)
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com;
            style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com;
            img-src 'self' data:;
            font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
            connect-src 'self' https://apisidra.ibge.gov.br https://servicodados.ibge.gov.br https://dadosabertos.aneel.gov.br;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'self';
            block-all-mixed-content;
            upgrade-insecure-requests;
        `;
        
        // Adiciona ao head se ainda não existir
        const cspExistente = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspExistente) {
            document.head.appendChild(cspMeta);
        }
        
        logger.info('CSP restritiva configurada com sucesso.');
    } catch (erro) {
        logger.error('Erro ao configurar CSP:', erro);
    }
}

/**
 * Configura o nível de logging com base nas preferências ou ambiente
 * @param {string} nivel - Nível de log (DEBUG, INFO, WARN, ERROR)
 */
function configurarNivelLog(nivel) {
    const nivelNormalizado = nivel.toUpperCase();
    if (['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(nivelNormalizado)) {
        logger.setNivel(nivelNormalizado);
        logger.info(`Nível de log configurado para: ${nivelNormalizado}`);
    } else {
        logger.warn(`Nível de log inválido: ${nivel}, usando INFO como padrão.`);
        logger.setNivel('INFO');
    }
}

/**
 * Atualiza a data de atualização exibida na interface
 */
function atualizarDataAtualizacao() {
    const dataElement = document.getElementById('data-atualizacao');
    if (dataElement) {
        const dataFormatada = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        dataElement.textContent = dataFormatada;
    }
}

/**
 * Exporta todos os dados em formato CSV
 */
function exportarTodosCSV() {
    // Implementação da exportação de todos os indicadores em CSV
    // Código existente...
}

/**
 * Exporta dados de um indicador específico em formato CSV
 * @param {string} endpoint - Identificador do indicador
 * @param {string} titulo - Título para o arquivo
 */
function exportarCSVIndicador(endpoint, titulo) {
    // Implementação da exportação de um indicador específico em CSV
    // Código existente...
}

/**
 * Inicializa o painel ODS: configura logging, carrega indicadores,
 * renderiza gráficos e configura eventos.
 */
async function inicializarPainel() {
    const medicaoTotal = monitorPerformance.iniciarMedicao('inicializacao_painel');
    logger.info('Iniciando carregamento do Painel ODS');

    try {
        // Configura o nível de log (INFO por padrão, DEBUG se definido no localStorage)
        configurarNivelLog(window.localStorage.getItem('nivel_log') || 'INFO');
        
        // Configura CSP restritiva para segurança
        configurarCSPRestritiva();
        
        // Inicia módulo de acessibilidade avançada (ODS 10)
        await inicializarAcessibilidadeAvancada();
        
        // Atualiza data no rodapé ou cabeçalho
        atualizarDataAtualizacao();
        
        // Registra listener global para eventos de exportação de CSV individual
        window.addEventListener('exportar-csv-indicador', (e) => {
            if (e.detail && e.detail.endpoint && e.detail.titulo) {
                exportarCSVIndicador(e.detail.endpoint, e.detail.titulo);
            } else {
                logger.warn('Evento exportar-csv-indicador recebido sem detalhes necessários.');
            }
        });

        const promessasCarregamento = [];

        // Itera sobre os indicadores definidos e inicia o carregamento de cada um
        for (const indicador of INDICADORES) {
            const promessa = (async () => {
                let dadosParaRenderizar;
                const medicaoIndicador = monitorPerformance.iniciarMedicao(`carregar_${indicador.endpoint}`);
                try {
                    // Busca dados via serviço (que lida com cache, API, fallback)
                    let dados = await buscarDadosAPI(indicador.endpoint);
                    
                    // Sanitiza e valida dados usando os novos módulos
                    dados = sanitizarDadosIndicador(dados, indicador.endpoint);
                    
                    try {
                        // Valida estrutura dos dados com JSON Schema
                        validarIndicador(indicador.endpoint, dados);
                    } catch (erroValidacao) {
                        logger.warn(`Dados do indicador ${indicador.endpoint} não passaram na validação: ${erroValidacao.message}`);
                        // Continua com os dados, mas marca como não validados
                        dados.naoValidado = true;
                    }
                    
                    // Verifica consistência dos dados (detecção de anomalias)
                    const historicoIndicador = DADOS_HISTORICOS[indicador.endpoint] || [];
                    const resultadoConsistencia = verificarConsistenciaDados(
                        dados, 
                        historicoIndicador, 
                        indicador.endpoint
                    );
                    
                    // Adiciona informações de consistência aos dados
                    dados.consistenciaVerificada = true;
                    if (!resultadoConsistencia.consistente) {
                        dados.alertasConsistencia = resultadoConsistencia.alertas;
                        logger.warn(
                            `Alertas de consistência para ${indicador.endpoint}: ${resultadoConsistencia.alertas.join(', ')}`
                        );
                    }
                    
                    // Enriquece dados com metadados específicos para ODS
                    dadosParaRenderizar = enriquecerDadosIndicador(indicador, dados);
                    
                    const duracao = monitorPerformance.finalizarMedicao(medicaoIndicador);
                    logger.info(`Indicador ${indicador.endpoint} carregado em ${duracao.toFixed(2)}ms.`);
                    return { sucesso: true, indicador: indicador.endpoint };
                } catch (erro) {
                    // Em caso de erro na busca, usa dados históricos como fallback
                    logger.error(`Erro ao carregar ${indicador.endpoint}, usando fallback:`, erro);
                    // Pega o último dado histórico disponível
                    const ultimoDadoHistorico = DADOS_HISTORICOS[indicador.endpoint]?.slice(-1)[0] || { valor: 'N/D', ano: 'N/A' };
                    dadosParaRenderizar = { ...ultimoDadoHistorico, usouFallback: true };
                    monitorPerformance.finalizarMedicao(medicaoIndicador); // Finaliza mesmo com erro
                    return { sucesso: false, indicador: indicador.endpoint, erro: erro.message };
                } finally {
                    // Renderiza o indicador com os dados obtidos (API ou fallback)
                    if (dadosParaRenderizar) {
                        renderizarIndicador(indicador, dadosParaRenderizar, buscarDadosAPI, INDICADORES);
                    } else {
                        // Caso extremo onde nem o fallback funcionou
                        logger.fatal(`Falha crítica ao obter dados para renderizar ${indicador.endpoint}`);
                        // Renderizar um estado de erro explícito no card
                        renderizarIndicador(indicador, { valor: 'Erro', ano: '', usouFallback: true, erro: true }, buscarDadosAPI, INDICADORES);
                    }
                }
            })();
            promessasCarregamento.push(promessa);
        }

        // Aguarda a conclusão do carregamento de todos os indicadores
        const resultados = await Promise.allSettled(promessasCarregamento);

        // Gera o gráfico comparativo após todos os dados (incluindo históricos) estarem disponíveis
        try {
            gerarGraficoComparativo(DADOS_HISTORICOS);
        } catch (error) {
            logger.error("Erro ao gerar gráfico comparativo:", error);
        }

        // Configura o botão de exportar todos os dados
        const btnExportarTodos = document.getElementById('btn-exportar-todos');
        if (btnExportarTodos) {
            btnExportarTodos.addEventListener('click', exportarTodosCSV);
        } else {
            logger.warn("Botão 'btn-exportar-todos' não encontrado no DOM.");
        }

        // Verifica e loga indicadores que falharam no carregamento inicial
        const falhas = resultados.filter(r => r.status === 'rejected' || (r.value && !r.value.sucesso));
        if (falhas.length > 0) {
            logger.warn(`⚠️ ${falhas.length} indicador(es) falharam no carregamento inicial ou usaram fallback.`);
            falhas.forEach(f => {
                if (f.status === 'rejected') {
                    logger.error(`- Falha (rejeitada): ${f.reason}`);
                } else if (f.value && !f.value.sucesso) {
                    logger.warn(`- Falha (fallback): ${f.value.indicador} - ${f.value.erro}`);
                }
            });
        }

        const duracaoTotal = monitorPerformance.finalizarMedicao(medicaoTotal);
        logger.info(`Painel ODS inicializado completamente em ${duracaoTotal.toFixed(2)}ms`);

        // Exibe estatísticas de performance se o log estiver em modo DEBUG
        if (localStorage.getItem('nivel_log') === 'DEBUG') {
            console.log("--- Estatísticas de Performance ---");
            console.table(monitorPerformance.obterEstatisticas());
            console.log("---------------------------------");
        }
    } catch (erro) {
        logger.error('Erro crítico na inicialização do painel:', erro);
        const container = document.querySelector('main .container');
        if (container) {
            const mensagemErro = document.createElement('div');
            mensagemErro.className = 'erro-inicializacao';
            mensagemErro.innerHTML = `
                <h2>Erro ao carregar o painel</h2>
                <p>Ocorreu um erro inesperado durante a inicialização. Por favor, recarregue a página.</p>
                <button onclick="window.location.reload()">Recarregar</button>
            `;
            container.innerHTML = '';
            container.appendChild(mensagemErro);
        }
    }
}

// Inicializa o painel quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarPainel);

// Exporta funções para testes ou uso em outros módulos
export {
    inicializarPainel,
    exportarTodosCSV,
    exportarCSVIndicador,
    configurarNivelLog
};