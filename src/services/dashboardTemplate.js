/**
 * Módulo de template para dashboards modernos dos ODS
 * Fornece estrutura HTML semântica e padronizada para todos os dashboards ODS
 * 
 * @module dashboardTemplate
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

/**
 * Gera o HTML base para um dashboard específico de ODS
 * @param {Object} config - Configurações do dashboard
 * @param {number} config.odsNumero - Número do ODS (1-18)
 * @param {string} config.odsTitulo - Título do ODS
 * @param {string} config.odsDescricao - Descrição do ODS
 * @param {Array} config.indicadores - Array de objetos com dados dos indicadores
 * @returns {string} - HTML do dashboard
 */
export function gerarTemplateDashboard(config) {
  const { odsNumero, odsTitulo, odsDescricao, indicadores = [] } = config;
  
  // Classe de cores específica para este ODS
  const odsColorClass = `ods${odsNumero}-color`;
  
  // HTML base para o dashboard
  return `
    <div class="dashboard-header">
      <div class="ods-badge">${odsNumero}</div>
      <div class="dashboard-title">
        <h1>${odsTitulo}</h1>
        <p class="descricao-ods">${odsDescricao}</p>
        <p class="atualizacao-info">Última atualização: <span id="data-atualizacao">Carregando...</span></p>
      </div>
    </div>
    
    <section class="dashboard-container">
      ${gerarHtmlIndicadorPrincipal(config)}

      ${indicadores.map(indicador => gerarHtmlCardIndicador(indicador, odsNumero)).join('')}
      
      ${gerarHtmlGraficoComparativo(config)}
    </section>

    ${gerarHtmlSecaoAcoesImpacto(config)}
    ${gerarHtmlSecaoRecomendacoes(config)}
  `;
}

/**
 * Gera o HTML para o card do indicador principal
 * @param {Object} config - Configurações do dashboard 
 * @returns {string} - HTML do indicador principal
 * @private
 */
function gerarHtmlIndicadorPrincipal(config) {
  const { odsNumero, indicadorPrincipal } = config;
  
  if (!indicadorPrincipal) {
    return '';
  }
  
  return `
    <div class="card-indicador main-visualization ${`ods${odsNumero}-color`}" id="indicador-principal">
      <div class="card-header">
        <h3>Indicador Principal: ${indicadorPrincipal.titulo || 'Carregando...'}</h3>
        <div class="ods-badge">${odsNumero}</div>
      </div>
      
      <div class="card-body">
        <div class="valor-principal" id="valor-principal">--</div>
        <p class="descricao-indicador" id="descricao-principal">Carregando dados...</p>
        
        ${indicadorPrincipal.infoAdicional ? `
          <div class="info-complementar">${indicadorPrincipal.infoAdicional}</div>
        ` : ''}
        
        <div class="grafico-container">
          <canvas id="grafico-principal" role="img" aria-label="Gráfico principal do ${indicadorPrincipal.titulo || 'indicador'}"></canvas>
          <div id="descricao-textual-principal" class="sr-only">Descrição detalhada do gráfico de ${indicadorPrincipal.titulo || 'indicador principal'} será exibida aqui após o carregamento dos dados.</div>
        </div>

        ${indicadorPrincipal.fonte ? `
          <p class="fonte-dados">Fonte: ${indicadorPrincipal.fonte}</p>
        ` : ''}
      </div>
      
      <div class="card-actions">
        <button class="btn btn-outline btn-exportar" data-indicador="${indicadorPrincipal.endpoint || 'principal'}" aria-label="Exportar dados de ${indicadorPrincipal.titulo || 'indicador principal'} em formato CSV">
          <i class="fas fa-download" aria-hidden="true"></i> Exportar CSV
        </button>
        <button class="btn btn-primary btn-detalhes" id="btn-mostrar-detalhes" aria-label="Ver análise detalhada de ${indicadorPrincipal.titulo || 'indicador principal'}">
          <i class="fas fa-chart-line" aria-hidden="true"></i> Análise Detalhada
        </button>
      </div>
    </div>
  `;
}

/**
 * Gera o HTML para um card de indicador
 * @param {Object} indicador - Dados do indicador
 * @param {number} odsNumero - Número do ODS
 * @returns {string} - HTML do card do indicador
 * @private
 */
function gerarHtmlCardIndicador(indicador, odsNumero) {
  if (!indicador) {
    return '';
  }

  const idIndicador = `indicador-${indicador.endpoint || 'sem-id'}`;
  
  return `
    <div class="card-indicador ${`ods${odsNumero}-color`}" id="${idIndicador}">
      <div class="card-header">
        <h3>${indicador.titulo || 'Carregando...'}</h3>
        <div class="ods-badge">${odsNumero}</div>
      </div>
      
      <div class="card-body">
        <div class="valor-principal" id="valor-${indicador.endpoint}">--</div>
        <p class="descricao-indicador" id="descricao-${indicador.endpoint}">Carregando dados...</p>
        
        ${indicador.infoAdicional ? `
          <div class="info-complementar">${indicador.infoAdicional}</div>
        ` : ''}
        
        <div class="grafico-container">
          <canvas id="grafico-${indicador.endpoint}" role="img" aria-label="Gráfico do indicador ${indicador.titulo || 'sem título'}"></canvas>
          <div id="descricao-textual-${indicador.endpoint}" class="sr-only">Descrição detalhada do gráfico "${indicador.titulo}" será exibida aqui após o carregamento dos dados.</div>
        </div>

        ${indicador.fonte ? `
          <p class="fonte-dados">Fonte: ${indicador.fonte}</p>
        ` : ''}
      </div>
      
      <div class="card-actions">
        <button class="btn btn-outline btn-exportar" data-indicador="${indicador.endpoint}" aria-label="Exportar dados de ${indicador.titulo || 'indicador'} em formato CSV">
          <i class="fas fa-download" aria-hidden="true"></i> Exportar CSV
        </button>
        <button class="btn btn-primary btn-detalhes" data-indicador="${indicador.endpoint}" aria-label="Ver detalhes de ${indicador.titulo || 'indicador'}">
          <i class="fas fa-info-circle" aria-hidden="true"></i> Ver Detalhes
        </button>
      </div>
    </div>
  `;
}

/**
 * Gera o HTML para o gráfico comparativo
 * @param {Object} config - Configurações do dashboard
 * @returns {string} - HTML do gráfico comparativo
 * @private
 */
function gerarHtmlGraficoComparativo(config) {
  if (!config.exibirComparativo) {
    return '';
  }

  return `
    <div class="card-indicador full-width">
      <div class="card-header">
        <h3>Análise Comparativa</h3>
      </div>
      
      <div class="card-body">
        <div class="grafico-comparativo-container">
          <canvas id="grafico-comparativo" role="img" aria-label="Gráfico comparativo dos indicadores"></canvas>
          <div id="grafico-comparativo-desc" class="sr-only">Análise comparativa dos indicadores ao longo do tempo.</div>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="btn btn-outline btn-exportar" data-indicador="comparativo">
          <i class="fas fa-download"></i> Exportar Dados
        </button>
      </div>
    </div>
  `;
}

/**
 * Gera o HTML para a seção de ações de impacto
 * @param {Object} config - Configurações do dashboard
 * @returns {string} - HTML da seção de ações de impacto
 * @private
 */
function gerarHtmlSecaoAcoesImpacto(config) {
  if (!config.acoesImpacto || config.acoesImpacto.length === 0) {
    return '';
  }

  const { acoesImpacto, odsNumero } = config;
  
  return `
    <section class="acoes-impacto-section">
      <h2>Ações de Impacto</h2>
      <div class="acoes-grid">
        ${acoesImpacto.map(acao => `
          <div class="acao-card ${`ods${odsNumero}-color`}">
            <h3>${acao.titulo}</h3>
            <p>${acao.descricao}</p>
            ${acao.link ? `<a href="${acao.link}" class="btn btn-primary btn-sm">Saiba mais</a>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Gera o HTML para a seção de recomendações
 * @param {Object} config - Configurações do dashboard
 * @returns {string} - HTML da seção de recomendações
 * @private
 */
function gerarHtmlSecaoRecomendacoes(config) {
  if (!config.recomendacoes || config.recomendacoes.length === 0) {
    return '';
  }

  const { recomendacoes, odsNumero } = config;
  
  return `
    <section class="recomendacoes-section">
      <h2>Recomendações de Políticas Públicas</h2>
      <div class="recomendacoes-lista">
        ${recomendacoes.map((rec, index) => `
          <div class="recomendacao-item ${`ods${odsNumero}-color`}">
            <h3>${index + 1}. ${rec.titulo}</h3>
            <p>${rec.descricao}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Inicializa o dashboard ODS moderno na página
 * @param {string} seletorConteiner - Seletor CSS do elemento onde o dashboard será renderizado
 * @param {Object} config - Configurações do dashboard
 */
export async function inicializarDashboard(seletorConteiner, config) {
  try {
    // Importa os módulos necessários
    const carregadorDados = await import('./carregadorDados.js');
    const graficosMelhorados = await import('./graficosMelhorados.js');
    const { inicializarMicroInteracoes } = await import('./microInteracoes.js');
    
    // Obtém o contêiner do dashboard
    const conteiner = document.querySelector(seletorConteiner);
    if (!conteiner) {
      console.error(`Contêiner não encontrado: ${seletorConteiner}`);
      return;
    }
    
    // Obtém o número do ODS da página atual
    const odsNumero = config.odsNumero || 
      document.body.getAttribute('data-pagina')?.replace('ods', '') || 
      window.location.pathname.match(/ods(\d+)/)?.[1];
      
    if (!odsNumero) {
      console.error('Não foi possível determinar o número do ODS');
      return;
    }
    
    // Mescla a configuração com o número do ODS determinado
    const configuracaoDashboard = {
      ...config,
      odsNumero
    };
    
    // Renderiza o template HTML no contêiner
    conteiner.innerHTML = gerarTemplateDashboard(configuracaoDashboard);
    
    // Inicializa as microinterações
    await inicializarMicroInteracoes();
    
    // Carrega os dados dos indicadores
    await carregarDadosIndicadores(configuracaoDashboard, carregadorDados);
    
    // Renderiza os gráficos
    renderizarGraficos(configuracaoDashboard, graficosMelhorados);
    
    // Configura eventos de interação
    configurarEventosInteracao(configuracaoDashboard);
    
    // Atualiza informação de data de atualização
    atualizarDataAtualizacao();
    
    return true;
  } catch (erro) {
    console.error('Erro ao inicializar dashboard:', erro);
    exibirMensagemErro(document.querySelector(seletorConteiner), erro);
    return false;
  }
}

/**
 * Exibe mensagem de erro no dashboard
 * @param {HTMLElement} container - Container onde exibir erro
 * @param {Error} erro - Objeto de erro
 */
function exibirMensagemErro(container, erro) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="erro-carregamento" role="alert" aria-live="assertive">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      <h2>Não foi possível carregar o dashboard</h2>
      <p>Ocorreu um erro ao carregar os dados do dashboard: ${erro.message}</p>
      <button onclick="window.location.reload()" class="btn btn-primary">
        <i class="fas fa-sync" aria-hidden="true"></i> Tentar novamente
      </button>
    </div>
  `;
}

/**
 * Carrega os dados dos indicadores
 * @param {Object} config - Configurações do dashboard
 * @param {Object} carregadorDados - Módulo de carregamento de dados
 * @private
 */
async function carregarDadosIndicadores(config, carregadorDados) {
  try {
    console.log('Carregando dados dos indicadores...');
    
    // Carrega dados do indicador principal
    if (config.indicadorPrincipal) {
      console.log(`Buscando dados do indicador principal: ${config.indicadorPrincipal.endpoint}`);
      const dadosPrincipal = await carregadorDados.buscarDadosAPI(config.indicadorPrincipal.endpoint);
      atualizarVisualizacaoIndicador('principal', dadosPrincipal, config.indicadorPrincipal);
    }
    
    // Carrega dados dos indicadores secundários
    if (config.indicadores && config.indicadores.length > 0) {
      for (const indicador of config.indicadores) {
        console.log(`Buscando dados do indicador: ${indicador.endpoint}`);
        const dados = await carregadorDados.buscarDadosAPI(indicador.endpoint);
        atualizarVisualizacaoIndicador(indicador.endpoint, dados, indicador);
      }
    }
    
    console.log('Todos os indicadores carregados com sucesso');
  } catch (erro) {
    console.error('Erro ao carregar dados dos indicadores:', erro);
    throw new Error(`Falha ao carregar indicadores: ${erro.message}`);
  }
}

/**
 * Atualiza a visualização de um indicador com os dados carregados
 * @param {string} idIndicador - ID base do indicador
 * @param {Object} dados - Dados do indicador
 * @param {Object} configuracaoIndicador - Configuração do indicador
 * @private
 */
function atualizarVisualizacaoIndicador(idIndicador, dados, configuracaoIndicador) {
  // Atualiza valor principal
  const elementoValor = document.getElementById(`valor-${idIndicador}`);
  if (elementoValor) {
    elementoValor.textContent = dados.valor ? 
      (typeof dados.valor === 'number' ? 
        dados.valor.toLocaleString('pt-BR', {maximumFractionDigits: 2}) : 
        dados.valor
      ) : '--';
      
    // Sinaliza carregamento completo adicionando classe
    elementoValor.classList.add('carregado');

    // Anunciar para leitores de tela que o valor foi atualizado
    const valorAtualizado = elementoValor.textContent;
    const containerIndicador = elementoValor.closest('.card-indicador');
    
    // Cria um elemento para anúncio de leitores de tela
    const anuncioLiveRegion = document.createElement('div');
    anuncioLiveRegion.setAttribute('role', 'status');
    anuncioLiveRegion.setAttribute('aria-live', 'polite');
    anuncioLiveRegion.classList.add('sr-only');
    anuncioLiveRegion.textContent = `${configuracaoIndicador.titulo || 'Indicador'} atualizado: ${valorAtualizado}${dados.unidade ? ' ' + dados.unidade : ''}`;
    
    // Adiciona o anúncio e o remove após ser lido
    if (containerIndicador) {
      containerIndicador.appendChild(anuncioLiveRegion);
      setTimeout(() => anuncioLiveRegion.remove(), 3000);
    }
  }
  
  // Atualiza descrição
  const elementoDescricao = document.getElementById(`descricao-${idIndicador}`);
  if (elementoDescricao) {
    elementoDescricao.textContent = configuracaoIndicador.descricao || 
      `${dados.descricao || 'Dados de'} ${dados.ano || 'período atual'}`;
      
    // Sinaliza carregamento completo adicionando classe
    elementoDescricao.classList.add('carregado');
  }

  // Atualiza descrição textual detalhada do gráfico para acessibilidade
  const elementoDescricaoTextual = document.getElementById(`descricao-textual-${idIndicador}`);
  if (elementoDescricaoTextual && dados.dados && dados.dados.length > 0) {
    // Cria uma descrição textual detalhada do gráfico para leitores de tela
    const titulo = configuracaoIndicador.titulo || dados.indicador || 'indicador';
    let textoDescritivo = `Gráfico de ${titulo}: `;
    
    // Adiciona tendência geral (crescimento, queda ou estabilidade)
    const primeiroValor = dados.dados[0].valor;
    const ultimoValor = dados.dados[dados.dados.length - 1].valor;
    let tendencia = "estável";
    
    if (ultimoValor > primeiroValor * 1.05) tendencia = "crescimento";
    if (ultimoValor < primeiroValor * 0.95) tendencia = "queda";
    
    textoDescritivo += `Mostra ${tendencia} ao longo do tempo. `;
    
    // Adiciona valores específicos
    textoDescritivo += "Valores por ano: ";
    dados.dados.forEach((item, index) => {
      if (index > 0) textoDescritivo += ", ";
      textoDescritivo += `${item.ano}: ${item.valor}${dados.unidade ? ' ' + dados.unidade : ''}`;
    });
    
    // Adiciona meta do ODS se disponível
    if (dados.meta_ods) {
      textoDescritivo += `. Meta ODS: ${dados.meta_ods}`;
    }
    
    // Adiciona fonte dos dados
    if (configuracaoIndicador.fonte || dados.fonte) {
      textoDescritivo += `. Fonte: ${configuracaoIndicador.fonte || dados.fonte}`;
    }
    
    // Adiciona explicação se disponível
    if (dados.explicacao) {
      textoDescritivo += `. ${dados.explicacao}`;
    }
    
    elementoDescricaoTextual.textContent = textoDescritivo;
  }
}

/**
 * Renderiza os gráficos dos indicadores
 * @param {Object} config - Configurações do dashboard
 * @param {Object} graficosMelhorados - Módulo de gráficos melhorados
 * @private
 */
function renderizarGraficos(config, graficosMelhorados) {
  try {
    // Renderiza gráfico do indicador principal
    if (config.indicadorPrincipal && config.indicadorPrincipal.dados) {
      const canvasPrincipal = document.getElementById('grafico-principal');
      if (canvasPrincipal) {
        graficosMelhorados.renderizarGraficoLinha(canvasPrincipal, config.indicadorPrincipal.dados, {
          odsId: config.odsNumero,
          tituloEixoX: config.indicadorPrincipal.tituloEixoX || 'Período',
          tituloEixoY: config.indicadorPrincipal.tituloEixoY || 'Valor',
          adicionarDescricaoTextual: true
        });
      }
    }
    
    // Renderiza gráficos dos indicadores secundários
    if (config.indicadores && config.indicadores.length > 0) {
      config.indicadores.forEach(indicador => {
        if (indicador.dados) {
          const canvas = document.getElementById(`grafico-${indicador.endpoint}`);
          if (canvas) {
            const tipoGrafico = indicador.tipoGrafico || 'linha';
            
            if (tipoGrafico === 'barra') {
              graficosMelhorados.renderizarGraficoBarra(canvas, indicador.dados, {
                odsId: config.odsNumero,
                tituloEixoX: indicador.tituloEixoX || 'Período',
                tituloEixoY: indicador.tituloEixoY || 'Valor',
                adicionarDescricaoTextual: true
              });
            } else {
              graficosMelhorados.renderizarGraficoLinha(canvas, indicador.dados, {
                odsId: config.odsNumero,
                tituloEixoX: indicador.tituloEixoX || 'Período',
                tituloEixoY: indicador.tituloEixoY || 'Valor',
                adicionarDescricaoTextual: true
              });
            }
          }
        }
      });
    }
    
    // Renderiza gráfico comparativo se solicitado
    if (config.exibirComparativo && config.dadosComparativos) {
      const canvasComparativo = document.getElementById('grafico-comparativo');
      if (canvasComparativo) {
        graficosMelhorados.renderizarGraficoLinha(canvasComparativo, config.dadosComparativos, {
          odsId: config.odsNumero,
          tituloEixoX: 'Período',
          tituloEixoY: 'Valor',
          adicionarDescricaoTextual: true
        });
      }
    }
  } catch (erro) {
    console.error('Erro ao renderizar gráficos:', erro);
  }
}

/**
 * Configura eventos de interação para o dashboard
 * @param {Object} config - Configurações do dashboard
 * @private
 */
function configurarEventosInteracao(config) {
  // Configura eventos para botões de exportação
  document.querySelectorAll('.btn-exportar').forEach(botao => {
    botao.addEventListener('click', function() {
      const indicador = this.getAttribute('data-indicador');
      if (indicador) {
        // Cria um evento customizado para solicitar exportação
        const evento = new CustomEvent('exportar-csv-indicador', {
          detail: {
            endpoint: indicador,
            titulo: indicador === 'principal' ? 
              config.indicadorPrincipal?.titulo : 
              config.indicadores?.find(ind => ind.endpoint === indicador)?.titulo
          }
        });
        
        window.dispatchEvent(evento);
      }
    });
  });
  
  // Configura eventos para botões de detalhes
  document.querySelectorAll('.btn-detalhes').forEach(botao => {
    botao.addEventListener('click', function() {
      const indicador = this.getAttribute('data-indicador');
      
      // Implementação a ser definida conforme necessidade
      console.log(`Solicitada visualização detalhada do indicador: ${indicador}`);
      
      // Evento para exibição de modal ou navegação para página de detalhes
      const evento = new CustomEvent('mostrar-detalhes-indicador', {
        detail: { indicador }
      });
      
      window.dispatchEvent(evento);
    });
  });
}

/**
 * Atualiza a informação de data de atualização
 * @private
 */
function atualizarDataAtualizacao() {
  const elementosData = document.querySelectorAll('#data-atualizacao');
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  elementosData.forEach(elemento => {
    elemento.textContent = dataFormatada;
  });
}

export default {
  gerarTemplateDashboard,
  inicializarDashboard
};