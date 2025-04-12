/**
 * Painel ODS Sergipe - Monitoramento dos indicadores da Agenda 2030
 */

const API_CONFIG = {
    ibge_sidra_base: 'https://apisidra.ibge.gov.br/values',
    endpoints: {
        pobreza: '/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201',
        educacao: '/t/7218/n6/28/v/1641/p/last',
        saneamento: '/t/1393/n6/28/v/1000096/p/last'
    },
    cache_expiration: 86400000,
    timeout: 5000
};

// Dados históricos utilizados como fallback quando a API não está disponível
const DADOS_HISTORICOS = {
    pobreza: [
        { ano: 2019, valor: 9.5 },
        { ano: 2020, valor: 10.3 },
        { ano: 2021, valor: 9.2 },
        { ano: 2022, valor: 8.8 },
        { ano: 2023, valor: 8.4 },
        { ano: 2024, valor: 8.1 }
    ],
    educacao: [
        { ano: 2017, valor: 84.7 },
        { ano: 2018, valor: 85.2 },
        { ano: 2019, valor: 85.7 },
        { ano: 2020, valor: 86.1 },
        { ano: 2021, valor: 86.5 },
        { ano: 2022, valor: 86.9 },
        { ano: 2023, valor: 88.8 }
    ],
    saneamento: [
        { ano: 2017, valor: 31.2 },
        { ano: 2018, valor: 32.8 },
        { ano: 2019, valor: 34.2 },
        { ano: 2020, valor: 35.1 },
        { ano: 2021, valor: 36.2 },
        { ano: 2022, valor: 54.2 }
    ]
};

// Definição das cores oficiais dos ODS para padronização visual
const CORES_ODS = {
    pobreza: {
        cor: '#E5243B',
        corSecundaria: 'rgba(229, 36, 59, 0.2)',
        nomeLegenda: 'Extrema Pobreza'
    },
    educacao: {
        cor: '#C5192D',
        corSecundaria: 'rgba(197, 25, 45, 0.2)',
        nomeLegenda: 'Alfabetização'
    },
    saneamento: {
        cor: '#26BDE2',
        corSecundaria: 'rgba(38, 189, 226, 0.2)',
        nomeLegenda: 'Saneamento Básico'
    }
};

// Configuração dos indicadores com metadados
const INDICADORES = [
    {
        id: 'indicador-pobreza',
        endpoint: 'pobreza',
        titulo: 'Taxa de Extrema Pobreza',
        descricao: 'da população de Sergipe vivia em situação de extrema pobreza em 2024.',
        tendencia: 'decrescente',
        contexto: 'A taxa caiu 0.3 pontos percentuais comparado a 2023, continuando a recuperação pós-pandemia.',
        fonte: 'Fonte: IBGE - PNAD Contínua'
    },
    {
        id: 'indicador-educacao',
        endpoint: 'educacao',
        titulo: 'Taxa de Alfabetização',
        descricao: 'da população de Sergipe com 15 anos ou mais de idade é alfabetizada.',
        tendencia: 'crescente',
        contexto: 'A taxa de alfabetização atingiu 88,8% em 2023, refletindo avanços recentes nas políticas educacionais.',
        fonte: 'Fonte: IBGE - PNAD Contínua Educação 2023'
    },
    {
        id: 'indicador-saneamento',
        endpoint: 'saneamento',
        titulo: 'Cobertura de Saneamento Básico',
        descricao: 'dos domicílios de Sergipe possuem esgotamento sanitário adequado.',
        tendencia: 'crescente',
        contexto: 'Sergipe lidera o Nordeste com 54,2% dos domicílios conectados à rede geral de esgoto (Censo IBGE 2022).',
        fonte: 'Fonte: IBGE - Censo Demográfico 2022'
    }
];

/**
 * Busca dados na API do IBGE com sistema de fallback
 */
async function buscarDadosAPI(endpoint) {
    try {
        const url = `${API_CONFIG.ibge_sidra_base}${API_CONFIG.endpoints[endpoint]}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        let valor = null;

        // Extração do valor do indicador conforme formato específico de cada endpoint
        if (data && data.length > 0) {
            if (endpoint === 'pobreza') {
                valor = parseFloat(data[1].V || data[1].valor || '0');
            } else if (endpoint === 'educacao') {
                valor = parseFloat(data[1]?.V || data[1]?.valor || '0');
            } else if (endpoint === 'saneamento') {
                valor = parseFloat(data[1]?.V || data[1]?.valor || '0');
            }
        }

        // Verifica se o valor é válido ou usa dados de fallback
        if (valor === null || isNaN(valor)) {
            const dadosFallback = DADOS_HISTORICOS[endpoint];
            const dadoMaisRecente = dadosFallback[dadosFallback.length - 1];
            return {
                valor: dadoMaisRecente.valor,
                ano: dadoMaisRecente.ano,
                usouFallback: true
            };
        }

        return {
            valor: valor,
            ano: new Date().getFullYear(),
            usouFallback: false
        };

    } catch (error) {
        console.error(`Erro ao buscar dados de ${endpoint}:`, error);

        // Em caso de erro, usa o dado mais recente do fallback
        const dadosFallback = DADOS_HISTORICOS[endpoint];
        const dadoMaisRecente = dadosFallback[dadosFallback.length - 1];

        return {
            valor: dadoMaisRecente.valor,
            ano: dadoMaisRecente.ano,
            usouFallback: true
        };
    }
}

/**
 * Renderiza o conteúdo de um indicador no DOM
 */
function renderizarIndicador(indicador, dados) {
    const container = document.getElementById(indicador.id);
    if (!container) return;

    const conteudoIndicador = container.querySelector('.conteudo-indicador');

    conteudoIndicador.innerHTML = '';
    conteudoIndicador.classList.remove('carregando');
    conteudoIndicador.classList.add('completo');

    const valorFormatado = dados.valor.toFixed(1).replace('.', ',');

    // Criação dos elementos de conteúdo
    const valorElement = document.createElement('div');
    valorElement.className = 'valor-indicador';
    valorElement.textContent = `${valorFormatado}%`;

    const textoElement = document.createElement('div');
    textoElement.className = 'texto-indicador';
    textoElement.textContent = indicador.descricao;

    const contextoElement = document.createElement('div');
    contextoElement.className = 'texto-indicador-complementar';
    contextoElement.textContent = indicador.contexto;

    const fonteElement = document.createElement('div');
    fonteElement.className = 'texto-indicador-fonte';
    fonteElement.textContent = indicador.fonte;

    conteudoIndicador.appendChild(valorElement);
    conteudoIndicador.appendChild(textoElement);
    conteudoIndicador.appendChild(contextoElement);
    conteudoIndicador.appendChild(fonteElement);

    // Exibe mensagem de fallback se necessário
    if (dados.usouFallback) {
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'texto-fallback';
        fallbackElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i> 
        Dados de ${dados.ano} (fonte alternativa) - API IBGE indisponível.
        <a href="https://sidra.ibge.gov.br/" target="_blank" rel="noopener noreferrer" 
           class="link-ibge" aria-label="Consultar dados oficiais no IBGE">
           Consultar IBGE <i class="fas fa-external-link-alt"></i>
        </a>
      `;
        conteudoIndicador.insertBefore(fallbackElement, textoElement);
    }

    const espacoElement = document.createElement('div');
    espacoElement.style.height = '30px';
    conteudoIndicador.appendChild(espacoElement);

    // Botão de exportação CSV
    const botaoExportar = document.createElement('button');
    botaoExportar.className = 'botao-exportar-indicador';
    botaoExportar.innerHTML = '<i class="fas fa-download"></i> CSV';
    botaoExportar.setAttribute('aria-label', `Exportar dados de ${indicador.titulo} em CSV`);
    botaoExportar.addEventListener('click', () => {
        exportarCSVIndicador(indicador.endpoint, indicador.titulo);
    });

    conteudoIndicador.appendChild(botaoExportar);

    gerarGrafico(indicador.endpoint, CORES_ODS[indicador.endpoint]);
}

function gerarGrafico(endpoint, cores) {
    const dados = DADOS_HISTORICOS[endpoint];
    const anos = dados.map(item => item.ano);
    const valores = dados.map(item => item.valor);

    const canvas = document.getElementById(`grafico-${endpoint}`);
    if (!canvas) return;

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: cores.nomeLegenda,
                data: valores,
                backgroundColor: cores.corSecundaria,
                borderColor: cores.cor,
                borderWidth: 2,
                pointBackgroundColor: cores.cor,
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Gera gráfico comparativo entre todos os indicadores
 */
function gerarGraficoComparativo() {
    const canvas = document.getElementById('grafico-comparativo');
    if (!canvas) return;

    const datasets = [];
    const anos = DADOS_HISTORICOS.pobreza.map(item => item.ano);

    // Prepara os datasets para cada indicador
    for (const endpoint of Object.keys(DADOS_HISTORICOS)) {
        const dados = DADOS_HISTORICOS[endpoint];
        const cor = CORES_ODS[endpoint].cor;

        datasets.push({
            label: CORES_ODS[endpoint].nomeLegenda,
            data: dados.map(item => item.valor),
            backgroundColor: CORES_ODS[endpoint].corSecundaria,
            borderColor: cor,
            borderWidth: 2,
            pointBackgroundColor: cor,
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.4
        });
    }

    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Exporta os dados de um indicador para CSV
 */
function exportarCSVIndicador(endpoint, titulo) {
    const dados = DADOS_HISTORICOS[endpoint];
    const nomeArquivo = `dados-${endpoint}-sergipe.csv`;

    const cabecalho = ['Ano', 'Valor (%)'];
    const linhas = dados.map(item => [item.ano, item.valor]);

    const csv = [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");

    // Cria o download do arquivo CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Exibe mensagem de sucesso
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-sucesso';
    mensagem.textContent = `Dados de ${titulo} exportados com sucesso!`;
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.style.opacity = '0';
        setTimeout(() => document.body.removeChild(mensagem), 500);
    }, 3000);
}

/**
 * Exporta todos os dados para um único arquivo CSV
 */
function exportarTodosCSV() {
    const dadosParaExportar = [];

    INDICADORES.forEach(indicador => {
        const endpoint = indicador.endpoint;
        DADOS_HISTORICOS[endpoint].forEach(item => {
            dadosParaExportar.push({
                indicador: indicador.titulo,
                ano: item.ano,
                valor: item.valor
            });
        });
    });

    // Ordena por indicador e ano
    dadosParaExportar.sort((a, b) => {
        if (a.indicador !== b.indicador) return a.indicador.localeCompare(b.indicador);
        return a.ano - b.ano;
    });

    const cabecalho = ['Indicador', 'Ano', 'Valor (%)'];
    const linhas = dadosParaExportar.map(item => [item.indicador, item.ano, item.valor]);

    const csv = [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");

    // Download do arquivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = 'indicadores-ods-sergipe.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Exibe mensagem de sucesso
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-sucesso';
    mensagem.textContent = 'Todos os dados exportados com sucesso!';
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.style.opacity = '0';
        setTimeout(() => document.body.removeChild(mensagem), 500);
    }, 3000);
}

/**
 * Atualiza a data no rodapé para a data atual
 */
function atualizarDataAtualizacao() {
    const dataElement = document.getElementById('data-atualizacao');
    if (dataElement) {
        const dataAtual = new Date();
        const opcoes = { month: 'long', year: 'numeric' };
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR', opcoes);

        // Capitaliza a primeira letra do mês
        const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

        dataElement.textContent = dataCapitalizada;
    }
}

/**
 * Inicializa o painel ODS com dados e gráficos
 */
async function inicializarPainel() {
    atualizarDataAtualizacao();

    // Carrega dados para cada indicador
    for (const indicador of INDICADORES) {
        const dados = await buscarDadosAPI(indicador.endpoint);
        renderizarIndicador(indicador, dados);
    }

    gerarGraficoComparativo();

    // Configura evento de exportação
    const btnExportarTodos = document.getElementById('btn-exportar-todos');
    if (btnExportarTodos) {
        btnExportarTodos.addEventListener('click', exportarTodosCSV);
    }
}

// Inicia o painel quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarPainel);