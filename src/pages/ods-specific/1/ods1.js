/**
 * Script específico para a página do ODS 1 - Erradicação da Pobreza
 */
import { buscarDadosAPI } from '../../../services/api/carregador-dados.js';
import { logger } from '../../../services/monitoring.js';
import { ODS_COLORS } from '../../../constants/ods.js';

// Biblioteca de gráficos (importação será configurada via Vite)
import Chart from 'chart.js/auto';

// Cor principal do ODS 1
const ODS1_COLOR = ODS_COLORS.ODS1;

document.addEventListener('DOMContentLoaded', async () => {
  logger.info('Página ODS 1 carregada');
  
  try {
    // Carrega indicadores principais
    await carregarDadosPrincipais();
    
    // Carrega o mapa
    carregarMapaDistribuicao();
    
    // Análise de tendências
    analisarTendencias();
  } catch (erro) {
    logger.error('Erro ao inicializar página ODS 1:', erro);
    mostrarErro('Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.');
  }
});

/**
 * Carrega os dados principais do ODS 1
 */
async function carregarDadosPrincipais() {
  try {
    // Busca dados da taxa de extrema pobreza
    const dadosExtremaPobrezaPromise = buscarDadosAPI('POBREZA');
    
    // Busca dados da taxa de pobreza
    const dadosPobrezaTotalPromise = buscarDadosAPI('POBREZA_TOTAL');
    
    // Busca dados do índice de Gini
    const dadosGiniPromise = buscarDadosAPI('GINI');
    
    // Aguarda todas as promessas serem resolvidas
    const [dadosExtremaPobrezaResult, dadosPobrezaTotalResult, dadosGiniResult] = 
      await Promise.allSettled([
        dadosExtremaPobrezaPromise,
        dadosPobrezaTotalPromise,
        dadosGiniPromise
      ]);
    
    // Processa os dados da extrema pobreza
    if (dadosExtremaPobrezaResult.status === 'fulfilled') {
      const dados = dadosExtremaPobrezaResult.value;
      renderizarIndicador('taxa-pobreza', dados.valor, '%');
      renderizarGrafico('chart-pobreza', dados.historico || [], 'Taxa de Extrema Pobreza (%)', ODS1_COLOR);
      document.getElementById('atualizacao-pobreza').textContent = dados.ano || 'N/D';
    } else {
      renderizarIndicadorErro('taxa-pobreza');
    }
    
    // Processa os dados da pobreza total
    if (dadosPobrezaTotalResult.status === 'fulfilled') {
      const dados = dadosPobrezaTotalResult.value;
      renderizarIndicador('taxa-pobreza-total', dados.valor, '%');
      renderizarGrafico('chart-pobreza-total', dados.historico || [], 'Taxa de Pobreza (%)', ODS1_COLOR);
      document.getElementById('atualizacao-pobreza-total').textContent = dados.ano || 'N/D';
    } else {
      renderizarIndicadorErro('taxa-pobreza-total');
    }
    
    // Processa os dados do Gini
    if (dadosGiniResult.status === 'fulfilled') {
      const dados = dadosGiniResult.value;
      renderizarIndicador('indice-gini', dados.valor);
      renderizarGrafico('chart-gini', dados.historico || [], 'Índice de Gini', ODS1_COLOR);
      document.getElementById('atualizacao-gini').textContent = dados.ano || 'N/D';
    } else {
      renderizarIndicadorErro('indice-gini');
    }
  } catch (erro) {
    logger.error('Erro ao carregar dados principais:', erro);
    throw erro;
  }
}

/**
 * Renderiza um indicador na interface
 * @param {string} elementoId - ID do elemento HTML
 * @param {number|string} valor - Valor do indicador
 * @param {string} unidade - Unidade de medida (opcional)
 */
function renderizarIndicador(elementoId, valor, unidade = '') {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;
  
  // Formata o valor se for numérico
  let valorFormatado = valor;
  if (typeof valor === 'number') {
    valorFormatado = valor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }
  
  elemento.innerHTML = `<span class="value">${valorFormatado}</span><span class="unit">${unidade}</span>`;
}

/**
 * Renderiza um estado de erro para um indicador
 * @param {string} elementoId - ID do elemento HTML
 */
function renderizarIndicadorErro(elementoId) {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;
  
  elemento.innerHTML = `<span class="error">Dados indisponíveis</span>`;
}

/**
 * Renderiza um gráfico de linha para o histórico de um indicador
 * @param {string} elementoId - ID do elemento HTML do gráfico
 * @param {Array} dadosHistorico - Array com dados históricos
 * @param {string} labelGrafico - Rótulo do gráfico
 * @param {string} corLinha - Cor da linha do gráfico
 */
function renderizarGrafico(elementoId, dadosHistorico, labelGrafico, corLinha) {
  const elemento = document.getElementById(elementoId);
  if (!elemento || !dadosHistorico || dadosHistorico.length === 0) {
    // Se não houver elemento ou dados, exibe mensagem
    if (elemento) {
      elemento.innerHTML = '<p class="no-data">Dados históricos indisponíveis</p>';
    }
    return;
  }
  
  // Prepara os dados para o gráfico
  const anos = dadosHistorico.map(item => item.ano);
  const valores = dadosHistorico.map(item => item.valor);
  
  // Cria o elemento canvas para o gráfico
  elemento.innerHTML = '<canvas></canvas>';
  const ctx = elemento.querySelector('canvas').getContext('2d');
  
  // Cria o gráfico usando Chart.js
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: anos,
      datasets: [{
        label: labelGrafico,
        data: valores,
        borderColor: corLinha,
        backgroundColor: `${corLinha}33`, // Cor com transparência
        tension: 0.3,
        fill: true
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
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#666'
          }
        },
        x: {
          ticks: {
            color: '#666'
          }
        }
      }
    }
  });
}

/**
 * Carrega o mapa de distribuição da pobreza em Sergipe
 */
function carregarMapaDistribuicao() {
  const mapaContainer = document.getElementById('map-ods1');
  if (!mapaContainer) return;
  
  // Temporariamente, exibimos uma mensagem
  // Em uma implementação real, carregaríamos um mapa interativo
  mapaContainer.innerHTML = `
    <div class="map-placeholder">
      <p>Mapa de distribuição da pobreza por municípios de Sergipe.</p>
      <p class="map-info">O mapa interativo está sendo carregado...</p>
    </div>
  `;
  
  // Simulação de carregamento do mapa (em implementação real, usaríamos uma biblioteca como Leaflet)
  setTimeout(() => {
    mapaContainer.innerHTML = `
      <div class="map-placeholder">
        <p>Mapa de distribuição da pobreza por municípios de Sergipe.</p>
        <p class="map-info">Os municípios do alto sertão sergipano apresentam as maiores taxas de pobreza do estado.</p>
        <p class="map-legend">
          <span class="legend-item"><span class="color-box high"></span> Alta incidência (&gt;25%)</span>
          <span class="legend-item"><span class="color-box medium"></span> Média incidência (15-25%)</span>
          <span class="legend-item"><span class="color-box low"></span> Baixa incidência (&lt;15%)</span>
        </p>
      </div>
    `;
  }, 1500);
}

/**
 * Analisa tendências dos dados e atualiza a interface
 */
function analisarTendencias() {
  // Simulação de análise de tendências
  // Em implementação real, analisaríamos os dados para determinar tendências
  const tendencias = ["redução gradual", "estabilização", "aumento preocupante"];
  const tendenciaAtual = tendencias[0]; // Utilizamos "redução gradual" como exemplo
  
  const elementoTendencia = document.getElementById('tendencia-pobreza');
  if (elementoTendencia) {
    elementoTendencia.textContent = tendenciaAtual;
  }
}

/**
 * Exibe uma mensagem de erro geral na página
 * @param {string} mensagem - Mensagem de erro
 */
function mostrarErro(mensagem) {
  // Cria elemento de alerta para exibir o erro
  const alerta = document.createElement('div');
  alerta.className = 'erro-alerta';
  alerta.innerHTML = `
    <p>${mensagem}</p>
    <button class="btn-fechar">Fechar</button>
  `;
  
  // Adiciona o alerta ao corpo do documento
  document.body.appendChild(alerta);
  
  // Configura o botão para fechar o alerta
  const btnFechar = alerta.querySelector('.btn-fechar');
  if (btnFechar) {
    btnFechar.addEventListener('click', () => {
      alerta.remove();
    });
  }
  
  // Remove o alerta após 10 segundos
  setTimeout(() => {
    if (document.body.contains(alerta)) {
      alerta.remove();
    }
  }, 10000);
}

// Exporta funções para uso em testes
export {
  carregarDadosPrincipais,
  renderizarIndicador,
  renderizarGrafico,
  carregarMapaDistribuicao,
  analisarTendencias
};
