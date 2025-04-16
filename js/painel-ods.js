/**
 * Painel ODS - Script principal
 * Responsável por inicializar e gerenciar o dashboard de indicadores ODS
 * Versão refatorada para ser configurável para qualquer ODS
 */

import { obterCoresODS } from './utils/coresODS.js';
import { 
  criarGraficoLinha,
  criarGraficoBarra,
  criarGraficoComparativo,
  getOdsColor,
  exportarGraficoComoPNG,
  adicionarBotaoExportacao
} from './modules/graficoResponsivo.js';

import {
  fetchComCache,
  construirUrlApi,
  formatarData,
  exportarDadosCSV,
  adicionarDescricaoAcessivel
} from './utils/painel-utils.js';

// Variáveis globais
let paginaAtual = '';
let codigoODS = '';
let graficoPrincipal = null;
let configODS = null;
const CACHE_TEMPO = 3600000; // 1 hora em milisegundos

// Elementos DOM principais
const elementosDOM = {
  loading: document.getElementById('loading-indicator'),
  erro: document.getElementById('error-message'),
  indicadoresContainer: document.getElementById('indicadores-detalhados'),
  valorPrincipal: document.getElementById('valor-principal'),
  valorDescricao: document.getElementById('valor-descricao'),
  botaoExportar: document.getElementById('btn-exportar')
};

/**
 * Inicialização do painel quando o DOM estiver totalmente carregado
 */
document.addEventListener('DOMContentLoaded', async () => {
  await carregarConfiguracao();
  inicializarPainel();
  configurarEventListeners();
  
  // Adiciona inicialização do mapa se presente na configuração
  const temMapa = document.getElementById('mapa-vulnerabilidade') && 
                 configODS && configODS.mapaConfig && configODS.mapaConfig.enabled;
                 
  if (temMapa) {
    carregarDadosMapaVulnerabilidade();
  }
});

/**
 * Carrega o arquivo de configuração para os ODS
 */
async function carregarConfiguracao() {
  try {
    detectarPaginaAtual();
    
    if (!codigoODS) return;
    
    const configData = await fetchComCache('/js/config/ods-config.json');
    if (configData && configData[codigoODS]) {
      configODS = configData[codigoODS];
      console.log(`Configuração carregada para ${codigoODS}:`, configODS);
    } else {
      console.error(`Configuração para ${codigoODS} não encontrada!`);
    }
  } catch (erro) {
    console.error('Erro ao carregar configuração:', erro);
    mostrarErro('Não foi possível carregar a configuração do painel.');
  }
}

/**
 * Inicializa o painel, detectando a página atual e carregando os dados correspondentes
 */
async function inicializarPainel() {
  try {
    if (codigoODS && configODS) {
      await Promise.all([
        carregarDadosPrincipais(),
        carregarIndicadoresDetalhados()
      ]);
      
      // Oculta a mensagem de carregamento após a conclusão
      if (elementosDOM.loading) {
        elementosDOM.loading.style.display = 'none';
      }
    }
  } catch (erro) {
    console.error('Erro ao inicializar o painel:', erro);
    mostrarErro('Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.');
  }
}

/**
 * Detecta a página ODS atual com base na URL ou atributos data
 */
function detectarPaginaAtual() {
  // Verifica se está em uma página específica de ODS
  const path = window.location.pathname;
  const pageName = path.split('/').pop();
  
  if (pageName.startsWith('ods') && pageName.includes('.html')) {
    codigoODS = pageName.replace('.html', '');
    paginaAtual = codigoODS;
    
    // Também pode obter do atributo data do body
    const bodyDataPage = document.body.getAttribute('data-pagina');
    if (bodyDataPage && bodyDataPage.startsWith('ods')) {
      // Confirma o código usando o atributo data
      codigoODS = bodyDataPage;
    }
    
    console.log(`Página atual: ${paginaAtual}`, `Código ODS: ${codigoODS}`);
  } else {
    console.log('Não está em uma página específica de ODS');
  }
}

/**
 * Configura os event listeners para interatividade
 */
function configurarEventListeners() {
  // Configurar botão de exportação de dados
  if (elementosDOM.botaoExportar) {
    elementosDOM.botaoExportar.addEventListener('click', () => {
      if (graficoPrincipal) {
        exportarGraficoComoPNG(graficoPrincipal.id, `dados_${codigoODS}`);
      }
    });
  }
  
  // Event listener para redimensionamento da janela (otimização de gráficos)
  window.addEventListener('resize', () => {
    if (graficoPrincipal) {
      // Redimensiona com animação desativada para melhor performance
      graficoPrincipal.resize();
    }
  });
  
  // Tratamento de seleção de idioma (se existir)
  const seletorIdioma = document.getElementById('selector-idioma');
  if (seletorIdioma) {
    seletorIdioma.addEventListener('change', (event) => {
      const idiomaSelecionado = event.target.value;
      // Armazena a preferência de idioma
      localStorage.setItem('idioma-preferido', idiomaSelecionado);
      // Recarrega a página para aplicar o novo idioma
      window.location.reload();
    });
  }
  
  // Detectar mudança de tema
  const temaHandler = function(e) {
    if (graficoPrincipal) {
      const temaAtivo = document.documentElement.getAttribute('data-theme') || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      
      if (temaAtivo === 'dark') {
        document.body.classList.add('modo-escuro');
      } else {
        document.body.classList.remove('modo-escuro');
      }
      
      // O próprio gráfico se atualizará no próximo render
    }
  };

  // Verifica tema inicial
  temaHandler();
  
  // Fica atento a mudanças de tema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', temaHandler);
}

/**
 * Carrega os dados principais para o gráfico e indicador principal via API
 */
async function carregarDadosPrincipais() {
  if (elementosDOM.loading) elementosDOM.loading.style.display = 'block';
  limparErro();

  try {
    // Obter valores dos filtros (ajuste os seletores se necessário)
    const ano = document.getElementById('ano-filtro')?.value || '2025'; // Valor padrão ou do filtro
    const territorio = document.getElementById('territorio-filtro')?.value || 'sergipe'; // Valor padrão ou do filtro

    // Verifica se temos configuração e código ODS
    if (!configODS || !codigoODS) {
        throw new Error('Configuração ou código ODS não definido.');
    }

    // Usa a URL da API da configuração ou constrói dinamicamente
    const apiUrl = configODS.endpoints.principais || `/api/v1/ods/${codigoODS}/principais`;
    const urlCompleta = construirUrlApi(apiUrl, {
        ano: ano,
        territorio: territorio
    });

    const dadosPrincipais = await fetchComCache(urlCompleta);

    if (!dadosPrincipais) {
      throw new Error('Resposta da API vazia ou inválida para dados principais.');
    }

    // Atualiza a interface com os dados recebidos
    atualizarIndicadorPrincipal(dadosPrincipais);
    inicializarGraficoPrincipal(dadosPrincipais);
    atualizarDataAtualizacao(dadosPrincipais.dataAtualizacao || new Date().toISOString());

  } catch (erro) {
    console.error('Erro ao carregar dados principais da API:', erro);
    mostrarErro(`Não foi possível carregar os dados principais. ${erro.message}`);
  } finally {
    if (elementosDOM.loading) elementosDOM.loading.style.display = 'none';
  }
}

/**
 * Carrega os indicadores detalhados para o ODS atual via API
 */
async function carregarIndicadoresDetalhados() {
  try {
    // Obter valores dos filtros (ajuste os seletores se necessário)
    const ano = document.getElementById('ano-filtro')?.value || '2025';
    const territorio = document.getElementById('territorio-filtro')?.value || 'sergipe';

    // Verifica se temos configuração e código ODS
    if (!configODS || !codigoODS) {
        throw new Error('Configuração ou código ODS não definido.');
    }

    // Usa a URL da API da configuração ou constrói dinamicamente
    const apiUrl = configODS.endpoints.detalhados || `/api/v1/ods/${codigoODS}/detalhados`;
    const urlCompleta = construirUrlApi(apiUrl, {
        ano: ano,
        territorio: territorio
    });

    const dadosDetalhados = await fetchComCache(urlCompleta);

    if (!dadosDetalhados || !dadosDetalhados.indicadores) {
      throw new Error('Resposta da API vazia ou inválida para dados detalhados.');
    }

    // Renderiza os indicadores detalhados
    renderizarIndicadoresDetalhados(dadosDetalhados.indicadores);

  } catch (erro) {
    console.error('Erro ao carregar indicadores detalhados da API:', erro);
    // Exibe erro em um local específico para esta seção ou no erro geral
    mostrarErro(`Não foi possível carregar os indicadores detalhados. ${erro.message}`);
    // Se necessário, cria indicadores fictícios para demonstração
    criarIndicadoresFicticios();
  }
}

/**
 * Atualiza o indicador principal no dashboard
 */
function atualizarIndicadorPrincipal(dados) {
  if (!elementosDOM.valorPrincipal || !elementosDOM.valorDescricao || !dados) return;
  
  // Usa a configuração para identificar o indicador principal
  let valorIndicador = '0';
  let descricaoIndicador = 'Dados não disponíveis';
  
  if (configODS && configODS.indicadorPrincipal) {
    const chaveIndicador = configODS.indicadorPrincipal.chave;
    
    if (dados[chaveIndicador] !== undefined) {
      valorIndicador = configODS.indicadorPrincipal.unidade === '%' ? 
        `${dados[chaveIndicador]}%` : 
        dados[chaveIndicador].toString();
      
      descricaoIndicador = configODS.indicadorPrincipal.titulo;
    }
  } else {
    // Fallback para quando não há configuração específica
    console.warn('Configuração do indicador principal não encontrada, utilizando detecção genérica.');
    
    // Tenta encontrar um valor relevante nos dados
    if (dados.valorIndicadorPrincipal) {
      valorIndicador = dados.valorIndicadorPrincipal;
      descricaoIndicador = dados.descricaoIndicadorPrincipal || 'Indicador principal';
    }
  }
  
  // Atualiza os elementos na interface
  elementosDOM.valorPrincipal.textContent = valorIndicador;
  elementosDOM.valorDescricao.textContent = descricaoIndicador;
  
  // Adiciona animação de aparecimento
  elementosDOM.valorPrincipal.classList.add('animacao-aparecer');
}

/**
 * Inicializa o gráfico principal do dashboard
 */
function inicializarGraficoPrincipal(dados) {
  if (!dados) return;
  
  const canvasGrafico = document.getElementById('grafico-principal');
  if (!canvasGrafico) {
    console.error('Canvas do gráfico principal não encontrado');
    return;
  }
  
  // Prepara os dados para o gráfico com base na configuração
  const dadosPreparados = prepararDadosGraficoPrincipal(dados);
  
  // Extrai número do ODS (exemplo: 'ods1' => 1)
  const numeroODS = parseInt(codigoODS.replace('ods', '')) || 1;
  
  // Define o título do gráfico com base na configuração
  const tituloGrafico = configODS && configODS.graficoPrincipal && configODS.graficoPrincipal.titulo ? 
                        configODS.graficoPrincipal.titulo : 
                        `Evolução - ${codigoODS.toUpperCase()}`;
  
  // Opções personalizadas para o gráfico
  const opcoes = {
    tituloGrafico: tituloGrafico,
    beginAtZero: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              if (dadosPreparados.unidade === 'porcentagem') {
                label += '%';
              } else if (dadosPreparados.unidade) {
                label += ` ${dadosPreparados.unidade}`;
              }
            }
            return label;
          }
        }
      }
    }
  };
  
  // Criar gráfico usando nosso módulo responsivo
  graficoPrincipal = criarGraficoLinha(
    'grafico-principal',
    dadosPreparados.data,
    opcoes
  );
  
  // Adiciona descrição acessível automaticamente
  const descricao = `Gráfico de evolução dos indicadores para o ${codigoODS.toUpperCase()}. ` +
                    `Mostra a tendência de ${dadosPreparados.data.datasets[0].label} ao longo dos anos, ` +
                    `com valores entre ${Math.min(...dadosPreparados.data.datasets[0].data)}${dadosPreparados.unidade === 'porcentagem' ? '%' : ''} e ` +
                    `${Math.max(...dadosPreparados.data.datasets[0].data)}${dadosPreparados.unidade === 'porcentagem' ? '%' : ''}.`;
  
  adicionarDescricaoAcessivel('grafico-principal', descricao);
  
  // Adiciona botão de exportação de imagem
  adicionarBotaoExportacao('grafico-principal', `grafico_${codigoODS}`);
}

/**
 * Prepara os dados para o gráfico principal com base na configuração
 */
function prepararDadosGraficoPrincipal(dados) {
  let labels = [];
  let valores = [];
  let titulo = '';
  let unidade = '';
  
  // Usa a configuração para identificar o histórico correto a ser usado
  if (configODS && configODS.indicadorPrincipal && configODS.indicadorPrincipal.historicoChave) {
    const historicoChave = configODS.indicadorPrincipal.historicoChave;
    
    if (dados[historicoChave]) {
      labels = dados[historicoChave].map(item => item.ano);
      valores = dados[historicoChave].map(item => item.valor);
      titulo = configODS.graficoPrincipal ? configODS.graficoPrincipal.titulo : 'Evolução';
      unidade = configODS.graficoPrincipal ? configODS.graficoPrincipal.unidade : '';
    }
  } else {
    // Fallback para quando não há configuração específica
    console.warn('Configuração de histórico não encontrada, tentando detectar automaticamente.');
    
    // Tenta encontrar um campo de histórico nos dados
    if (dados.historico) {
      labels = dados.historico.map(item => item.ano || item.periodo);
      valores = dados.historico.map(item => item.valor);
      titulo = dados.tituloIndicador || 'Evolução do indicador';
      unidade = dados.unidade || '';
    } else {
      // Dados fictícios para demonstração
      labels = ['2020', '2021', '2022', '2023', '2024'];
      valores = [45, 52, 57, 60, 67];
      titulo = 'Indicador demonstrativo';
      unidade = 'porcentagem';
    }
  }
  
  // Extrai número do ODS para obter as cores
  const numeroODS = parseInt(codigoODS.replace('ods', '')) || 1;
  
  // Define as cores com base na configuração ou usa defaults
  const corPrimaria = configODS && configODS.corPrimaria ? configODS.corPrimaria : getOdsColor(numeroODS);
  const corSecundaria = configODS && configODS.corSecundaria ? configODS.corSecundaria : getOdsColor(numeroODS, true);
  
  return {
    data: {
      labels: labels,
      datasets: [{
        label: titulo,
        data: valores,
        borderColor: corPrimaria,
        backgroundColor: corSecundaria,
        fill: true,
        tension: 0.4
      }]
    },
    unidade: unidade
  };
}

/**
 * Renderiza os indicadores detalhados na interface
 */
function renderizarIndicadoresDetalhados(indicadores) {
  if (!elementosDOM.indicadoresContainer || !indicadores) return;
  
  // Limpa o conteúdo existente
  elementosDOM.indicadoresContainer.innerHTML = '';
  
  // Para cada indicador, cria um card
  indicadores.forEach(indicador => {
    const card = document.createElement('div');
    card.className = 'indicador-card';
    card.setAttribute('tabindex', '0'); // Torna o card focável para acessibilidade
    
    // Adiciona ícone se disponível
    let iconeHTML = '';
    if (indicador.icone) {
      iconeHTML = `<i class="${indicador.icone}" aria-hidden="true"></i> `;
    }
    
    // Determina a classe de tendência
    let classeTendencia = '';
    let textoTendencia = '';
    let iconeTendencia = '';
    
    if (indicador.tendencia) {
      if (indicador.tendencia === 'positiva') {
        classeTendencia = 'tendencia positiva';
        textoTendencia = 'Em melhoria';
        iconeTendencia = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
      } else if (indicador.tendencia === 'negativa') {
        classeTendencia = 'tendencia negativa';
        textoTendencia = 'Em piora';
        iconeTendencia = '<i class="fas fa-arrow-down" aria-hidden="true"></i>';
      } else {
        classeTendencia = 'tendencia estavel';
        textoTendencia = 'Estável';
        iconeTendencia = '<i class="fas fa-minus" aria-hidden="true"></i>';
      }
    }
    
    // Constrói o HTML do card
    card.innerHTML = `
      <h3>${iconeHTML}${indicador.titulo}</h3>
      <p class="texto-indicador">${indicador.descricao || ''}</p>
      <div class="valor-grande">${indicador.valor}</div>
      <div class="${classeTendencia}">${iconeTendencia} ${textoTendencia}</div>
      ${indicador.textoComplementar ? `<p class="texto-indicador-complementar">${indicador.textoComplementar}</p>` : ''}
      ${indicador.fonte ? `<p class="fonte-indicador">Fonte: ${indicador.fonte}</p>` : ''}
      <button class="botao-exportar-indicador" data-indicador="${indicador.id || ''}" aria-label="Exportar dados deste indicador">
        <i class="fas fa-download" aria-hidden="true"></i>
      </button>
    `;
    
    // Adiciona o card ao container
    elementosDOM.indicadoresContainer.appendChild(card);
    
    // Animação de entrada
    setTimeout(() => {
      card.classList.add('animado');
    }, 100);
  });
  
  // Adiciona listeners para os botões de exportação
  const botoesExportar = document.querySelectorAll('.botao-exportar-indicador');
  botoesExportar.forEach(botao => {
    botao.addEventListener('click', (event) => {
      const idIndicador = event.currentTarget.getAttribute('data-indicador');
      exportarIndicadorCSV(idIndicador);
    });
  });
}

/**
 * Cria indicadores fictícios para demonstração quando os dados reais não estão disponíveis
 */
function criarIndicadoresFicticios() {
  if (!elementosDOM.indicadoresContainer) return;
  
  // Dados fictícios gerais
  let indicadoresFicticios = [];
  
  // Se temos configuração, usa os dados fictícios mais próximos do real
  if (configODS && configODS.indicadorPrincipal) {
    indicadoresFicticios = [
      {
        titulo: configODS.indicadorPrincipal.titulo,
        valor: `45${configODS.indicadorPrincipal.unidade}`,
        tendencia: 'positiva',
        descricao: `Dados fictícios para ${configODS.titulo}`,
        icone: 'fas fa-chart-line'
      },
      {
        titulo: `Indicador secundário - ${codigoODS}`,
        valor: '78%',
        tendencia: 'estavel',
        descricao: 'Dados fictícios para demonstração',
        icone: 'fas fa-info-circle'
      }
    ];
  } else {
    // Indicadores genéricos para outros ODS
    indicadoresFicticios = [
      {
        titulo: 'Indicador Principal',
        valor: '54,3%',
        tendencia: 'positiva',
        descricao: 'Descrição do indicador principal para este ODS',
        icone: 'fas fa-chart-line'
      },
      {
        titulo: 'Indicador Secundário',
        valor: '35,7%',
        tendencia: 'estavel',
        descricao: 'Descrição do indicador secundário para este ODS',
        icone: 'fas fa-chart-bar'
      }
    ];
  }
  
  // Renderiza os indicadores fictícios
  renderizarIndicadoresDetalhados(indicadoresFicticios);
}

/**
 * Atualiza a data de atualização exibida no painel
 */
function atualizarDataAtualizacao(dataString) {
  const elementoData = document.getElementById('ultima-atualizacao');
  if (!elementoData) return;
  
  const dataFormatada = formatarData(dataString);
  elementoData.textContent = `Última atualização: ${dataFormatada}`;
}

/**
 * Exporta os dados de um indicador específico como CSV
 */
function exportarIndicadorCSV(idIndicador) {
  // Função para gerar CSV fictício para demonstração
  const gerarDadosFicticios = () => {
    // Cabeçalho
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ano;Valor;Observação\n";
    
    // Gera alguns dados históricos fictícios
    const anoAtual = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const ano = anoAtual - 4 + i;
      const valor = Math.round(Math.random() * 100) / 10;
      csvContent += `${ano};${valor};Observação para ${ano}\n`;
    }
    
    // Cria link para download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `indicador_${idIndicador || 'dados'}_${codigoODS}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Todo: No futuro, implementar busca real dos dados
  gerarDadosFicticios();
}

/**
 * Exibe uma mensagem de erro no painel
 */
function mostrarErro(mensagem) {
  if (!elementosDOM.erro) return;
  
  elementosDOM.erro.textContent = mensagem;
  elementosDOM.erro.style.display = 'block';
  
  if (elementosDOM.loading) {
    elementosDOM.loading.style.display = 'none';
  }
}

/**
 * Limpa a mensagem de erro
 */
function limparErro() {
  if (!elementosDOM.erro) return;
  elementosDOM.erro.textContent = '';
  elementosDOM.erro.style.display = 'none';
}

/**
 * Carrega os dados para o mapa e inicializa o mapa interativo
 */
async function carregarDadosMapaVulnerabilidade() {
  try {
    // Verifica se o container do mapa existe
    const containerMapa = document.getElementById('mapa-vulnerabilidade');
    if (!containerMapa) return;
    
    // Verifica se temos configuração de mapa
    if (!configODS || !configODS.mapaConfig || !configODS.mapaConfig.enabled) {
      console.warn('Configuração de mapa não encontrada ou desativada');
      return;
    }
    
    // URL da API para buscar os dados GeoJSON
    const mapaEndpoint = configODS.endpoints.mapaVulnerabilidade || `/api/v1/ods/${codigoODS}/mapa-vulnerabilidade`;
    
    try {
      // Tenta buscar dados da API
      const dadosGeo = await fetchComCache(mapaEndpoint);
      
      // Inicializa o mapa com os dados recebidos
      inicializarMapaInterativo('mapa-vulnerabilidade', dadosGeo, configODS.mapaConfig);
      
    } catch (erro) {
      console.warn('Erro ao buscar dados do mapa:', erro);
      console.info('Usando dados fictícios para demonstração...');
      
      // Inicializa o mapa sem dados, o que acionará a criação de dados fictícios
      inicializarMapaInterativo('mapa-vulnerabilidade', null, configODS.mapaConfig);
    }
    
  } catch (erro) {
    console.error('Erro ao carregar mapa:', erro);
  }
}

/**
 * Inicializa o mapa interativo
 * @param {string} containerId - ID do elemento HTML que conterá o mapa
 * @param {object} dadosGeo - Dados GeoJSON para renderizar no mapa
 * @param {object} configMapa - Configuração específica para o mapa
 */
function inicializarMapaInterativo(containerId, dadosGeo, configMapa) {
  // Verifica se o elemento container existe
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container do mapa não encontrado: ${containerId}`);
    return;
  }
  
  // Remove placeholder se existir
  const placeholder = container.querySelector('.mapa-placeholder');
  if (placeholder) {
    container.removeChild(placeholder);
  }
  
  // Coordenadas e zoom do mapa da configuração ou defaults
  const coordenadasCentro = configMapa?.center || [-10.9, -37.4]; // Default: Sergipe
  const zoomInicial = configMapa?.zoom || 8;
  
  // Inicializa o mapa
  const mapa = L.map(containerId).setView(coordenadasCentro, zoomInicial);
  
  // Adiciona camada base do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(mapa);
  
  // Estilos para as áreas de vulnerabilidade da configuração ou defaults
  const estilos = configMapa?.estilos || {
    alta: {
      color: '#388e3c',
      weight: 1,
      fillOpacity: 0.7
    },
    media: {
      color: '#81c784',
      weight: 1,
      fillOpacity: 0.6
    },
    baixa: {
      color: '#c8e6c9',
      weight: 1,
      fillOpacity: 0.5
    }
  };
  
  // Se temos dados GeoJSON, adicionamos ao mapa
  if (dadosGeo && dadosGeo.features) {
    const camadaVulnerabilidade = L.geoJSON(dadosGeo, {
      style: function(feature) {
        // Define o estilo baseado no nível de vulnerabilidade
        switch (feature.properties.vulnerabilidade) {
          case 'alta': return estilos.alta;
          case 'media': return estilos.media;
          case 'baixa': return estilos.baixa;
          default: return estilos.baixa;
        }
      },
      onEachFeature: function(feature, layer) {
        // Popula o popup com informações do município
        if (feature.properties) {
          const conteudoPopup = `
            <div class="mapa-popup">
              <h4>${feature.properties.nome}</h4>
              <p><strong>Vulnerabilidade:</strong> ${feature.properties.vulnerabilidade}</p>
              <p><strong>População afetada:</strong> ${feature.properties.populacaoAfetada || 'N/A'}</p>
              <p><strong>Principais riscos:</strong> ${feature.properties.riscos || 'N/A'}</p>
              <p><strong>Ações de mitigação:</strong> ${feature.properties.acoesDeAdaptacao || 'N/A'}</p>
            </div>
          `;
          layer.bindPopup(conteudoPopup);
        }
        
        // Adiciona interação de hover
        layer.on({
          mouseover: function(e) {
            const camada = e.target;
            camada.setStyle({
              weight: 3,
              fillOpacity: 0.9
            });
            camada.bringToFront();
            
            // Adiciona tooltip para acessibilidade
            camada.bindTooltip(feature.properties.nome, {
              direction: 'top',
              sticky: true
            }).openTooltip();
          },
          mouseout: function(e) {
            camadaVulnerabilidade.resetStyle(e.target);
          },
          click: function(e) {
            mapa.fitBounds(e.target.getBounds());
          }
        });
      }
    }).addTo(mapa);
    
    // Ajusta a visualização para mostrar todos os dados
    mapa.fitBounds(camadaVulnerabilidade.getBounds());
  } else {
    // Se não temos dados, carregamos dados fictícios para demonstração
    console.warn('Dados GeoJSON não fornecidos, usando dados fictícios para demonstração');
    criarDadosFicticiosDoMapaSergipe(mapa, estilos);
  }
  
  // Adiciona controles de zoom com posicionamento acessível
  mapa.zoomControl.setPosition('topright');
  
  // Adiciona escala
  L.control.scale({
    imperial: false,
    position: 'bottomright'
  }).addTo(mapa);
  
  // Adiciona legenda
  adicionarLegendaMapa(mapa);
  
  return mapa;
}

/**
 * Cria dados fictícios para demonstração do mapa de vulnerabilidade climática
 * @param {L.Map} mapa - Instância do mapa Leaflet
 * @param {object} estilos - Estilos para as áreas de vulnerabilidade
 */
function criarDadosFicticiosDoMapaSergipe(mapa, estilos) {
  // Cidades principais de Sergipe com coordenadas aproximadas
  const cidadesSergipe = [
    { nome: "Aracaju", coords: [-10.9472, -37.0731], vulnerabilidade: "media", populacaoAfetada: "120.000", riscos: "Elevação do mar, inundações", acoesDeAdaptacao: "Barreiras costeiras" },
    { nome: "Nossa Senhora do Socorro", coords: [-10.8568, -37.1233], vulnerabilidade: "alta", populacaoAfetada: "85.000", riscos: "Inundações, deslizamentos", acoesDeAdaptacao: "Sistema de drenagem" },
    { nome: "Lagarto", coords: [-10.9153, -37.6689], vulnerabilidade: "baixa", populacaoAfetada: "35.000", riscos: "Seca", acoesDeAdaptacao: "Cisternas, reflorestamento" },
    { nome: "Itabaiana", coords: [-10.6829, -37.4259], vulnerabilidade: "media", populacaoAfetada: "42.000", riscos: "Seca, ondas de calor", acoesDeAdaptacao: "Áreas verdes urbanas" },
    { nome: "Estância", coords: [-11.2646, -37.4381], vulnerabilidade: "alta", populacaoAfetada: "28.000", riscos: "Elevação do mar, erosão costeira", acoesDeAdaptacao: "Restauração de manguezais" },
    { nome: "Propriá", coords: [-10.2167, -36.8333], vulnerabilidade: "alta", populacaoAfetada: "18.000", riscos: "Inundações do Rio São Francisco", acoesDeAdaptacao: "Monitoramento de cheias" },
    { nome: "Tobias Barreto", coords: [-11.1829, -37.9999], vulnerabilidade: "baixa", populacaoAfetada: "15.000", riscos: "Seca prolongada", acoesDeAdaptacao: "Captação de água de chuva" }
  ];
  
  // Raios dos círculos proporcionais à população afetada (simplificado)
  const calcularRaio = (populacao) => {
    const pop = parseInt(populacao.replace(/\D/g, ''), 10);
    return Math.sqrt(pop) * 50;
  };
  
  // Adiciona marcadores de círculo para cada cidade
  cidadesSergipe.forEach(cidade => {
    const raio = calcularRaio(cidade.populacaoAfetada);
    const estilo = estilos[cidade.vulnerabilidade];
    
    const circulo = L.circle(cidade.coords, {
      radius: raio,
      color: estilo.color,
      fillColor: estilo.color,
      fillOpacity: estilo.fillOpacity,
      weight: estilo.weight
    }).addTo(mapa);
    
    // Conteúdo do popup
    const conteudoPopup = `
      <div class="mapa-popup">
        <h4>${cidade.nome}</h4>
        <p><strong>Vulnerabilidade:</strong> ${cidade.vulnerabilidade}</p>
        <p><strong>População afetada:</strong> ${cidade.populacaoAfetada}</p>
        <p><strong>Principais riscos:</strong> ${cidade.riscos}</p>
        <p><strong>Ações de mitigação:</strong> ${cidade.acoesDeAdaptacao}</p>
      </div>
    `;
    
    circulo.bindPopup(conteudoPopup);
    
    // Interatividade
    circulo.on({
      mouseover: function(e) {
        circulo.setStyle({
          weight: 3,
          fillOpacity: 0.9
        });
        circulo.bindTooltip(cidade.nome, {
          direction: 'top',
          sticky: true
        }).openTooltip();
      },
      mouseout: function(e) {
        circulo.setStyle({
          weight: estilo.weight,
          fillOpacity: estilo.fillOpacity
        });
      }
    });
  });
  
  // Centraliza o mapa nas coordenadas de Sergipe
  mapa.setView([-10.9, -37.4], 8);
}

/**
 * Adiciona uma legenda ao mapa
 * @param {L.Map} mapa - Instância do mapa Leaflet
 */
function adicionarLegendaMapa(mapa) {
  // Cria um control de legenda
  const legenda = L.control({ position: 'bottomleft' });
  
  legenda.onAdd = function(mapa) {
    const div = L.DomUtil.create('div', 'mapa-legenda-control');
    div.innerHTML = `
      <div style="background-color: white; padding: 8px; border-radius: 4px; box-shadow: 0 0 5px rgba(0,0,0,0.2);">
        <div style="margin-bottom: 5px; font-weight: bold;">Vulnerabilidade Climática</div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <span style="display: inline-block; width: 18px; height: 18px; background-color: #388e3c; margin-right: 8px; border-radius: 3px;"></span>
          <span>Alta</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <span style="display: inline-block; width: 18px; height: 18px; background-color: #81c784; margin-right: 8px; border-radius: 3px;"></span>
          <span>Média</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 18px; height: 18px; background-color: #c8e6c9; margin-right: 8px; border-radius: 3px;"></span>
          <span>Baixa</span>
        </div>
      </div>
    `;
    return div;
  };
  
  legenda.addTo(mapa);
}