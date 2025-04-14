/**
 * Módulo de cache com TTL (Time-To-Live)
 * Permite armazenar dados em cache com tempo de expiração
 * @module cache
 */

/**
 * Armazena dados no cache local com tempo de vida definido
 * @param {string} chave - Chave única para identificar os dados
 * @param {*} dados - Dados a serem armazenados
 * @param {number} ttlMinutos - Tempo de vida em minutos (padrão: 60 minutos)
 */
export function armazenarCache(chave, dados, ttlMinutos = 60) {
  const cache = {
    dados,
    expiraEm: Date.now() + (ttlMinutos * 60 * 1000)
  };
  localStorage.setItem(chave, JSON.stringify(cache));
}

/**
 * Recupera dados do cache local se ainda forem válidos
 * @param {string} chave - Chave dos dados a serem recuperados
 * @returns {*|null} - Dados armazenados ou null se não existirem ou estiverem expirados
 */
export function obterCache(chave) {
  const cache = JSON.parse(localStorage.getItem(chave));
  if (cache && cache.expiraEm && Date.now() < cache.expiraEm) {
    return cache.dados;
  }
  localStorage.removeItem(chave);
  return null;
}

/**
 * Limpa todos os itens de cache expirados ou com base em um prefixo
 * @param {string} prefixo - Prefixo das chaves de cache a serem limpas (opcional)
 * @param {boolean} forcar - Se true, remove todas as chaves que correspondem ao prefixo, mesmo que não estejam expiradas
 */
export function limparCacheExpirado(prefixo = '', forcar = false) {
  Object.keys(localStorage).forEach(chave => {
    if (chave.startsWith(prefixo)) {
      const cache = JSON.parse(localStorage.getItem(chave));
      if (forcar || (cache && cache.expiraEm && Date.now() >= cache.expiraEm)) {
        localStorage.removeItem(chave);
      }
    }
  });
}

/**
 * Obtém informações sobre o uso de armazenamento local
 * @returns {Object} - Informações sobre o uso de armazenamento
 */
export function obterInfoCache() {
  const info = {
    totalItens: 0,
    totalItemsCache: 0,
    itemsExpirados: 0,
    tamanhoEstimado: 0, // em bytes
    usoEstimado: '0 KB'
  };
  
  try {
    // Obter todas as chaves do localStorage
    const todasChaves = Object.keys(localStorage);
    info.totalItens = todasChaves.length;
    
    let tamanhoTotal = 0;
    
    for (const chave of todasChaves) {
      try {
        const cacheString = localStorage.getItem(chave);
        if (!cacheString) continue;
        
        // Adicionar tamanho do item
        tamanhoTotal += chave.length * 2 + cacheString.length * 2; // aproximadamente 2 bytes por caractere em UTF-16
        
        try {
          const cache = JSON.parse(cacheString);
          
          // Verificar se o item é de cache (tem propriedade expiraEm)
          if (cache && typeof cache === 'object' && cache.expiraEm) {
            info.totalItemsCache++;
            
            if (cache.expiraEm < Date.now()) {
              info.itemsExpirados++;
            }
          }
        } catch (erroJSON) {
          // Não é um item de cache válido em JSON, ignorar
        }
      } catch (erroItem) {
        // Ignorar erros em itens individuais
      }
    }
    
    info.tamanhoEstimado = tamanhoTotal;
    
    // Converter para formato legível
    if (tamanhoTotal < 1024) {
      info.usoEstimado = `${tamanhoTotal} B`;
    } else if (tamanhoTotal < 1024 * 1024) {
      info.usoEstimado = `${(tamanhoTotal / 1024).toFixed(2)} KB`;
    } else {
      info.usoEstimado = `${(tamanhoTotal / (1024 * 1024)).toFixed(2)} MB`;
    }
    
    return info;
  } catch (erro) {
    console.error('Erro ao obter informações do cache:', erro);
    return info;
  }
}

/**
 * Teste de capacidade de armazenamento do localStorage
 * Detecta o limite aproximado de armazenamento disponível
 * @returns {Promise<Object>} - Informações sobre a capacidade de armazenamento
 */
export async function testarCapacidadeArmazenamento() {
  return new Promise(resolve => {
    try {
      // Limpar armazenamento temporário de teste
      const prefixoTeste = '_teste_capacidade_';
      Object.keys(localStorage).forEach(chave => {
        if (chave.startsWith(prefixoTeste)) {
          localStorage.removeItem(chave);
        }
      });
      
      const dadosTeste = 'X'.repeat(1024); // 1KB de dados
      let i = 0;
      let ultimoSucessoKB = 0;
      
      // Tentar armazenar quantidades crescentes
      while (true) {
        try {
          const chave = `${prefixoTeste}${i}`;
          localStorage.setItem(chave, dadosTeste);
          ultimoSucessoKB = (i + 1); // Cada iteração adiciona 1KB
          i++;
        } catch (e) {
          // Atingiu o limite
          break;
        }
        
        // Evitar loop infinito (limite de segurança em 10MB)
        if (i >= 10240) {
          break;
        }
      }
      
      // Limpar armazenamento de teste
      Object.keys(localStorage).forEach(chave => {
        if (chave.startsWith(prefixoTeste)) {
          localStorage.removeItem(chave);
        }
      });
      
      const resultado = {
        capacidadeEstimadaKB: ultimoSucessoKB,
        capacidadeEstimadaMB: (ultimoSucessoKB / 1024).toFixed(2),
        navegador: navigator.userAgent
      };
      
      console.info('Capacidade de armazenamento detectada:', resultado);
      resolve(resultado);
    } catch (erro) {
      console.error('Erro ao testar capacidade de armazenamento:', erro);
      resolve({
        capacidadeEstimadaKB: 0,
        capacidadeEstimadaMB: 0,
        erro: erro.message,
        navegador: navigator.userAgent
      });
    }
  });
}

// Exportar funções adicionais
export default {
  armazenarCache,
  obterCache,
  limparCacheExpirado,
  obterInfoCache,
  testarCapacidadeArmazenamento
};