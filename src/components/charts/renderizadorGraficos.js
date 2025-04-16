/**
 * Módulo para renderização padronizada de gráficos do ODS
 * Fornece funções reutilizáveis para gerar diferentes tipos de gráficos
 * com configurações de acessibilidade e responsividade
 * 
 * @module renderizadorGraficos
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 * @requires Chart.js
 */

/**
 * Configuração padrão para todos os gráficos
 * @private
 */
const configPadrao = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 13
      },
      padding: 10,
      cornerRadius: 4,
      displayColors: true
    }
  },
  elements: {
    line: {
      tension: 0.3,
      borderWidth: 2
    },
    point: {
      radius: 3,
      hoverRadius: 6
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  }
};

/**
 * Verifica se Chart.js está disponível no escopo global
 * @throws {Error} Se Chart.js não estiver disponível
 * @private
 */
function verificarChartJs() {
  if (typeof Chart === 'undefined') {
    throw new Error('Chart.js não está disponível. Este módulo requer Chart.js para funcionar.');
  }
}

/**
 * Limpa qualquer gráfico existente no canvas
 * @param {string|HTMLCanvasElement} canvas - ID do canvas ou elemento canvas
 * @private
 */
function limparGraficoExistente(canvas) {
  if (typeof canvas === 'string') {
    canvas = document.getElementById(canvas);
  }
  
  if (canvas) {
    const chartInstance = Chart.getChart(canvas);
    if (chartInstance) {
      chartInstance.destroy();
    }
  }
}

/**
 * Renderiza gráfico histórico de linha
 * @param {string|HTMLCanvasElement} canvas - ID do canvas ou elemento canvas
 * @param {Array} dados - Array de objetos com anos e valores
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Chart} Instância do gráfico criado
 */
export function renderizarGraficoHistorico(canvas, dados, opcoes = {}) {
  try {
    verificarChartJs();
    
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }
    
    if (!canvas) {
      throw new Error(`Canvas não encontrado: ${canvas}`);
    }
    
    limparGraficoExistente(canvas);
    
    // Definição das cores padrão se não especificadas
    const coresPadrao = {
      corPrimaria: opcoes.corPrimaria || 'rgba(54, 162, 235, 1)',
      corSecundaria: opcoes.corSecundaria || 'rgba(54, 162, 235, 0.2)'
    };
    
    // Extração de anos e valores da estrutura de dados
    const labels = dados.map(item => item.ano);
    const valores = dados.map(item => item.valor);
    
    // Configuração do gráfico
    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: opcoes.titulo || 'Evolução',
          data: valores,
          backgroundColor: coresPadrao.corSecundaria,
          borderColor: coresPadrao.corPrimaria,
          fill: opcoes.preenchido !== false
        }]
      },
      options: {
        ...configPadrao,
        scales: {
          y: {
            beginAtZero: opcoes.iniciarDoZero || false,
            ticks: {
              callback: function(value) {
                // Adiciona unidade se especificado (ex: %, R$)
                return opcoes.unidade ? value + opcoes.unidade : value;
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
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y;
                if (opcoes.unidade) {
                  label += opcoes.unidade;
                }
                return label;
              }
            }
          }
        }
      }
    };
    
    // Mescla com opções personalizadas adicionais
    if (opcoes.configAdicional) {
      config.options = { ...config.options, ...opcoes.configAdicional };
    }
    
    // Cria e retorna o gráfico
    return new Chart(canvas, config);
  } catch (erro) {
    console.error('Erro ao renderizar gráfico histórico:', erro);
    
    // Mostra mensagem de erro no lugar do gráfico
    if (typeof canvas === 'object' && canvas.parentNode) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'grafico-erro';
      errorContainer.innerHTML = `<i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível renderizar o gráfico</p>`;
      canvas.style.display = 'none';
      canvas.parentNode.appendChild(errorContainer);
    }
    
    throw erro;
  }
}

/**
 * Renderiza gráfico de barras
 * @param {string|HTMLCanvasElement} canvas - ID do canvas ou elemento canvas
 * @param {Array} labels - Array com os rótulos das barras
 * @param {Array} valores - Array com os valores das barras
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Chart} Instância do gráfico criado
 */
export function renderizarGraficoBarras(canvas, labels, valores, opcoes = {}) {
  try {
    verificarChartJs();
    
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }
    
    if (!canvas) {
      throw new Error(`Canvas não encontrado: ${canvas}`);
    }
    
    limparGraficoExistente(canvas);
    
    // Definição das cores
    const corPrimaria = opcoes.corPrimaria || 'rgba(54, 162, 235, 1)';
    const corSecundaria = opcoes.corSecundaria || 'rgba(54, 162, 235, 0.2)';
    
    // Configuração do gráfico
    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: opcoes.titulo || 'Valores',
          data: valores,
          backgroundColor: opcoes.cores || Array(valores.length).fill(corSecundaria),
          borderColor: opcoes.coresBorda || Array(valores.length).fill(corPrimaria),
          borderWidth: opcoes.espessuraBorda || 1
        }]
      },
      options: {
        ...configPadrao,
        scales: {
          y: {
            beginAtZero: opcoes.iniciarDoZero !== false, // Por padrão true para barras
            ticks: {
              callback: function(value) {
                return opcoes.unidade ? value + opcoes.unidade : value;
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
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y;
                if (opcoes.unidade) {
                  label += opcoes.unidade;
                }
                return label;
              }
            }
          }
        }
      }
    };
    
    // Mescla com opções personalizadas adicionais
    if (opcoes.configAdicional) {
      config.options = { ...config.options, ...opcoes.configAdicional };
    }
    
    // Cria e retorna o gráfico
    return new Chart(canvas, config);
  } catch (erro) {
    console.error('Erro ao renderizar gráfico de barras:', erro);
    
    // Mostra mensagem de erro no lugar do gráfico
    if (typeof canvas === 'object' && canvas.parentNode) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'grafico-erro';
      errorContainer.innerHTML = `<i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível renderizar o gráfico</p>`;
      canvas.style.display = 'none';
      canvas.parentNode.appendChild(errorContainer);
    }
    
    throw erro;
  }
}

/**
 * Renderiza gráfico comparativo com múltiplos datasets
 * @param {string|HTMLCanvasElement} canvas - ID do canvas ou elemento canvas
 * @param {Array} labels - Array com os rótulos do eixo X
 * @param {Array} datasets - Array de objetos de dataset com propriedades label, data e cor
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Chart} Instância do gráfico criado
 */
export function renderizarGraficoComparativo(canvas, labels, datasets, opcoes = {}) {
  try {
    verificarChartJs();
    
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }
    
    if (!canvas) {
      throw new Error(`Canvas não encontrado: ${canvas}`);
    }
    
    limparGraficoExistente(canvas);
    
    // Cores padrão para datasets
    const coresPadrao = [
      { borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)' },
      { borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)' },
      { borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)' },
      { borderColor: 'rgba(255, 159, 64, 1)', backgroundColor: 'rgba(255, 159, 64, 0.2)' },
      { borderColor: 'rgba(153, 102, 255, 1)', backgroundColor: 'rgba(153, 102, 255, 0.2)' }
    ];
    
    // Prepara os datasets com configurações completas
    const datasetsConfigurados = datasets.map((ds, index) => {
      // Usa cor do dataset, ou cor padrão da posição, ou cor cíclica
      const corIndex = index % coresPadrao.length;
      return {
        label: ds.label || `Série ${index + 1}`,
        data: ds.data,
        borderColor: ds.borderColor || coresPadrao[corIndex].borderColor,
        backgroundColor: ds.backgroundColor || coresPadrao[corIndex].backgroundColor,
        fill: ds.fill !== undefined ? ds.fill : opcoes.preenchido || false,
        borderWidth: ds.borderWidth || 2,
        tension: ds.tension || 0.3,
        pointRadius: ds.pointRadius || 3,
        pointHoverRadius: ds.pointHoverRadius || 6
      };
    });
    
    // Configuração do gráfico
    const config = {
      type: opcoes.tipo || 'line',
      data: {
        labels: labels,
        datasets: datasetsConfigurados
      },
      options: {
        ...configPadrao,
        scales: {
          y: {
            beginAtZero: opcoes.iniciarDoZero || false,
            ticks: {
              callback: function(value) {
                return opcoes.unidade ? value + opcoes.unidade : value;
              }
            }
          }
        },
        plugins: {
          ...configPadrao.plugins,
          tooltip: {
            ...configPadrao.plugins.tooltip,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y;
                if (opcoes.unidade) {
                  label += opcoes.unidade;
                }
                return label;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };
    
    // Mescla com opções personalizadas adicionais
    if (opcoes.configAdicional) {
      config.options = { ...config.options, ...opcoes.configAdicional };
    }
    
    // Cria e retorna o gráfico
    return new Chart(canvas, config);
  } catch (erro) {
    console.error('Erro ao renderizar gráfico comparativo:', erro);
    
    // Mostra mensagem de erro no lugar do gráfico
    if (typeof canvas === 'object' && canvas.parentNode) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'grafico-erro';
      errorContainer.innerHTML = `<i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível renderizar o gráfico</p>`;
      canvas.style.display = 'none';
      canvas.parentNode.appendChild(errorContainer);
    }
    
    throw erro;
  }
}

/**
 * Renderiza gráfico de pizza/doughnut
 * @param {string|HTMLCanvasElement} canvas - ID do canvas ou elemento canvas
 * @param {Array} labels - Array com os rótulos das fatias
 * @param {Array} valores - Array com os valores das fatias
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Chart} Instância do gráfico criado
 */
export function renderizarGraficoPizza(canvas, labels, valores, opcoes = {}) {
  try {
    verificarChartJs();
    
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }
    
    if (!canvas) {
      throw new Error(`Canvas não encontrado: ${canvas}`);
    }
    
    limparGraficoExistente(canvas);
    
    // Cores padrão para fatias
    const coresPadraoFatias = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(201, 203, 207, 0.8)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(75, 192, 192, 0.6)'
    ];
    
    // Configuração do gráfico
    const config = {
      type: opcoes.doughnut ? 'doughnut' : 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: opcoes.titulo || 'Distribuição',
          data: valores,
          backgroundColor: opcoes.cores || coresPadraoFatias,
          borderColor: opcoes.coresBorda || 'white',
          borderWidth: opcoes.espessuraBorda || 1,
          hoverOffset: opcoes.deslocamentoHover || 10
        }]
      },
      options: {
        ...configPadrao,
        plugins: {
          ...configPadrao.plugins,
          tooltip: {
            ...configPadrao.plugins.tooltip,
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                
                const valor = context.parsed;
                label += valor;
                
                if (opcoes.unidade) {
                  label += opcoes.unidade;
                }
                
                // Adicionar percentual se solicitado
                if (opcoes.mostrarPercentual) {
                  const dataset = context.dataset;
                  const total = dataset.data.reduce((acc, val) => acc + val, 0);
                  const percentual = Math.round((valor / total) * 100);
                  label += ` (${percentual}%)`;
                }
                
                return label;
              }
            }
          },
          legend: {
            position: opcoes.posicaoLegenda || 'bottom'
          },
          datalabels: opcoes.mostrarLabelsNoPie ? {
            formatter: (value, ctx) => {
              const total = ctx.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentual = Math.round((value / total) * 100);
              return percentual >= opcoes.percentualMinimoLabel || 5 ? `${percentual}%` : '';
            },
            color: '#fff',
            font: {
              weight: 'bold',
              size: 12
            }
          } : false
        }
      }
    };
    
    // Mescla com opções personalizadas adicionais
    if (opcoes.configAdicional) {
      config.options = { ...config.options, ...opcoes.configAdicional };
    }
    
    // Cria e retorna o gráfico
    return new Chart(canvas, config);
  } catch (erro) {
    console.error('Erro ao renderizar gráfico de pizza/doughnut:', erro);
    
    // Mostra mensagem de erro no lugar do gráfico
    if (typeof canvas === 'object' && canvas.parentNode) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'grafico-erro';
      errorContainer.innerHTML = `<i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível renderizar o gráfico</p>`;
      canvas.style.display = 'none';
      canvas.parentNode.appendChild(errorContainer);
    }
    
    throw erro;
  }
}

/**
 * Gera cores automaticamente para gráficos com muitas séries
 * @param {number} quantidade - Quantidade de cores a gerar
 * @param {Object} opcoes - Opções para geração de cores
 * @returns {Array} Array com as cores geradas
 */
export function gerarCores(quantidade, opcoes = {}) {
  const cores = [];
  const hueInicio = opcoes.hueInicio || 0;      // 0-360
  const hueFim = opcoes.hueFim || 360;          // 0-360
  const saturacao = opcoes.saturacao || 70;     // 0-100
  const luminosidade = opcoes.luminosidade || 60; // 0-100
  const alfa = opcoes.alfa || 0.8;              // 0-1
  
  for (let i = 0; i < quantidade; i++) {
    const hue = hueInicio + (i * (hueFim - hueInicio) / quantidade);
    cores.push(`hsla(${hue}, ${saturacao}%, ${luminosidade}%, ${alfa})`);
  }
  
  return cores;
}