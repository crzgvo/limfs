/**
 * Painel ODS Sergipe - Sistema de visualização dos indicadores para monitoramento
 * dos Objetivos de Desenvolvimento Sustentável (Agenda 2030) em Sergipe.
 */

const API_CONFIG = {
    ibge_sidra_base: 'https://apisidra.ibge.gov.br/values',
    endpoints: {
        pobreza: '/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201',
        educacao: '/t/7218/n6/28/v/1641/p/last',
        saneamento: '/t/1393/n6/28/v/1000096/p/last',
        mortalidade_infantil: '/t/793/n6/28/v/104/p/last',
        energia_solar: 'https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=b1bd71e7-d0ad-4214-9053-cbd58e9564a7',
        residuos_reciclados: '/t/1400/n6/28/v/1000100/p/last'
    },
    arquivos_json: {
        base_url: '../dados/indicadores/', // Caminho atualizado para os arquivos JSON
        cache_expiration: 86400000, // 24 horas em milissegundos
    },
    timeout: 5000 // 5 segundos para timeout da API
};

// Dados históricos de fallback (usados quando a API está indisponível)
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
    ],
    mortalidade_infantil: [
        { ano: 2017, valor: 15.2 },
        { ano: 2018, valor: 14.8 },
        { ano: 2019, valor: 14.1 },
        { ano: 2020, valor: 13.7 },
        { ano: 2021, valor: 13.2 },
        { ano: 2022, valor: 12.8 }
    ],
    energia_solar: [
        { ano: 2018, valor: 1.2 },
        { ano: 2019, valor: 2.8 },
        { ano: 2020, valor: 4.5 },
        { ano: 2021, valor: 5.9 },
        { ano: 2022, valor: 7.5 },
        { ano: 2023, valor: 9.2 },
        { ano: 2024, valor: 11.3 }
    ],
    residuos_reciclados: [
        { ano: 2017, valor: 2.1 },
        { ano: 2018, valor: 2.5 },
        { ano: 2019, valor: 3.2 },
        { ano: 2020, valor: 3.8 },
        { ano: 2021, valor: 4.3 },
        { ano: 2022, valor: 5.0 },
        { ano: 2023, valor: 5.7 },
        { ano: 2024, valor: 6.2 }
    ]
};

// Cores oficiais dos ODS conforme padrão visual da ONU
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
    },
    mortalidade_infantil: {
        cor: '#4C9F38',
        corSecundaria: 'rgba(76, 159, 56, 0.2)',
        nomeLegenda: 'Mortalidade Infantil'
    },
    energia_solar: {
        cor: '#FCC30B',
        corSecundaria: 'rgba(252, 195, 11, 0.2)',
        nomeLegenda: 'Energia Solar'
    },
    residuos_reciclados: {
        cor: '#FD9D24',
        corSecundaria: 'rgba(253, 157, 36, 0.2)',
        nomeLegenda: 'Resíduos Reciclados'
    }
};

// Descrições detalhadas para os tooltips
const TOOLTIPS = {
    pobreza: "Percentual da população vivendo com menos de R$ 182 por mês (linha de extrema pobreza definida pelo Banco Mundial).",
    educacao: "Percentual da população com 15 anos ou mais de idade que sabe ler e escrever.",
    saneamento: "Percentual de domicílios que possuem acesso à rede geral de esgotamento sanitário.",
    mortalidade_infantil: "Número de óbitos de crianças menores de 1 ano de idade por mil nascidos vivos.",
    energia_solar: "Percentual de domicílios que possuem sistemas de energia solar fotovoltaica instalada.",
    residuos_reciclados: "Percentual do total de resíduos sólidos urbanos que são coletados seletivamente e reciclados."
};

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
        contexto: 'Sergipe apresenta um aumento significativo de 54,2% na cobertura de saneamento em 2022.',
        fonte: 'Fonte: IBGE - Censo Demográfico 2022'
    },
    {
        id: 'indicador-mortalidade-infantil',
        endpoint: 'mortalidade_infantil',
        titulo: 'Taxa de Mortalidade Infantil',
        descricao: 'óbitos por mil nascidos vivos em Sergipe.',
        tendencia: 'decrescente',
        contexto: 'Redução gradual da mortalidade infantil para 12,8 em 2022, refletindo melhorias na saúde pública e atenção básica.',
        fonte: 'Fonte: DATASUS/IBGE'
    },
    {
        id: 'indicador-energia-solar',
        endpoint: 'energia_solar',
        titulo: 'Energia Solar Fotovoltaica',
        descricao: 'dos domicílios de Sergipe possuem energia solar fotovoltaica instalada.',
        tendencia: 'crescente',
        contexto: 'Crescimento acelerado para 11,3% em 2024, com 14.200 instalações e capacidade de 355.000 kW no estado.',
        fonte: 'Fonte: ANEEL - Dados Abertos'
    },
    {
        id: 'indicador-residuos-reciclados',
        endpoint: 'residuos_reciclados',
        titulo: 'Resíduos Sólidos Reciclados',
        descricao: 'dos resíduos sólidos urbanos são reciclados ou coletados seletivamente em Sergipe.',
        tendencia: 'crescente',
        contexto: 'Aumento para 6,2% em 2024, mostrando progressos graduais na gestão de resíduos no estado.',
        fonte: 'Fonte: IBGE / SNIS'
    }
];

/**
 * Verifica se existem dados atualizados em JSON e os carrega
 * @param {string} endpoint - Nome do endpoint/indicador
 * @returns {Promise<Object|null>} - Dados atualizados ou null se indisponível
 */
async function carregarDadosAtualizados(endpoint) {
    try {
        const url = `${API_CONFIG.arquivos_json.base_url}${endpoint}.json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`Arquivo de dados para ${endpoint} não encontrado, usando API ou fallback.`);
            return null;
        }
        
        const dadosAtualizados = await response.json();
        
        // Verificar data de atualização para garantir que não são dados muito antigos
        const ultimaAtualizacao = new Date(dadosAtualizados.ultimaAtualizacao);
        const agora = new Date();
        const diferencaDias = Math.floor((agora - ultimaAtualizacao) / (1000 * 60 * 60 * 24));
        
        // Se os dados têm mais de 30 dias, tenta atualizar via API
        if (diferencaDias > 30) {
            console.log(`Dados de ${endpoint} têm mais de 30 dias, tentando atualizar via API.`);
            return null;
        }
        
        console.log(`Usando dados atualizados de ${endpoint} (${dadosAtualizados.ultimaAtualizacao})`);
        return {
            valor: dadosAtualizados.dados.valor,
            ano: dadosAtualizados.dados.ano,
            usouFallback: false,
            dadosCompletos: dadosAtualizados.dados
        };
    } catch (erro) {
        console.warn(`Erro ao carregar dados atualizados de ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Busca dados na API do IBGE e implementa mecanismo de fallback
 * em caso de falha na requisição ou timeout
 */
async function buscarDadosAPI(endpoint) {
    // Primeiro tenta carregar dados atualizados do arquivo JSON
    const dadosAtualizados = await carregarDadosAtualizados(endpoint);
    if (dadosAtualizados) {
        return dadosAtualizados;
    }
    
    try {
        const url = `${API_CONFIG.ibge_sidra_base}${API_CONFIG.endpoints[endpoint]}`;

        // Implementa timeout para a requisição
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        let valor = null;

        // Cada endpoint da API IBGE tem formato específico
        if (data && data.length > 0) {
            if (endpoint === 'pobreza') {
                valor = parseFloat(data[1].V || data[1].valor || '0');
            } else if (endpoint === 'educacao') {
                valor = parseFloat(data[1]?.V || data[1]?.valor || '0');
            } else if (endpoint === 'saneamento') {
                valor = parseFloat(data[1]?.V || data[1]?.valor || '0');
            }
        }

        if (valor === null || isNaN(valor)) {
            return usarDadosFallback(endpoint);
        }

        return {
            valor: valor,
            ano: new Date().getFullYear(),
            usouFallback: false
        };

    } catch (error) {
        console.error(`Erro ao buscar dados de ${endpoint}:`, error);
        return usarDadosFallback(endpoint);
    }
}

// Função auxiliar para retornar dados de fallback quando API falha
function usarDadosFallback(endpoint) {
    const dadosFallback = DADOS_HISTORICOS[endpoint];
    const dadoMaisRecente = dadosFallback[dadosFallback.length - 1];
    return {
        valor: dadoMaisRecente.valor,
        ano: dadoMaisRecente.ano,
        usouFallback: true
    };
}

/**
 * Renderiza o conteúdo de um indicador no DOM e inicializa tooltips
 */
function renderizarIndicador(indicador, dados) {
    const container = document.getElementById(indicador.id);
    if (!container) return;

    const conteudoIndicador = container.querySelector('.conteudo-indicador');

    conteudoIndicador.innerHTML = '';
    conteudoIndicador.classList.remove('carregando');
    conteudoIndicador.classList.add('completo');

    const valorFormatado = dados.valor.toFixed(1).replace('.', ',');

    // Cria o elemento principal com o valor do indicador
    const valorElement = document.createElement('div');
    valorElement.className = 'valor-indicador';
    valorElement.textContent = `${valorFormatado}%`;
    valorElement.setAttribute('data-tooltip', TOOLTIPS[indicador.endpoint]);
    valorElement.setAttribute('tabindex', '0');
    valorElement.setAttribute('role', 'button');
    valorElement.setAttribute('aria-label', `${valorFormatado}% - ${TOOLTIPS[indicador.endpoint]}`);

    // Cria elementos complementares de texto
    const textoElement = document.createElement('div');
    textoElement.className = 'texto-indicador';
    textoElement.textContent = indicador.descricao;

    const contextoElement = document.createElement('div');
    contextoElement.className = 'texto-indicador-complementar';
    contextoElement.textContent = indicador.contexto;

    const fonteElement = document.createElement('div');
    fonteElement.className = 'texto-indicador-fonte';
    fonteElement.textContent = indicador.fonte;

    // Adiciona os elementos ao DOM
    conteudoIndicador.appendChild(valorElement);
    conteudoIndicador.appendChild(textoElement);
    conteudoIndicador.appendChild(contextoElement);
    conteudoIndicador.appendChild(fonteElement);

    // Exibe aviso quando usando dados de fallback
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

    // Adiciona botão para exportação CSV
    const botaoExportar = document.createElement('button');
    botaoExportar.className = 'botao-exportar-indicador';
    botaoExportar.innerHTML = '<i class="fas fa-download"></i> CSV';
    botaoExportar.setAttribute('aria-label', `Exportar dados de ${indicador.titulo} em CSV`);
    botaoExportar.addEventListener('click', () => {
        exportarCSVIndicador(indicador.endpoint, indicador.titulo);
    });

    conteudoIndicador.appendChild(botaoExportar);

    // Gera gráfico e inicializa tooltip
    gerarGrafico(indicador.endpoint, CORES_ODS[indicador.endpoint]);
    
    tippy(valorElement, {
        content: TOOLTIPS[indicador.endpoint],
        animation: 'scale',
        theme: 'light-border',
        placement: 'top',
        arrow: true,
        appendTo: () => document.body,
        allowHTML: false,
        a11y: true,
        touch: 'hold',
        maxWidth: 300
    });
}

/**
 * Gera gráfico de linha para um indicador usando Chart.js
 */
function gerarGrafico(endpoint, cores) {
    const dados = DADOS_HISTORICOS[endpoint];
    const anos = dados.map(item => item.ano);
    const valores = dados.map(item => item.valor);

    const canvas = document.getElementById(`grafico-${endpoint}`);
    if (!canvas) return;

    // Destrói gráfico anterior se existir
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
 * Gera gráfico comparativo com todos os indicadores
 */
function gerarGraficoComparativo() {
    const canvas = document.getElementById('grafico-comparativo');
    if (!canvas) return;

    const datasets = [];
    const anos = DADOS_HISTORICOS.pobreza.map(item => item.ano);

    // Prepara datasets para cada indicador com sua cor correspondente
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
 * Exporta os dados de um indicador específico para CSV
 */
function exportarCSVIndicador(endpoint, titulo) {
    const dados = DADOS_HISTORICOS[endpoint];
    const nomeArquivo = `dados-${endpoint}-sergipe.csv`;

    const cabecalho = ['Ano', 'Valor (%)'];
    const linhas = dados.map(item => [item.ano, item.valor]);

    const csv = [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");

    downloadCSV(csv, nomeArquivo);
    mostrarMensagemSucesso(`Dados de ${titulo} exportados com sucesso!`);
}

/**
 * Exporta todos os dados combinados para um único arquivo CSV
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

    // Ordena os dados por indicador e ano
    dadosParaExportar.sort((a, b) => {
        if (a.indicador !== b.indicador) return a.indicador.localeCompare(b.indicador);
        return a.ano - b.ano;
    });

    const cabecalho = ['Indicador', 'Ano', 'Valor (%)'];
    const linhas = dadosParaExportar.map(item => [item.indicador, item.ano, item.valor]);

    const csv = [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");

    downloadCSV(csv, 'indicadores-ods-sergipe.csv');
    mostrarMensagemSucesso('Todos os dados exportados com sucesso!');
}

// Função auxiliar para download de arquivo CSV
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

// Exibe mensagem temporária de sucesso
function mostrarMensagemSucesso(texto) {
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-sucesso';
    mensagem.textContent = texto;
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.style.opacity = '0';
        setTimeout(() => document.body.removeChild(mensagem), 500);
    }, 3000);
}

/**
 * Atualiza a data de atualização no rodapé
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
 * Inicializa o painel ODS completo
 */
async function inicializarPainel() {
    atualizarDataAtualizacao();

    // Carrega e renderiza todos os indicadores
    for (const indicador of INDICADORES) {
        const dados = await buscarDadosAPI(indicador.endpoint);
        renderizarIndicador(indicador, dados);
    }

    gerarGraficoComparativo();

    // Configura evento para botão de exportação
    const btnExportarTodos = document.getElementById('btn-exportar-todos');
    if (btnExportarTodos) {
        btnExportarTodos.addEventListener('click', exportarTodosCSV);
    }
}

// Inicializa o painel quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarPainel);