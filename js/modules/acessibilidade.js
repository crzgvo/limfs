/**
 * @file acessibilidade.js
 * @description Módulo com funcionalidades de acessibilidade para o painel ODS
 * @version 1.0.0
 */

/**
 * Inicializa recursos de acessibilidade no painel
 */
export function inicializarAcessibilidade() {
  // Adiciona atributos ARIA e role onde necessário
  adicionarAtributosARIA();
  
  // Adiciona suporte para navegação por teclado
  configurarNavegacaoTeclado();
  
  // Adiciona suporte para alto contraste se necessário
  verificarPreferenciaContraste();
  
  // Adiciona suporte para tamanho de fonte
  adicionarControlesFonte();
}

/**
 * Adiciona atributos ARIA e role adequados aos elementos da página
 */
function adicionarAtributosARIA() {
  // Adiciona role="region" para seções importantes
  document.querySelectorAll('section').forEach(section => {
    if (!section.hasAttribute('role')) {
      section.setAttribute('role', 'region');
    }
    
    // Garante que cada seção tenha um aria-labelledby ou aria-label
    if (!section.hasAttribute('aria-labelledby') && !section.hasAttribute('aria-label')) {
      const heading = section.querySelector('h2, h3');
      if (heading) {
        const id = heading.id || `heading-${Math.random().toString(36).substring(2, 9)}`;
        heading.id = id;
        section.setAttribute('aria-labelledby', id);
      }
    }
  });
  
  // Adiciona labels adequados para botões sem texto
  document.querySelectorAll('button:not([aria-label])').forEach(button => {
    if (!button.textContent.trim()) {
      const ariaLabel = button.title || 'Botão';
      button.setAttribute('aria-label', ariaLabel);
    }
  });
  
  // Garante que os gráficos tenham descrições acessíveis
  document.querySelectorAll('canvas').forEach(canvas => {
    if (!canvas.hasAttribute('aria-label') && !canvas.hasAttribute('aria-labelledby')) {
      // Tenta inferir uma descrição do contexto
      const parent = canvas.closest('.grafico-container');
      const cardIndicador = canvas.closest('.card-indicador');
      
      if (cardIndicador) {
        const titulo = cardIndicador.querySelector('h3')?.textContent;
        if (titulo) {
          canvas.setAttribute('aria-label', `Gráfico mostrando a evolução do indicador: ${titulo}`);
        }
      }
    }
  });
}

/**
 * Configura navegação por teclado para elementos interativos
 */
function configurarNavegacaoTeclado() {
  // Configura links "skip to content"
  const skipLink = document.querySelector('.pular-link');
  if (!skipLink) {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      const skipToContent = document.createElement('a');
      skipToContent.className = 'pular-link';
      skipToContent.href = '#conteudo-principal';
      skipToContent.textContent = 'Pular para o conteúdo principal';
      document.body.insertBefore(skipToContent, document.body.firstChild);
      
      if (!mainContent.id) {
        mainContent.id = 'conteudo-principal';
      }
    }
  }
  
  // Adiciona navigação por teclado para cards de indicadores
  document.querySelectorAll('.card-indicador').forEach(card => {
    if (!card.hasAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }
    
    card.addEventListener('keydown', function(e) {
      // Tecla Enter ou espaço ativa o link "ver mais"
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const link = this.querySelector('.btn-ver-mais');
        if (link) {
          link.click();
        }
      }
    });
  });
}

/**
 * Verifica se o usuário tem preferência por alto contraste
 * e aplica estilo adequado caso necessário
 */
function verificarPreferenciaContraste() {
  // Verifica se o navegador suporta a detecção de preferência de contraste
  if (window.matchMedia('(prefers-contrast: more)').matches) {
    document.body.classList.add('alto-contraste');
  }
  
  // Adiciona botão para alternar contraste manualmente
  const adicionarBotaoContraste = () => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    // Verifica se o botão já existe
    if (document.getElementById('btn-contraste')) return;
    
    const botaoContraste = document.createElement('button');
    botaoContraste.id = 'btn-contraste';
    botaoContraste.className = 'btn-acessibilidade';
    botaoContraste.innerHTML = '<i class="fas fa-adjust"></i> Alto Contraste';
    botaoContraste.setAttribute('aria-label', 'Alternar modo de alto contraste');
    botaoContraste.addEventListener('click', alternarContraste);
    
    const containerBotoes = document.createElement('div');
    containerBotoes.className = 'acessibilidade-botoes';
    containerBotoes.appendChild(botaoContraste);
    
    // Adiciona antes do último parágrafo do footer
    const ultimoP = footer.querySelector('p:last-child');
    if (ultimoP) {
      footer.insertBefore(containerBotoes, ultimoP);
    } else {
      footer.appendChild(containerBotoes);
    }
  };
  
  // Aguarda o DOM estar completamente carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', adicionarBotaoContraste);
  } else {
    setTimeout(adicionarBotaoContraste, 1000); // Pequeno delay para garantir que footer.js já executou
  }
}

/**
 * Alterna entre modo normal e alto contraste
 */
function alternarContraste() {
  document.body.classList.toggle('alto-contraste');
  
  // Salva a preferência do usuário
  const altoContrasteAtivo = document.body.classList.contains('alto-contraste');
  localStorage.setItem('altoContraste', altoContrasteAtivo);
  
  // Atualiza o texto do botão
  const botao = document.getElementById('btn-contraste');
  if (botao) {
    botao.innerHTML = altoContrasteAtivo 
      ? '<i class="fas fa-adjust"></i> Contraste Normal'
      : '<i class="fas fa-adjust"></i> Alto Contraste';
  }
  
  // Atualiza também os gráficos para cores com maior contraste
  atualizarCoresGraficos(altoContrasteAtivo);
}

/**
 * Atualiza as cores dos gráficos para melhorar contraste
 * @param {boolean} altoContraste - Se verdadeiro, aplica cores de alto contraste
 */
function atualizarCoresGraficos(altoContraste) {
  // Se a biblioteca Chart.js estiver disponível
  if (typeof Chart !== 'undefined') {
    // Atualiza a configuração global para novos gráficos
    Chart.defaults.color = altoContraste ? '#ffffff' : '#666';
    Chart.defaults.borderColor = altoContraste ? '#444' : '#ddd';
    
    // Atualiza gráficos existentes
    Chart.instances.forEach(chart => {
      // Aplica cores mais contrastantes
      if (altoContraste) {
        chart.options.plugins.legend.labels.color = '#ffffff';
        chart.options.scales.x.ticks.color = '#ffffff';
        chart.options.scales.y.ticks.color = '#ffffff';
        
        // Aumenta espessura das linhas para melhor visibilidade
        if (chart.config.type === 'line') {
          chart.data.datasets.forEach(dataset => {
            dataset.borderWidth = 3;
          });
        }
      } else {
        // Restaura valores padrão
        chart.options.plugins.legend.labels.color = '#666';
        chart.options.scales.x.ticks.color = '#666';
        chart.options.scales.y.ticks.color = '#666';
        
        if (chart.config.type === 'line') {
          chart.data.datasets.forEach(dataset => {
            dataset.borderWidth = 2;
          });
        }
      }
      
      chart.update();
    });
  }
}

/**
 * Adiciona controles para ajustar o tamanho da fonte
 */
function adicionarControlesFonte() {
  const adicionarBotoesFonte = () => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    // Verifica se os botões já existem
    if (document.getElementById('btn-aumentar-fonte')) return;
    
    // Botão para aumentar a fonte
    const botaoAumentar = document.createElement('button');
    botaoAumentar.id = 'btn-aumentar-fonte';
    botaoAumentar.className = 'btn-acessibilidade';
    botaoAumentar.innerHTML = '<i class="fas fa-text-height"></i> Aumentar Fonte';
    botaoAumentar.setAttribute('aria-label', 'Aumentar tamanho da fonte');
    botaoAumentar.addEventListener('click', () => ajustarFonte(1));
    
    // Botão para diminuir a fonte
    const botaoDiminuir = document.createElement('button');
    botaoDiminuir.id = 'btn-diminuir-fonte';
    botaoDiminuir.className = 'btn-acessibilidade';
    botaoDiminuir.innerHTML = '<i class="fas fa-text-height fa-flip-vertical"></i> Diminuir Fonte';
    botaoDiminuir.setAttribute('aria-label', 'Diminuir tamanho da fonte');
    botaoDiminuir.addEventListener('click', () => ajustarFonte(-1));
    
    // Container para os botões
    let containerBotoes = document.querySelector('.acessibilidade-botoes');
    
    if (!containerBotoes) {
      containerBotoes = document.createElement('div');
      containerBotoes.className = 'acessibilidade-botoes';
      
      // Adiciona antes do último parágrafo do footer
      const ultimoP = footer.querySelector('p:last-child');
      if (ultimoP) {
        footer.insertBefore(containerBotoes, ultimoP);
      } else {
        footer.appendChild(containerBotoes);
      }
    }
    
    containerBotoes.appendChild(botaoAumentar);
    containerBotoes.appendChild(botaoDiminuir);
  };
  
  // Aguarda o DOM estar completamente carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', adicionarBotoesFonte);
  } else {
    setTimeout(adicionarBotoesFonte, 1000); // Pequeno delay para garantir que footer.js já executou
  }
}

/**
 * Ajusta o tamanho da fonte
 * @param {number} direcao - 1 para aumentar, -1 para diminuir
 */
function ajustarFonte(direcao) {
  const html = document.documentElement;
  const tamanhoAtual = parseInt(window.getComputedStyle(html).fontSize);
  
  // Limite de tamanho (min: 14px, max: 24px)
  const novoTamanho = Math.min(Math.max(tamanhoAtual + (direcao * 2), 14), 24);
  
  html.style.fontSize = `${novoTamanho}px`;
  
  // Salva a preferência do usuário
  localStorage.setItem('tamanhoFonte', novoTamanho);
  
  // Atualiza altura dos cards para manter consistência
  document.querySelectorAll('.card-indicador').forEach(card => {
    card.style.height = 'auto';
  });
}

// Carrega configurações salvas do usuário quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  // Carrega preferência de contraste
  const altoContraste = localStorage.getItem('altoContraste') === 'true';
  if (altoContraste) {
    document.body.classList.add('alto-contraste');
    setTimeout(() => atualizarCoresGraficos(true), 500);
  }
  
  // Carrega tamanho de fonte
  const tamanhoFonte = localStorage.getItem('tamanhoFonte');
  if (tamanhoFonte) {
    document.documentElement.style.fontSize = `${tamanhoFonte}px`;
  }
});