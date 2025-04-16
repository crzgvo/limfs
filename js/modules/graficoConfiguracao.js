/**
 * Módulo para configuração avançada de gráficos Chart.js com melhorias de 
 * acessibilidade, desempenho e estilização específica para cada ODS
 */

import { coresODS } from '../utils/coresODS.js';

/**
 * Configuração base para todos os gráficos com melhorias de acessibilidade e performance
 * @param {string} tipo - Tipo de gráfico (bar, line, pie, etc)
 * @param {Array} dados - Dados para o gráfico
 * @param {string} codigoODS - Código do ODS (ex: 'ods1', 'ods12', etc)
 * @param {Object} opcoesPersonalizadas - Opções adicionais para customização
 * @returns {Object} Configuração completa para Chart.js
 */
export function criarConfiguracaoGrafico(tipo, dados, codigoODS, opcoesPersonalizadas = {}) {
  // Obtém as cores do ODS específico
  const coresDoODS = obterCoresODS(codigoODS);
  
  // Configuração base
  const configBase = {
    type: tipo,
    data: dados,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 14
            },
            color: '#333',
            padding: 15,
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#333',
          borderColor: coresDoODS.primaria,
          borderWidth: 1,
          cornerRadius: 4,
          padding: 10,
          displayColors: true,
          boxPadding: 5,
          bodyFont: {
            family: "'Public Sans', sans-serif",
            size: 14
          },
          callbacks: {
            // Formatação adicional para valores numéricos
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                // Formata números com separador de milhar
                label += new Intl.NumberFormat('pt-BR').format(context.parsed.y);
                // Adiciona porcentagem se for do tipo porcentagem
                if (context.dataset.unidade === 'porcentagem') {
                  label += '%';
                }
              }
              return label;
            }
          }
        }
      },
      // Configurações específicas para acessibilidade
      interaction: {
        intersect: false,
        mode: 'index'
      },
      layout: {
        padding: 10
      },
      // Animate elements individually for better performance
      animations: {
        colors: true,
        numbers: {
          type: 'number',
          duration: 1000,
          easing: 'easeOutQuart',
          delay: (context) => context.dataIndex * 100
        }
      }
    }
  };

  // Configurações específicas por tipo de gráfico
  adicionarConfigEspecificaPorTipo(configBase, tipo, coresDoODS);
  
  // Mescla as opções personalizadas com a configuração base
  const configMesclada = mesclarOpcoes(configBase, opcoesPersonalizadas);
  
  // Configuração para melhor performance em animações
  otimizarPerformance(configMesclada);
  
  // Melhorias de acessibilidade
  melhorarAcessibilidade(configMesclada, codigoODS);
  
  return configMesclada;
}

/**
 * Obtém as cores específicas para um ODS
 * @param {string} codigoODS - Código do ODS (ex: 'ods1', 'ods12')
 * @returns {Object} Objeto com cores primária, secundária e terciária
 */
function obterCoresODS(codigoODS) {
  // Cores padrão para caso não seja encontrado
  const coresPadrao = {
    primaria: '#1E386A',
    secundaria: 'rgba(30, 56, 106, 0.7)',
    terciaria: 'rgba(30, 56, 106, 0.3)'
  };
  
  if (!codigoODS || !coresODS[codigoODS]) {
    console.warn(`Cores não encontradas para o ODS ${codigoODS}. Usando cores padrão.`);
    return coresPadrao;
  }
  
  return coresODS[codigoODS];
}

/**
 * Adiciona configurações específicas baseadas no tipo de gráfico
 * @param {Object} config - Configuração base do gráfico
 * @param {string} tipo - Tipo de gráfico 
 * @param {Object} cores - Cores do ODS
 */
function adicionarConfigEspecificaPorTipo(config, tipo, cores) {
  switch (tipo) {
    case 'bar':
      config.options.scales = {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 12
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          beginAtZero: true,
          ticks: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 12
            },
            callback: function(value) {
              return new Intl.NumberFormat('pt-BR').format(value);
            }
          }
        }
      };
      break;
      
    case 'line':
      config.options.scales = {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 12
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          beginAtZero: true,
          ticks: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 12
            },
            callback: function(value) {
              return new Intl.NumberFormat('pt-BR').format(value);
            }
          }
        }
      };
      // Definições específicas para linhas
      if (config.data && config.data.datasets) {
        config.data.datasets.forEach(dataset => {
          dataset.tension = 0.3; // Suavização da linha
          dataset.borderWidth = 3;
          if (!dataset.pointBackgroundColor) {
            dataset.pointBackgroundColor = '#fff';
          }
          if (!dataset.pointBorderWidth) {
            dataset.pointBorderWidth = 2;
          }
        });
      }
      break;
      
    case 'pie':
    case 'doughnut':
      config.options.cutout = tipo === 'doughnut' ? '70%' : 0;
      config.options.plugins.legend.position = 'bottom';
      config.options.plugins.tooltip.callbacks.label = function(context) {
        const label = context.label || '';
        const value = context.raw || 0;
        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        return `${label}: ${new Intl.NumberFormat('pt-BR').format(value)} (${percentage}%)`;
      };
      break;
      
    case 'radar':
      config.options.scales = {
        r: {
          beginAtZero: true,
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          pointLabels: {
            font: {
              family: "'Public Sans', sans-serif",
              size: 12
            }
          },
          ticks: {
            backdropColor: 'transparent',
            font: {
              family: "'Public Sans', sans-serif",
              size: 10
            }
          }
        }
      };
      break;
  }
}

/**
 * Mescla opções personalizadas com a configuração base
 * @param {Object} configBase - Configuração base 
 * @param {Object} opcoesPersonalizadas - Opções personalizadas
 * @returns {Object} Configuração mesclada
 */
function mesclarOpcoes(configBase, opcoesPersonalizadas) {
  // Clona a configuração base para evitar mutações
  const configFinal = JSON.parse(JSON.stringify(configBase));
  
  // Mescla as opções de maneira recursiva
  function mesclarObjetosRecursivamente(destino, fonte) {
    Object.keys(fonte).forEach(chave => {
      if (fonte[chave] !== null && typeof fonte[chave] === 'object' && !Array.isArray(fonte[chave])) {
        // Se o destino não tiver essa chave, cria um objeto vazio
        if (!destino[chave] || typeof destino[chave] !== 'object') {
          destino[chave] = {};
        }
        // Mescla recursivamente
        mesclarObjetosRecursivamente(destino[chave], fonte[chave]);
      } else {
        // Substitui ou adiciona o valor diretamente
        destino[chave] = fonte[chave];
      }
    });
  }
  
  // Aplica a mesclagem
  if (opcoesPersonalizadas) {
    mesclarObjetosRecursivamente(configFinal, opcoesPersonalizadas);
  }
  
  return configFinal;
}

/**
 * Otimiza a performance das configurações de gráficos
 * @param {Object} config - Configuração do gráfico
 */
function otimizarPerformance(config) {
  // Limita a quantidade de pontos exibidos para melhor performance
  if (config.data && config.data.datasets) {
    const conjuntosDeDados = config.data.datasets;
    
    // Verifica se há muitos pontos de dados para análise
    const muitosDados = conjuntosDeDados.some(conjunto => conjunto.data && conjunto.data.length > 50);
    
    if (muitosDados) {
      // Reduz a complexidade das animações
      config.options.animation.duration = 500;
      
      // Ajusta configurações específicas de desempenho
      config.options.responsiveAnimationDuration = 0;
      
      // Reduz o tamanho dos pontos em gráficos de linha
      if (config.type === 'line') {
        conjuntosDeDados.forEach(conjunto => {
          conjunto.pointRadius = 2;
          conjunto.pointHoverRadius = 4;
        });
      }
    }
  }
  
  // Adiciona uma dica visual para aguardar o carregamento
  config.options.onResize = function(chart, size) {
    chart.options.animation.duration = 0;
  };
  
  // Utilização de device pixel ratio para melhorar nitidez em telas de alta resolução
  config.options.devicePixelRatio = window.devicePixelRatio || 1;
}

/**
 * Melhora a acessibilidade da configuração do gráfico
 * @param {Object} config - Configuração do gráfico
 * @param {string} codigoODS - Código do ODS
 */
function melhorarAcessibilidade(config, codigoODS) {
  // Adiciona descrições para leitores de tela
  config.options.plugins.tooltip.callbacks.beforeLabel = function(context) {
    const datasetLabel = context.dataset.label || '';
    const value = context.parsed.y;
    
    // Cria uma descrição textual mais detalhada para leitores de tela
    const descricao = `${datasetLabel}: ${value}`;
    
    // Armazena a descrição para uso pelo leitor de tela
    if (!context.chart.accessibility) {
      context.chart.accessibility = {};
    }
    context.chart.accessibility.currentDescription = descricao;
    
    return undefined; // Não afeta o tooltip visual
  };
  
  // Adiciona hooks para acessibilidade
  config.options.plugins.afterDraw = function(chart) {
    if (chart.accessibility && chart.accessibility.currentDescription) {
      // Atualiza o atributo aria-label do canvas para refletir os dados atuais
      chart.canvas.setAttribute('aria-label', 
        `Gráfico de ${config.type} mostrando dados do ${codigoODS.toUpperCase()}. ${chart.accessibility.currentDescription}`
      );
    }
  };
  
  // Garante que o canvas tenha o role e label adequados para acessibilidade
  config.options.plugins.beforeInit = function(chart) {
    chart.canvas.setAttribute('role', 'img');
    chart.canvas.setAttribute('aria-label', `Gráfico de ${config.type} mostrando dados do ${codigoODS.toUpperCase()}`);
  };
}

/**
 * Gera gradientes personalizados para gráficos baseados nas cores do ODS
 * @param {Object} ctx - Contexto do canvas
 * @param {Object} cores - Cores do ODS
 * @param {string} direcao - Direção do gradiente ('vertical' ou 'horizontal')
 * @returns {CanvasGradient} Gradiente para uso no gráfico
 */
export function criarGradiente(ctx, cores, direcao = 'vertical') {
  const gradient = direcao === 'vertical' 
    ? ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
    : ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
  
  // Cria um gradiente bonito baseado na cor primária do ODS
  gradient.addColorStop(0, cores.primaria);
  gradient.addColorStop(1, cores.secundaria);
  
  return gradient;
}

/**
 * Cria um conjunto de cores para datasets baseado nas cores do ODS
 * @param {number} quantidadeDatasets - Número de datasets que precisam de cores
 * @param {Object} cores - Cores do ODS
 * @param {number} opacidade - Valor de opacidade (0-1)
 * @returns {Array} Array de cores para datasets
 */
export function criarConjuntoCores(quantidadeDatasets, cores, opacidade = 0.7) {
  // Função para ajustar a cor (clarear ou escurecer)
  function ajustarCor(cor, fator) {
    // Converte cor hex para RGB
    let r = parseInt(cor.slice(1, 3), 16);
    let g = parseInt(cor.slice(3, 5), 16);
    let b = parseInt(cor.slice(5, 7), 16);
    
    if (fator > 0) { // Clarear
      r = Math.min(255, Math.round(r + (255 - r) * fator));
      g = Math.min(255, Math.round(g + (255 - g) * fator));
      b = Math.min(255, Math.round(b + (255 - b) * fator));
    } else { // Escurecer
      fator = Math.abs(fator);
      r = Math.max(0, Math.round(r * (1 - fator)));
      g = Math.max(0, Math.round(g * (1 - fator)));
      b = Math.max(0, Math.round(b * (1 - fator)));
    }
    
    // Converte de volta para hex
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  }
  
  const coresGeradas = [];
  const corBase = cores.primaria;
  
  for (let i = 0; i < quantidadeDatasets; i++) {
    // Determina o fator de ajuste para criar variações da cor
    const fator = (i === 0) ? 0 : (i % 2 === 0) ? 0.2 * (i/2) : -0.2 * ((i+1)/2);
    const corAjustada = ajustarCor(corBase, fator);
    
    // Adiciona a cor com opacidade especificada
    coresGeradas.push(`${corAjustada}${Math.round(opacidade * 255).toString(16).padStart(2, '0')}`);
  }
  
  return coresGeradas;
}

/**
 * Cria uma configuração para exportação de gráfico como imagem PNG
 * @param {Chart} grafico - Instância do gráfico Chart.js
 * @param {string} nomeArquivo - Nome base do arquivo
 * @returns {Function} Função para exportar o gráfico como imagem
 */
export function exportarGraficoPNG(grafico, nomeArquivo) {
  return function() {
    const link = document.createElement('a');
    link.href = grafico.toBase64Image('image/png', 1.0);
    link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  };
}

/**
 * Cria uma configuração para exportação de dados do gráfico como CSV
 * @param {Chart} grafico - Instância do gráfico Chart.js
 * @param {string} nomeArquivo - Nome base do arquivo
 * @returns {Function} Função para exportar os dados como CSV
 */
export function exportarDadosCSV(grafico, nomeArquivo) {
  return function() {
    // Extrai os dados do gráfico
    const labels = grafico.data.labels;
    const datasets = grafico.data.datasets;
    
    // Cria o conteúdo do CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Adiciona o cabeçalho
    const cabecalho = ["Categoria"].concat(datasets.map(ds => ds.label));
    csvContent += cabecalho.join(";") + "\n";
    
    // Adiciona os dados
    for (let i = 0; i < labels.length; i++) {
      const linha = [labels[i]].concat(datasets.map(ds => ds.data[i]));
      csvContent += linha.join(";") + "\n";
    }
    
    // Cria o link de download
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
}