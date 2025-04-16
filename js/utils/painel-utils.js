/**
 * Utilitários para API e manipulação de dados do painel ODS
 */

// Constantes
const CACHE_TEMPO = 3600000; // 1 hora em milisegundos

/**
 * Realiza uma requisição com suporte a cache local
 * @param {string} url - URL da API a ser chamada
 * @param {number} tempoCache - Tempo em milisegundos para expiração do cache
 * @returns {Promise<object>} Dados da resposta
 */
export async function fetchComCache(url, tempoCache = CACHE_TEMPO) {
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

/**
 * Constrói URL da API com parâmetros
 * @param {string} baseUrl - URL base da API
 * @param {object} params - Objeto com parâmetros para a query string
 * @returns {string} URL completa com parâmetros
 */
export function construirUrlApi(baseUrl, params = {}) {
  const url = new URL(baseUrl, window.location.origin);
  
  // Adiciona os parâmetros à URL
  Object.keys(params).forEach(chave => {
    const valor = params[chave];
    if (valor !== null && valor !== undefined) {
      url.searchParams.append(chave, valor);
    }
  });
  
  return url.toString();
}

/**
 * Formata data para exibição no formato brasileiro
 * @param {string} dataString - String de data (formato ISO)
 * @returns {string} Data formatada
 */
export function formatarData(dataString) {
  try {
    const data = new Date(dataString);
    const opcoes = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('pt-BR', opcoes).format(data);
  } catch (erro) {
    console.error('Erro ao formatar data:', erro);
    return dataString || 'Data desconhecida';
  }
}

/**
 * Exporta os dados para formato CSV
 * @param {object} data - Dados do gráfico (labels, datasets)
 * @param {string} nomeArquivo - Nome do arquivo CSV a ser baixado
 */
export function exportarDadosCSV(data, nomeArquivo) {
  // Gerar cabeçalho
  let csv = 'Período';
  data.datasets.forEach(dataset => {
      csv += `,${dataset.label}`;
  });
  csv += '\n';
  
  // Gerar linhas de dados
  data.labels.forEach((label, i) => {
      csv += label;
      data.datasets.forEach(dataset => {
          csv += `,${dataset.data[i] || ''}`;
      });
      csv += '\n';
  });
  
  // Criar blob e link para download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Criar URL para download
  if (navigator.msSaveBlob) { // Para IE
      navigator.msSaveBlob(blob, nomeArquivo + '.csv');
  } else {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', nomeArquivo + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
}

/**
 * Adiciona uma descrição acessível detalhada ao gráfico para tecnologias assistivas
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} descricao - Descrição detalhada para acessibilidade
 */
export function adicionarDescricaoAcessivel(canvasId, descricao) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  // Identificar elementos existentes ou criar novos
  let descricaoId = `descricao-${canvasId}`;
  let descricaoElem = document.getElementById(descricaoId);
  
  if (!descricaoElem) {
      descricaoElem = document.createElement('div');
      descricaoElem.id = descricaoId;
      descricaoElem.className = 'screen-reader-only';
      canvas.parentNode.insertBefore(descricaoElem, canvas.nextSibling);
      
      // Vincular o canvas à descrição
      canvas.setAttribute('aria-describedby', descricaoId);
  }
  
  // Atualiza a descrição
  descricaoElem.textContent = descricao;
}