/**
 * Script principal para o Dashboard ODS Sergipe
 */
import { logger, monitorPerformance } from '../../services/monitoring.js';
import { buscarDadosAPI, limparCache } from '../../services/api/carregador-dados.js';
import { ODS_COLORS, ODS_INDICATORS } from '../../constants/ods.js';
import { DASHBOARD_CONFIG, getOdsColor, verificarStatusMeta } from './dashboard-config.js';
import graficos from '../../components/charts/grafico-indicador.js';

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', inicializarDashboard);

/**
 * Inicializa o Dashboard ODS
 */
async function inicializarDashboard() {
  logger.info('Inicializando Dashboard ODS');
  const medicaoTotal = monitorPerformance.iniciarMedicao('inicializacao_dashboard');

  try {
    // Carrega menu e footer
    await Promise.all([
      carregarGridODS(),
      carregarIndicadoresDestaque(),
      carregarGraficosComparativos()
    ]);

    // Configura eventos
    configurarEventos();
    
    // Atualiza data de atualização
    atualizarDataAtualizacao();
    
    const duracaoTotal = monitorPerformance.finalizarMedicao(medicaoTotal);
    logger.info(`Dashboard inicializado em ${duracaoTotal.toFixed(2)}ms`);
  } catch (erro) {
    logger.error('Erro ao inicializar dashboard:', erro);
    exibirMensagemErro('Ocorreu um erro ao carregar o dashboard. Por favor, tente novamente mais tarde.');
  }
}

/**
 * Carrega o grid com os 17 ODS
 */
function carregarGridODS() {
  const odsGrid = document.querySelector('.ods-grid');
  if (!odsGrid) return;

  // Limpa o grid
  odsGrid.innerHTML = '';
  
  // Adiciona cada ODS ao grid
  for (let i = 1; i <= 17; i++) {
    // Obtém informações do ODS
    const odsKey = `ODS${i}`;
    const odsInfo = ODS_INDICATORS[odsKey] || {
      title: `ODS ${i}`,
      icon: `../../assets/images/logo-icons-coloridos-${String(i).padStart(2, '0')}.png`
    };
    const odsColor = ODS_COLORS[odsKey] || '#cccccc';
    
    // Cria o elemento do ODS
    const odsElement = document.createElement('div');
    odsElement.className = 'ods-item';
    odsElement.dataset.ods = i;
    odsElement.style.borderColor = odsColor;
    
    odsElement.innerHTML = `
      <img src="${odsInfo.icon}" alt="ODS ${i}" class="ods-icon">
      <div class="ods-content">
        <h3 class="ods-number">ODS ${i}</h3>
        <p class="ods-title">${odsInfo.title}</p>
      </div>
    `;
    
    // Adiciona evento de clique para navegar para a página específica do ODS
    odsElement.addEventListener('click', () => {
      window.location.href = `../ods-specific/${i}/`;
    });
    
    // Adiciona o elemento ao grid
    odsGrid.appendChild(odsElement);
  }
}

/**
 * Carrega os indicadores em destaque
 */
async function carregarIndicadoresDestaque() {
  const indicadoresContainer = document.getElementById('indicadores-destaque');
  if (!indicadoresContainer) return;
  
  try {
    // Limpa o container
    indicadoresContainer.innerHTML = '';
    
    const { indicadoresDestaque } = DASHBOARD_CONFIG;
    const promessasCarregamento = [];
    
    // Para cada indicador em destaque, busca os dados e cria o card
    for (const indicadorConfig of indicadoresDestaque) {
      const promessa = (async () => {
        try {
          // Busca dados do indicador
          const dados = await buscarDadosAPI(indicadorConfig.endpoint);
          
          // Cria o card do indicador
          const card = criarCardIndicador(indicadorConfig, dados);
          
          // Adiciona o card ao container
          indicadoresContainer.appendChild(card);
          
          return { sucesso: true, id: indicadorConfig.id };
        } catch (erro) {
          logger.error(`Erro ao carregar indicador ${indicadorConfig.id}:`, erro);
          
          // Cria o card com erro
          const cardErro = criarCardIndicadorErro(indicadorConfig);
          indicadoresContainer.appendChild(cardErro);
          
          return { sucesso: false, id: indicadorConfig.id, erro };
        }
      })();
      
      promessasCarregamento.push(promessa);
    }
    
    // Aguarda todos os indicadores carregarem
    await Promise.allSettled(promessasCarregamento);
    
  } catch (erro) {
    logger.error('Erro ao carregar indicadores em destaque:', erro);
    indicadoresContainer.innerHTML = `
      <div class="error-message">
        <p>Não foi possível carregar os indicadores.</p>
        <button class="btn-retry">Tentar novamente</button>
      </div>
    `;
    
    indicadoresContainer.querySelector('.btn-retry')?.addEventListener('click', () => {
      carregarIndicadoresDestaque();
    });
  }
}

/**
 * Cria um card para o indicador
 * @param {Object} config - Configuração do indicador
 * @param {Object} dados - Dados do indicador
 * @returns {HTMLElement} Elemento do card
 */
function criarCardIndicador(config, dados) {
  const { id, ods, titulo, descricao, unidade, fonte } = config;
  const odsColor = getOdsColor(ods);
  
  // Obtém o valor mais recente do indicador
  const valorAtual = dados?.valor || 'N/D';
  const ano = dados?.ano || 'N/A';
  
  // Verifica o status do indicador em relação à meta
  const statusMeta = verificarStatusMeta(id, valorAtual);
  
  // Cria o card
  const card = document.createElement('div');
  card.className = `indicator-card status-${statusMeta.status || 'indefinido'}`;
  card.dataset.ods = ods;
  card.dataset.id = id;
  
  card.innerHTML = `
    <div class="card-header" style="background-color: ${odsColor}">
      <div class="ods-badge">ODS ${ods}</div>
      <h3 class="indicator-title">${titulo}</h3>
    </div>
    <div class="card-body">
      <div class="indicator-value-wrapper">
        <p class="indicator-value">${valorAtual}<span class="indicator-unit">${unidade}</span></p>
        <p class="indicator-year">${ano}</p>
      </div>
      <div class="indicator-description">
        <p>${descricao}</p>
        <p class="indicator-source">Fonte: ${fonte}</p>
      </div>
    </div>
    <div class="card-footer">
      <div class="meta-status">
        <span class="status-badge status-${statusMeta.status || 'indefinido'}">${statusMeta.mensagem || 'Status indefinido'}</span>
      </div>
      <div class="card-actions">
        <button class="btn-details" data-id="${id}" data-ods="${ods}">Ver detalhes</button>
        <button class="btn-export" data-id="${id}">Exportar CSV</button>
      </div>
    </div>
  `;
  
  // Adiciona eventos
  card.querySelector('.btn-details')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `../ods-specific/${ods}/`;
  });
  
  card.querySelector('.btn-export')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportarCSVIndicador(id, titulo);
  });
  
  return card;
}

/**
 * Cria um card de erro para indicador que falhou ao carregar
 * @param {Object} config - Configuração do indicador
 * @returns {HTMLElement} Elemento do card
 */
function criarCardIndicadorErro(config) {
  const { id, ods, titulo } = config;
  const odsColor = getOdsColor(ods);
  
  const card = document.createElement('div');
  card.className = 'indicator-card error';
  card.dataset.ods = ods;
  card.dataset.id = id;
  
  card.innerHTML = `
    <div class="card-header" style="background-color: ${odsColor}">
      <div class="ods-badge">ODS ${ods}</div>
      <h3 class="indicator-title">${titulo}</h3>
    </div>
    <div class="card-body error-body">
      <p class="error-message">Não foi possível carregar este indicador.</p>
      <button class="btn-retry">Tentar novamente</button>
    </div>
  `;
  
  card.querySelector('.btn-retry')?.addEventListener('click', async () => {
    try {
      const dados = await buscarDadosAPI(config.endpoint);
      const cardAtualizado = criarCardIndicador(config, dados);
      card.replaceWith(cardAtualizado);
    } catch (erro) {
      logger.error(`Erro ao recarregar indicador ${id}:`, erro);
      // O card de erro já está sendo exibido, então não é necessário fazer nada
    }
  });
  
  return card;
}

/**
 * Carrega os gráficos comparativos
 */
async function carregarGraficosComparativos() {
  try {
    const { graficosComparativos } = DASHBOARD_CONFIG.visualizacao;
    
    // Para cada configuração de gráfico comparativo
    for (const graficoConfig of graficosComparativos) {
      const { id, titulo, tipo, indicadores } = graficoConfig;
      
      // Obtém o container do gráfico
      const container = document.getElementById(id);
      if (!container) continue;
      
      // Busca os dados de cada indicador
      const dadosIndicadores = await Promise.all(
        indicadores.map(async (indId) => {
          try {
            const indicadorConfig = DASHBOARD_CONFIG.indicadoresDestaque.find(i => i.id === indId);
            if (!indicadorConfig) return null;
            
            const dados = await buscarDadosAPI(indicadorConfig.endpoint);
            return {
              id: indId,
              config: indicadorConfig,
              dados
            };
          } catch (erro) {
            logger.error(`Erro ao buscar dados para gráfico comparativo (${indId}):`, erro);
            return null;
          }
        })
      );
      
      // Filtra indicadores que falharam
      const indicadoresValidos = dadosIndicadores.filter(Boolean);
      
      if (indicadoresValidos.length === 0) {
        container.innerHTML = '<p class="error-message">Não foi possível carregar os dados para este gráfico.</p>';
        continue;
      }
      
      // Prepara dados para o gráfico
      // Exemplo: buscar série histórica de cada indicador (esse seria um exemplo para linha do tempo)
      // Aqui seria necessário adaptar conforme o formato dos seus dados
      
      // Renderiza o gráfico baseado no tipo
      if (tipo === 'linha') {
        renderizarGraficoLinhaComparativo(container, indicadoresValidos, { titulo });
      } else if (tipo === 'barra') {
        renderizarGraficoBarraComparativo(container, indicadoresValidos, { titulo });
      }
    }
    
    // Configura as abas dos gráficos
    configurarAbasGraficos();
    
  } catch (erro) {
    logger.error('Erro ao carregar gráficos comparativos:', erro);
  }
}

/**
 * Renderiza um gráfico de linha comparativo
 */
function renderizarGraficoLinhaComparativo(container, indicadoresValidos, opcoes) {
  // Implementação simplificada - aqui seria necessário adaptar conforme seu formato de dados
  // Esta é uma versão de exemplo
  
  container.innerHTML = '<canvas></canvas>';
  const canvas = container.querySelector('canvas');
  
  const datasets = indicadoresValidos.map((indicador, index) => {
    const cor = getOdsColor(indicador.config.ods);
    return {
      label: indicador.config.titulo,
      data: [60, 65, 70, 75, 80, 85, 90], // Dados simulados para exemplo
      borderColor: cor,
      backgroundColor: `${cor}33`,
      tension: 0.2
    };
  });
  
  const labels = ['2017', '2018', '2019', '2020', '2021', '2022', '2023'];
  
  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: opcoes.titulo || 'Comparativo de Indicadores'
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de barra comparativo
 */
function renderizarGraficoBarraComparativo(container, indicadoresValidos, opcoes) {
  // Implementação simplificada similar à função acima
  // Aqui usaria graficos.barra() do seu componente de gráficos
}

/**
 * Configura as abas para alternar entre gráficos
 */
function configurarAbasGraficos() {
  const tabs = document.querySelectorAll('.chart-tab');
  const chartWrappers = document.querySelectorAll('.chart-wrapper');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove a classe ativa de todas as abas
      tabs.forEach(t => t.classList.remove('active'));
      // Adiciona a classe ativa na aba clicada
      tab.classList.add('active');
      
      // Esconde todos os gráficos
      chartWrappers.forEach(wrapper => {
        wrapper.style.display = 'none';
      });
      
      // Mostra o gráfico correspondente
      const chartId = tab.dataset.chart;
      const chartWrapper = document.getElementById(`grafico-comparativo-${chartId}`);
      if (chartWrapper) {
        chartWrapper.style.display = 'block';
      }
    });
  });
}

/**
 * Configura eventos para os elementos interativos do dashboard
 */
function configurarEventos() {
  // Botão para atualizar dados
  const btnAtualizar = document.getElementById('btn-atualizar');
  if (btnAtualizar) {
    btnAtualizar.addEventListener('click', async () => {
      try {
        // Limpa o cache para buscar dados atualizados
        limparCache();
        
        // Recarrega o dashboard
        await Promise.all([
          carregarIndicadoresDestaque(),
          carregarGraficosComparativos()
        ]);
        
        // Atualiza a data de atualização
        atualizarDataAtualizacao();
        
        // Exibe mensagem de sucesso
        exibirMensagemSucesso('Dados atualizados com sucesso!');
      } catch (erro) {
        logger.error('Erro ao atualizar dados:', erro);
        exibirMensagemErro('Erro ao atualizar os dados. Por favor, tente novamente.');
      }
    });
  }
  
  // Botão para exportar todos os dados
  const btnExportarTodos = document.getElementById('btn-exportar-todos');
  if (btnExportarTodos) {
    btnExportarTodos.addEventListener('click', exportarTodosCSV);
  }
  
  // Filtros
  const filtros = ['filtro-dimensao', 'filtro-ano', 'filtro-regiao'];
  filtros.forEach(filtroId => {
    const elemento = document.getElementById(filtroId);
    if (elemento) {
      elemento.addEventListener('change', aplicarFiltros);
    }
  });
}

/**
 * Aplica os filtros selecionados aos indicadores
 */
function aplicarFiltros() {
  // Implementação do filtro
  const dimensao = document.getElementById('filtro-dimensao')?.value || 'todas';
  const ano = document.getElementById('filtro-ano')?.value || '2023';
  const regiao = document.getElementById('filtro-regiao')?.value || 'sergipe';
  
  logger.info(`Aplicando filtros: dimensão=${dimensao}, ano=${ano}, região=${regiao}`);
  
  // Aqui implementaria a lógica de filtragem
  // Esta é uma implementação de exemplo
  
  // Para filtrar por dimensão
  if (dimensao !== 'todas') {
    const odsDaDimensao = DASHBOARD_CONFIG.filtros.dimensoes
      .find(d => d.id === dimensao)?.ods || [];
    
    // Destacar os ODS da dimensão selecionada
    document.querySelectorAll('.ods-item').forEach(item => {
      const odsNumero = parseInt(item.dataset.ods);
      if (odsDaDimensao.includes(odsNumero)) {
        item.classList.add('destaque');
      } else {
        item.classList.remove('destaque');
      }
    });
    
    // Filtrar indicadores
    document.querySelectorAll('.indicator-card').forEach(card => {
      const odsNumero = parseInt(card.dataset.ods);
      if (odsDaDimensao.includes(odsNumero)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  } else {
    // Mostrar todos
    document.querySelectorAll('.ods-item').forEach(item => {
      item.classList.remove('destaque');
    });
    
    document.querySelectorAll('.indicator-card').forEach(card => {
      card.style.display = '';
    });
  }
  
  // Logica adicional para filtros de ano e região seria implementada aqui
  // Isso exigiria buscar dados históricos ou por região
}

/**
 * Exporta todos os dados em formato CSV
 */
function exportarTodosCSV() {
  try {
    // Implementação simplificada da exportação
    logger.info('Exportando todos os dados em CSV');
    
    const indicadores = DASHBOARD_CONFIG.indicadoresDestaque;
    
    // Cria cabeçalho do CSV
    let csvContent = 'ODS,Indicador,Valor,Unidade,Ano,Fonte\n';
    
    // Adiciona cada indicador ao CSV
    indicadores.forEach(indicador => {
      const card = document.querySelector(`.indicator-card[data-id="${indicador.id}"]`);
      
      if (card) {
        const valor = card.querySelector('.indicator-value')?.textContent || 'N/D';
        const ano = card.querySelector('.indicator-year')?.textContent || 'N/A';
        
        csvContent += `${indicador.ods},${indicador.titulo},${valor},${indicador.unidade},${ano},${indicador.fonte}\n`;
      }
    });
    
    // Cria um blob e um link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `painel-ods-sergipe-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    exibirMensagemSucesso('Dados exportados com sucesso!');
  } catch (erro) {
    logger.error('Erro ao exportar dados:', erro);
    exibirMensagemErro('Erro ao exportar os dados. Por favor, tente novamente.');
  }
}

/**
 * Exporta dados de um indicador específico em formato CSV
 * @param {string} indicadorId - ID do indicador
 * @param {string} titulo - Título do indicador para o nome do arquivo
 */
function exportarCSVIndicador(indicadorId, titulo) {
  try {
    // Implementação simplificada da exportação de um indicador
    logger.info(`Exportando dados do indicador ${indicadorId} em CSV`);
    
    const indicador = DASHBOARD_CONFIG.indicadoresDestaque.find(i => i.id === indicadorId);
    if (!indicador) {
      throw new Error(`Indicador ${indicadorId} não encontrado`);
    }
    
    const card = document.querySelector(`.indicator-card[data-id="${indicadorId}"]`);
    if (!card) {
      throw new Error(`Card do indicador ${indicadorId} não encontrado`);
    }
    
    const valor = card.querySelector('.indicator-value')?.textContent || 'N/D';
    const ano = card.querySelector('.indicator-year')?.textContent || 'N/A';
    
    // Cria CSV
    let csvContent = 'ODS,Indicador,Valor,Unidade,Ano,Fonte\n';
    csvContent += `${indicador.ods},${indicador.titulo},${valor},${indicador.unidade},${ano},${indicador.fonte}\n`;
    
    // Cria download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const nomeArquivo = titulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${nomeArquivo}-${ano}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    exibirMensagemSucesso('Dados exportados com sucesso!');
  } catch (erro) {
    logger.error(`Erro ao exportar dados do indicador ${indicadorId}:`, erro);
    exibirMensagemErro('Erro ao exportar os dados. Por favor, tente novamente.');
  }
}

/**
 * Atualiza a data de atualização exibida
 */
function atualizarDataAtualizacao() {
  const dataElement = document.getElementById('data-atualizacao');
  if (!dataElement) return;
  
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  dataElement.textContent = dataFormatada;
}

/**
 * Exibe uma mensagem de sucesso temporária
 * @param {string} mensagem - Mensagem a ser exibida
 */
function exibirMensagemSucesso(mensagem) {
  criarMensagemTemporaria(mensagem, 'success');
}

/**
 * Exibe uma mensagem de erro temporária
 * @param {string} mensagem - Mensagem a ser exibida
 */
function exibirMensagemErro(mensagem) {
  criarMensagemTemporaria(mensagem, 'error');
}

/**
 * Cria uma mensagem temporária que desaparece após alguns segundos
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo de mensagem ('success', 'error', 'warning', 'info')
 */
function criarMensagemTemporaria(mensagem, tipo = 'info') {
  // Verifica se já existe um container para mensagens
  let container = document.querySelector('.toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  // Cria a mensagem
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-content">
      <p>${mensagem}</p>
      <button class="toast-close" aria-label="Fechar">&times;</button>
    </div>
  `;
  
  // Adiciona ao container
  container.appendChild(toast);
  
  // Adiciona evento para fechar
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      toast.remove();
      
      // Remove o container se não houver mais mensagens
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  });
  
  // Remove automaticamente após 5 segundos
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
  
  // Anima entrada
  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 10);
}
