/**
 * Módulo de gráficos responsivos para o painel ODS
 * Fornece funções para criar gráficos compatíveis com dispositivos móveis e acessibilidade
 */

import { getOdsColor, obterCoresODS } from '../utils/coresODS.js';

// Configurações padrão para responsividade
const configResponsiva = {
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: window.innerWidth < 768 ? 1 : 2,
  resizeDelay: 100
};

/**
 * Cria um gráfico de linha responsivo
 * @param {string} canvasId - ID do elemento canvas
 * @param {object} dados - Dados para o gráfico (labels, datasets)
 * @param {object} opcoes - Opções adicionais para o gráfico
 * @returns {Chart} Instância do gráfico
 */
export function criarGraficoLinha(canvasId, dados, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas não encontrado: ${canvasId}`);
    return null;
  }
  
  // Mescla as configurações padrão com as opções fornecidas
  const config = {
    type: 'line',
    data: dados,
    options: {
      ...configResponsiva,
      plugins: {
        title: {
          display: !!opcoes.tituloGrafico,
          text: opcoes.tituloGrafico || '',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          position: window.innerWidth < 768 ? 'bottom' : 'top',
          labels: {
            boxWidth: 12,
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          ...(opcoes.plugins?.tooltip || {})
        }
      },
      scales: {
        y: {
          beginAtZero: opcoes.beginAtZero !== undefined ? opcoes.beginAtZero : true,
          ticks: {
            padding: 10,
            callback: function(value) {
              if (value % 1 === 0) {
                return value;
              }
              return null;
            }
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)'
          }
        },
        x: {
          ticks: {
            padding: 10,
            maxRotation: 30,
            minRotation: 0
          },
          grid: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 20,
          bottom: 10
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      animation: {
        duration: 1000,
      },
      ...(opcoes.options || {})
    }
  };
  
  // Obtém contexto e cria o gráfico
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, config);
}

/**
 * Cria um gráfico de barras responsivo
 * @param {string} canvasId - ID do elemento canvas
 * @param {object} dados - Dados para o gráfico (labels, datasets)
 * @param {object} opcoes - Opções adicionais para o gráfico
 * @returns {Chart} Instância do gráfico
 */
export function criarGraficoBarra(canvasId, dados, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas não encontrado: ${canvasId}`);
    return null;
  }
  
  // Mescla as configurações padrão com as opções fornecidas
  const config = {
    type: 'bar',
    data: dados,
    options: {
      ...configResponsiva,
      plugins: {
        title: {
          display: !!opcoes.tituloGrafico,
          text: opcoes.tituloGrafico || '',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          position: window.innerWidth < 768 ? 'bottom' : 'top',
          labels: {
            boxWidth: 12,
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          ...(opcoes.plugins?.tooltip || {})
        }
      },
      scales: {
        y: {
          beginAtZero: opcoes.beginAtZero !== undefined ? opcoes.beginAtZero : true,
          ticks: {
            padding: 10
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)'
          }
        },
        x: {
          ticks: {
            padding: 10,
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 20,
          bottom: 10
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      animation: {
        duration: 1000,
      },
      ...(opcoes.options || {})
    }
  };
  
  // Obtém contexto e cria o gráfico
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, config);
}

/**
 * Cria um gráfico comparativo entre múltiplos indicadores ou períodos
 * @param {string} canvasId - ID do elemento canvas
 * @param {object} dados - Dados para o gráfico (labels, datasets)
 * @param {object} opcoes - Opções adicionais para o gráfico
 * @returns {Chart} Instância do gráfico
 */
export function criarGraficoComparativo(canvasId, dados, opcoes = {}) {
  // Define o tipo de gráfico baseado nas opções ou nos dados
  let tipoGrafico = opcoes.tipo || 'bar';
  
  // Para comparações com muitos valores, preferir linhas
  if (!opcoes.tipo && dados.datasets.length > 3) {
    tipoGrafico = 'line';
  }
  
  // Cores para diferentes datasets
  if (opcoes.codigosODS && Array.isArray(opcoes.codigosODS)) {
    dados.datasets.forEach((dataset, index) => {
      const codigo = opcoes.codigosODS[index % opcoes.codigosODS.length];
      const numeroODS = typeof codigo === 'string' ? parseInt(codigo.replace('ods', '')) : codigo;
      
      dataset.borderColor = getOdsColor(numeroODS);
      dataset.backgroundColor = tipoGrafico === 'line' 
        ? getOdsColor(numeroODS, true)
        : getOdsColor(numeroODS);
    });
  }
  
  // Usa o método apropriado conforme o tipo de gráfico
  if (tipoGrafico === 'line') {
    return criarGraficoLinha(canvasId, dados, opcoes);
  } else {
    return criarGraficoBarra(canvasId, dados, opcoes);
  }
}

/**
 * Exporta o gráfico como imagem PNG
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} nomeArquivo - Nome do arquivo para download
 */
export function exportarGraficoComoPNG(canvasId, nomeArquivo = 'grafico') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas não encontrado: ${canvasId}`);
    return;
  }
  
  // Converte o canvas para URL de dados
  const imageURL = canvas.toDataURL('image/png');
  
  // Cria link para download
  const link = document.createElement('a');
  link.download = `${nomeArquivo}.png`;
  link.href = imageURL;
  link.click();
}

/**
 * Adiciona um botão de exportação ao gráfico
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} nomeArquivo - Nome base para o arquivo exportado
 */
export function adicionarBotaoExportacao(canvasId, nomeArquivo) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  // Cria o botão
  const botao = document.createElement('button');
  botao.className = 'botao-exportacao-grafico';
  botao.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i> Exportar';
  botao.setAttribute('aria-label', 'Exportar gráfico como imagem');
  
  // Posiciona o botão próximo ao canvas
  const container = canvas.parentElement;
  container.style.position = 'relative';
  botao.style.position = 'absolute';
  botao.style.top = '10px';
  botao.style.right = '10px';
  
  // Adiciona event listener
  botao.addEventListener('click', () => exportarGraficoComoPNG(canvasId, nomeArquivo));
  
  // Adiciona ao DOM
  container.appendChild(botao);
  
  return botao;
}