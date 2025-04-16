/**
 * Módulo de Acessibilidade Avançada para o Painel ODS Sergipe
 * Implementa recursos de acessibilidade para atender diferentes tipos de necessidades,
 * incluindo deficiências cognitivas, motoras, visuais e auditivas.
 * 
 * Este módulo visa contribuir com o ODS 10 (Redução das Desigualdades)
 * garantindo acesso inclusivo às informações sobre desenvolvimento sustentável.
 * 
 * @module acessibilidadeAvancada
 * @version 1.0.0
 */

import { logger } from '../services/monitoramento.js';

// Configurações padrão
const configPadrao = {
  ativarModoSimplificado: false,
  aumentarContraste: false,
  aumentarFontes: false,
  navegacaoTeclado: true,
  descricoesClaras: true,
  destacarFoco: true,
  velocidadeAnimacao: 1, // normal
  ativarLeitorTela: false
};

// Configuração atual
let config = { ...configPadrao };

// Armazena estado dos elementos visuais para o modo simplificado
const estadoElementos = {
  graficos: new Map(),
  elementosComplexos: new Map()
};

/**
 * Inicializa o módulo de acessibilidade avançada
 * @param {Object} opcoes - Opções de configuração
 * @returns {Promise<boolean>} - Indica se a inicialização foi bem-sucedida
 */
export async function inicializarAcessibilidadeAvancada(opcoes = {}) {
  try {
    // Mescla as opções recebidas com as configurações padrão
    config = { ...configPadrao, ...opcoes };

    // Carrega preferências salvas pelo usuário
    carregarPreferencias();

    // Cria a barra de acessibilidade
    criarBarraAcessibilidade();

    // Configura a navegação por teclado
    if (config.navegacaoTeclado) {
      configurarNavegacaoTeclado();
    }

    // Aplica as configurações iniciais
    aplicarConfiguracoes();

    // Monitora mudanças no DOM para aplicar acessibilidade a novos elementos
    observarMudancasDom();

    logger.info("Módulo de acessibilidade avançada inicializado com sucesso.");
    return true;
  } catch (erro) {
    logger.error("Erro ao inicializar módulo de acessibilidade avançada:", erro);
    return false;
  }
}

/**
 * Cria a barra de ferramentas de acessibilidade na interface
 * @private
 */
function criarBarraAcessibilidade() {
  // Verifica se a barra já existe
  if (document.getElementById('barra-acessibilidade')) return;

  // Cria o container principal
  const barra = document.createElement('div');
  barra.id = 'barra-acessibilidade';
  barra.setAttribute('role', 'region');
  barra.setAttribute('aria-label', 'Ferramentas de acessibilidade');
  barra.className = 'barra-acessibilidade';

  // Define o CSS inline inicialmente (será movido para arquivo CSS)
  barra.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #f8f9fa;
    border-top: 2px solid #0056b3;
    padding: 0.5rem;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    transform: translateY(100%);
    transition: transform 0.3s ease;
  `;

  // Botão para alternar a visibilidade da barra
  const botaoAlternar = document.createElement('button');
  botaoAlternar.className = 'botao-acessibilidade botao-alternar';
  botaoAlternar.innerHTML = '<span aria-hidden="true">♿</span> Acessibilidade';
  botaoAlternar.setAttribute('aria-expanded', 'false');
  botaoAlternar.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 0.5rem 1rem;
    background-color: #0056b3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1001;
  `;

  // Grupo de controles
  const controles = document.createElement('div');
  controles.className = 'controles-acessibilidade';
  controles.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
  `;

  // Cria os controles de acessibilidade
  const controlesConfig = [
    {
      id: 'modo-simplificado',
      texto: 'Modo Simplificado',
      propConfig: 'ativarModoSimplificado',
      acao: ativarModoSimplificado
    },
    {
      id: 'alto-contraste',
      texto: 'Alto Contraste',
      propConfig: 'aumentarContraste',
      acao: alterarContraste
    },
    {
      id: 'aumentar-fonte',
      texto: 'Aumentar Fonte',
      propConfig: 'aumentarFontes',
      acao: alterarTamanhoFonte
    },
    {
      id: 'destacar-foco',
      texto: 'Destacar Foco',
      propConfig: 'destacarFoco',
      acao: alternarDestacarFoco
    }
  ];

  // Adiciona cada controle à barra
  controlesConfig.forEach(controle => {
    const wrapper = document.createElement('div');
    wrapper.className = 'controle-wrapper';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = controle.id;
    checkbox.checked = config[controle.propConfig];
    checkbox.addEventListener('change', () => {
      config[controle.propConfig] = checkbox.checked;
      controle.acao(checkbox.checked);
      salvarPreferencias();
    });
    
    const label = document.createElement('label');
    label.htmlFor = controle.id;
    label.textContent = controle.texto;
    
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    controles.appendChild(wrapper);
  });

  // Adiciona um botão para redefinir configurações
  const botaoRedefinir = document.createElement('button');
  botaoRedefinir.className = 'botao-acessibilidade';
  botaoRedefinir.textContent = 'Redefinir';
  botaoRedefinir.addEventListener('click', redefinirConfiguracoes);
  controles.appendChild(botaoRedefinir);

  // Adiciona comportamento de abertura/fechamento da barra
  botaoAlternar.addEventListener('click', () => {
    const estaAberta = barra.style.transform === 'translateY(0%)';
    barra.style.transform = estaAberta ? 'translateY(100%)' : 'translateY(0%)';
    botaoAlternar.setAttribute('aria-expanded', !estaAberta);
  });

  // Adiciona os elementos ao DOM
  barra.appendChild(controles);
  document.body.appendChild(botaoAlternar);
  document.body.appendChild(barra);
}

/**
 * Configura a navegação por teclado para elementos interativos
 * @private
 */
function configurarNavegacaoTeclado() {
  // Adiciona gestão de foco explícito para elementos interativos
  document.addEventListener('keydown', (e) => {
    // Tab - gerencia movimentação entre elementos
    if (e.key === 'Tab') {
      // O comportamento padrão do Tab é adequado, apenas destacamos o foco
      setTimeout(() => {
        if (document.activeElement && config.destacarFoco) {
          destacarElementoAtivo(document.activeElement);
        }
      }, 10);
    }

    // Teclas de espaço e enter para ativar elementos
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement) {
      // Verifica se não é um botão ou link (que já tem comportamento nativo)
      const elemento = document.activeElement;
      if (!['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName)) {
        // Se tiver role='button', simula um clique
        if (elemento.getAttribute('role') === 'button') {
          e.preventDefault();
          elemento.click();
        }
      }
    }
  });

  // Adiciona gerenciamento de foco visual para elementos interativos
  const elementos = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
  elementos.forEach(elemento => {
    if (!elemento.hasAttribute('tabindex')) {
      elemento.setAttribute('tabindex', '0');
    }
  });
}

/**
 * Destaca o elemento que está com foco
 * @param {HTMLElement} elemento - Elemento a ser destacado
 * @private
 */
function destacarElementoAtivo(elemento) {
  // Remove destaque anterior
  document.querySelectorAll('.foco-acessibilidade').forEach(e => {
    e.classList.remove('foco-acessibilidade');
  });

  // Adiciona classe de destaque
  if (elemento && config.destacarFoco) {
    elemento.classList.add('foco-acessibilidade');
  }
}

/**
 * Ativa ou desativa o modo simplificado
 * @param {boolean} ativar - Indica se deve ativar o modo simplificado
 * @private
 */
function ativarModoSimplificado(ativar) {
  document.body.classList.toggle('modo-simplificado', ativar);

  if (ativar) {
    // Guarda estado atual dos gráficos e elementos complexos
    armazenarEstadoElementos();
    
    // Oculta gráficos e mostra alternativas textuais
    document.querySelectorAll('.grafico-container').forEach(container => {
      container.style.display = 'none';
      
      // Cria ou exibe descrição textual
      let descricao = container.nextElementSibling;
      if (!descricao || !descricao.classList.contains('texto-alternativo')) {
        descricao = document.createElement('div');
        descricao.className = 'texto-alternativo';
        descricao.setAttribute('role', 'region');
        descricao.setAttribute('aria-label', 'Descrição textual do gráfico');
        
        // Gera descrição com base no canvas do gráfico
        const canvas = container.querySelector('canvas');
        if (canvas) {
          const ariaLabel = canvas.getAttribute('aria-label') || 'Gráfico';
          descricao.innerHTML = `<h4>${ariaLabel}</h4><p>Uma descrição detalhada deste gráfico está disponível na exportação CSV.</p>`;
        } else {
          descricao.innerHTML = '<p>Descrição do gráfico não disponível.</p>';
        }
        
        container.parentNode.insertBefore(descricao, container.nextSibling);
      }
      descricao.style.display = 'block';
    });
    
    // Simplifica outros elementos complexos
    simplificarElementosComplexos();
  } else {
    // Restaura estado anterior
    restaurarEstadoElementos();
  }
}

/**
 * Altera o contraste da interface
 * @param {boolean} aumentar - Indica se deve aumentar o contraste
 * @private
 */
function alterarContraste(aumentar) {
  document.body.classList.toggle('alto-contraste', aumentar);
  
  if (aumentar) {
    // Aplicar cores de alto contraste
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--link-color', '#ffff00');
    document.documentElement.style.setProperty('--heading-color', '#ffffff');
  } else {
    // Restaurar cores originais
    document.documentElement.style.removeProperty('--text-color');
    document.documentElement.style.removeProperty('--background-color');
    document.documentElement.style.removeProperty('--link-color');
    document.documentElement.style.removeProperty('--heading-color');
  }
}

/**
 * Altera o tamanho da fonte na interface
 * @param {boolean} aumentar - Indica se deve aumentar o tamanho da fonte
 * @private
 */
function alterarTamanhoFonte(aumentar) {
  document.body.classList.toggle('fonte-grande', aumentar);
  
  if (aumentar) {
    document.documentElement.style.setProperty('--font-scale', '1.25');
  } else {
    document.documentElement.style.removeProperty('--font-scale');
  }
}

/**
 * Alterna o destaque visual para elementos com foco
 * @param {boolean} destacar - Indica se deve destacar o foco
 * @private
 */
function alternarDestacarFoco(destacar) {
  config.destacarFoco = destacar;
  
  if (!destacar) {
    // Remove destaque atual
    document.querySelectorAll('.foco-acessibilidade').forEach(e => {
      e.classList.remove('foco-acessibilidade');
    });
  } else if (document.activeElement) {
    // Destaca o elemento ativo atual
    destacarElementoAtivo(document.activeElement);
  }
}

/**
 * Armazena o estado atual dos elementos visuais
 * @private
 */
function armazenarEstadoElementos() {
  // Armazena estado dos gráficos
  document.querySelectorAll('.grafico-container').forEach((container, index) => {
    estadoElementos.graficos.set(index, {
      elemento: container,
      display: container.style.display
    });
  });
  
  // Armazena estado de outros elementos complexos
  document.querySelectorAll('.elemento-complexo, .tabela-dados-complexa').forEach((elem, index) => {
    estadoElementos.elementosComplexos.set(index, {
      elemento: elem,
      display: elem.style.display,
      html: elem.innerHTML
    });
  });
}

/**
 * Restaura o estado dos elementos visuais
 * @private
 */
function restaurarEstadoElementos() {
  // Restaura gráficos
  estadoElementos.graficos.forEach((dados) => {
    dados.elemento.style.display = dados.display || '';
    
    // Oculta textos alternativos
    const textoAlt = dados.elemento.nextElementSibling;
    if (textoAlt && textoAlt.classList.contains('texto-alternativo')) {
      textoAlt.style.display = 'none';
    }
  });
  
  // Restaura elementos complexos
  estadoElementos.elementosComplexos.forEach((dados) => {
    dados.elemento.style.display = dados.display || '';
    if (dados.html) {
      dados.elemento.innerHTML = dados.html;
    }
  });
}

/**
 * Simplifica elementos complexos para melhor acessibilidade
 * @private
 */
function simplificarElementosComplexos() {
  // Simplifica tabelas complexas
  document.querySelectorAll('table.tabela-dados-complexa').forEach((tabela) => {
    // Cria versão simplificada
    const wrapper = document.createElement('div');
    wrapper.className = 'tabela-simplificada';
    
    const resumo = document.createElement('div');
    resumo.className = 'tabela-resumo';
    
    // Extrai o título da tabela
    const caption = tabela.querySelector('caption');
    if (caption) {
      const titulo = document.createElement('h4');
      titulo.textContent = caption.textContent;
      resumo.appendChild(titulo);
    }
    
    // Extrai dados principais
    const linhas = Array.from(tabela.querySelectorAll('tr')).slice(0, 5); // Apenas 5 primeiras linhas
    
    if (linhas.length > 0) {
      const lista = document.createElement('ul');
      
      linhas.forEach((linha) => {
        const celulas = linha.querySelectorAll('th, td');
        if (celulas.length > 0) {
          const item = document.createElement('li');
          
          // Formato simplificado: "Coluna: Valor"
          const rotulo = celulas[0].textContent.trim();
          const valor = celulas.length > 1 ? celulas[1].textContent.trim() : '';
          
          item.textContent = `${rotulo}: ${valor}`;
          lista.appendChild(item);
        }
      });
      
      resumo.appendChild(lista);
    }
    
    // Adiciona um link para ver a tabela completa
    const linkCompleto = document.createElement('button');
    linkCompleto.textContent = 'Mostrar tabela completa';
    linkCompleto.className = 'btn-tabela-completa';
    linkCompleto.addEventListener('click', () => {
      wrapper.style.display = 'none';
      tabela.style.display = '';
    });
    
    resumo.appendChild(linkCompleto);
    wrapper.appendChild(resumo);
    
    // Substitui a tabela pelo resumo
    tabela.parentNode.insertBefore(wrapper, tabela);
    tabela.style.display = 'none';
  });
  
  // Simplifica outros elementos marcados como complexos
  document.querySelectorAll('.elemento-complexo').forEach((elemento) => {
    const alternativoId = elemento.getAttribute('data-alternativo-id');
    if (alternativoId) {
      const elementoAlternativo = document.getElementById(alternativoId);
      if (elementoAlternativo) {
        elementoAlternativo.style.display = 'block';
        elemento.style.display = 'none';
      }
    }
  });
}

/**
 * Aplica as configurações atuais de acessibilidade
 * @private
 */
function aplicarConfiguracoes() {
  // Aplica cada configuração
  ativarModoSimplificado(config.ativarModoSimplificado);
  alterarContraste(config.aumentarContraste);
  alterarTamanhoFonte(config.aumentarFontes);
  alternarDestacarFoco(config.destacarFoco);
  
  // Adiciona folha de estilos CSS para acessibilidade se necessário
  adicionarEstilosAcessibilidade();
}

/**
 * Adiciona estilos CSS específicos para acessibilidade
 * @private
 */
function adicionarEstilosAcessibilidade() {
  // Verifica se os estilos já foram adicionados
  if (document.getElementById('estilos-acessibilidade')) return;
  
  const estilos = document.createElement('style');
  estilos.id = 'estilos-acessibilidade';
  estilos.textContent = `
    :root {
      --font-scale: 1;
    }
    
    /* Modo Simplificado */
    .modo-simplificado .texto-alternativo {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    
    /* Alto Contraste */
    .alto-contraste {
      color: #ffffff !important;
      background-color: #000000 !important;
    }
    
    .alto-contraste a, .alto-contraste button {
      color: #ffff00 !important;
      border-color: #ffff00 !important;
    }
    
    .alto-contraste h1, .alto-contraste h2, .alto-contraste h3,
    .alto-contraste h4, .alto-contraste h5, .alto-contraste h6 {
      color: #ffffff !important;
    }
    
    .alto-contraste .card-indicador,
    .alto-contraste .grafico-container,
    .alto-contraste .card-info {
      border: 1px solid #ffffff !important;
    }
    
    /* Fonte Aumentada */
    .fonte-grande {
      font-size: calc(1rem * var(--font-scale));
    }
    
    .fonte-grande h1 { font-size: calc(2.5rem * var(--font-scale)); }
    .fonte-grande h2 { font-size: calc(2rem * var(--font-scale)); }
    .fonte-grande h3 { font-size: calc(1.75rem * var(--font-scale)); }
    .fonte-grande h4 { font-size: calc(1.5rem * var(--font-scale)); }
    
    /* Destaque de Foco */
    .foco-acessibilidade {
      outline: 3px solid #4a90e2 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5) !important;
    }
    
    /* Componentes de Acessibilidade */
    .barra-acessibilidade .controle-wrapper {
      display: flex;
      align-items: center;
      margin-right: 1rem;
    }
    
    .barra-acessibilidade .controle-wrapper label {
      margin-left: 0.5rem;
      margin-bottom: 0;
    }
    
    /* Barra de acessibilidade responsiva */
    @media (max-width: 768px) {
      .barra-acessibilidade .controles-acessibilidade {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .botao-alternar {
        font-size: 0.85rem;
        padding: 0.4rem 0.7rem;
        bottom: 1rem;
        right: 1rem;
      }
    }
  `;
  
  document.head.appendChild(estilos);
}

/**
 * Observa mudanças no DOM para aplicar acessibilidade a novos elementos
 * @private
 */
function observarMudancasDom() {
  // Cria um observer para monitorar alterações no DOM
  const observer = new MutationObserver((mutations) => {
    // Para cada mutação
    let deveAtualizar = false;
    
    mutations.forEach((mutation) => {
      // Se foram adicionados novos nós
      if (mutation.addedNodes.length > 0) {
        // Verifica se algum dos nós adicionados é relevante
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.classList.contains('grafico-container') ||
              node.classList.contains('elemento-complexo') ||
              node.classList.contains('tabela-dados-complexa') ||
              node.querySelector('.grafico-container, .elemento-complexo, .tabela-dados-complexa')
            ) {
              deveAtualizar = true;
            }
          }
        });
      }
    });
    
    // Se houver elementos relevantes novos, reaplicamos as configurações
    if (deveAtualizar) {
      // Armazena novamente o estado e reaplicar configurações se necessário
      armazenarEstadoElementos();
      
      if (config.ativarModoSimplificado) {
        ativarModoSimplificado(true);
      }
    }
  });
  
  // Inicia observação do corpo do documento
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

/**
 * Carrega preferências de acessibilidade do usuário
 * @private
 */
function carregarPreferencias() {
  try {
    const preferencias = localStorage.getItem('limfs_acessibilidade_prefs');
    if (preferencias) {
      config = { ...config, ...JSON.parse(preferencias) };
    }
  } catch (erro) {
    logger.warn('Erro ao carregar preferências de acessibilidade:', erro);
  }
}

/**
 * Salva preferências de acessibilidade do usuário
 * @private
 */
function salvarPreferencias() {
  try {
    localStorage.setItem('limfs_acessibilidade_prefs', JSON.stringify(config));
  } catch (erro) {
    logger.warn('Erro ao salvar preferências de acessibilidade:', erro);
  }
}

/**
 * Redefine as configurações para os valores padrão
 * @private
 */
function redefinirConfiguracoes() {
  // Restaura configurações padrão
  config = { ...configPadrao };
  salvarPreferencias();
  
  // Atualiza a interface
  document.getElementById('modo-simplificado').checked = config.ativarModoSimplificado;
  document.getElementById('alto-contraste').checked = config.aumentarContraste;
  document.getElementById('aumentar-fonte').checked = config.aumentarFontes;
  document.getElementById('destacar-foco').checked = config.destacarFoco;
  
  // Aplica as configurações
  aplicarConfiguracoes();
  
  // Notifica o usuário
  alert('Configurações de acessibilidade redefinidas para os valores padrão.');
}