/**
 * @file painel-ods.js
 * @description Código principal para o painel de visualização dos ODS
 * @version 2.1.0
 */

import { carregarIndicadores, configurarExportacaoCSV } from './modules/indicadoresLoader.js';
import { inicializarAcessibilidade } from './modules/acessibilidade.js';
import { inicializarLazyLoading } from './modules/lazyLoader.js';
import { inicializarCache } from './modules/cacheMultinivel.js';
import { configurarCache } from './modules/carregadorDados.js';

// Inicialização do módulo
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Inicializa sistema de cache multinível
    await inicializarCache({
      ativado: true,
      tempoExpiracao: 1000 * 60 * 60 * 24, // 24 horas em milissegundos
      usarLocalStorage: true,
      usarIndexedDB: true
    });
    
    // Configura o carregador de dados para usar o cache
    configurarCache(true);
    
    // Inicializa recursos de acessibilidade
    if (typeof inicializarAcessibilidade === 'function') {
      inicializarAcessibilidade();
    }
    
    // Exibe indicador de carregamento
    mostrarCarregando(true);
    
    // Inicializa o lazy loading para elementos visuais
    inicializarLazyLoading({
      rootMargin: '200px', // Carrega elementos quando estiverem a 200px de distância da viewport
      threshold: 0.1,      // Carrega quando pelo menos 10% do elemento estiver visível
    });
    
    // Carrega e renderiza todos os indicadores
    const dados = await carregarIndicadores();
    
    // Configura exportação de dados em CSV
    configurarExportacaoCSV('btn-exportar-todos', dados.indicadores);
    
    // Configura eventos adicionais de usuário
    configurarEventos();
    
    // Oculta indicador de carregamento
    mostrarCarregando(false);
    
    // Adiciona botão para limpeza de cache se estiver em modo de desenvolvimento
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      adicionarBotaoLimpezaCache();
    }
    
  } catch (erro) {
    console.error('Erro ao inicializar painel:', erro);
    mostrarCarregando(false);
    mostrarErro('Ocorreu um erro ao carregar o painel. Por favor, tente novamente mais tarde.');
  }
});

/**
 * Mostra ou oculta o indicador de carregamento
 * @param {boolean} mostrar - Se verdadeiro, mostra o indicador
 */
function mostrarCarregando(mostrar) {
  const loadingEl = document.getElementById('loading-indicator');
  if (loadingEl) {
    loadingEl.style.display = mostrar ? 'block' : 'none';
    loadingEl.setAttribute('aria-hidden', !mostrar);
  }
}

/**
 * Mostra mensagem de erro
 * @param {string} mensagem - Mensagem de erro
 */
function mostrarErro(mensagem) {
  const erroEl = document.querySelector('.error-message');
  if (erroEl) {
    erroEl.textContent = mensagem;
    erroEl.style.display = 'block';
    erroEl.setAttribute('role', 'alert');
  } else {
    // Cria elemento de erro se não existir
    const containerEl = document.querySelector('#indicadores-ods .container') || document.querySelector('main .container');
    if (containerEl) {
      const novoErroEl = document.createElement('div');
      novoErroEl.className = 'error-message';
      novoErroEl.textContent = mensagem;
      novoErroEl.setAttribute('role', 'alert');
      containerEl.insertBefore(novoErroEl, containerEl.firstChild);
    }
  }
}

/**
 * Configura eventos adicionais da interface
 */
function configurarEventos() {
  // Configurar botões de compartilhamento social
  configurarBotoesCompartilhamento();
  
  // Configurar tooltips para informações complementares
  configurarTooltips();
  
  // Adicionar navegação por teclado para acessibilidade
  configurarNavegacaoTeclado();
  
  // Configurar botão de atualização de dados
  configurarBotaoAtualizarDados();
  
  // Adicionar botão de recarregar dados se não existir
  adicionarBotaoRecarregarDados();
}

/**
 * Adiciona botão de recarga de dados caso não exista na página
 */
function adicionarBotaoRecarregarDados() {
  // Se já existe o botão, não adiciona novamente
  if (document.getElementById('btn-recarregar-dados')) {
    return;
  }
  
  const containerBotoes = document.querySelector('.grafico-card .btn-exportar')?.parentElement;
  
  if (containerBotoes) {
    const btnRecarregar = document.createElement('button');
    btnRecarregar.id = 'btn-recarregar-dados';
    btnRecarregar.className = 'btn-recarregar';
    btnRecarregar.innerHTML = '<i class="fas fa-sync"></i> Atualizar Dados';
    btnRecarregar.setAttribute('aria-label', 'Atualizar dados do servidor');
    
    // Insere antes do botão exportar, se existir
    const btnExportar = document.querySelector('.btn-exportar');
    if (btnExportar) {
      containerBotoes.insertBefore(btnRecarregar, btnExportar);
    } else {
      containerBotoes.appendChild(btnRecarregar);
    }
  }
}

/**
 * Configura botão de atualização de dados
 */
function configurarBotaoAtualizarDados() {
  const btnRecarregar = document.getElementById('btn-recarregar-dados');
  
  if (btnRecarregar) {
    btnRecarregar.addEventListener('click', async () => {
      // A lógica principal agora está no módulo carregadorDados.js
      const odsId = document.body.dataset.pagina;
      
      if (!odsId) {
        alert('Não foi possível identificar o ODS atual.');
        return;
      }
      
      btnRecarregar.disabled = true;
      btnRecarregar.innerHTML = '<i class="fas fa-sync fa-spin"></i> Atualizando...';
      
      try {
        // Importa a função de recarga dinâmica
        const { recarregarDadosODS } = await import('./modules/carregadorDados.js');
        await recarregarDadosODS(odsId);
        
        // Recarrega a página para atualizar todos os componentes visuais
        window.location.reload();
      } catch (erro) {
        alert('Erro ao recarregar dados. Por favor, tente novamente mais tarde.');
        console.error('Erro ao recarregar dados:', erro);
        
        btnRecarregar.disabled = false;
        btnRecarregar.innerHTML = '<i class="fas fa-sync"></i> Atualizar Dados';
      }
    });
  }
}

/**
 * Configura botões de compartilhamento em redes sociais
 */
function configurarBotoesCompartilhamento() {
  const pageTitle = document.title;
  const pageUrl = window.location.href;
  
  const botoes = {
    'twitter-share': `https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}`,
    'facebook-share': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    'linkedin-share': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    'whatsapp-share': `https://api.whatsapp.com/send?text=${encodeURIComponent(pageTitle + ' ' + pageUrl)}`
  };
  
  // Configura botões com IDs específicos
  Object.entries(botoes).forEach(([id, url]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        window.open(url);
      });
    }
  });
  
  // Configura botões gerais da nova interface
  document.querySelectorAll('.btn-social').forEach(btn => {
    if (btn.getAttribute('href') && btn.getAttribute('href') !== '#') {
      return; // Se já tem URL, pula
    }
    
    const rede = btn.classList.contains('btn-twitter') ? 'twitter' :
                btn.classList.contains('btn-facebook') ? 'facebook' :
                btn.classList.contains('btn-linkedin') ? 'linkedin' :
                btn.classList.contains('btn-whatsapp') ? 'whatsapp' : '';
                
    if (rede) {
      const url = botoes[`${rede}-share`];
      if (url) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          window.open(url);
        });
      }
    }
  });
}

/**
 * Configura tooltips para elementos que precisam de informações adicionais
 */
function configurarTooltips() {
  // Verifica se a biblioteca Tippy.js está disponível
  if (typeof tippy === 'function') {
    // Configura tooltips para indicadores
    tippy('.valor-principal', {
      content: 'Clique para ver detalhes históricos',
      placement: 'top',
      theme: 'light-border',
      animation: 'scale'
    });
    
    // Tooltips para botões de exportação
    tippy('.botao-exportar, .botao-exportar-indicador, .btn-exportar', {
      content: 'Exportar dados em formato CSV',
      placement: 'top',
      theme: 'light-border',
      animation: 'scale'
    });
    
    // Tooltips para botão de atualização
    tippy('#btn-recarregar-dados', {
      content: 'Atualizar dados do servidor (ignorar cache)',
      placement: 'top',
      theme: 'light-border',
      animation: 'scale'
    });
  }
}

/**
 * Configura navegação por teclado para melhorar acessibilidade
 */
function configurarNavegacaoTeclado() {
  // Foco para navegação por tabulação nos cards
  const cards = document.querySelectorAll('.card-indicador, .acao-card');
  
  cards.forEach(card => {
    if (!card.getAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }
    
    // Permitir interação via teclado (Enter simula clique no link)
    card.addEventListener('keydown', function(e) {
      // Tecla Enter
      if (e.key === 'Enter') {
        const link = this.querySelector('.btn-ver-mais, .btn-saiba-mais');
        if (link) {
          link.click();
        }
      }
    });
  });
  
  // Navegação por teclado para elementos de compartilhamento
  const botoesSociais = document.querySelectorAll('.btn-social');
  botoesSociais.forEach(btn => {
    btn.setAttribute('role', 'button');
    if (!btn.getAttribute('tabindex')) {
      btn.setAttribute('tabindex', '0');
    }
    
    btn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
}

/**
 * Adiciona botão para limpeza de cache (apenas em ambiente de desenvolvimento)
 */
function adicionarBotaoLimpezaCache() {
  // Cria o botão
  const btnLimparCache = document.createElement('button');
  btnLimparCache.id = 'btn-limpar-cache';
  btnLimparCache.innerText = 'Limpar Cache';
  btnLimparCache.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 8px 15px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  // Adiciona evento para limpeza de cache
  btnLimparCache.addEventListener('click', async () => {
    try {
      const { limparCache } = await import('./modules/cacheMultinivel.js');
      await limparCache();
      alert('Cache limpo com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (erro) {
      console.error('Erro ao limpar cache:', erro);
      alert('Erro ao limpar cache. Consulte o console para detalhes.');
    }
  });
  
  document.body.appendChild(btnLimparCache);
}

/**
 * Gera gráfico comparativo entre múltiplos ODS
 * @param {Array} odsIds - Array com IDs dos ODS a serem comparados
 * @returns {Promise<void>}
 */
export async function gerarGraficoComparativo(odsIds) {
  if (!Array.isArray(odsIds) || odsIds.length === 0) {
    throw new Error('É necessário fornecer pelo menos um ID de ODS para comparação');
  }
  
  try {
    // Importa módulos necessários dinamicamente
    const { carregarDadosODS } = await import('./modules/carregadorDados.js');
    const { renderizarGraficoComparativo } = await import('./modules/renderizadorGraficos.js');
    
    // Busca container para o gráfico, ou cria um se não existir
    let container = document.getElementById('grafico-comparativo-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'grafico-comparativo-container';
      container.className = 'grafico-card';
      
      const titulo = document.createElement('h2');
      titulo.textContent = 'Comparativo entre ODS';
      container.appendChild(titulo);
      
      const graficoContainer = document.createElement('div');
      graficoContainer.className = 'grafico-container';
      graficoContainer.style.height = '400px';
      
      const canvas = document.createElement('canvas');
      canvas.id = 'grafico-comparativo';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Gráfico comparativo entre ODS selecionados');
      
      graficoContainer.appendChild(canvas);
      container.appendChild(graficoContainer);
      
      // Adiciona descrição para acessibilidade
      const descricao = document.createElement('p');
      descricao.id = 'grafico-comparativo-descricao';
      descricao.className = 'screen-reader-only';
      container.appendChild(descricao);
      
      // Adiciona à página
      const secaoComparativos = document.querySelector('.comparativo-container');
      if (secaoComparativos) {
        secaoComparativos.appendChild(container);
      } else {
        document.querySelector('main .container').appendChild(container);
      }
    }
    
    // Carrega dados e monta datasets
    const datasets = [];
    const labels = [];
    
    // Obtém dados de cada ODS solicitado
    for (const odsId of odsIds) {
      try {
        const dados = await carregarDadosODS(odsId, { semIndicadoresUI: true });
        if (!dados || !dados.historico || !dados.historico.length) {
          console.warn(`Dados históricos não encontrados para ODS ${odsId}`);
          continue;
        }
        
        // Monta labels a partir do primeiro conjunto de dados
        if (labels.length === 0) {
          dados.historico.forEach(item => {
            if (!labels.includes(item.ano)) {
              labels.push(item.ano);
            }
          });
        }
        
        // Cria dataset para este ODS
        datasets.push({
          label: `ODS ${odsId} - ${dados.titulo || 'Sem título'}`,
          data: dados.historico.map(item => item.valor),
          borderColor: dados.cor_primaria || getCorPadrao(odsId),
          backgroundColor: `${dados.cor_secundaria || getCorPadrao(odsId, 0.2)}`,
          fill: false
        });
      } catch (erro) {
        console.error(`Erro ao carregar dados do ODS ${odsId}:`, erro);
      }
    }
    
    // Verifica se temos dados para renderizar
    if (datasets.length === 0) {
      throw new Error('Não foi possível carregar dados para nenhum dos ODS selecionados.');
    }
    
    // Atualiza descrição acessível
    const descricaoEl = document.getElementById('grafico-comparativo-descricao');
    if (descricaoEl) {
      const odsNomes = datasets.map(ds => ds.label).join(', ');
      descricaoEl.textContent = `Gráfico comparativo da evolução histórica entre ${odsNomes} no período de ${labels[0]} a ${labels[labels.length - 1]}.`;
    }
    
    // Renderiza o gráfico comparativo
    const canvas = document.getElementById('grafico-comparativo');
    renderizarGraficoComparativo(canvas, labels, datasets, {
      tipo: 'line'
    });
    
    return { datasets, labels };
  } catch (erro) {
    console.error('Erro ao gerar gráfico comparativo:', erro);
    mostrarErro(`Erro ao gerar gráfico comparativo: ${erro.message}`);
    throw erro;
  }
}

/**
 * Obtém cor padrão para um ODS específico
 * @param {string|number} odsId - ID do ODS
 * @param {number} opacity - Opacidade da cor (0-1)
 * @returns {string} - Cor em formato CSS
 * @private
 */
function getCorPadrao(odsId, opacity = 1) {
  // Cores oficiais dos ODS
  const coresODS = {
    '1': 'rgba(229, 36, 59, ' + opacity + ')',   // Vermelho
    '2': 'rgba(221, 166, 58, ' + opacity + ')',  // Amarelo
    '3': 'rgba(76, 159, 56, ' + opacity + ')',   // Verde
    '4': 'rgba(197, 25, 45, ' + opacity + ')',   // Vermelho escuro
    '5': 'rgba(255, 58, 33, ' + opacity + ')',   // Laranja avermelhado
    '6': 'rgba(38, 189, 226, ' + opacity + ')',  // Azul claro
    '7': 'rgba(252, 195, 11, ' + opacity + ')',  // Amarelo
    '8': 'rgba(162, 25, 66, ' + opacity + ')',   // Vinho
    '9': 'rgba(253, 105, 37, ' + opacity + ')',  // Laranja
    '10': 'rgba(221, 19, 103, ' + opacity + ')', // Rosa
    '11': 'rgba(253, 157, 36, ' + opacity + ')', // Laranja claro
    '12': 'rgba(191, 139, 46, ' + opacity + ')', // Marrom
    '13': 'rgba(63, 126, 68, ' + opacity + ')',  // Verde escuro
    '14': 'rgba(10, 151, 217, ' + opacity + ')', // Azul
    '15': 'rgba(86, 192, 43, ' + opacity + ')',  // Verde
    '16': 'rgba(0, 104, 157, ' + opacity + ')',  // Azul escuro
    '17': 'rgba(25, 72, 106, ' + opacity + ')',  // Azul marinho
    '18': 'rgba(111, 29, 120, ' + opacity + ')'  // Roxo (ODS Brasileiro)
  };
  
  // Normaliza o ID para garantir formato adequado
  const id = String(odsId).replace('ods', '');
  
  // Retorna a cor correspondente ou uma cor padrão
  return coresODS[id] || `rgba(100, 100, 100, ${opacity})`;
}