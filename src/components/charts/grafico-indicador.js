/**
 * Componente para renderizar gráficos de indicadores ODS
 * Utiliza Chart.js para renderizar gráficos interativos e responsivos
 */

import { logger } from '../../services/monitoring.js';
import { ODS_COLORS } from '../../constants/ods.js';

/**
 * Renderiza um gráfico de linhas para visualização histórica de um indicador
 * @param {string} containerId - ID do elemento HTML onde o gráfico será renderizado
 * @param {Array} dados - Dados históricos do indicador
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Object|null} Instância do gráfico ou null em caso de erro
 */
export function renderizarGraficoLinha(containerId, dados, opcoes = {}) {
  try {
    const container = document.getElementById(containerId);
    
    if (!container) {
      logger.warn(`Container ${containerId} não encontrado para renderizar gráfico`);
      return null;
    }
    
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      logger.warn('Dados inválidos para renderização do gráfico');
      container.innerHTML = '<div class="erro-grafico">Dados insuficientes para exibir o gráfico.</div>';
      return null;
    }
    
    // Configurações padrão do gráfico
    const config = {
      type: 'line',
      data: {
        labels: dados.map(d => d.ano || d.periodo),
        datasets: [{
          label: opcoes.titulo || 'Valor do Indicador',
          data: dados.map(d => d.valor),
          backgroundColor: opcoes.corFundo || opcoes.odsColor || ODS_COLORS.ODS1,
          borderColor: opcoes.corBorda || opcoes.odsColor || ODS_COLORS.ODS1,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: opcoes.manterAspecto !== false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y;
                  if (opcoes.unidade) {
                    label += ` ${opcoes.unidade}`;
                  }
                }
                return label;
              }
            }
          },
          legend: {
            position: 'top',
          },
          title: {
            display: !!opcoes.titulo,
            text: opcoes.titulo || ''
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              drawBorder: true,
              drawOnChartArea: true,
              drawTicks: true,
            },
            title: {
              display: !!opcoes.tituloEixoX,
              text: opcoes.tituloEixoX || ''
            }
          },
          y: {
            beginAtZero: opcoes.iniciarEmZero !== false,
            grid: {
              display: true,
              drawBorder: true,
              drawOnChartArea: true,
              drawTicks: true,
            },
            title: {
              display: !!opcoes.tituloEixoY,
              text: opcoes.tituloEixoY || ''
            },
            ticks: {
              callback: function(value) {
                return value + (opcoes.unidade ? ` ${opcoes.unidade}` : '');
              }
            }
          }
        }
      }
    };
    
    // Mescla configurações personalizadas
    if (opcoes.config) {
      Object.assign(config.options, opcoes.config);
    }
    
    // Limpa o container e cria o canvas para o gráfico
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Renderiza o gráfico usando Chart.js
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, config);
    
    // Adiciona métodos de acessibilidade (descrição sonora do gráfico)
    adicionarDescricaoAcessivel(container, dados, opcoes);
    
    return chart;
  } catch (erro) {
    logger.error(`Erro ao renderizar gráfico de linha:`, erro);
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="erro-grafico">
          <p>Não foi possível carregar o gráfico.</p>
          <button class="btn-retry">Tentar novamente</button>
        </div>
      `;
      
      // Adiciona evento para tentar novamente
      container.querySelector('.btn-retry')?.addEventListener('click', () => {
        renderizarGraficoLinha(containerId, dados, opcoes);
      });
    }
    
    return null;
  }
}

/**
 * Renderiza um gráfico de barras para comparação de indicadores
 * @param {string} containerId - ID do elemento HTML onde o gráfico será renderizado
 * @param {Array} dados - Dados dos indicadores para comparação
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Object|null} Instância do gráfico ou null em caso de erro
 */
export function renderizarGraficoBarra(containerId, dados, opcoes = {}) {
  try {
    const container = document.getElementById(containerId);
    
    if (!container) {
      logger.warn(`Container ${containerId} não encontrado para renderizar gráfico`);
      return null;
    }
    
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      logger.warn('Dados inválidos para renderização do gráfico');
      container.innerHTML = '<div class="erro-grafico">Dados insuficientes para exibir o gráfico.</div>';
      return null;
    }
    
    // Configurações padrão do gráfico de barras
    const config = {
      type: 'bar',
      data: {
        labels: dados.map(d => d.nome || d.label),
        datasets: [{
          label: opcoes.titulo || 'Valores',
          data: dados.map(d => d.valor),
          backgroundColor: dados.map(d => d.cor || d.color || opcoes.corFundo || ODS_COLORS[`ODS${d.ods || 1}`] || ODS_COLORS.ODS1),
          borderColor: dados.map(d => d.corBorda || d.borderColor || opcoes.corBorda || ODS_COLORS[`ODS${d.ods || 1}`] || ODS_COLORS.ODS1),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: opcoes.manterAspecto !== false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          legend: {
            position: 'top',
            display: opcoes.mostrarLegenda !== false
          },
          title: {
            display: !!opcoes.titulo,
            text: opcoes.titulo || ''
          },
          datalabels: {
            display: opcoes.mostrarValores !== false,
            anchor: 'end',
            align: 'top',
            formatter: function(value) {
              return value + (opcoes.unidade ? ` ${opcoes.unidade}` : '');
            },
            font: {
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: opcoes.mostrarGradeX !== false
            },
            title: {
              display: !!opcoes.tituloEixoX,
              text: opcoes.tituloEixoX || ''
            }
          },
          y: {
            beginAtZero: opcoes.iniciarEmZero !== false,
            grid: {
              display: opcoes.mostrarGradeY !== false
            },
            title: {
              display: !!opcoes.tituloEixoY,
              text: opcoes.tituloEixoY || ''
            },
            ticks: {
              callback: function(value) {
                return value + (opcoes.unidade ? ` ${opcoes.unidade}` : '');
              }
            }
          }
        }
      }
    };
    
    // Mescla configurações personalizadas
    if (opcoes.config) {
      Object.assign(config.options, opcoes.config);
    }
    
    // Limpa o container e cria o canvas para o gráfico
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Renderiza o gráfico usando Chart.js
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, config);
    
    // Adiciona métodos de acessibilidade
    adicionarDescricaoAcessivel(container, dados, opcoes);
    
    return chart;
  } catch (erro) {
    logger.error(`Erro ao renderizar gráfico de barras:`, erro);
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="erro-grafico">
          <p>Não foi possível carregar o gráfico.</p>
          <button class="btn-retry">Tentar novamente</button>
        </div>
      `;
      
      container.querySelector('.btn-retry')?.addEventListener('click', () => {
        renderizarGraficoBarra(containerId, dados, opcoes);
      });
    }
    
    return null;
  }
}

/**
 * Renderiza um gráfico de pizza/rosca para distribuição de dados
 * @param {string} containerId - ID do elemento HTML onde o gráfico será renderizado
 * @param {Array} dados - Dados para o gráfico
 * @param {Object} opcoes - Opções de configuração do gráfico
 * @returns {Object|null} Instância do gráfico ou null em caso de erro
 */
export function renderizarGraficoPizza(containerId, dados, opcoes = {}) {
  try {
    const container = document.getElementById(containerId);
    
    if (!container) {
      logger.warn(`Container ${containerId} não encontrado para renderizar gráfico`);
      return null;
    }
    
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      logger.warn('Dados inválidos para renderização do gráfico');
      container.innerHTML = '<div class="erro-grafico">Dados insuficientes para exibir o gráfico.</div>';
      return null;
    }
    
    // Define tipo como rosca ou pizza
    const tipo = opcoes.tipo === 'rosca' ? 'doughnut' : 'pie';
    
    // Configurações padrão do gráfico
    const config = {
      type: tipo,
      data: {
        labels: dados.map(d => d.nome || d.label),
        datasets: [{
          label: opcoes.titulo || 'Distribuição',
          data: dados.map(d => d.valor),
          backgroundColor: dados.map((d, i) => d.cor || d.color || opcoes.cores?.[i] || `hsl(${(i * 360) / dados.length}, 70%, 60%)`),
          borderColor: opcoes.corBorda || '#ffffff',
          borderWidth: 2,
          hoverOffset: 10,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: opcoes.manterAspecto !== false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                
                return `${label}: ${value}${opcoes.unidade ? ` ${opcoes.unidade}` : ''} (${percentage}%)`;
              }
            }
          },
          legend: {
            position: opcoes.posicaoLegenda || 'right',
            display: opcoes.mostrarLegenda !== false
          },
          title: {
            display: !!opcoes.titulo,
            text: opcoes.titulo || ''
          },
          datalabels: {
            display: opcoes.mostrarValores !== false,
            color: '#fff',
            font: {
              weight: 'bold'
            },
            formatter: function(value, context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return percentage + '%';
            }
          }
        }
      }
    };
    
    // Mescla configurações personalizadas
    if (opcoes.config) {
      Object.assign(config.options, opcoes.config);
    }
    
    // Limpa o container e cria o canvas para o gráfico
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Renderiza o gráfico usando Chart.js
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, config);
    
    // Adiciona métodos de acessibilidade
    adicionarDescricaoAcessivel(container, dados, opcoes);
    
    return chart;
  } catch (erro) {
    logger.error(`Erro ao renderizar gráfico de pizza:`, erro);
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="erro-grafico">
          <p>Não foi possível carregar o gráfico.</p>
          <button class="btn-retry">Tentar novamente</button>
        </div>
      `;
      
      container.querySelector('.btn-retry')?.addEventListener('click', () => {
        renderizarGraficoPizza(containerId, dados, opcoes);
      });
    }
    
    return null;
  }
}

/**
 * Adiciona descrição acessível para o gráfico (ARIA)
 * @param {HTMLElement} container - Container do gráfico
 * @param {Array} dados - Dados do gráfico
 * @param {Object} opcoes - Opções de configuração
 */
function adicionarDescricaoAcessivel(container, dados, opcoes) {
  try {
    if (!container || !dados) return;
    
    // Cria descrição acessível do gráfico
    let descricao = opcoes.titulo ? `Gráfico: ${opcoes.titulo}. ` : 'Gráfico de dados. ';
    
    // Adiciona descrição específica dependendo do tipo de dados
    if (Array.isArray(dados) && dados.length > 0) {
      if (dados[0].ano || dados[0].periodo) {
        // Série histórica
        descricao += `Série histórica com ${dados.length} períodos. `;
        
        // Destaca valores inicial e final
        const primeiro = dados[0];
        const ultimo = dados[dados.length - 1];
        
        descricao += `Valor inicial em ${primeiro.ano || primeiro.periodo}: ${primeiro.valor}${opcoes.unidade ? ` ${opcoes.unidade}` : ''}. `;
        descricao += `Valor mais recente em ${ultimo.ano || ultimo.periodo}: ${ultimo.valor}${opcoes.unidade ? ` ${opcoes.unidade}` : ''}. `;
        
        // Adiciona tendência
        if (dados.length > 1) {
          const valorInicial = Number(primeiro.valor);
          const valorFinal = Number(ultimo.valor);
          
          if (!isNaN(valorInicial) && !isNaN(valorFinal)) {
            if (valorFinal > valorInicial) {
              descricao += `Tendência de aumento de ${((valorFinal - valorInicial) / valorInicial * 100).toFixed(1)}% no período.`;
            } else if (valorFinal < valorInicial) {
              descricao += `Tendência de redução de ${((valorInicial - valorFinal) / valorInicial * 100).toFixed(1)}% no período.`;
            } else {
              descricao += `Valores estáveis no período.`;
            }
          }
        }
      } else {
        // Distribuição ou comparação de categorias
        descricao += `Comparação entre ${dados.length} categorias. `;
        
        // Encontra maior e menor valor
        let maiorValor = dados[0].valor;
        let menorValor = dados[0].valor;
        let categoriaMaior = dados[0].nome || dados[0].label;
        let categoriaMenor = dados[0].nome || dados[0].label;
        
        dados.forEach(d => {
          if (d.valor > maiorValor) {
            maiorValor = d.valor;
            categoriaMaior = d.nome || d.label;
          }
          if (d.valor < menorValor) {
            menorValor = d.valor;
            categoriaMenor = d.nome || d.label;
          }
        });
        
        descricao += `Maior valor: ${categoriaMaior} com ${maiorValor}${opcoes.unidade ? ` ${opcoes.unidade}` : ''}. `;
        descricao += `Menor valor: ${categoriaMenor} com ${menorValor}${opcoes.unidade ? ` ${opcoes.unidade}` : ''}.`;
      }
    }
    
    // Cria elemento de descrição acessível
    const descricaoEl = document.createElement('div');
    descricaoEl.className = 'sr-only'; // Visível apenas para leitores de tela
    descricaoEl.setAttribute('aria-live', 'polite');
    descricaoEl.textContent = descricao;
    
    // Adiciona ao container
    container.appendChild(descricaoEl);
    
    // Adiciona atributos ARIA ao container
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', descricao);
  } catch (erro) {
    logger.warn('Erro ao adicionar descrição acessível ao gráfico:', erro);
  }
}

// Exporta as funções de renderização de gráficos
export default {
  linha: renderizarGraficoLinha,
  barra: renderizarGraficoBarra,
  pizza: renderizarGraficoPizza
};
