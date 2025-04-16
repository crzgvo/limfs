/**
 * Arquivo principal do Painel ODS Sergipe.
 * Inicializa e coordena os componentes da aplicação no front-end.
 */

// Importações dos módulos de serviço e componentes
import { buscarDadosAPI, INDICADORES, DADOS_HISTORICOS, gerarCSVIndicador, gerarCSVTodosIndicadores } from './services/dados-service.js';
import { renderizarIndicador, gerarGrafico, gerarGraficoComparativo, mostrarMensagemSucesso, atualizarDataAtualizacao } from './components/indicadores.js';
import { logger, monitorPerformance, configurarNivelLog } from './services/monitoramento.js';

/**
 * Cria e dispara o download de um arquivo CSV.
 * @param {string} conteudoCSV - Conteúdo do arquivo CSV.
 * @param {string} nomeArquivo - Nome do arquivo para download.
 */
function downloadCSV(conteudoCSV, nomeArquivo) {
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Gera e baixa o CSV para um indicador específico.
 * @param {string} endpoint - Identificador do endpoint do indicador.
 * @param {string} titulo - Título do indicador para o nome do arquivo.
 */
function exportarCSVIndicador(endpoint, titulo) {
    const medicao = monitorPerformance.iniciarMedicao('exportar_csv');

    try {
        const csv = gerarCSVIndicador(endpoint, titulo);
        const nomeArquivo = `dados-${endpoint}-sergipe.csv`;
        downloadCSV(csv, nomeArquivo);
        mostrarMensagemSucesso(`Dados de ${titulo} exportados com sucesso!`);
        logger.info(`CSV exportado para ${endpoint}: ${nomeArquivo}`);
    } catch (error) {
        logger.error(`Erro ao exportar CSV para ${endpoint}:`, error);
        // Adicionar feedback visual de erro para o usuário, se necessário
    } finally {
        monitorPerformance.finalizarMedicao(medicao);
    }
}


/**
 * Gera e baixa um CSV combinado com dados de todos os indicadores.
 */
function exportarTodosCSV() {
    const medicao = monitorPerformance.iniciarMedicao('exportar_todos_csv');

    try {
        const csv = gerarCSVTodosIndicadores(INDICADORES);
        downloadCSV(csv, 'indicadores-ods-sergipe.csv');
        mostrarMensagemSucesso('Todos os dados exportados com sucesso!');
        logger.info('CSV completo exportado');
    } catch (error) {
        logger.error('Erro ao exportar CSV completo:', error);
        // Adicionar feedback visual de erro para o usuário, se necessário
    } finally {
        monitorPerformance.finalizarMedicao(medicao);
    }
}


/**
 * Inicializa o painel ODS: configura logging, carrega indicadores,
 * renderiza gráficos e configura eventos.
 */
async function inicializarPainel() {
    const medicaoTotal = monitorPerformance.iniciarMedicao('inicializacao_painel');
    logger.info('Iniciando carregamento do Painel ODS');

    // Configura o nível de log (INFO por padrão, DEBUG se definido no localStorage)
    configurarNivelLog(window.localStorage.getItem('nivel_log') || 'INFO');
    atualizarDataAtualizacao(); // Atualiza data no rodapé ou cabeçalho

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
                dadosParaRenderizar = await buscarDadosAPI(indicador.endpoint);
                const duracao = monitorPerformance.finalizarMedicao(medicaoIndicador);
                logger.info(`Indicador ${indicador.endpoint} carregado em ${duracao.toFixed(2)}ms.`);
                return { sucesso: true, indicador: indicador.endpoint };
            } catch (erro) {
                // Em caso de erro na busca, usa dados históricos como fallback
                logger.error(`Erro ao carregar ${indicador.endpoint, usando fallback:`, erro);
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
}


// Inicializa o painel quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarPainel);

// Exporta funções para possível uso externo ou testes unitários
export {
    inicializarPainel,
    exportarCSVIndicador,
    exportarTodosCSV
};