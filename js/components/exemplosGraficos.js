/**
 * Exemplos de Gráficos Responsivos - LIMFS
 * Demonstração de visualização de dados com Chart.js para o Painel ODS
 * 
 * @file exemplosGraficos.js
 * @version 1.0.0
 * @author LIMFS
 * @lastUpdate 14/04/2025
 */

// Registra o plugin de rótulos de dados
Chart.register(ChartDataLabels);

// Configurações globais para melhorar a acessibilidade dos gráficos
Chart.defaults.font.family = "'Public Sans', 'Roboto', sans-serif";
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.display = true;
Chart.defaults.plugins.legend.position = 'bottom';
Chart.defaults.plugins.legend.labels.padding = 20;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.boxPadding = 8;
Chart.defaults.plugins.tooltip.cornerRadius = 6;
Chart.defaults.plugins.tooltip.titleFont = {
    weight: 600,
    size: 14
};

// Configurações para cores dos gráficos com base no tema atual
const temasCores = {
    'light': {
        backgroundColor: 'white',
        textColor: '#333',
        gridColor: '#f0f0f0',
        borderColor: '#ddd'
    },
    'dark': {
        backgroundColor: '#2a2a2a',
        textColor: '#eee',
        gridColor: '#444',
        borderColor: '#555'
    },
    'high-contrast': {
        backgroundColor: 'black',
        textColor: 'white',
        gridColor: '#666',
        borderColor: 'white'
    }
};

// Obtém o tema atual do documento ou usa 'light' como padrão
function obterTemaAtual() {
    const tema = document.documentElement.getAttribute('data-theme');
    return tema || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

// Paleta de cores baseada nas cores dos ODS
const coresODS = {
    ods1: '#E5243B', // Erradicação da Pobreza
    ods2: '#DDA63A', // Fome Zero
    ods3: '#4C9F38', // Saúde e Bem-Estar
    ods4: '#C5192D', // Educação de Qualidade
    ods5: '#FF3A21', // Igualdade de Gênero
    ods6: '#26BDE2', // Água Potável e Saneamento
    ods7: '#FCC30B', // Energia Limpa e Acessível
    ods8: '#A21942', // Trabalho Decente
    ods9: '#FD6925', // Indústria, Inovação e Infraestrutura
    ods10: '#DD1367', // Redução das Desigualdades
    ods11: '#FD9D24', // Cidades e Comunidades Sustentáveis
    ods12: '#BF8B2E', // Consumo e Produção Responsáveis
    ods13: '#3F7E44', // Ação Contra a Mudança Global do Clima
    ods14: '#0A97D9', // Vida na Água
    ods15: '#56C02B', // Vida Terrestre
    ods16: '#00689D', // Paz, Justiça e Instituições Eficazes
    ods17: '#19486A'  // Parcerias e Meios de Implementação
};

// Função para ajustar o brilho das cores para alto contraste
function ajustarCoresParaAltoContraste(coresOriginais) {
    const coresAjustadas = {};
    
    for (const [chave, cor] of Object.entries(coresOriginais)) {
        // Para alto contraste, usamos cores mais contrastantes
        coresAjustadas[chave] = cor;
    }
    
    return coresAjustadas;
}

// Função para ajustar as cores do tema escuro
function ajustarCoresParaTemaEscuro(coresOriginais) {
    const coresAjustadas = {};
    
    for (const [chave, cor] of Object.entries(coresOriginais)) {
        // Tornamos as cores um pouco mais brilhantes para o tema escuro
        coresAjustadas[chave] = cor;
    }
    
    return coresAjustadas;
}

// Função para criar gradientes
function criarGradiente(ctx, cor, altura) {
    const gradiente = ctx.createLinearGradient(0, 0, 0, altura);
    gradiente.addColorStop(0, cor);
    gradiente.addColorStop(1, ajustarTransparencia(cor, 0.7));
    return gradiente;
}

// Função para ajustar a transparência de uma cor
function ajustarTransparencia(cor, alpha) {
    const r = parseInt(cor.slice(1, 3), 16);
    const g = parseInt(cor.slice(3, 5), 16);
    const b = parseInt(cor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Função para aplicar configurações de tema aos gráficos
function aplicarTemaAosGraficos(tema) {
    const temaConfig = temasCores[tema] || temasCores.light;
    
    // Ajusta as configurações globais com base no tema
    Chart.defaults.color = temaConfig.textColor;
    Chart.defaults.borderColor = temaConfig.gridColor;
    
    // Ajusta as cores para o tema específico
    let coresUsadas;
    if (tema === 'high-contrast') {
        coresUsadas = ajustarCoresParaAltoContraste(coresODS);
    } else if (tema === 'dark') {
        coresUsadas = ajustarCoresParaTemaEscuro(coresODS);
    } else {
        coresUsadas = {...coresODS};
    }
    
    // Atualiza todos os gráficos existentes
    Chart.instances.forEach(grafico => {
        // Atualiza configurações específicas de cada tipo de gráfico
        const tipoGrafico = grafico.config.type;
        
        // Atualiza as cores de fundo do gráfico
        if (grafico.options.plugins.tooltip) {
            grafico.options.plugins.tooltip.backgroundColor = tema === 'light' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            grafico.options.plugins.tooltip.titleColor = tema === 'light' ? '#fff' : '#000';
            grafico.options.plugins.tooltip.bodyColor = tema === 'light' ? '#fff' : '#000';
        }
        
        // Atualiza escalas para gráficos lineares e de barras
        if (grafico.options.scales) {
            Object.values(grafico.options.scales).forEach(escala => {
                escala.grid.color = temaConfig.gridColor;
                escala.ticks.color = temaConfig.textColor;
            });
        }
        
        // Atualiza bordas e legendas para todos os gráficos
        if (grafico.options.plugins && grafico.options.plugins.legend) {
            grafico.options.plugins.legend.labels.color = temaConfig.textColor;
        }
        
        grafico.update();
    });
}

// Listener para evento de alteração de tema
document.addEventListener('tema-alterado', (evento) => {
    aplicarTemaAosGraficos(evento.detail.tema);
});

// Quando o DOM estiver carregado, inicializa os gráficos
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os gráficos com as configurações padrão
    inicializarGraficos();
    
    // Aplica o tema atual aos gráficos
    aplicarTemaAosGraficos(obterTemaAtual());
});

/**
 * Inicializa todos os gráficos de exemplo na página
 */
function inicializarGraficos() {
    // 1. Gráfico de linha - Evolução da taxa de pobreza
    inicializarGraficoLinha();
    
    // 2. Gráfico de barras - Acesso à água potável por região
    inicializarGraficoBarra();
    
    // 3. Gráfico de pizza - Matriz energética
    inicializarGraficoPizza();
    
    // 4. Gráfico de donut - Fontes renováveis x não renováveis
    inicializarGraficoDonut();
    
    // 5. Gráfico de radar - Índices de qualidade de vida
    inicializarGraficoRadar();
    
    // 6. Gráfico comparativo - Taxas de escolarização
    inicializarGraficoComparativo();
    
    // 7. Gráfico de barras comparativo - IDH por região
    inicializarGraficoBarrasComparativo();
}

/**
 * Inicializa o gráfico de linha de exemplo (ODS 1)
 */
function inicializarGraficoLinha() {
    const ctx = document.getElementById('grafico-linha-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico de linha
    const dados = {
        labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'Taxa de Pobreza (%)',
            data: [24.3, 23.1, 22.7, 27.5, 26.2, 25.8, 23.9, 21.6],
            borderColor: coresODS.ods1,
            backgroundColor: ajustarTransparencia(coresODS.ods1, 0.1),
            borderWidth: 2,
            pointBackgroundColor: coresODS.ods1,
            pointBorderColor: '#fff',
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.3
        }]
    };
    
    const config = {
        type: 'line',
        data: dados,
        options: {
            plugins: {
                title: {
                    display: false
                },
                tooltip: {
                    usePointStyle: true,
                    callbacks: {
                        label: (context) => `Taxa: ${context.parsed.y}%`
                    }
                },
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    formatter: (value) => value + '%',
                    font: {
                        weight: 'bold'
                    },
                    color: (context) => {
                        const tema = obterTemaAtual();
                        return tema === 'dark' ? '#eee' : '#333';
                    },
                    display: (context) => context.dataIndex === context.dataset.data.length - 1 || context.dataIndex === 0
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Ano'
                    }
                },
                y: {
                    grid: {
                        color: '#f0f0f0'
                    },
                    title: {
                        display: true,
                        text: 'Taxa de Pobreza (%)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 30
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    };
    
    new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de barras de exemplo (ODS 6)
 */
function inicializarGraficoBarra() {
    const ctx = document.getElementById('grafico-barra-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico de barras
    const dados = {
        labels: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
        datasets: [{
            label: 'Acesso à água tratada (%)',
            data: [76.4, 84.2, 92.7, 96.3, 94.9],
            backgroundColor: (context) => {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) {
                    return ajustarTransparencia(coresODS.ods6, 0.8);
                }
                return criarGradiente(ctx, coresODS.ods6, chartArea.bottom);
            },
            borderColor: coresODS.ods6,
            borderWidth: 1,
            borderRadius: 6
        }]
    };
    
    const config = {
        type: 'bar',
        data: dados,
        options: {
            indexAxis: 'x',
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (context) => `Acesso: ${context.parsed.y}%`
                    }
                },
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    formatter: (value) => value + '%',
                    font: {
                        weight: 'bold'
                    },
                    color: (context) => {
                        const tema = obterTemaAtual();
                        return tema === 'dark' ? '#eee' : '#333';
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Região'
                    }
                },
                y: {
                    grid: {
                        color: '#f0f0f0'
                    },
                    title: {
                        display: true,
                        text: 'Acesso à água tratada (%)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            animation: {
                delay: (context) => context.dataIndex * 100,
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    };
    
    new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de pizza de exemplo (ODS 7)
 */
function inicializarGraficoPizza() {
    const ctx = document.getElementById('grafico-pizza-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico de pizza
    const dados = {
        labels: ['Hidrelétrica', 'Eólica', 'Solar', 'Biomassa', 'Gás Natural', 'Petróleo', 'Carvão', 'Nuclear'],
        datasets: [{
            data: [63.8, 11.4, 6.7, 8.9, 5.1, 2.1, 1.3, 0.7],
            backgroundColor: [
                ajustarTransparencia(coresODS.ods6, 0.8),
                ajustarTransparencia(coresODS.ods15, 0.8),
                ajustarTransparencia(coresODS.ods7, 0.8),
                ajustarTransparencia(coresODS.ods12, 0.8),
                ajustarTransparencia(coresODS.ods9, 0.8),
                ajustarTransparencia(coresODS.ods8, 0.8),
                ajustarTransparencia(coresODS.ods13, 0.8),
                ajustarTransparencia(coresODS.ods16, 0.8)
            ],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'pie',
        data: dados,
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.parsed}%`
                    }
                },
                datalabels: {
                    formatter: (value) => {
                        if (value < 3) return '';
                        return value + '%';
                    },
                    font: {
                        weight: 'bold'
                    },
                    color: '#fff'
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeOutCirc'
            },
            layout: {
                padding: 10
            }
        }
    };
    
    new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de donut de exemplo (ODS 7)
 */
function inicializarGraficoDonut() {
    const ctx = document.getElementById('grafico-donut-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico de donut
    const dados = {
        labels: ['Fontes Renováveis', 'Fontes Não Renováveis'],
        datasets: [{
            data: [90.8, 9.2],
            backgroundColor: [
                ajustarTransparencia(coresODS.ods7, 0.8),
                ajustarTransparencia(coresODS.ods13, 0.8)
            ],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: dados,
        options: {
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.parsed}%`
                    }
                },
                datalabels: {
                    formatter: (value) => value + '%',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#fff'
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    };
    
    new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de radar de exemplo (ODS 3)
 */
function inicializarGraficoRadar() {
    const ctx = document.getElementById('grafico-radar-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico de radar
    const dados = {
        labels: [
            'Saúde',
            'Educação',
            'Segurança',
            'Mobilidade',
            'Meio Ambiente',
            'Cultura',
            'Trabalho'
        ],
        datasets: [{
            label: '2015',
            data: [65, 72, 68, 58, 63, 60, 70],
            backgroundColor: ajustarTransparencia(coresODS.ods3, 0.2),
            borderColor: coresODS.ods3,
            pointBackgroundColor: coresODS.ods3,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: coresODS.ods3,
            borderWidth: 2
        }, {
            label: '2024',
            data: [78, 85, 73, 69, 75, 66, 82],
            backgroundColor: ajustarTransparencia(coresODS.ods4, 0.2),
            borderColor: coresODS.ods4,
            pointBackgroundColor: coresODS.ods4,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: coresODS.ods4,
            borderWidth: 2
        }]
    };
    
    const config = {
        type: 'radar',
        data: dados,
        options: {
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(200, 200, 200, 0.3)'
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)'
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        }
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                datalabels: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.r} pontos`
                    }
                }
            },
            animation: {
                duration: 1500
            },
            elements: {
                line: {
                    tension: 0.1
                }
            }
        }
    };
    
    new Chart(ctx, config);
}

/**
 * Inicializa o gráfico comparativo de exemplo (ODS 4)
 */
function inicializarGraficoComparativo() {
    const ctx = document.getElementById('grafico-comparativo-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico comparativo de linha
    const dados = {
        labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'Ensino Fundamental',
            data: [97.2, 97.5, 97.8, 98.0, 98.1, 98.0, 98.5, 98.7, 98.9, 99.1],
            borderColor: coresODS.ods4,
            backgroundColor: ajustarTransparencia(coresODS.ods4, 0.1),
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.2,
            fill: true
        }, {
            label: 'Ensino Médio',
            data: [81.3, 82.6, 83.4, 84.7, 85.1, 84.8, 86.5, 87.2, 88.5, 89.3],
            borderColor: coresODS.ods5,
            backgroundColor: ajustarTransparencia(coresODS.ods5, 0.1),
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.2,
            fill: true
        }, {
            label: 'Ensino Superior',
            data: [33.2, 34.5, 35.7, 37.2, 38.6, 39.1, 40.5, 42.1, 44.3, 45.8],
            borderColor: coresODS.ods17,
            backgroundColor: ajustarTransparencia(coresODS.ods17, 0.1),
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.2,
            fill: true
        }]
    };
    
    const config = {
        type: 'line',
        data: dados,
        options: {
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
                    }
                },
                datalabels: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Ano'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Taxa de Escolarização (%)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            animation: {
                duration: 2000
            }
        }
    };
    
    new Chart(ctx, config);
}

/**
 * Inicializa o gráfico de barras comparativo de exemplo (ODS 10)
 */
function inicializarGraficoBarrasComparativo() {
    const ctx = document.getElementById('grafico-barras-comparativo-exemplo').getContext('2d');
    
    // Dados e configurações para o gráfico de barras comparativo
    const dados = {
        labels: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'],
        datasets: [{
            label: '2010',
            data: [0.667, 0.663, 0.757, 0.778, 0.754],
            backgroundColor: ajustarTransparencia(coresODS.ods10, 0.7),
            borderColor: coresODS.ods10,
            borderWidth: 1,
            borderRadius: 4
        }, {
            label: '2024',
            data: [0.712, 0.721, 0.801, 0.826, 0.805],
            backgroundColor: ajustarTransparencia(coresODS.ods8, 0.7),
            borderColor: coresODS.ods8,
            borderWidth: 1,
            borderRadius: 4
        }]
    };
    
    const config = {
        type: 'bar',
        data: dados,
        options: {
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`
                    }
                },
                datalabels: {
                    display: true,
                    formatter: (value) => value.toFixed(2),
                    anchor: 'end',
                    align: 'top',
                    offset: 0,
                    color: (context) => {
                        const tema = obterTemaAtual();
                        return tema === 'dark' ? '#eee' : '#333';
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Região'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'IDH'
                    },
                    suggestedMin: 0.6,
                    suggestedMax: 0.9
                }
            },
            animation: {
                delay: (context) => context.dataIndex * 100 + context.datasetIndex * 100,
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    };
    
    new Chart(ctx, config);
}