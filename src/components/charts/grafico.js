/**
 * Componente para criação e atualização de gráficos do painel.
 * @module grafico
 */

const CORES_ODS = {
    pobreza: '#E5243B',
    educacao: '#C5192D',
    saneamento: '#26BDE2',
    mortalidade_infantil: '#4C9F38',
    energia_solar: '#FCC30B',
    residuos_reciclados: '#FD9D24'
};

/**
 * Cria um novo gráfico de indicador.
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} dados - Dados do indicador
 * @param {string} tipo - Tipo do indicador
 */
export function criarGrafico(canvasId, dados, tipo) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dados),
            datasets: [{
                label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                data: Object.values(dados),
                borderColor: CORES_ODS[tipo],
                backgroundColor: CORES_ODS[tipo] + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `Valor: ${context.parsed.y}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Atualiza os dados de um gráfico existente.
 * @param {Chart} grafico - Instância do gráfico
 * @param {Object} dados - Novos dados
 */
export function atualizarGrafico(grafico, dados) {
    if (!grafico) return;
    
    grafico.data.labels = Object.keys(dados);
    grafico.data.datasets[0].data = Object.values(dados);
    grafico.update();
}

/**
 * Cria gráfico comparativo entre indicadores.
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} dados - Dados dos indicadores
 */
export function criarGraficoComparativo(canvasId, dados) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;
    
    const datasets = Object.entries(dados).map(([tipo, valores]) => ({
        label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        data: Object.values(valores),
        borderColor: CORES_ODS[tipo],
        backgroundColor: CORES_ODS[tipo] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4
    }));

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(Object.values(dados)[0]),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}