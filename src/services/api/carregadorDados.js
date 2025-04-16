/**
 * Módulo para carregamento de dados dos ODS
 * Fornece funções reutilizáveis para carregar dados e tratar erros
 * 
 * @module carregadorDados
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.2.0
 */

import { obterDoCache, adicionarAoCache } from './cacheMultinivel.js';

// Flag para controle interno do uso de cache
let usarCache = true;

// Configurações de ciclo de vida do cache por tipo de indicador
const CICLO_VIDA_CACHE = {
  default: 24 * 60 * 60 * 1000, // 24 horas em milissegundos (padrão)
  diario: 24 * 60 * 60 * 1000,  // 24 horas para indicadores atualizados diariamente
  semanal: 7 * 24 * 60 * 60 * 1000, // 7 dias para indicadores semanais
  mensal: 30 * 24 * 60 * 60 * 1000, // 30 dias para indicadores mensais
  estavel: 90 * 24 * 60 * 60 * 1000 // 90 dias para indicadores muito estáveis
};

// Mapeamento de indicadores para seus ciclos de vida
const MAPA_CICLO_VIDA = {
  // Indicadores que mudam frequentemente
  'pobreza': 'mensal',
  'trabalho': 'semanal',
  'energia_solar': 'mensal',
  
  // Indicadores mais estáveis
  'saneamento': 'estavel',
  'educacao': 'estavel',
  
  // Indicadores com atualizações diárias
  'mortalidade_infantil': 'diario',
  'residuos_reciclados': 'semanal',
};

/**
 * Configura o uso de cache no carregador de dados
 * @param {boolean} flag - Ativar ou desativar cache
 */
export function configurarCache(flag) {
  usarCache = !!flag;
  console.log(`Cache ${usarCache ? 'ativado' : 'desativado'} para carregador de dados`);
}

/**
 * Determina o tempo de expiração ideal para um indicador específico
 * @param {string} indicadorId - ID do indicador 
 * @returns {number} - Tempo de expiração em milissegundos
 * @private
 */
function determinarTempoExpiracao(indicadorId) {
  const tipoIndicador = MAPA_CICLO_VIDA[indicadorId] || 'default';
  return CICLO_VIDA_CACHE[tipoIndicador] || CICLO_VIDA_CACHE.default;
}

/**
 * Verifica se é necessário pré-carregar um indicador com base em seu padrão de uso
 * @param {string} indicadorId - ID do indicador
 * @returns {boolean} - True se o indicador deve ser pré-carregado
 * @private 
 */
function devePreCarregar(indicadorId) {
  // Lista de indicadores prioritários para pré-carregamento
  const indicadoresPrioritarios = ['pobreza', 'educacao', 'saneamento', 'mortalidade_infantil'];
  return indicadoresPrioritarios.includes(indicadorId);
}

/**
 * Carrega dados JSON de uma URL especificada com tratamento de erros
 * 
 * @param {string} url - URL para buscar dados JSON
 * @param {Object} [opcoes] - Opções adicionais
 * @param {Function} [opcoes.callbackSucesso] - Função a ser chamada em caso de sucesso
 * @param {Function} [opcoes.callbackErro] - Função a ser chamada em caso de erro
 * @param {boolean} [opcoes.ignorarCache=false] - Ignorar cache e forçar carregamento do servidor
 * @param {number} [opcoes.tempoExpiracao] - Tempo personalizado de expiração do cache em ms
 * @returns {Promise<Object>} - Promise com os dados carregados
 */
export async function carregarJSON(url, opcoes = {}) {
  try {
    let dados = null;
    const chaveCache = `url_${encodeURIComponent(url)}`;
    
    // Verifica no cache primeiro, se cache estiver ativado e não for solicitado ignorar
    if (usarCache && !opcoes.ignorarCache) {
      dados = await obterDoCache(chaveCache);
      
      if (dados) {
        console.log(`Dados carregados do cache para: ${url}`);
        
        if (opcoes.callbackSucesso) {
          opcoes.callbackSucesso(dados);
        }
        
        return dados;
      }
    }
    
    // Se não encontrou no cache ou cache está desativado, carrega da rede
    console.log(`Carregando dados da rede: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      cache: opcoes.ignorarCache ? 'no-cache' : 'default',
      headers: {
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    dados = await response.json();
    
    // Armazena no cache para uso futuro
    if (usarCache) {
      adicionarAoCache(chaveCache, dados, opcoes.tempoExpiracao);
    }
    
    if (opcoes.callbackSucesso) {
      opcoes.callbackSucesso(dados);
    }
    
    return dados;
  } catch (erro) {
    console.error(`Erro ao carregar dados de ${url}:`, erro);
    
    if (opcoes.callbackErro) {
      opcoes.callbackErro(erro);
    }
    
    // Re-lança o erro para tratamento adicional pelo chamador, se necessário
    throw erro;
  }
}

/**
 * Carrega dados específicos de um ODS pelo ID
 * 
 * @param {string|number} odsId - ID do ODS a carregar (ex: 1, 2, "5", "ods10")
 * @param {Object} [opcoes] - Opções adicionais
 * @param {boolean} [opcoes.ignorarCache=false] - Ignorar cache e forçar carregamento
 * @param {boolean} [opcoes.semIndicadoresUI=false] - Não atualizar indicadores visuais de carregamento
 * @returns {Promise<Object>} - Dados do ODS
 */
export async function carregarDadosODS(odsId, opcoes = {}) {
  // Normaliza o ID para garantir formato adequado
  const id = String(odsId).replace('ods', '');
  const url = `/dados/indicadores/ods${id}.json`;
  
  // Elementos UI para feedback
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  
  // Gestão de indicadores UI
  if (!opcoes.semIndicadoresUI) {
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
  }
  
  try {
    // Define chave de cache específica para este ODS
    const chaveCache = `ods_${id}_dados`;
    
    let dados = null;
    
    // Tenta obter do cache primeiro, se cache estiver ativado e não for solicitado ignorar
    if (usarCache && !opcoes.ignorarCache) {
      dados = await obterDoCache(chaveCache);
      
      if (dados) {
        console.log(`Dados do ODS ${id} carregados do cache`);
        
        if (!opcoes.semIndicadoresUI) {
          if (loadingIndicator) loadingIndicator.style.display = 'none';
          // Atualiza a data de atualização na UI se disponível
          if (dados.data_atualizacao) {
            atualizarTimestamp(dados.data_atualizacao);
          }
        }
        
        return dados;
      }
    }
    
    // Se não encontrou no cache ou cache está desativado, carrega da rede
    dados = await carregarJSON(url, {
      ignorarCache: opcoes.ignorarCache
    });
    
    if (!opcoes.semIndicadoresUI) {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      
      // Atualiza a data de atualização na UI se disponível
      if (dados.data_atualizacao) {
        atualizarTimestamp(dados.data_atualizacao);
      }
    }
    
    // Determina o tempo apropriado de expiração para este ODS
    const tempoExpiracao = determinarTempoExpiracao(`ods${id}`);
    
    // Armazena especificamente no cache de ODS, se não foi uma recarga forçada
    if (usarCache && !opcoes.ignorarCache) {
      adicionarAoCache(chaveCache, dados, tempoExpiracao);
    }
    
    return dados;
  } catch (erro) {
    if (!opcoes.semIndicadoresUI) {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (errorMessage) {
        errorMessage.textContent = `Não foi possível carregar os dados do ODS ${id}. ${erro.message}`;
        errorMessage.style.display = 'block';
      }
    }
    throw erro;
  }
}

/**
 * Carrega dados do indicador específico de um ODS
 * 
 * @param {string|number} odsId - ID do ODS
 * @param {string} indicadorId - ID do indicador
 * @param {Object} [opcoes] - Opções adicionais
 * @param {boolean} [opcoes.ignorarCache=false] - Ignorar cache e forçar carregamento
 * @returns {Promise<Object>} - Dados do indicador específico
 */
export async function carregarDadosIndicador(odsId, indicadorId, opcoes = {}) {
  // Define chave específica para este indicador
  const chaveCache = `ods_${odsId}_indicador_${indicadorId}`;
  
  // Se o cache está ativado e não é uma recarga forçada, tenta o cache primeiro
  if (usarCache && !opcoes.ignorarCache) {
    const dadosCache = await obterDoCache(chaveCache);
    if (dadosCache) {
      return dadosCache;
    }
  }
  
  // Se não conseguiu do cache, carrega o ODS completo
  const dados = await carregarDadosODS(odsId, {
    ignorarCache: opcoes.ignorarCache,
    semIndicadoresUI: opcoes.semIndicadoresUI
  });
  
  if (!dados.indicadores || !dados.indicadores[indicadorId]) {
    throw new Error(`Indicador ${indicadorId} não encontrado para o ODS ${odsId}`);
  }
  
  const indicador = dados.indicadores[indicadorId];
  
  // Determina o tempo apropriado de expiração para este indicador
  const tempoExpiracao = determinarTempoExpiracao(indicadorId);
  
  // Armazena este indicador específico no cache para acesso mais rápido futuro
  if (usarCache && !opcoes.ignorarCache) {
    adicionarAoCache(chaveCache, indicador, tempoExpiracao);
  }
  
  return indicador;
}

/**
 * Recarrega os dados do ODS, ignorando o cache existente
 * 
 * @param {string|number} odsId - ID do ODS a recarregar
 * @returns {Promise<Object>} - Dados atualizados do ODS
 */
export async function recarregarDadosODS(odsId) {
  console.log(`Recarregando dados do ODS ${odsId} (ignorando cache)...`);
  return carregarDadosODS(odsId, { ignorarCache: true });
}

/**
 * Atualiza a informação de timestamp na UI
 * 
 * @param {string} timestamp - Data de atualização em formato ISO
 * @private
 */
function atualizarTimestamp(timestamp) {
  const elementos = [
    document.getElementById('ultima-atualizacao'),
    document.getElementById('data-atualizacao')
  ];
  
  try {
    const data = new Date(timestamp);
    const formatoData = new Intl.DateTimeFormat('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const dataFormatada = formatoData.format(data);
    
    elementos.forEach(elemento => {
      if (elemento) elemento.textContent = dataFormatada;
    });
  } catch (erro) {
    console.error('Erro ao formatar timestamp:', erro);
  }
}

/**
 * Exporta dados em formato CSV
 * 
 * @param {Array} dados - Array de objetos com dados a exportar
 * @param {string} nomeArquivo - Nome do arquivo a gerar
 */
export function exportarCSV(dados, nomeArquivo) {
  try {
    if (!Array.isArray(dados) || dados.length === 0) {
      throw new Error('Os dados fornecidos não são válidos para exportação');
    }
    
    // Obter as chaves do primeiro objeto como cabeçalhos
    const cabecalhos = Object.keys(dados[0]);
    
    // Criar linha de cabeçalho
    let csv = cabecalhos.join(',') + '\n';
    
    // Adicionar linhas de dados
    dados.forEach(item => {
      const valores = cabecalhos.map(cabecalho => {
        const valor = item[cabecalho];
        // Formato adequado para strings com vírgulas
        if (typeof valor === 'string' && valor.includes(',')) {
          return `"${valor}"`;
        }
        return valor;
      });
      csv += valores.join(',') + '\n';
    });
    
    // Criar blob e download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `${nomeArquivo}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (erro) {
    console.error('Erro ao exportar CSV:', erro);
    alert('Não foi possível exportar os dados. Por favor, tente novamente mais tarde.');
  }
}

/**
 * Busca dados de um indicador específico pela API
 * 
 * @param {string} endpoint - Endpoint/nome do indicador a carregar
 * @param {Object} [opcoes] - Opções adicionais
 * @param {boolean} [opcoes.ignorarCache=false] - Ignorar cache e forçar carregamento
 * @returns {Promise<Object>} - Dados do indicador
 */
export async function buscarDadosAPI(endpoint, opcoes = {}) {
  try {
    if (!endpoint) {
      throw new Error('Endpoint não especificado');
    }
    
    // Normaliza o endpoint para evitar problemas de path
    const endpointNormalizado = endpoint.trim().toLowerCase();
    
    // Constrói a URL com base no endpoint
    // Verifica primeiro se o endpoint é para um indicador específico ou um arquivo direto
    let url;
    if (endpointNormalizado.includes('/')) {
      // É um caminho completo
      url = `/dados/${endpointNormalizado}.json`;
    } else {
      // É um nome de indicador simples
      url = `/dados/indicadores/${endpointNormalizado}.json`;
    }
    
    console.log(`Tentando carregar dados de: ${url}`);
    
    // Define chave de cache específica para este indicador
    const chaveCache = `indicador_${endpointNormalizado}`;
    
    // Se o cache está ativado e não é uma recarga forçada, tenta o cache primeiro
    if (usarCache && !opcoes.ignorarCache) {
      const dadosCache = await obterDoCache(chaveCache);
      if (dadosCache) {
        console.log(`Dados do indicador ${endpoint} carregados do cache`);
        return dadosCache;
      }
    }
    
    // Se não encontrou no cache ou cache está desativado, carrega da rede
    console.log(`Carregando dados do indicador ${endpoint} da API: ${url}`);
    
    // Tenta o caminho padrão primeiro
    try {
      const dados = await carregarJSON(url, {
        ignorarCache: opcoes.ignorarCache
      });
      
      // Determina o tempo apropriado de expiração para este indicador
      const tempoExpiracao = determinarTempoExpiracao(endpointNormalizado);
      
      // Armazena este indicador específico no cache para acesso mais rápido futuro
      if (usarCache && !opcoes.ignorarCache) {
        adicionarAoCache(chaveCache, dados, tempoExpiracao);
      }
      
      return dados;
    } catch (erroAPI) {
      // Se falhar, tenta caminhos alternativos
      console.warn(`Falha ao carregar de ${url}. Tentando caminhos alternativos...`);
      
      // Tenta na pasta raiz de dados
      const urlAlternativa = `/dados/${endpointNormalizado}.json`;
      if (url !== urlAlternativa) {
        try {
          const dados = await carregarJSON(urlAlternativa, {
            ignorarCache: opcoes.ignorarCache
          });
          console.log(`Dados carregados com sucesso do caminho alternativo: ${urlAlternativa}`);
          
          if (usarCache && !opcoes.ignorarCache) {
            adicionarAoCache(chaveCache, dados, tempoExpiracao);
          }
          
          return dados;
        } catch (erroAlternativo) {
          console.error(`Também falhou o caminho alternativo ${urlAlternativa}`);
        }
      }
      
      // Se chegou aqui, ambos os caminhos falharam
      throw erroAPI;
    }
  } catch (erro) {
    console.error(`Erro ao carregar dados do indicador ${endpoint}:`, erro);
    
    // Lança o erro novamente para tratamento no chamador
    throw erro;
  }
}

// Inicializar listeners para botões de exportação se existirem na página
document.addEventListener('DOMContentLoaded', () => {
  const btnExportar = document.getElementById('btn-exportar');
  
  if (btnExportar) {
    btnExportar.addEventListener('click', () => {
      // Obtém o ID do ODS da página atual
      const odsId = document.body.dataset.pagina;
      
      // Se não encontrar o ID da página, usa um nome genérico
      const nomeArquivo = odsId ? `dados_${odsId}` : 'dados_ods';
      
      try {
        // Tenta obter os dados atuais do gráfico principal
        const chartPrincipal = Chart.getChart('grafico-principal');
        if (chartPrincipal && chartPrincipal.data) {
          const labels = chartPrincipal.data.labels || [];
          const dados = chartPrincipal.data.datasets[0].data || [];
          
          // Cria array de objetos para exportar
          const dadosExport = labels.map((ano, index) => ({
            ano,
            valor: dados[index]
          }));
          
          exportarCSV(dadosExport, nomeArquivo);
        } else {
          alert('Não há dados disponíveis para exportação no momento.');
        }
      } catch (erro) {
        console.error('Erro ao preparar dados para exportação:', erro);
        alert('Não foi possível preparar os dados para exportação.');
      }
    });
  }
  
  // Adiciona botão para recarregar dados (se existir na página)
  const btnRecarregar = document.getElementById('btn-recarregar-dados');
  
  if (btnRecarregar) {
    btnRecarregar.addEventListener('click', async () => {
      const odsId = document.body.dataset.pagina;
      
      if (!odsId) {
        alert('Não foi possível identificar o ODS atual.');
        return;
      }
      
      btnRecarregar.disabled = true;
      btnRecarregar.innerHTML = '<i class="fas fa-sync fa-spin"></i> Atualizando...';
      
      try {
        await recarregarDadosODS(odsId);
        
        // Recarrega a página para atualizar todos os componentes visuais
        window.location.reload();
      } catch (erro) {
        alert('Erro ao recarregar dados. Por favor, tente novamente mais tarde.');
        console.error('Erro ao recarregar dados:', erro);
        
        btnRecarregar.disabled = false;
        btnRecarregar.innerHTML = '<i class="fas fa-sync"></i> Recarregar Dados';
      }
    });
  }
});