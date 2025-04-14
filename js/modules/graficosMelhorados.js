/**
 * Módulo de visualização de dados aprimorada para dashboards ODS
 * Fornece funções para renderizar gráficos com aparência consistente e melhor experiência visual
 * 
 * @module graficosMelhorados
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

// Cores específicas para cada ODS
const coresODS = {
    1: '#e5243b', // Erradicação da Pobreza
    2: '#DDA63A', // Fome Zero
    3: '#4C9F38', // Saúde e Bem-estar
    4: '#C5192D', // Educação de Qualidade
    5: '#FF3A21', // Igualdade de Gênero
    6: '#26BDE2', // Água Potável e Saneamento
    7: '#FCC30B', // Energia Limpa e Acessível
    8: '#A21942', // Trabalho Decente
    9: '#FD6925', // Indústria, Inovação e Infraestrutura
    10: '#DD1367', // Redução das Desigualdades
    11: '#FD9D24', // Cidades e Comunidades Sustentáveis
    12: '#BF8B2E', // Consumo e Produção Responsáveis
    13: '#3F7E44', // Ação Contra a Mudança Global do Clima
    14: '#0A97D9', // Vida na Água
    15: '#56C02B', // Vida Terrestre
    16: '#00689D', // Paz, Justiça e Instituições Eficazes
    17: '#19486A', // Parcerias e Meios de Implementação
    18: '#6F1D78'  // Igualdade Racial (Brasil)
};

// Paleta de cores complementares para gráficos multi-séries
const paletaCores = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', 
    '#990099', '#0099C6', '#DD4477', '#66AA00',
    '#B82E2E', '#316395', '#994499', '#22AA99', 
    '#AAAA11', '#6633CC', '#E67300', '#8B0707'
];

/**
 * Configurações padrão dos gráficos
 * @private
 */
const configPadrao = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 1000,
        easing: 'easeOutQuart'
    },
    plugins: {
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                    size: 12,
                    family: "'Public Sans', sans-serif"
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1,
            cornerRadius: 6,
            boxPadding: 6,
            titleFont: {
                weight: 'bold',
                family: "'Public Sans', sans-serif"
            },
            bodyFont: {
                family: "'Public Sans', sans-serif"
            },
            displayColors: true,
            usePointStyle: true,
            padding: 10,
            boxWidth: 10
        }
    }
};

/**
 * Renderiza um gráfico de linha com estilo aprimorado
 * @param {HTMLCanvasElement} canvas - Elemento canvas onde o gráfico será renderizado
 * @param {Array} dados - Array de objetos com os dados do gráfico (ano e valor)
 * @param {Object} opcoes - Opções de configuração do gráfico
 */
export function renderizarGraficoLinha(canvas, dados, opcoes = {}) {
    if (!canvas || !dados || dados.length === 0) {
        console.error('Dados ou canvas inválidos para gráfico de linha');
        return;
    }
    
    // Extrai anos e valores
    const anos = dados.map(item => item.ano);
    const valores = dados.map(item => parseFloat(item.valor));
    
    // Determina cor do ODS ou usa cor padrão
    const corODS = opcoes.odsId ? coresODS[opcoes.odsId] : '#0a97d9';
    
    // Configuração do gráfico de linha
    const config = {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: opcoes.titulo || 'Indicador',
                data: valores,
                borderColor: corODS,
                backgroundColor: `${corODS}33`,
                borderWidth: 3,
                fill: opcoes.preencher || true,
                tension: 0.2,
                pointBackgroundColor: corODS,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            ...configPadrao,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: opcoes.tituloEixoX || 'Ano',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: { top: 10, bottom: 0 }
                    },
                    grid: {
                        display: false,
                        drawBorder: true
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: opcoes.tituloEixoY || 'Valor',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 10 }
                    },
                    beginAtZero: opcoes.iniciarEmZero !== undefined ? opcoes.iniciarEmZero : true,
                    grid: {
                        color: '#eeeeee'
                    },
                    ticks: {
                        callback: function(valor) {
                            // Formatação condicional baseada na unidade
                            if (opcoes.unidade === '%') {
                                return valor + '%';
                            } else if (opcoes.unidade === 'R$') {
                                return 'R$ ' + valor.toLocaleString('pt-BR');
                            }
                            return valor;
                        }
                    }
                }
            },
            plugins: {
                ...configPadrao.plugins,
                tooltip: {
                    ...configPadrao.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            let valorFormatado = context.parsed.y;
                            if (opcoes.unidade === '%') {
                                valorFormatado = valorFormatado + '%';
                            } else if (opcoes.unidade === 'R$') {
                                valorFormatado = 'R$ ' + valorFormatado.toLocaleString('pt-BR');
                            } else if (opcoes.unidade) {
                                valorFormatado = valorFormatado + ' ' + opcoes.unidade;
                            }
                            return `${context.dataset.label}: ${valorFormatado}`;
                        }
                    }
                }
            }
        }
    };
    
    // Adicionar descrição textual se ativado
    if (opcoes.adicionarDescricaoTextual && canvas.parentNode) {
        const descricaoEl = document.createElement('div');
        descricaoEl.className = 'sr-only';
        descricaoEl.id = canvas.id + '-descricao';
        descricaoEl.textContent = opcoes.descricaoTexto || 
            `Gráfico de linha mostrando a evolução do indicador ${opcoes.titulo || ''} de ${anos[0]} a ${anos[anos.length-1]}. ` +
            `Valores entre ${Math.min(...valores)} e ${Math.max(...valores)}${opcoes.unidade || ''}.`;
        
        canvas.setAttribute('aria-describedby', descricaoEl.id);
        canvas.parentNode.appendChild(descricaoEl);
    }
    
    // Renderiza o gráfico
    // @ts-ignore
    return new Chart(canvas, config);
}

/**
 * Renderiza um gráfico de barras com estilo aprimorado
 * @param {HTMLCanvasElement} canvas - Elemento canvas onde o gráfico será renderizado
 * @param {Array} dados - Array de objetos com os dados do gráfico (ano e valor)
 * @param {Object} opcoes - Opções de configuração do gráfico
 */
export function renderizarGraficoBarra(canvas, dados, opcoes = {}) {
    if (!canvas || !dados || dados.length === 0) {
        console.error('Dados ou canvas inválidos para gráfico de barras');
        return;
    }
    
    // Extrai anos e valores
    const anos = dados.map(item => item.ano);
    const valores = dados.map(item => parseFloat(item.valor));
    
    // Determina cor do ODS ou usa cor padrão
    const corODS = opcoes.odsId ? coresODS[opcoes.odsId] : '#0a97d9';
    
    // Configuração do gráfico de barras
    const config = {
        type: 'bar',
        data: {
            labels: anos,
            datasets: [{
                label: opcoes.titulo || 'Indicador',
                data: valores,
                backgroundColor: opcoes.usarGradiente ? 
                    createBarGradient(canvas, corODS) : 
                    `${corODS}dd`,
                borderColor: corODS,
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.75,
                hoverBackgroundColor: corODS
            }]
        },
        options: {
            ...configPadrao,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: opcoes.tituloEixoX || 'Ano',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: { top: 10, bottom: 0 }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: opcoes.tituloEixoY || 'Valor',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 10 }
                    },
                    beginAtZero: opcoes.iniciarEmZero !== undefined ? opcoes.iniciarEmZero : true,
                    grid: {
                        color: '#eeeeee'
                    },
                    ticks: {
                        callback: function(valor) {
                            if (opcoes.unidade === '%') {
                                return valor + '%';
                            } else if (opcoes.unidade === 'R$') {
                                return 'R$ ' + valor.toLocaleString('pt-BR');
                            }
                            return valor;
                        }
                    }
                }
            },
            plugins: {
                ...configPadrao.plugins,
                tooltip: {
                    ...configPadrao.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            let valorFormatado = context.parsed.y;
                            if (opcoes.unidade === '%') {
                                valorFormatado = valorFormatado + '%';
                            } else if (opcoes.unidade === 'R$') {
                                valorFormatado = 'R$ ' + valorFormatado.toLocaleString('pt-BR');
                            } else if (opcoes.unidade) {
                                valorFormatado = valorFormatado + ' ' + opcoes.unidade;
                            }
                            return `${context.dataset.label}: ${valorFormatado}`;
                        }
                    }
                }
            }
        }
    };
    
    // Adicionar descrição textual se ativado
    if (opcoes.adicionarDescricaoTextual && canvas.parentNode) {
        const descricaoEl = document.createElement('div');
        descricaoEl.className = 'sr-only';
        descricaoEl.id = canvas.id + '-descricao';
        descricaoEl.textContent = opcoes.descricaoTexto || 
            `Gráfico de barras mostrando a evolução do indicador ${opcoes.titulo || ''} de ${anos[0]} a ${anos[anos.length-1]}. ` +
            `Valores entre ${Math.min(...valores)} e ${Math.max(...valores)}${opcoes.unidade || ''}.`;
        
        canvas.setAttribute('aria-describedby', descricaoEl.id);
        canvas.parentNode.appendChild(descricaoEl);
    }
    
    // Renderiza o gráfico
    // @ts-ignore
    return new Chart(canvas, config);
}

/**
 * Renderiza um gráfico comparativo com múltiplas séries temporais
 * @param {HTMLCanvasElement} canvas - Elemento canvas onde o gráfico será renderizado
 * @param {Array} indicadores - Array de indicadores, cada um com seus dados próprios
 * @param {Object} opcoes - Opções de configuração do gráfico
 */
export function renderizarGraficoComparativo(canvas, indicadores, opcoes = {}) {
    if (!canvas || !indicadores || indicadores.length === 0) {
        console.error('Dados ou canvas inválidos para gráfico comparativo');
        return;
    }
    
    // Determina cor do ODS para elementos relacionados
    const corODS = opcoes.odsId ? coresODS[opcoes.odsId] : '#0a97d9';
    
    // Coleta todos os anos de todos os indicadores para formar escala X completa
    const todosAnos = new Set();
    indicadores.forEach(indicador => {
        indicador.dados.forEach(item => {
            todosAnos.add(item.ano);
        });
    });
    
    // Converte para array e ordena
    const anos = Array.from(todosAnos).sort();
    
    // Prepara os datasets para o gráfico
    const datasets = indicadores.map((indicador, index) => {
        // Determina a cor para esta série
        const cor = paletaCores[index % paletaCores.length];
        
        // Prepara os dados para esta série, preenchendo anos sem dados com null
        const dadosSerie = anos.map(ano => {
            const ponto = indicador.dados.find(item => item.ano === ano);
            return ponto ? parseFloat(ponto.valor) : null;
        });
        
        return {
            label: indicador.titulo,
            data: dadosSerie,
            borderColor: cor,
            backgroundColor: `${cor}22`,
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointBackgroundColor: cor,
            pointRadius: 3,
            pointHoverRadius: 5
        };
    });
    
    // Configuração do gráfico comparativo
    const config = {
        type: 'line',
        data: {
            labels: anos,
            datasets
        },
        options: {
            ...configPadrao,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: opcoes.tituloEixoX || 'Ano',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: { top: 10, bottom: 0 }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: opcoes.tituloEixoY || 'Valor',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: { top: 0, bottom: 10 }
                    },
                    grid: {
                        color: '#eeeeee'
                    },
                    beginAtZero: opcoes.iniciarEmZero !== undefined ? opcoes.iniciarEmZero : true,
                    ticks: {
                        callback: function(valor) {
                            if (opcoes.unidade === '%') {
                                return valor + '%';
                            } else if (opcoes.unidade === 'R$') {
                                return 'R$ ' + valor.toLocaleString('pt-BR');
                            }
                            return valor;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                ...configPadrao.plugins,
                tooltip: {
                    ...configPadrao.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            let valorFormatado = context.parsed.y;
                            // Verifica se o valor é null para não exibir séries sem dados para este período
                            if (valorFormatado === null) {
                                return '';
                            }
                            
                            if (opcoes.unidade === '%') {
                                valorFormatado = valorFormatado + '%';
                            } else if (opcoes.unidade === 'R$') {
                                valorFormatado = 'R$ ' + valorFormatado.toLocaleString('pt-BR');
                            } else if (opcoes.unidade) {
                                valorFormatado = valorFormatado + ' ' + opcoes.unidade;
                            }
                            return `${context.dataset.label}: ${valorFormatado}`;
                        },
                        // Filtra datasets vazios
                        labelPointStyle: function(context) {
                            if (context.parsed.y === null) {
                                return false;
                            }
                            return {
                                pointStyle: 'circle'
                            };
                        }
                    }
                }
            }
        }
    };
    
    // Adicionar descrição textual se ativado
    if (opcoes.adicionarDescricaoTextual && canvas.parentNode) {
        const descricaoEl = document.createElement('div');
        descricaoEl.className = 'sr-only';
        descricaoEl.id = canvas.id + '-descricao';
        
        // Cria uma descrição textual detalhada para acessibilidade
        let descricaoTexto = `Gráfico comparativo mostrando a evolução de ${indicadores.length} indicadores. `;
        descricaoTexto += `Período: de ${anos[0]} a ${anos[anos.length-1]}. `;
        
        // Adiciona resumo de cada série
        indicadores.forEach((indicador, index) => {
            const valores = indicador.dados.map(item => parseFloat(item.valor));
            descricaoTexto += `${index + 1}) ${indicador.titulo}: varia de ${Math.min(...valores)} a ${Math.max(...valores)}. `;
        });
        
        descricaoEl.textContent = opcoes.descricaoTexto || descricaoTexto;
        
        canvas.setAttribute('aria-describedby', descricaoEl.id);
        canvas.parentNode.appendChild(descricaoEl);
    }
    
    // Renderiza o gráfico
    // @ts-ignore
    return new Chart(canvas, config);
}

/**
 * Cria um gradiente para barras baseado na cor do ODS
 * @param {HTMLCanvasElement} canvas - Elemento canvas onde o gráfico será renderizado
 * @param {string} corBase - Cor base em formato hexadecimal
 * @return {CanvasGradient} Um gradiente para usar em barras
 * @private
 */
function createBarGradient(canvas, corBase) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return corBase;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, corBase);
    gradient.addColorStop(1, `${corBase}77`);
    
    return gradient;
}

/**
 * Converte um valor hexadecimal para RGB
 * @param {string} hex - Cor no formato hexadecimal
 * @return {Object} Objeto com valores r, g, b
 * @private
 */
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Gera um código de cor RGBA a partir de uma cor hexadecimal e uma opacidade
 * @param {string} hex - Cor no formato hexadecimal
 * @param {number} alpha - Valor de opacidade (0-1)
 * @return {string} Cor no formato rgba()
 * @private
 */
function hexToRgba(hex, alpha = 1) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export default {
    renderizarGraficoLinha,
    renderizarGraficoBarra,
    renderizarGraficoComparativo,
    coresODS
};