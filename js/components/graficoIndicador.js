/**
 * Componente para criação de gráficos interativos para o painel ODS
 * Utiliza Chart.js para visualização de dados
 * 
 * @autor LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @versão 1.0.0 (14/04/2025)
 */

/**
 * Cria um gráfico de linha para indicadores
 * @param {HTMLCanvasElement} ctx - O contexto do canvas para renderização do gráfico
 * @param {Array} labels - Array com os rótulos (anos, meses, etc)
 * @param {Array} dados - Array com os valores numéricos do indicador
 * @param {Object} opcoes - Configurações adicionais para o gráfico
 * @returns {Chart} Instância do gráfico criado
 */
export function criarGraficoIndicador(ctx, labels, dados, opcoes = {}) {
  // Configuração padrão do gráfico ODS1
  const configPadrao = {
    cor: '#E5243B',              // Cor oficial do ODS 1
    corFundo: 'rgba(229, 36, 59, 0.2)',
    titulo: 'Taxa de Pobreza (%)',
    tipoGrafico: 'line',
    tensao: 0.3,
    pontosVisiveis: true,
    tooltips: true
  };

  // Mescla configurações padrão com opções personalizadas
  const config = {...configPadrao, ...opcoes};

  return new Chart(ctx, {
    type: config.tipoGrafico,
    data: {
      labels: labels,
      datasets: [{
        label: config.titulo,
        data: dados,
        backgroundColor: config.corFundo,
        borderColor: config.cor,
        borderWidth: 2,
        tension: config.tensao,
        fill: true,
        pointRadius: config.pontosVisiveis ? 5 : 0,
        pointHoverRadius: 7,
        pointBackgroundColor: config.cor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          labels: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 14
            },
            color: '#333'
          }
        },
        tooltip: { 
          mode: 'index',
          intersect: false,
          enabled: config.tooltips,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#333',
          bodyColor: '#333',
          borderColor: config.cor,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          cornerRadius: 8,
          titleFont: {
            family: "'Public Sans', sans-serif",
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: "'Public Sans', sans-serif",
            size: 13
          },
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              family: "'Public Sans', sans-serif"
            },
            color: '#555'
          },
          title: {
            display: true,
            text: 'Taxa (%)',
            font: {
              family: "'Public Sans', sans-serif",
              size: 13
            },
            color: '#555'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: "'Public Sans', sans-serif"
            },
            color: '#555'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

/**
 * Atualiza dados de um gráfico existente por período
 * @param {Chart} grafico - A instância do gráfico a ser atualizada
 * @param {string} periodo - O período a ser mostrado ('1-ano', '5-anos', '10-anos')
 */
export function atualizarGraficoPorPeriodo(grafico, periodo) {
  // Dados completos (simulados)
  const dadosCompletos = {
    labels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
    dados: [16.2, 15.4, 14.2, 13.8, 12.5, 11.8, 13.2, 12.7, 11.3, 10.1]
  };

  let novosDados, novosLabels;

  // Determina quais dados mostrar com base no período
  switch (periodo) {
    case '1-ano':
      novosLabels = dadosCompletos.labels.slice(-4);
      novosDados = dadosCompletos.dados.slice(-4);
      break;
    case '5-anos':
      novosLabels = dadosCompletos.labels.slice(-6);
      novosDados = dadosCompletos.dados.slice(-6);
      break;
    case '10-anos':
    default:
      novosLabels = dadosCompletos.labels;
      novosDados = dadosCompletos.dados;
      break;
  }

  // Atualiza os dados do gráfico
  grafico.data.labels = novosLabels;
  grafico.data.datasets[0].data = novosDados;
  
  // Calcula a variação percentual para adicionar no título
  const primeiro = novosDados[0];
  const ultimo = novosDados[novosDados.length - 1];
  const variacao = ((ultimo - primeiro) / primeiro * 100).toFixed(1);
  const direcao = variacao < 0 ? 'redução' : 'aumento';
  
  // Atualiza o título do gráfico para incluir a variação
  grafico.options.plugins.title = {
    display: true,
    text: `Variação no período: ${Math.abs(variacao)}% de ${direcao}`,
    font: {
      family: "'Public Sans', sans-serif",
      size: 14
    },
    color: '#333',
    padding: {
      top: 10,
      bottom: 20
    }
  };

  // Renderiza o gráfico com as atualizações
  grafico.update();
}

/**
 * Cria um gráfico de barras para comparar indicadores
 * @param {HTMLCanvasElement} ctx - O contexto do canvas para renderização do gráfico
 * @param {Array} categorias - Array com as categorias a comparar
 * @param {Array} series - Array com séries de dados para comparação
 * @returns {Chart} Instância do gráfico criado
 */
export function criarGraficoComparativo(ctx, categorias, series) {
  const cores = [
    '#E5243B',  // ODS 1 - Vermelho
    '#5CB8E6',  // Azul claro
    '#4C9F38',  // Verde
    '#FF9E1B',  // Laranja
    '#A21942'   // Bordô
  ];

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categorias,
      datasets: series.map((serie, index) => ({
        label: serie.nome,
        data: serie.valores,
        backgroundColor: cores[index % cores.length],
        borderColor: cores[index % cores.length],
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 'flex',
        maxBarThickness: 50
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 15,
            padding: 15,
            font: {
              family: "'Public Sans', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#333',
          borderColor: '#ccc',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          titleFont: {
            family: "'Public Sans', sans-serif",
            weight: 'bold'
          },
          bodyFont: {
            family: "'Public Sans', sans-serif"
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              family: "'Public Sans', sans-serif"
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: "'Public Sans', sans-serif"
            }
          }
        }
      }
    }
  });
}