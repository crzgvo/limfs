/**
 * Painel ODS - Script principal
 * Responsável por inicializar e gerenciar o dashboard de indicadores ODS
 */

import { obterCoresODS } from './utils/coresODS.js';
import { 
  criarGraficoLinha,
  criarGraficoBarra,
  criarGraficoComparativo,
  adicionarDescricaoAcessivel,
  getOdsColor,
  exportarGraficoComoPNG,
  adicionarBotaoExportacao
} from './modules/graficoResponsivo.js';

// Variáveis globais
let paginaAtual = '';
let codigoODS = '';
let graficoPrincipal = null;
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
document.addEventListener('DOMContentLoaded', () => {
  inicializarPainel();
  configurarEventListeners();
});

/**
 * Inicializa o painel, detectando a página atual e carregando os dados correspondentes
 */
async function inicializarPainel() {
  try {
    detectarPaginaAtual();
    
    if (codigoODS) {
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
 * Carrega os dados principais para o gráfico e indicador principal
 */
async function carregarDadosPrincipais() {
  try {
    // Determina qual arquivo de dados carregar com base no ODS atual
    let nomeArquivo = '';
    
    switch (codigoODS) {
      case 'ods1':
        nomeArquivo = 'pobreza.json';
        break;
      case 'ods4':
        nomeArquivo = 'educacao.json';
        break;
      case 'ods6':
        nomeArquivo = 'saneamento.json';
        break;
      case 'ods7':
        nomeArquivo = 'energia_solar.json';
        break;
      case 'ods8':
        nomeArquivo = 'trabalho.json';
        break;
      case 'ods12':
        nomeArquivo = 'residuos_reciclados.json';
        break;
      default:
        // Para outros ODS, carrega o arquivo genérico
        nomeArquivo = 'indicadores.json';
    }
    
    // Busca os dados do servidor com cache
    const dadosPrincipais = await fetchComCache(`../dados/${nomeArquivo}`, CACHE_TEMPO);
    
    if (!dadosPrincipais) {
      throw new Error('Não foi possível carregar os dados principais');
    }
    
    // Atualiza o indicador principal (depende do ODS)
    atualizarIndicadorPrincipal(dadosPrincipais);
    
    // Inicializa o gráfico principal
    inicializarGraficoPrincipal(dadosPrincipais);
    
    // Atualiza a data de atualização
    atualizarDataAtualizacao(dadosPrincipais.dataAtualizacao || new Date().toISOString());
    
  } catch (erro) {
    console.error('Erro ao carregar dados principais:', erro);
    mostrarErro('Não foi possível carregar os dados principais.');
  }
}

/**
 * Carrega os indicadores detalhados para o ODS atual
 */
async function carregarIndicadoresDetalhados() {
  try {
    // Busca dados específicos do ODS atual
    const dadosDetalhados = await fetchComCache(`../dados/indicadores/${codigoODS}.json`, CACHE_TEMPO);
    
    if (!dadosDetalhados || !dadosDetalhados.indicadores) {
      throw new Error('Dados detalhados não disponíveis ou formato inválido');
    }
    
    // Renderiza os indicadores detalhados
    renderizarIndicadoresDetalhados(dadosDetalhados.indicadores);
    
  } catch (erro) {
    console.error('Erro ao carregar indicadores detalhados:', erro);
    // Caso não consiga carregar, exibe indicadores fictícios para demonstração
    criarIndicadoresFicticios();
  }
}

/**
 * Atualiza o indicador principal no dashboard
 */
function atualizarIndicadorPrincipal(dados) {
  if (!elementosDOM.valorPrincipal || !elementosDOM.valorDescricao || !dados) return;
  
  // Identifica o indicador principal baseado no ODS atual
  let valorIndicador = '0';
  let descricaoIndicador = 'Dados não disponíveis';
  
  // Obtém os dados específicos para cada ODS
  switch (codigoODS) {
    case 'ods1': // Erradicação da pobreza
      valorIndicador = dados.taxaPobrezaExtrema ? `${dados.taxaPobrezaExtrema}%` : '0%';
      descricaoIndicador = 'População em situação de pobreza extrema';
      break;
    
    case 'ods4': // Educação de qualidade
      valorIndicador = dados.taxaAlfabetizacao ? `${dados.taxaAlfabetizacao}%` : '0%';
      descricaoIndicador = 'Taxa de alfabetização';
      break;
    
    case 'ods6': // Água potável e saneamento
      valorIndicador = dados.coberturaSaneamento ? `${dados.coberturaSaneamento}%` : '0%';
      descricaoIndicador = 'População com acesso a saneamento básico';
      break;
    
    case 'ods7': // Energia limpa e acessível
      valorIndicador = dados.percentualEnergiaSolar ? `${dados.percentualEnergiaSolar}%` : '0%';
      descricaoIndicador = 'Percentual de energia solar na matriz energética';
      break;
      
    case 'ods8': // Trabalho decente
      valorIndicador = dados.taxaDesemprego ? `${dados.taxaDesemprego}%` : '0%';
      descricaoIndicador = 'Taxa de desemprego';
      break;
      
    case 'ods12': // Consumo e produção responsáveis
      valorIndicador = dados.percentualResiduosReciclados ? `${dados.percentualResiduosReciclados}%` : '0%';
      descricaoIndicador = 'Percentual de resíduos sólidos reciclados';
      break;
      
    default:
      // Para outros ODS, tenta usar um dado padrão
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
  
  // Prepara os dados para o gráfico com base no ODS atual
  const dadosPreprados = prepararDadosGraficoPrincipal(dados);
  
  // Extrai número do ODS (exemplo: 'ods1' => 1)
  const numeroODS = parseInt(codigoODS.replace('ods', '')) || 1;
  
  // Opções personalizadas para o gráfico
  const opcoes = {
    tituloGrafico: `Evolução - ${codigoODS.toUpperCase()}`,
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
              if (dadosPreprados.unidade === 'porcentagem') {
                label += '%';
              }
            }
            return label;
          }
        }
      }
    }
  };
  
  // Criar gráfico usando nosso novo módulo responsivo
  graficoPrincipal = criarGraficoLinha(
    'grafico-principal',
    dadosPreprados.data,
    opcoes
  );
  
  // Adiciona descrição acessível automaticamente
  const descricao = `Gráfico de evolução dos indicadores para o ${codigoODS.toUpperCase()}. ` +
                    `Mostra a tendência de ${dadosPreprados.data.datasets[0].label} ao longo dos anos, ` +
                    `com valores entre ${Math.min(...dadosPreprados.data.datasets[0].data)}% e ` +
                    `${Math.max(...dadosPreprados.data.datasets[0].data)}%.`;
  
  adicionarDescricaoAcessivel('grafico-principal', descricao);
  
  // Adiciona botão de exportação de imagem
  adicionarBotaoExportacao('grafico-principal', `grafico_${codigoODS}`);
}

/**
 * Prepara os dados para o gráfico principal com base no ODS atual
 */
function prepararDadosGraficoPrincipal(dados) {
  let labels = [];
  let valores = [];
  let titulo = '';
  let unidade = '';
  
  // Configura os dados específicos para cada ODS
  switch (codigoODS) {
    case 'ods1': // Erradicação da pobreza
      if (dados.historicoPobreza) {
        labels = dados.historicoPobreza.map(item => item.ano);
        valores = dados.historicoPobreza.map(item => item.valor);
        titulo = 'Taxa de pobreza extrema (%)';
        unidade = 'porcentagem';
      }
      break;
      
    case 'ods4': // Educação de qualidade
      if (dados.historicoAlfabetizacao) {
        labels = dados.historicoAlfabetizacao.map(item => item.ano);
        valores = dados.historicoAlfabetizacao.map(item => item.valor);
        titulo = 'Taxa de alfabetização (%)';
        unidade = 'porcentagem';
      }
      break;
      
    case 'ods6': // Água e saneamento
      if (dados.historicoSaneamento) {
        labels = dados.historicoSaneamento.map(item => item.ano);
        valores = dados.historicoSaneamento.map(item => item.valor);
        titulo = 'Cobertura de saneamento básico (%)';
        unidade = 'porcentagem';
      }
      break;
      
    case 'ods7': // Energia limpa
      if (dados.historicoEnergiaSolar) {
        labels = dados.historicoEnergiaSolar.map(item => item.ano);
        valores = dados.historicoEnergiaSolar.map(item => item.valor);
        titulo = 'Percentual de energia solar (%)';
        unidade = 'porcentagem';
      }
      break;
      
    case 'ods8': // Trabalho decente
      if (dados.historicoDesemprego) {
        labels = dados.historicoDesemprego.map(item => item.ano);
        valores = dados.historicoDesemprego.map(item => item.valor);
        titulo = 'Taxa de desemprego (%)';
        unidade = 'porcentagem';
      }
      break;
      
    case 'ods12': // Consumo responsável
      if (dados.historicoResiduos) {
        labels = dados.historicoResiduos.map(item => item.ano);
        valores = dados.historicoResiduos.map(item => item.valor);
        titulo = 'Taxa de reciclagem (%)';
        unidade = 'porcentagem';
      }
      break;
      
    default:
      // Para outros ODS, tenta usar dados genéricos
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
  
  return {
    data: {
      labels: labels,
      datasets: [{
        label: titulo,
        data: valores,
        borderColor: getOdsColor(numeroODS),
        backgroundColor: getOdsColor(numeroODS, true),
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
  
  // Dados fictícios diferentes para cada ODS
  let indicadoresFicticios = [];
  
  switch (codigoODS) {
    case 'ods1':
      indicadoresFicticios = [
        {
          titulo: 'População em extrema pobreza',
          valor: '8,5%',
          tendencia: 'positiva',
          descricao: 'Percentual da população sergipana vivendo abaixo da linha de pobreza extrema',
          icone: 'fas fa-hand-holding-usd'
        },
        {
          titulo: 'Cobertura de programas sociais',
          valor: '65,3%',
          tendencia: 'positiva',
          descricao: 'Percentual da população de baixa renda atendida por programas de transferência de renda',
          icone: 'fas fa-home'
        }
      ];
      break;
      
    case 'ods12':
      indicadoresFicticios = [
        {
          titulo: 'Taxa de reciclagem',
          valor: '24,8%',
          tendencia: 'positiva',
          descricao: 'Percentual de resíduos sólidos urbanos reciclados em Sergipe',
          icone: 'fas fa-recycle'
        },
        {
          titulo: 'Compras públicas sustentáveis',
          valor: '18,3%',
          tendencia: 'positiva',
          descricao: 'Percentual de compras governamentais com critérios de sustentabilidade',
          icone: 'fas fa-shopping-basket'
        },
        {
          titulo: 'Perdas alimentares',
          valor: '31,5%',
          tendencia: 'negativa',
          descricao: 'Percentual de perdas na cadeia de distribuição de alimentos',
          icone: 'fas fa-apple-alt'
        }
      ];
      break;
      
    default:
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
  
  try {
    // Formata a data para exibição
    const data = new Date(dataString);
    const opcoes = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
    elementoData.textContent = `Última atualização: ${dataFormatada}`;
    
  } catch (erro) {
    console.error('Erro ao formatar data:', erro);
    elementoData.textContent = `Última atualização: ${dataString || 'Data desconhecida'}`;
  }
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
 * Realiza uma requisição com suporte a cache local
 */
async function fetchComCache(url, tempoCache = CACHE_TEMPO) {
  const cacheKey = `ods_cache_${url}`;
  
  // Verifica se há dados em cache válidos
  const cacheData = localStorage.getItem(cacheKey);
  if (cacheData) {
    try {
      const cache = JSON.parse(cacheData);
      // Verifica se o cache ainda é válido
      if (cache.timestamp && (Date.now() - cache.timestamp < tempoCache)) {
        console.log(`Usando dados em cache para ${url}`);
        return cache.data;
      }
    } catch (erro) {
      console.error('Erro ao ler cache:', erro);
    }
  }
  
  // Se não há cache válido, busca os dados novamente
  try {
    const resposta = await fetch(url);
    
    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }
    
    const dados = await resposta.json();
    
    // Salva no cache
    const cacheObj = {
      timestamp: Date.now(),
      data: dados
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheObj));
    return dados;
    
  } catch (erro) {
    console.error(`Erro ao buscar ${url}:`, erro);
    throw erro;
  }
}