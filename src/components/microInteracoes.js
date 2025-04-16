/**
 * Módulo para gerenciar microinterações da interface do usuário no dashboard ODS
 * 
 * @module microInteracoes
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

/**
 * Inicializa todas as microinterações do dashboard
 */
export async function inicializarMicroInteracoes() {
  // Aguarda carregamento do DOM
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', () => resolve());
    });
  }
  
  // Inicializa todas as interações
  inicializarAnimacoesCards();
  inicializarFocoAcessibilidade();
  inicializarHoverEfeitos();
  inicializarTooltips();
  configurarModais();
  
  // Configura lazy loading para melhorar performance
  configurarLazyLoading();
}

/**
 * Configura animações de entrada para os cards de indicadores
 * @private
 */
function inicializarAnimacoesCards() {
  const cards = document.querySelectorAll('.card-indicador');
  
  if (cards.length === 0) return;
  
  // Configura um pequeno atraso entre a animação de cada card
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animado');
    }, index * 150); // Atraso sequencial de 150ms entre cards
  });
}

/**
 * Melhora a acessibilidade para navegação por teclado
 * @private
 */
function inicializarFocoAcessibilidade() {
  // Adiciona classe CSS visível quando elementos interativos recebem foco
  document.addEventListener('focusin', (event) => {
    if (
      event.target.tagName === 'BUTTON' || 
      event.target.tagName === 'A' ||
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'SELECT' ||
      event.target.getAttribute('tabindex') === '0'
    ) {
      event.target.classList.add('com-foco');
      
      // Também aplica estilo ao container pai quando relevante
      const containerPai = event.target.closest('.card-indicador, .card-actions');
      if (containerPai) {
        containerPai.classList.add('container-com-foco');
      }
    }
  });
  
  document.addEventListener('focusout', (event) => {
    if (
      event.target.tagName === 'BUTTON' || 
      event.target.tagName === 'A' ||
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'SELECT' ||
      event.target.getAttribute('tabindex') === '0'
    ) {
      event.target.classList.remove('com-foco');
      
      // Remove estilo do container pai
      const containerPai = event.target.closest('.card-indicador, .card-actions');
      if (containerPai) {
        containerPai.classList.remove('container-com-foco');
      }
    }
  });
  
  // Adiciona link de pular para conteúdo principal (acessibilidade)
  const adicionarLinkPular = () => {
    if (document.getElementById('pular-para-conteudo')) return;
    
    const linkPular = document.createElement('a');
    linkPular.id = 'pular-para-conteudo';
    linkPular.href = '#conteudo-principal';
    linkPular.className = 'pular-link';
    linkPular.textContent = 'Pular para o conteúdo principal';
    
    document.body.insertBefore(linkPular, document.body.firstChild);
  };
  
  adicionarLinkPular();
}

/**
 * Inicializa efeitos de hover nos elementos interativos
 * @private
 */
function inicializarHoverEfeitos() {
  // Adiciona efeito de elevação aos cards no hover
  const cards = document.querySelectorAll('.card-indicador, .recomendacao-item, .acao-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('hover');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('hover');
    });
  });
  
  // Adiciona efeito de destaque aos botões no hover
  const botoes = document.querySelectorAll('.btn-primary, .btn-outline, .btn-secundary');
  
  botoes.forEach(botao => {
    botao.addEventListener('mouseenter', () => {
      botao.classList.add('btn-hover');
    });
    
    botao.addEventListener('mouseleave', () => {
      botao.classList.remove('btn-hover');
    });
  });
}

/**
 * Inicializa tooltips para elementos que necessitem de explicações adicionais
 * @private
 */
function inicializarTooltips() {
  // Verifica se a biblioteca Tippy.js está disponível
  if (!window.tippy) {
    console.warn('Tippy.js não está disponível. Tooltips não serão inicializados.');
    return;
  }
  
  // Configura tooltips para valores de indicadores
  window.tippy('.valor-principal', {
    content: 'Clique para ver detalhes históricos',
    placement: 'top',
    theme: 'light-border',
    animation: 'scale',
    delay: [300, 100],
    touch: 'hold'
  });
  
  // Tooltips para botões de exportação
  window.tippy('.btn-exportar', {
    content: 'Exportar dados em formato CSV',
    placement: 'top',
    theme: 'light-border',
    animation: 'scale',
    delay: [300, 100]
  });
  
  // Tooltips para botões de detalhes
  window.tippy('.btn-detalhes', {
    content: 'Ver análise detalhada deste indicador',
    placement: 'top',
    theme: 'light-border',
    animation: 'scale',
    delay: [300, 100]
  });
  
  // Tooltips para outros elementos específicos
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(element => {
    window.tippy(element, {
      content: element.getAttribute('data-tooltip'),
      placement: 'top',
      theme: 'light-border',
      animation: 'scale',
      delay: [300, 100],
      touch: 'hold'
    });
  });
}

/**
 * Configura modais para análises detalhadas e outras interações
 * @private
 */
function configurarModais() {
  // Implementa lógica para abrir/fechar modais e registra eventos relacionados
  document.addEventListener('click', (evento) => {
    // Botões que abrem modais
    if (evento.target.matches('.btn-detalhes, .btn-mostrar-detalhes') || 
        evento.target.closest('.btn-detalhes, .btn-mostrar-detalhes')) {
      
      const botao = evento.target.closest('.btn-detalhes, .btn-mostrar-detalhes');
      const indicadorId = botao.getAttribute('data-indicador') || 'principal';
      
      // Dispara evento personalizado para ser capturado pelo módulo de dashboard
      const eventoAnalise = new CustomEvent('abrir-analise-indicador', {
        detail: { indicador: indicadorId }
      });
      
      window.dispatchEvent(eventoAnalise);
      evento.preventDefault();
    }
    
    // Fechamento de modais pelo botão de fechar
    if (evento.target.matches('.modal-fechar') || 
        evento.target.closest('.modal-fechar')) {
      
      const modal = evento.target.closest('.modal-container');
      if (modal) {
        fecharModal(modal);
      }
      
      evento.preventDefault();
    }
    
    // Fechamento de modais clicando fora do conteúdo
    if (evento.target.matches('.modal-container')) {
      fecharModal(evento.target);
      evento.preventDefault();
    }
  });
  
  // Fecha modal ao pressionar ESC
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      const modalAberto = document.querySelector('.modal-container.ativo');
      if (modalAberto) {
        fecharModal(modalAberto);
        evento.preventDefault();
      }
    }
  });
  
  // Função auxiliar para fechar modal com animação
  function fecharModal(modal) {
    modal.classList.add('fechando');
    
    // Remove o modal após a animação de saída
    setTimeout(() => {
      modal.classList.remove('ativo', 'fechando');
    }, 300); // Duração da animação
  }
}

/**
 * Configura lazy loading para melhorar a performance
 * @private
 */
function configurarLazyLoading() {
  // Verifica se o navegador suporta Intersection Observer
  if (!('IntersectionObserver' in window)) {
    console.warn('Intersection Observer não suportado. Lazy loading não será ativado.');
    return;
  }
  
  // Configuração do observer
  const opcoesObserver = {
    root: null, // viewport
    rootMargin: '100px', // carrega quando o elemento estiver a 100px da viewport
    threshold: 0.1 // carrega quando pelo menos 10% do elemento estiver visível
  };
  
  // Cria o observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const elemento = entry.target;
        
        // Carrega imagens com lazy loading
        if (elemento.tagName === 'IMG' && elemento.dataset.src) {
          elemento.src = elemento.dataset.src;
          elemento.removeAttribute('data-src');
        }
        
        // Carrega componentes de gráfico quando visíveis
        if (elemento.classList.contains('grafico-container')) {
          elemento.classList.add('visivel');
          
          // Dispara evento de gráfico visível para possível renderização lazy
          const canvas = elemento.querySelector('canvas');
          if (canvas) {
            const evento = new CustomEvent('grafico-visivel', {
              detail: { canvasId: canvas.id }
            });
            window.dispatchEvent(evento);
          }
        }
        
        // Para de observar após o carregamento
        observer.unobserve(elemento);
      }
    });
  }, opcoesObserver);
  
  // Observa imagens com data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    observer.observe(img);
  });
  
  // Observa contêineres de gráficos
  document.querySelectorAll('.grafico-container').forEach(container => {
    observer.observe(container);
  });
}

export default {
  inicializarMicroInteracoes
};