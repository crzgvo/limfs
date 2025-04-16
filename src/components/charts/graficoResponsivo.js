/**
 * Módulo graficoResponsivo.js
 * 
 * Implementa gráficos responsivos para o Painel ODS usando Chart.js
 * com suporte a acessibilidade, tema claro/escuro e exportação.
 * 
 * @version 1.0.0
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 */

import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { 
    ODSColors, 
    ODSAlphaColors, 
    defaultChartOptions, 
    applyTheme, 
    generateColorPalette 
} from './chart-config.js';

// Registrar o plugin de data labels 
Chart.register(ChartDataLabels);

// Contadores para IDs únicos quando necessário
let chartCounter = 0;

/**
 * Obtém a cor associada a um ODS específico
 * 
 * @param {number|string} odsNumber - Número do ODS (1-18)
 * @param {boolean} alpha - Se true, retorna a cor com transparência
 * @returns {string} Código de cor CSS
 */
export function getOdsColor(odsNumber, alpha = false) {
    // Normaliza o parâmetro para um número
    if (typeof odsNumber === 'string') {
        if (odsNumber.startsWith('ods')) {
            odsNumber = parseInt(odsNumber.replace('ods', ''));
        } else {
            odsNumber = parseInt(odsNumber);
        }
    }
    
    // Garante que está no intervalo válido
    if (isNaN(odsNumber) || odsNumber < 1 || odsNumber > 18) {
        console.warn(`Número ODS inválido: ${odsNumber}, usando ODS 1 como padrão`);
        odsNumber = 1;
    }
    
    // Retorna a cor
    const colorObj = alpha ? ODSAlphaColors : ODSColors;
    return colorObj[`ods${odsNumber}`];
}

/**
 * Cria um gráfico de linha responsivo
 * 
 * @param {string|HTMLCanvasElement} canvasId - ID do elemento canvas ou o elemento
 * @param {Object} data - Dados para o gráfico
 * @param {Object} options - Opções para personalização
 * @returns {Chart} Instância do gráfico criado
 */
export function criarGraficoLinha(canvasId, data, options = {}) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) {
        console.error(`Canvas não encontrado: ${canvasId}`);
        return null;
    }
    
    // Configurações padrão para gráfico de linha
    const lineOptions = {
        ...defaultChartOptions,
        scales: {
            y: {
                beginAtZero: options.beginAtZero !== undefined ? options.beginAtZero : true,
                ticks: {
                    callback: function(value) {
                        return value + (options.unidade ? ` ${options.unidade}` : '');
                    }
                }
            }
        },
        plugins: {
            ...defaultChartOptions.plugins,
            title: options.tituloGrafico ? {
                display: true,
                text: options.tituloGrafico,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 10
                }
            } : undefined,
            datalabels: {
                align: 'end',
                anchor: 'end',
                backgroundColor: function(context) {
                    return context.dataset.backgroundColor;
                },
                borderRadius: 4,
                color: 'white',
                font: {
                    weight: 'bold'
                },
                formatter: function(value) {
                    return value + (options.unidade ? ` ${options.unidade}` : '');
                },
                padding: 6
            },
            ...options.plugins
        }
    };
    
    // Merge das configurações
    const mergedConfig = {
        type: 'line',
        data: data,
        options: lineOptions
    };
    
    // Criar o gráfico
    const chart = new Chart(canvas, mergedConfig);
    
    // Aplica o tema atual
    const temaAtivo = document.documentElement.getAttribute('data-theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(chart, temaAtivo);
    
    // Escuta por mudanças no tema
    const updateThemeOnChange = () => {
        const novoTema = document.documentElement.getAttribute('data-theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(chart, novoTema);
    };
    
    // Adiciona listener para o mediaQuery de preferência de cor
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeOnChange);
    
    // Observer para detectar mudanças no atributo data-theme do HTML
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateThemeOnChange();
            }
        });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Armazena os observers no gráfico para limpeza posterior
    chart._themeObserver = observer;
    chart._mediaQueryListener = updateThemeOnChange;
    
    return chart;
}

/**
 * Cria um gráfico de barras responsivo
 * 
 * @param {string|HTMLCanvasElement} canvasId - ID do elemento canvas ou o elemento
 * @param {Object} data - Dados para o gráfico
 * @param {Object} options - Opções para personalização
 * @returns {Chart} Instância do gráfico criado
 */
export function criarGraficoBarra(canvasId, data, options = {}) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) {
        console.error(`Canvas não encontrado: ${canvasId}`);
        return null;
    }
    
    // Configurações padrão para gráfico de barras
    const barOptions = {
        ...defaultChartOptions,
        scales: {
            y: {
                beginAtZero: options.beginAtZero !== undefined ? options.beginAtZero : true,
                ticks: {
                    callback: function(value) {
                        return value + (options.unidade ? ` ${options.unidade}` : '');
                    }
                }
            }
        },
        plugins: {
            ...defaultChartOptions.plugins,
            title: options.tituloGrafico ? {
                display: true,
                text: options.tituloGrafico,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 10
                }
            } : undefined,
            datalabels: {
                align: 'center',
                anchor: 'center',
                color: function(context) {
                    const value = context.dataset.data[context.dataIndex];
                    // Define cor do texto com base na luminosidade do background
                    return value > 50 ? 'white' : 'black';
                },
                font: {
                    weight: 'bold'
                },
                formatter: function(value) {
                    return value + (options.unidade ? ` ${options.unidade}` : '');
                },
                padding: 6
            },
            ...options.plugins
        }
    };
    
    // Merge das configurações
    const mergedConfig = {
        type: 'bar',
        data: data,
        options: barOptions
    };
    
    // Criar o gráfico
    const chart = new Chart(canvas, mergedConfig);
    
    // Aplica o tema atual
    const temaAtivo = document.documentElement.getAttribute('data-theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(chart, temaAtivo);
    
    // Escuta por mudanças no tema (mesmo código do gráfico de linha)
    const updateThemeOnChange = () => {
        const novoTema = document.documentElement.getAttribute('data-theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(chart, novoTema);
    };
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeOnChange);
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateThemeOnChange();
            }
        });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    chart._themeObserver = observer;
    chart._mediaQueryListener = updateThemeOnChange;
    
    return chart;
}

/**
 * Cria um gráfico comparativo de múltiplos indicadores
 * 
 * @param {string|HTMLCanvasElement} canvasId - ID do elemento canvas ou o elemento
 * @param {Object} data - Dados para o gráfico
 * @param {Object} options - Opções para personalização
 * @returns {Chart} Instância do gráfico criado
 */
export function criarGraficoComparativo(canvasId, data, options = {}) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) {
        console.error(`Canvas não encontrado: ${canvasId}`);
        return null;
    }
    
    // Tipo de gráfico (padrão: radar)
    const chartType = options.tipo || 'radar';
    
    // Configurações específicas para cada tipo
    let chartOptions;
    
    switch(chartType) {
        case 'radar':
            chartOptions = {
                ...defaultChartOptions,
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: options.maxValue || 100,
                        ticks: {
                            callback: function(value) {
                                return value + (options.unidade ? ` ${options.unidade}` : '');
                            }
                        }
                    }
                }
            };
            break;
            
        case 'polarArea':
            chartOptions = {
                ...defaultChartOptions,
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            };
            break;
            
        case 'bar':
            chartOptions = {
                ...defaultChartOptions,
                indexAxis: options.horizontal ? 'y' : 'x',
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: options.stacked || false,
                        ticks: {
                            callback: function(value) {
                                return value + (options.unidade ? ` ${options.unidade}` : '');
                            }
                        }
                    },
                    x: {
                        stacked: options.stacked || false
                    }
                }
            };
            break;
            
        default:
            chartOptions = {...defaultChartOptions};
    }
    
    // Adiciona título se fornecido
    if (options.tituloGrafico) {
        chartOptions.plugins = chartOptions.plugins || {};
        chartOptions.plugins.title = {
            display: true,
            text: options.tituloGrafico,
            font: {
                size: 16,
                weight: 'bold'
            },
            padding: {
                top: 10,
                bottom: 10
            }
        };
    }
    
    // Configurações para labels de dados
    if (chartType === 'radar' || chartType === 'polarArea') {
        chartOptions.plugins = chartOptions.plugins || {};
        chartOptions.plugins.datalabels = {
            display: function(context) {
                return context.datasetIndex === 0; // exibe apenas para o primeiro dataset em radar
            },
            formatter: function(value, context) {
                return value + (options.unidade ? ` ${options.unidade}` : '');
            },
            color: '#fff',
            backgroundColor: function(context) {
                return context.dataset.backgroundColor;
            },
            borderRadius: 3,
            font: {
                weight: 'bold',
                size: 10
            }
        };
    }
    
    // Merge com plugins personalizados
    if (options.plugins) {
        chartOptions.plugins = {
            ...chartOptions.plugins,
            ...options.plugins
        };
    }
    
    // Configuração final
    const mergedConfig = {
        type: chartType,
        data: data,
        options: chartOptions
    };
    
    // Criar o gráfico
    const chart = new Chart(canvas, mergedConfig);
    
    // Aplica o tema atual
    const temaAtivo = document.documentElement.getAttribute('data-theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(chart, temaAtivo);
    
    // Escuta por mudanças no tema (mesmo código dos outros gráficos)
    const updateThemeOnChange = () => {
        const novoTema = document.documentElement.getAttribute('data-theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(chart, novoTema);
    };
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeOnChange);
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                updateThemeOnChange();
            }
        });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    chart._themeObserver = observer;
    chart._mediaQueryListener = updateThemeOnChange;
    
    return chart;
}

/**
 * Adiciona descrição acessível a um gráfico
 * 
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} descricao - Texto descrevendo o gráfico para leitores de tela
 */
export function adicionarDescricaoAcessivel(canvasId, descricao) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas não encontrado: ${canvasId}`);
        return;
    }
    
    // Usa um ID único baseado no canvas ID
    const descId = `desc-${canvasId}`;
    
    // Verifica se já existe uma descrição
    let descricaoEl = document.getElementById(descId);
    
    if (!descricaoEl) {
        // Cria um elemento visualmente oculto para leitores de tela
        descricaoEl = document.createElement('div');
        descricaoEl.setAttribute('id', descId);
        descricaoEl.classList.add('sr-only'); // Classe para screen readers
        canvas.parentNode.insertBefore(descricaoEl, canvas);
        
        // Adiciona os atributos ARIA
        canvas.setAttribute('aria-describedby', descId);
        canvas.setAttribute('role', 'img');
    }
    
    // Define o texto da descrição
    descricaoEl.textContent = descricao;
}

/**
 * Exporta um gráfico como imagem PNG
 * 
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} nomeArquivo - Nome base para o arquivo de download
 */
export function exportarGraficoComoPNG(canvasId, nomeArquivo = 'grafico') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas não encontrado: ${canvasId}`);
        return;
    }
    
    // Certifica-se de que o nome do arquivo não tem espaços e caracteres especiais
    const nomeSanitizado = nomeArquivo.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Adiciona timestamp ao nome
    const data = new Date();
    const timestamp = `${data.getFullYear()}-${(data.getMonth()+1).toString().padStart(2, '0')}-${data.getDate().toString().padStart(2, '0')}_${data.getHours().toString().padStart(2, '0')}${data.getMinutes().toString().padStart(2, '0')}`;
    const nomeCompleto = `${nomeSanitizado}_${timestamp}.png`;
    
    // Cria uma URL temporária para download
    const url = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeCompleto;
    
    // Adiciona ao DOM temporariamente para acionar o download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Adiciona botão de exportação junto ao gráfico
 * 
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} prefixoArquivo - Prefixo para o nome do arquivo
 * @returns {HTMLButtonElement} O botão criado
 */
export function adicionarBotaoExportacao(canvasId, prefixoArquivo) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas não encontrado: ${canvasId}`);
        return null;
    }
    
    // Verifica se já existe um botão de exportação
    const parentDiv = canvas.parentElement;
    let existingButton = parentDiv.querySelector('.btn-exportar-grafico');
    
    if (existingButton) {
        return existingButton; // Retorna o botão existente
    }
    
    // Cria contêiner de botões para o gráfico (usado para exportar e outras ações)
    let actionBar = parentDiv.querySelector('.chart-action-bar');
    
    if (!actionBar) {
        actionBar = document.createElement('div');
        actionBar.className = 'chart-action-bar';
        actionBar.style.display = 'flex';
        actionBar.style.justifyContent = 'flex-end';
        actionBar.style.margin = '8px 0';
        
        // Insere após o canvas
        if (canvas.nextSibling) {
            parentDiv.insertBefore(actionBar, canvas.nextSibling);
        } else {
            parentDiv.appendChild(actionBar);
        }
    }
    
    // Cria botão de exportação
    const btn = document.createElement('button');
    btn.className = 'btn-exportar-grafico';
    btn.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i> Exportar PNG';
    btn.title = 'Exportar gráfico como imagem PNG';
    btn.setAttribute('aria-label', 'Exportar gráfico como imagem PNG');
    
    // Estiliza o botão
    btn.style.backgroundColor = '#f5f5f5';
    btn.style.border = '1px solid #ddd';
    btn.style.borderRadius = '4px';
    btn.style.padding = '6px 12px';
    btn.style.margin = '0 4px';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '6px';
    
    // Adapta estilos para modo escuro
    if (document.documentElement.getAttribute('data-theme') === 'dark' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
        btn.style.backgroundColor = '#333';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #555';
    }
    
    // Configura ação de clique
    btn.addEventListener('click', () => {
        exportarGraficoComoPNG(canvasId, prefixoArquivo || 'grafico');
    });
    
    // Adiciona o botão à barra de ações
    actionBar.appendChild(btn);
    
    return btn;
}

/**
 * Destrói um gráfico e limpa os event listeners
 * 
 * @param {Chart} chart - Instância do gráfico a ser destruída
 */
export function destruirGrafico(chart) {
    if (!chart) return;
    
    // Remove observers de tema
    if (chart._themeObserver) {
        chart._themeObserver.disconnect();
    }
    
    // Remove event listeners
    if (chart._mediaQueryListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', chart._mediaQueryListener);
    }
    
    // Destrói o gráfico
    chart.destroy();
}

/**
 * Atualiza os dados de um gráfico existente
 * 
 * @param {Chart} chart - Instância do gráfico a ser atualizada
 * @param {Object} newData - Novos dados para o gráfico
 */
export function atualizarDadosGrafico(chart, newData) {
    if (!chart || !newData) return;
    
    // Atualiza labels se fornecidos
    if (newData.labels) {
        chart.data.labels = newData.labels;
    }
    
    // Atualiza datasets
    if (newData.datasets) {
        chart.data.datasets = newData.datasets;
    }
    
    // Atualiza o gráfico
    chart.update();
}

export default {
    criarGraficoLinha,
    criarGraficoBarra,
    criarGraficoComparativo,
    adicionarDescricaoAcessivel,
    exportarGraficoComoPNG,
    adicionarBotaoExportacao,
    getOdsColor,
    atualizarDadosGrafico,
    destruirGrafico
};