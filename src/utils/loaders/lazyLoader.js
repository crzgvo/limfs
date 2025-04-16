/**
 * Módulo de carregamento preguiçoso (lazy loading) para otimizar o desempenho
 * Implementa carregamento sob demanda de componentes visuais como gráficos e indicadores
 * 
 * @module lazyLoader
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

import { carregarDadosODS } from './carregadorDados.js';
import { renderizarGraficoHistorico, renderizarGraficoPizza } from './renderizadorGraficos.js';

/**
 * Inicializa o lazy loading para elementos visuais
 * @param {Object} [opcoes] - Opções de configuração do lazy loading
 * @param {string} [opcoes.seletorContainers='.grafico-container, .indicador-card'] - Seletor CSS para os elementos a observar
 * @param {number} [opcoes.threshold=0.1] - Limiar de interseção (0 a 1)
 * @param {string} [opcoes.rootMargin='100px'] - Margem de observação
 */
export function inicializarLazyLoading(opcoes = {}) {
  // Configurações padrão
  const config = {
    seletorContainers: opcoes.seletorContainers || '.grafico-container, .indicador-card',
    threshold: opcoes.threshold || 0.1,
    rootMargin: opcoes.rootMargin || '100px'
  };

  // Verifica se Intersection Observer é suportado
  if (!('IntersectionObserver' in window)) {
    console.warn('Intersection Observer não suportado neste navegador. Carregando todos os elementos imediatamente.');
    carregarTodosElementos(config.seletorContainers);
    return;
  }

  // Cria o observador de interseção
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const elemento = entry.target;
        
        // Processa o elemento quando se torna visível
        processarElementoVisivel(elemento);
        
        // Para de observar após o carregamento
        observer.unobserve(elemento);
      }
    });
  }, {
    threshold: config.threshold,
    rootMargin: config.rootMargin
  });

  // Seleciona todos os elementos que devem ser observados
  const elementos = document.querySelectorAll(config.seletorContainers);
  
  // Adiciona cada elemento ao observador
  elementos.forEach(elemento => {
    observer.observe(elemento);
  });
  
  console.log(`Lazy loading inicializado para ${elementos.length} elementos.`);
}

/**
 * Processa um elemento quando ele se torna visível
 * @param {HTMLElement} elemento - O elemento que se tornou visível
 * @private
 */
function processarElementoVisivel(elemento) {
  try {
    // Verifica se é um contêiner de gráfico
    if (elemento.classList.contains('grafico-container')) {
      const canvas = elemento.querySelector('canvas');
      if (canvas) {
        carregarGrafico(canvas);
      }
    } 
    // Verifica se é um card de indicador
    else if (elemento.classList.contains('indicador-card')) {
      carregarDadosIndicador(elemento);
    }

    // Adicionamos uma classe para indicar que o elemento foi carregado
    elemento.classList.add('lazy-loaded');
    
  } catch (erro) {
    console.error('Erro ao processar elemento visível:', erro);
    elemento.classList.add('lazy-error');
  }
}

/**
 * Carrega um gráfico específico
 * @param {HTMLCanvasElement} canvas - O elemento canvas do gráfico
 * @private
 */
function carregarGrafico(canvas) {
  const id = canvas.id;
  const container = canvas.closest('.grafico-container');
  
  // Mostra indicador de carregamento se existir
  const loadingIndicator = container.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }
  
  // Determina o tipo de gráfico e dados necessários pelo ID ou atributos data-
  const odsId = document.body.dataset.pagina || canvas.dataset.ods;
  const tipoGrafico = canvas.dataset.tipoGrafico || 'historico';
  const indicadorId = canvas.dataset.indicador;

  if (!odsId) {
    console.error('ID do ODS não encontrado para o gráfico:', id);
    return;
  }

  // Carrega dados e renderiza o gráfico apropriado
  carregarDadosODS(odsId)
    .then(dados => {
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Renderiza o gráfico adequado conforme tipo
      switch(tipoGrafico) {
        case 'historico':
          renderizarGraficoHistorico(canvas, dados.historico, {
            corPrimaria: dados.cor_primaria,
            titulo: dados.titulo_grafico || 'Evolução Histórica',
            unidade: dados.unidade
          });
          break;
        case 'pizza':
          const labelsGrafico = dados.categorias || Object.keys(dados.distribuicao || {});
          const valoresGrafico = dados.valores || Object.values(dados.distribuicao || {});
          renderizarGraficoPizza(canvas, labelsGrafico, valoresGrafico, {
            doughnut: canvas.dataset.doughnut === 'true',
            mostrarPercentual: true
          });
          break;
        default:
          console.warn(`Tipo de gráfico não suportado: ${tipoGrafico}`);
      }
    })
    .catch(erro => {
      console.error(`Erro ao carregar dados para o gráfico ${id}:`, erro);
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      container.classList.add('erro-carregamento');
    });
}

/**
 * Carrega dados para um card de indicador
 * @param {HTMLElement} card - O elemento do card do indicador
 * @private
 */
function carregarDadosIndicador(card) {
  const odsId = document.body.dataset.pagina;
  const indicadorId = card.dataset.indicador;
  
  if (!odsId || !indicadorId) {
    console.error('ID do ODS ou indicador não encontrado para:', card);
    return;
  }
  
  // Mostra indicador de carregamento se existir
  const loadingIndicator = card.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  // Carrega dados do indicador específico
  carregarDadosODS(odsId)
    .then(dados => {
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      const indicador = dados.indicadores?.[indicadorId];
      if (!indicador) {
        throw new Error(`Indicador ${indicadorId} não encontrado nos dados do ODS ${odsId}`);
      }
      
      // Atualiza o conteúdo do card com os dados carregados
      const valorElement = card.querySelector('.valor-grande');
      const tendenciaElement = card.querySelector('.tendencia');
      
      if (valorElement) {
        valorElement.textContent = indicador.valor + (indicador.unidade || '');
      }
      
      if (tendenciaElement) {
        const tendencia = indicador.tendencia || 'estável';
        let icone = '';
        let descricao = '';
        
        switch(tendencia) {
          case 'crescente':
            icone = '<i class="fas fa-arrow-up" style="color: green;"></i>';
            descricao = 'Em crescimento';
            break;
          case 'decrescente':
            icone = '<i class="fas fa-arrow-down" style="color: red;"></i>';
            descricao = 'Em queda';
            break;
          default:
            icone = '<i class="fas fa-minus" style="color: gray;"></i>';
            descricao = 'Estável';
        }
        
        tendenciaElement.innerHTML = `${icone} ${descricao}`;
      }
      
      // Se houver um mini-gráfico no card, carregue-o também
      const miniGrafico = card.querySelector('canvas');
      if (miniGrafico && indicador.dados_historicos) {
        renderizarGraficoHistorico(miniGrafico, indicador.dados_historicos, {
          corPrimaria: indicador.cor || dados.cor_primaria,
          preenchido: false,
          configAdicional: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
          }
        });
      }
    })
    .catch(erro => {
      console.error(`Erro ao carregar dados para o indicador ${indicadorId}:`, erro);
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      card.classList.add('erro-carregamento');
    });
}

/**
 * Carrega imediatamente todos os elementos (fallback)
 * @param {string} seletorContainers - Seletor CSS para os elementos
 * @private
 */
function carregarTodosElementos(seletorContainers) {
  const elementos = document.querySelectorAll(seletorContainers);
  elementos.forEach(elemento => {
    processarElementoVisivel(elemento);
  });
}