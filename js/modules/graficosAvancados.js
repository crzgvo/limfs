/**
 * @file graficosAvancados.js
 * @description Módulo para visualizações avançadas de dados ODS usando Chart.js
 * @version 1.0.0
 */

// Paleta de cores padrão para ODS
const CORES_ODS = {
  'ods1': '#E5243B', // Vermelho
  'ods2': '#DDA63A', // Amarelo
  'ods3': '#4C9F38', // Verde
  'ods4': '#C5192D', // Vermelho escuro
  'ods5': '#FF3A21', // Laranja avermelhado
  'ods6': '#26BDE2', // Azul claro
  'ods7': '#FCC30B', // Amarelo dourado
  'ods8': '#A21942', // Bordô
  'ods9': '#FD6925', // Laranja
  'ods10': '#DD1367', // Rosa
  'ods11': '#FD9D24', // Laranja claro
  'ods12': '#BF8B2E', // Marrom
  'ods13': '#3F7E44', // Verde escuro
  'ods14': '#0A97D9', // Azul
  'ods15': '#56C02B', // Verde lima
  'ods16': '#00689D', // Azul marinho
  'ods17': '#19486A'  // Azul escuro
};

// Configurações padrão de acessibilidade para gráficos
const configAcessibilidade = {
  plugins: {
    htmlLegend: {
      containerID: 'legenda-acessivel'
    }
  }
};

/**
 * Cria um gráfico de radar para comparar múltiplos indicadores
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} dados - Dados para o gráfico
 * @param {Array<string>} labels - Labels para os eixos
 * @param {string} titulo - Título do gráfico
 * @param {Object} opcoes - Opções adicionais
 * @returns {Chart} Instância do gráfico
 */
export function criarGraficoRadar(canvasId, dados, labels, titulo, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado`);
    return null;
  }

  // Cria container para legenda acessível
  const legendaContainer = document.createElement('div');
  legendaContainer.id = `legenda-${canvasId}`;
  legendaContainer.className = 'legenda-acessivel';
  legendaContainer.setAttribute('role', 'region');
  legendaContainer.setAttribute('aria-live', 'polite');
  canvas.parentNode.insertBefore(legendaContainer, canvas.nextSibling);

  // Configurações do gráfico radar
  const config = {
    type: 'radar',
    data: {
      labels: labels,
      datasets: dados.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.dados,
        backgroundColor: hexToRgba(dataset.cor || obterCorODS(index), 0.2),
        borderColor: dataset.cor || obterCorODS(index),
        borderWidth: 2,
        pointBackgroundColor: dataset.cor || obterCorODS(index)
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: !!titulo,
          text: titulo,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.formattedValue}`;
            }
          }
        },
        ...configAcessibilidade.plugins,
        ...opcoes.plugins
      },
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: opcoes.valorMinimo || 0,
          suggestedMax: opcoes.valorMaximo || 100,
          ticks: {
            stepSize: opcoes.incremento || 20
          }
        }
      },
      ...opcoes
    },
    plugins: [criarPluginLegendaAcessivel()]
  };

  // Cria e retorna o gráfico
  return new Chart(canvas, config);
}

/**
 * Cria um gráfico misto (barras + linha) para análise comparativa
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} dadosBarras - Dados para o gráfico de barras
 * @param {Object} dadosLinha - Dados para o gráfico de linha
 * @param {Array<string>} labels - Labels para o eixo X
 * @param {string} titulo - Título do gráfico
 * @param {Object} opcoes - Opções adicionais
 * @returns {Chart} Instância do gráfico
 */
export function criarGraficoMisto(canvasId, dadosBarras, dadosLinha, labels, titulo, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado`);
    return null;
  }

  // Configurações para gráfico misto
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: dadosBarras.label,
          data: dadosBarras.dados,
          backgroundColor: hexToRgba(dadosBarras.cor || CORES_ODS.ods5, 0.6),
          borderColor: dadosBarras.cor || CORES_ODS.ods5,
          borderWidth: 1,
          order: 2
        },
        {
          type: 'line',
          label: dadosLinha.label,
          data: dadosLinha.dados,
          borderColor: dadosLinha.cor || CORES_ODS.ods3,
          backgroundColor: hexToRgba(dadosLinha.cor || CORES_ODS.ods3, 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: !!titulo,
          text: titulo,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        ...opcoes.plugins
      },
      scales: {
        x: {
          title: {
            display: !!opcoes.tituloEixoX,
            text: opcoes.tituloEixoX || '',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: !!opcoes.tituloEixoY,
            text: opcoes.tituloEixoY || '',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: true
          }
        }
      }
    }
  };

  // Se houver uma segunda escala Y
  if (opcoes.segundaEscalaY) {
    config.options.scales.y1 = {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: !!opcoes.tituloEixoY2,
        text: opcoes.tituloEixoY2 || '',
        font: {
          weight: 'bold'
        }
      },
      grid: {
        drawOnChartArea: false
      }
    };
    
    // Ajusta o dataset de linha para usar a escala y1
    config.data.datasets[1].yAxisID = 'y1';
  }

  // Cria e retorna o gráfico
  return new Chart(canvas, config);
}

/**
 * Cria um heatmap geográfico de Sergipe para distribuição de indicadores
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} dados - Dados para o mapa de calor
 * @param {string} titulo - Título do mapa
 * @param {Object} opcoes - Opções adicionais
 * @returns {Chart} Instância do gráfico
 */
export function criarMapaCalorSergipe(canvasId, dados, titulo, opcoes = {}) {
  // Coordenadas aproximadas dos municípios de Sergipe
  const municipiosCoordenadas = {
    'aracaju': { x: 0.7, y: 0.6 },
    'nossa_senhora_do_socorro': { x: 0.65, y: 0.55 },
    'lagarto': { x: 0.4, y: 0.7 },
    'itabaiana': { x: 0.5, y: 0.4 },
    'estancia': { x: 0.6, y: 0.85 },
    'sao_cristovao': { x: 0.65, y: 0.65 },
    'tobias_barreto': { x: 0.3, y: 0.75 },
    'propria': { x: 0.75, y: 0.2 },
    'simao_dias': { x: 0.3, y: 0.6 },
    'capela': { x: 0.6, y: 0.3 }
    // Adicionar mais municípios conforme necessário
  };

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado`);
    return null;
  }

  // Converte dados ao formato esperado para o scatter chart
  const datasets = [{
    label: dados.label || 'Distribuição',
    data: Object.keys(dados.valores).map(municipio => {
      const coordenadas = municipiosCoordenadas[municipio.toLowerCase().replace(/ /g, '_')];
      if (!coordenadas) return null;
      
      return {
        x: coordenadas.x,
        y: coordenadas.y,
        r: escalarValor(dados.valores[municipio], 
                        dados.valorMinimo || Math.min(...Object.values(dados.valores)), 
                        dados.valorMaximo || Math.max(...Object.values(dados.valores)),
                        5, 25),
        municipio: municipio,
        valor: dados.valores[municipio]
      };
    }).filter(item => item !== null),
    backgroundColor: ctx => {
      // Escalona cores com base nos valores
      const valor = ctx.raw.valor;
      const min = dados.valorMinimo || Math.min(...Object.values(dados.valores));
      const max = dados.valorMaximo || Math.max(...Object.values(dados.valores));
      const escala = (valor - min) / (max - min);
      
      // Gradiente de cores do azul (baixo) ao vermelho (alto)
      return `rgba(${Math.round(escala * 255)}, ${Math.round(100 - escala * 100)}, ${Math.round(255 - escala * 255)}, 0.7)`;
    }
  }];

  // Configurações do mapa de calor
  const config = {
    type: 'bubble',
    data: {
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: !!titulo,
          text: titulo,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: context => {
              const municipio = context.raw.municipio;
              const valor = context.raw.valor;
              return `${municipio}: ${valor}${dados.unidade || ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 1,
          display: false
        },
        y: {
          min: 0,
          max: 1,
          display: false
        }
      },
      elements: {
        point: {
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.3)'
        }
      },
      ...opcoes
    }
  };

  // Cria e retorna o gráfico
  const chart = new Chart(canvas, config);
  
  // Adiciona mapa de Sergipe como overlay se a opção estiver habilitada
  if (opcoes.adicionarMapa !== false) {
    adicionarMapaSergipeOverlay(canvas);
  }
  
  return chart;
}

/**
 * Cria um gráfico de área empilhado para mostrar evolução de múltiplos indicadores
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array<Object>} conjuntoDados - Conjunto de dados para o gráfico
 * @param {Array<string>} labels - Labels para o eixo X
 * @param {string} titulo - Título do gráfico
 * @param {Object} opcoes - Opções adicionais
 * @returns {Chart} Instância do gráfico
 */
export function criarGraficoAreaEmpilhado(canvasId, conjuntoDados, labels, titulo, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado`);
    return null;
  }

  // Prepara os datasets
  const datasets = conjuntoDados.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.dados,
    backgroundColor: hexToRgba(dataset.cor || obterCorODS(index), 0.6),
    borderColor: dataset.cor || obterCorODS(index),
    borderWidth: 1,
    fill: true
  }));

  // Configurações do gráfico
  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        filler: {
          propagate: true
        },
        title: {
          display: !!titulo,
          text: titulo,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index'
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
        axis: 'x'
      },
      scales: {
        x: {
          title: {
            display: !!opcoes.tituloEixoX,
            text: opcoes.tituloEixoX || '',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          stacked: true,
          title: {
            display: !!opcoes.tituloEixoY,
            text: opcoes.tituloEixoY || '',
            font: {
              weight: 'bold'
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4
        }
      },
      ...opcoes
    }
  };

  // Cria e retorna o gráfico
  return new Chart(canvas, config);
}

/**
 * Cria um treemap para mostrar distribuição hierárquica de indicadores
 * @param {string} canvasId - ID do elemento canvas
 * @param {Object} dados - Dados para o treemap
 * @param {string} titulo - Título do gráfico
 * @param {Object} opcoes - Opções adicionais
 * @returns {Chart} Instância do gráfico
 */
export function criarTreeMap(canvasId, dados, titulo, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado`);
    return null;
  }

  // Converte dados para o formato esperado pelo treemap
  const processedData = processarDadosTreemap(dados);

  // Configurações do gráfico
  const config = {
    type: 'treemap',
    data: {
      datasets: [{
        tree: processedData,
        key: 'value',
        groups: ['grupo'],
        spacing: 2,
        backgroundColor: ctx => {
          if (!ctx.raw) return 'rgba(0,0,0,0.1)';
          
          // Usa cores diferentes para cada grupo
          const grupo = ctx.raw._data.grupo;
          const grupos = [...new Set(dados.map(item => item.grupo))];
          const index = grupos.indexOf(grupo);
          return obterCorODS(index);
        },
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        labels: {
          display: true,
          formatter: ctx => {
            if (!ctx.raw) return '';
            return [ctx.raw._data.label, ctx.raw._data.valor];
          },
          color: ctx => {
            if (!ctx.raw) return '#000';
            // Contraste da cor do texto baseado na cor de fundo
            const backgroundColor = ctx.raw.backgroundColor;
            return isColorBright(backgroundColor) ? '#000' : '#fff';
          },
          font: {
            size: 14
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!titulo,
          text: titulo,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: items => items[0].raw._data.label,
            label: item => {
              return [
                `Grupo: ${item.raw._data.grupo}`,
                `Valor: ${item.raw._data.valor}${item.raw._data.unidade || ''}`
              ];
            }
          }
        }
      },
      ...opcoes
    }
  };

  // Se o plugin TreeMap não está disponível, exibe alerta
  if (!Chart.controllers.treemap) {
    console.error('Plugin Chart.js Treemap não está disponível. Certifique-se de incluir o plugin.');
    
    // Fallback para um gráfico de barras empilhadas
    return criarGraficoBarrasEmpilhadas(
      canvasId, 
      dados.map(d => ({label: d.label, valor: d.valor, grupo: d.grupo})),
      titulo,
      opcoes
    );
  }

  // Cria e retorna o treemap
  return new Chart(canvas, config);
}

// Funções auxiliares

/**
 * Obtém uma cor da paleta ODS pelo índice
 * @param {number} index - Índice da cor
 * @returns {string} - Cor hexadecimal
 */
function obterCorODS(index) {
  const cores = Object.values(CORES_ODS);
  return cores[index % cores.length];
}

/**
 * Converte cor hexadecimal para rgba
 * @param {string} hex - Cor em formato hexadecimal
 * @param {number} alpha - Valor de transparência (0-1)
 * @returns {string} - Cor em formato rgba
 */
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(128, 128, 128, ${alpha})`;
  
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
  }
  return hex;
}

/**
 * Verifica se uma cor é clara ou escura
 * @param {string} color - Cor em formato hexadecimal ou rgba
 * @returns {boolean} - Verdadeiro se a cor é clara
 */
function isColorBright(color) {
  // Para cores rgba
  if (color.startsWith('rgba')) {
    const parts = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d*(?:\.\d+)?)\)/i);
    if (parts) {
      const r = parseInt(parts[1]);
      const g = parseInt(parts[2]);
      const b = parseInt(parts[3]);
      // Fórmula de luminância relativa
      return (0.299 * r + 0.587 * g + 0.114 * b) > 128;
    }
  }
  
  // Para cores hexadecimais
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 128;
  }
  
  return true; // Default para cores desconhecidas
}

/**
 * Escala um valor entre um mínimo e máximo para um novo intervalo
 * @param {number} valor - Valor a ser escalado
 * @param {number} min - Valor mínimo original
 * @param {number} max - Valor máximo original
 * @param {number} novoMin - Novo valor mínimo
 * @param {number} novoMax - Novo valor máximo
 * @returns {number} - Valor escalado
 */
function escalarValor(valor, min, max, novoMin, novoMax) {
  return ((valor - min) / (max - min)) * (novoMax - novoMin) + novoMin;
}

/**
 * Processa dados para formato esperado pelo treemap
 * @param {Array<Object>} dados - Dados para o treemap
 * @returns {Object} - Dados processados
 */
function processarDadosTreemap(dados) {
  if (!dados || !Array.isArray(dados)) return [];
  
  return dados.map(item => ({
    grupo: item.grupo || 'Geral',
    label: item.label,
    value: item.valor,
    valor: item.valor,
    unidade: item.unidade || ''
  }));
}

/**
 * Adiciona imagem do mapa de Sergipe como overlay em um canvas
 * @param {HTMLElement} canvas - Elemento canvas para adicionar o mapa
 */
function adicionarMapaSergipeOverlay(canvas) {
  // Esta função usaria uma imagem SVG ou PNG do mapa de Sergipe
  // e a sobreporia sobre o canvas do gráfico
  console.info('Função para adicionar mapa overlay não implementada');
  // A implementação completa exigiria uma imagem do mapa e posicionamento preciso
}

/**
 * Cria plugin para legendas acessíveis
 * @returns {Object} Plugin de legenda acessível
 */
function criarPluginLegendaAcessivel() {
  return {
    id: 'htmlLegend',
    afterUpdate: (chart, args, options) => {
      const legendContainer = document.getElementById(`legenda-${chart.canvas.id}`);
      if (!legendContainer) return;
      
      legendContainer.innerHTML = '';
      
      // Cabeçalho da tabela
      const table = document.createElement('table');
      table.style.margin = 'auto';
      table.setAttribute('role', 'region');
      table.setAttribute('aria-label', 'Legenda do gráfico');
      
      // Corpo da tabela
      const tbody = document.createElement('tbody');
      
      chart.data.datasets.forEach((dataset, i) => {
        const row = document.createElement('tr');
        
        // Célula com a cor
        const colorCell = document.createElement('td');
        colorCell.style.width = '20px';
        
        const colorBox = document.createElement('div');
        colorBox.style.width = '15px';
        colorBox.style.height = '15px';
        colorBox.style.background = dataset.borderColor;
        colorBox.style.borderRadius = '3px';
        
        colorCell.appendChild(colorBox);
        row.appendChild(colorCell);
        
        // Célula com o texto da legenda
        const textCell = document.createElement('td');
        textCell.textContent = dataset.label;
        textCell.style.paddingLeft = '10px';
        row.appendChild(textCell);
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      legendContainer.appendChild(table);
      
      // Texto de descrição para leitores de tela
      const descricao = document.createElement('div');
      descricao.className = 'sr-only';
      descricao.textContent = `Este gráfico contém ${chart.data.datasets.length} séries de dados: ${chart.data.datasets.map(d => d.label).join(', ')}`;
      legendContainer.appendChild(descricao);
    }
  };
}

/**
 * Gera um gráfico de barras empilhadas (fallback para treemap)
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array<Object>} dados - Dados para o gráfico
 * @param {string} titulo - Título do gráfico
 * @param {Object} opcoes - Opções adicionais
 * @returns {Chart} - Instância do gráfico
 */
function criarGraficoBarrasEmpilhadas(canvasId, dados, titulo, opcoes = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas com ID ${canvasId} não encontrado`);
    return null;
  }
  
  // Agrupa dados por grupo
  const grupos = [...new Set(dados.map(d => d.grupo))];
  const labels = [...new Set(dados.map(d => d.label))];
  
  const datasets = grupos.map((grupo, i) => {
    const dadosGrupo = dados.filter(d => d.grupo === grupo);
    
    return {
      label: grupo,
      data: labels.map(label => {
        const item = dadosGrupo.find(d => d.label === label);
        return item ? item.valor : 0;
      }),
      backgroundColor: obterCorODS(i),
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 1
    };
  });
  
  // Configurações do gráfico
  const config = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!titulo,
          text: titulo,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true
        }
      },
      ...opcoes
    }
  };
  
  // Cria e retorna o gráfico
  return new Chart(canvas, config);
}