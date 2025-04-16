/**
 * Módulo de cache multinível para otimizar o desempenho
 * Implementa armazenamento em memória, localStorage e IndexedDB
 * 
 * @module cacheMultinivel
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

/**
 * Cache em memória (nível 1 - mais rápido, volátil)
 * @private
 */
const memoriaCache = new Map();

/**
 * Configuração do módulo
 * @private
 */
const config = {
  ativado: true,
  tempoExpiracao: 1000 * 60 * 60, // 1 hora em milissegundos
  prefixoChave: 'limfs_cache_',
  usarLocalStorage: true,
  usarIndexedDB: true,
  nomeBancoDados: 'limfs_cache_db',
  versaoBancoDados: 1,
  nomeStore: 'dados_cache',
  usarCompressao: false, // Nova opção para compressão de dados
  nivelCompressao: 5     // Nível de compressão (1-9, onde 9 é máximo)
};

/**
 * Inicializa o módulo de cache
 * @param {Object} opcoes - Opções de configuração
 * @param {boolean} [opcoes.ativado=true] - Ativa/desativa o cache
 * @param {number} [opcoes.tempoExpiracao=3600000] - Tempo de expiração em ms
 * @param {boolean} [opcoes.usarLocalStorage=true] - Usar localStorage
 * @param {boolean} [opcoes.usarIndexedDB=true] - Usar IndexedDB
 * @param {boolean} [opcoes.usarCompressao=false] - Usar compressão para dados grandes
 * @param {number} [opcoes.nivelCompressao=5] - Nível de compressão (1-9)
 * @returns {Promise<boolean>} Promise indicando sucesso da inicialização
 */
export async function inicializarCache(opcoes = {}) {
  // Mescla configurações fornecidas com padrões
  Object.assign(config, opcoes);

  // Se cache estiver desativado, retorna
  if (!config.ativado) {
    console.log('Cache multinível desativado.');
    return false;
  }

  console.log('Inicializando cache multinível...');

  try {
    // Verifica suporte a IndexedDB se necessário
    if (config.usarIndexedDB) {
      const suportaIndexedDB = 'indexedDB' in window;
      if (!suportaIndexedDB) {
        console.warn('IndexedDB não suportado neste navegador. Utilizando apenas localStorage.');
        config.usarIndexedDB = false;
      } else {
        await inicializarIndexedDB();
      }
    }

    // Verifica suporte a localStorage se necessário
    if (config.usarLocalStorage) {
      const suportaLocalStorage = 'localStorage' in window;
      if (!suportaLocalStorage) {
        console.warn('localStorage não suportado neste navegador. Utilizando apenas cache em memória.');
        config.usarLocalStorage = false;
      }
    }

    console.log('Cache multinível inicializado com sucesso.');
    return true;
  } catch (erro) {
    console.error('Erro ao inicializar cache multinível:', erro);
    return false;
  }
}

/**
 * Inicializa o banco de dados IndexedDB
 * @private
 * @returns {Promise<IDBDatabase>} Promise com a conexão do banco
 */
function inicializarIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB não é suportado neste navegador'));
      return;
    }

    const request = indexedDB.open(config.nomeBancoDados, config.versaoBancoDados);

    request.onerror = (evento) => {
      console.error('Erro ao abrir IndexedDB:', evento.target.error);
      reject(evento.target.error);
    };

    request.onupgradeneeded = (evento) => {
      const db = evento.target.result;
      
      // Cria o object store se não existir
      if (!db.objectStoreNames.contains(config.nomeStore)) {
        const objectStore = db.createObjectStore(config.nomeStore, { keyPath: 'chave' });
        objectStore.createIndex('expiracao', 'expiracao', { unique: false });
        console.log('Object store criado no IndexedDB');
      }
    };

    request.onsuccess = (evento) => {
      const db = evento.target.result;
      console.log('Conexão com IndexedDB estabelecida com sucesso.');
      
      // Fecha a conexão após criação bem-sucedida
      db.close();
      resolve();
    };
  });
}

/**
 * Busca um valor do cache, verificando todos os níveis
 * @param {string} chave - Chave do item no cache
 * @returns {Promise<any>} Promise com o valor do cache ou null se não encontrado
 */
export async function obterDoCache(chave) {
  if (!config.ativado) {
    return null;
  }

  const chaveFormatada = formatarChave(chave);
  
  try {
    // Nível 1: Verifica cache em memória (mais rápido)
    if (memoriaCache.has(chaveFormatada)) {
      const item = memoriaCache.get(chaveFormatada);
      
      // Verifica se o item expirou
      if (item && item.expiracao > Date.now()) {
        console.log(`Cache hit (memória): ${chaveFormatada}`);
        return item.valor;
      } else {
        // Remove item expirado
        memoriaCache.delete(chaveFormatada);
      }
    }

    // Nível 2: Verifica localStorage
    if (config.usarLocalStorage) {
      const itemJSON = localStorage.getItem(chaveFormatada);
      if (itemJSON) {
        try {
          const item = JSON.parse(itemJSON);
          
          // Verifica se o item expirou
          if (item && item.expiracao > Date.now()) {
            console.log(`Cache hit (localStorage): ${chaveFormatada}`);
            
            // Atualiza o cache em memória
            memoriaCache.set(chaveFormatada, item);
            
            return item.valor;
          } else {
            // Remove item expirado
            localStorage.removeItem(chaveFormatada);
          }
        } catch (err) {
          console.warn(`Erro ao ler item do localStorage: ${err}`);
        }
      }
    }

    // Nível 3: Verifica IndexedDB
    if (config.usarIndexedDB) {
      const item = await obterDoIndexedDB(chaveFormatada);
      if (item && item.expiracao > Date.now()) {
        console.log(`Cache hit (IndexedDB): ${chaveFormatada}`);
        
        // Atualiza cache em memória
        memoriaCache.set(chaveFormatada, item);
        
        // Atualiza localStorage se disponível
        if (config.usarLocalStorage) {
          try {
            localStorage.setItem(chaveFormatada, JSON.stringify(item));
          } catch (err) {
            console.warn(`Não foi possível atualizar localStorage: ${err}`);
          }
        }
        
        return item.valor;
      } else if (item) {
        // Remove item expirado
        await removerDoIndexedDB(chaveFormatada);
      }
    }

    // Item não encontrado em nenhum cache ou expirado
    console.log(`Cache miss: ${chaveFormatada}`);
    return null;
    
  } catch (erro) {
    console.error(`Erro ao buscar item do cache (${chaveFormatada}):`, erro);
    return null;
  }
}

/**
 * Armazena um valor no cache em todos os níveis disponíveis
 * @param {string} chave - Chave do item
 * @param {any} valor - Valor a ser armazenado
 * @param {number} [tempoExpiracao] - Tempo de expiração em ms (usa o padrão se não especificado)
 * @returns {Promise<boolean>} Promise indicando sucesso da operação
 */
export async function adicionarAoCache(chave, valor, tempoExpiracao = null) {
  if (!config.ativado) {
    return false;
  }

  const chaveFormatada = formatarChave(chave);
  const expiracao = Date.now() + (tempoExpiracao || config.tempoExpiracao);
  
  const item = {
    chave: chaveFormatada,
    valor: valor,
    expiracao: expiracao,
    timestamp: Date.now()
  };
  
  try {
    // Nível 1: Adiciona ao cache em memória
    memoriaCache.set(chaveFormatada, item);
    
    // Nível 2: Adiciona ao localStorage se disponível
    if (config.usarLocalStorage) {
      try {
        localStorage.setItem(chaveFormatada, JSON.stringify(item));
      } catch (err) {
        console.warn(`Não foi possível adicionar ao localStorage: ${err.message}`);
        
        // Se for erro de quota, tenta limpar itens antigos
        if (err.name === 'QuotaExceededError') {
          await limparItensAntigos();
          try {
            localStorage.setItem(chaveFormatada, JSON.stringify(item));
          } catch {
            // Se ainda falhar, continua com os outros níveis
          }
        }
      }
    }
    
    // Nível 3: Adiciona ao IndexedDB se disponível
    if (config.usarIndexedDB) {
      await adicionarAoIndexedDB(item);
    }
    
    return true;
  } catch (erro) {
    console.error(`Erro ao adicionar item ao cache (${chaveFormatada}):`, erro);
    return false;
  }
}

/**
 * Limpa itens expirados ou antigos do cache
 * @returns {Promise<number>} Promise com o número de itens removidos
 */
export async function limparItensAntigos() {
  if (!config.ativado) {
    return 0;
  }

  let contadorRemovidos = 0;
  const agora = Date.now();
  
  try {
    // Limpa itens expirados da memória
    for (const [chave, item] of memoriaCache.entries()) {
      if (item.expiracao <= agora) {
        memoriaCache.delete(chave);
        contadorRemovidos++;
      }
    }
    
    // Limpa itens expirados do localStorage
    if (config.usarLocalStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        
        // Verifica se é um item do nosso cache
        if (chave && chave.startsWith(config.prefixoChave)) {
          try {
            const itemJSON = localStorage.getItem(chave);
            const item = JSON.parse(itemJSON);
            
            if (item && item.expiracao <= agora) {
              localStorage.removeItem(chave);
              contadorRemovidos++;
            }
          } catch {} // Ignora erros de parsing
        }
      }
    }
    
    // Limpa itens expirados do IndexedDB
    if (config.usarIndexedDB) {
      contadorRemovidos += await limparExpiradosIndexedDB();
    }
    
    console.log(`${contadorRemovidos} itens expirados removidos do cache.`);
    return contadorRemovidos;
  } catch (erro) {
    console.error('Erro ao limpar itens do cache:', erro);
    return contadorRemovidos;
  }
}

/**
 * Limpa todo o cache em todos os níveis
 * @returns {Promise<boolean>} Promise indicando sucesso da operação
 */
export async function limparCache() {
  try {
    // Limpa cache em memória
    memoriaCache.clear();
    
    // Limpa localStorage
    if (config.usarLocalStorage) {
      // Remove apenas itens do nosso cache
      const chaves = [];
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave.startsWith(config.prefixoChave)) {
          chaves.push(chave);
        }
      }
      
      chaves.forEach(chave => localStorage.removeItem(chave));
    }
    
    // Limpa IndexedDB
    if (config.usarIndexedDB) {
      await limparIndexedDB();
    }
    
    console.log('Cache limpo com sucesso.');
    return true;
  } catch (erro) {
    console.error('Erro ao limpar cache:', erro);
    return false;
  }
}

/**
 * Formata a chave para uso no cache
 * @param {string} chave - Chave original
 * @returns {string} Chave formatada
 * @private
 */
function formatarChave(chave) {
  return `${config.prefixoChave}${chave}`;
}

/**
 * Obtém um item do IndexedDB
 * @param {string} chave - Chave do item
 * @returns {Promise<any>} Promise com o item ou null
 * @private
 */
function obterDoIndexedDB(chave) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.nomeBancoDados, config.versaoBancoDados);
    
    request.onerror = (evento) => reject(evento.target.error);
    
    request.onsuccess = (evento) => {
      const db = evento.target.result;
      
      try {
        const transaction = db.transaction([config.nomeStore], 'readonly');
        const objectStore = transaction.objectStore(config.nomeStore);
        const getRequest = objectStore.get(chave);
        
        getRequest.onerror = (event) => {
          db.close();
          reject(event.target.error);
        };
        
        getRequest.onsuccess = (event) => {
          db.close();
          resolve(event.target.result || null);
        };
      } catch (erro) {
        db.close();
        reject(erro);
      }
    };
  });
}

/**
 * Adiciona um item ao IndexedDB
 * @param {Object} item - Item a ser adicionado
 * @returns {Promise<boolean>} Promise indicando sucesso
 * @private
 */
function adicionarAoIndexedDB(item) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.nomeBancoDados, config.versaoBancoDados);
    
    request.onerror = (evento) => reject(evento.target.error);
    
    request.onsuccess = (evento) => {
      const db = evento.target.result;
      
      try {
        const transaction = db.transaction([config.nomeStore], 'readwrite');
        const objectStore = transaction.objectStore(config.nomeStore);
        const putRequest = objectStore.put(item);
        
        putRequest.onerror = (event) => {
          db.close();
          reject(event.target.error);
        };
        
        putRequest.onsuccess = () => {
          db.close();
          resolve(true);
        };
      } catch (erro) {
        db.close();
        reject(erro);
      }
    };
  });
}

/**
 * Remove um item do IndexedDB
 * @param {string} chave - Chave do item
 * @returns {Promise<boolean>} Promise indicando sucesso
 * @private
 */
function removerDoIndexedDB(chave) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.nomeBancoDados, config.versaoBancoDados);
    
    request.onerror = (evento) => reject(evento.target.error);
    
    request.onsuccess = (evento) => {
      const db = evento.target.result;
      
      try {
        const transaction = db.transaction([config.nomeStore], 'readwrite');
        const objectStore = transaction.objectStore(config.nomeStore);
        const deleteRequest = objectStore.delete(chave);
        
        deleteRequest.onerror = (event) => {
          db.close();
          reject(event.target.error);
        };
        
        deleteRequest.onsuccess = () => {
          db.close();
          resolve(true);
        };
      } catch (erro) {
        db.close();
        reject(erro);
      }
    };
  });
}

/**
 * Limpa itens expirados do IndexedDB
 * @returns {Promise<number>} Promise com número de itens removidos
 * @private
 */
function limparExpiradosIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.nomeBancoDados, config.versaoBancoDados);
    
    request.onerror = (evento) => reject(evento.target.error);
    
    request.onsuccess = (evento) => {
      const db = evento.target.result;
      const agora = Date.now();
      let contadorRemovidos = 0;
      
      try {
        const transaction = db.transaction([config.nomeStore], 'readwrite');
        const objectStore = transaction.objectStore(config.nomeStore);
        const index = objectStore.index('expiracao');
        
        // Cria um intervalo para todos os itens com expiração menor que agora
        const range = IDBKeyRange.upperBound(agora);
        
        const cursorRequest = index.openCursor(range);
        
        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            cursor.delete();
            contadorRemovidos++;
            cursor.continue();
          }
        };
        
        transaction.oncomplete = () => {
          db.close();
          resolve(contadorRemovidos);
        };
        
        transaction.onerror = (event) => {
          db.close();
          reject(event.target.error);
        };
      } catch (erro) {
        db.close();
        reject(erro);
      }
    };
  });
}

/**
 * Limpa todo o IndexedDB
 * @returns {Promise<boolean>} Promise indicando sucesso
 * @private
 */
function limparIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.nomeBancoDados, config.versaoBancoDados);
    
    request.onerror = (evento) => reject(evento.target.error);
    
    request.onsuccess = (evento) => {
      const db = evento.target.result;
      
      try {
        const transaction = db.transaction([config.nomeStore], 'readwrite');
        const objectStore = transaction.objectStore(config.nomeStore);
        const clearRequest = objectStore.clear();
        
        clearRequest.onerror = (event) => {
          db.close();
          reject(event.target.error);
        };
        
        clearRequest.onsuccess = () => {
          db.close();
          resolve(true);
        };
      } catch (erro) {
        db.close();
        reject(erro);
      }
    };
  });
}