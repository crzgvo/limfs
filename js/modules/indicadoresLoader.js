/**
 * Módulo para carregamento de indicadores de ODS
 * 
 * @module indicadoresLoader
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 2.0.0
 */

import { obterDoCache, adicionarAoCache } from './cacheMultinivel.js';
import * as tratamentoErros from './tratamentoErros.js';

// Configurações do carregador
const config = {
  urlBase: 'https://api.limfs.org.br/v2/indicadores/',
  tempoCache: 3600000, // 1 hora em milissegundos
  tentativasMaximas: 3,
  intervaloTentativas: 2000, // 2 segundos
  atualizacaoAutomatica: false,
  intervaloAtualizacao: 300000, // 5 minutos em milissegundos
  callbacks: {
    antesDaAtualizacao: null,
    depoisDaAtualizacao: null,
    aoFalhar: null
  },
  preferirCache: true,
  gerarLogDesempenho: true,
  timeouts: {
    requisicao: 10000, // 10 segundos
    processamento: 5000  // 5 segundos
  }
};

// Registro de carregamentos ativos
const carregamentosAtivos = new Map();

// Controladores de atualização automática
const controladoresAtualizacao = new Map();

/**
 * Configura o carregador de indicadores
 * @param {Object} opcoes - Opções de configuração
 * @returns {void}
 */
export function configurarCarregador(opcoes = {}) {
  Object.assign(config, opcoes);
  console.log('Carregador de indicadores configurado:', config);
}

/**
 * Carrega indicadores para um ODS específico
 * 
 * @param {number|string} numeroODS - Número do ODS (1-17)
 * @param {Object} opcoes - Opções de carregamento
 * @param {boolean} [opcoes.forcarAtualizacao=false] - Força atualização ignorando cache
 * @param {boolean} [opcoes.ativarAtualizacaoAutomatica=false] - Ativa atualização automática
 * @param {Function} [opcoes.callback] - Função de callback após carregamento
 * @returns {Promise<Object>} Dados dos indicadores
 */
export async function carregarIndicadoresODS(numeroODS, opcoes = {}) {
  const opcoesPadrao = {
    forcarAtualizacao: false,
    ativarAtualizacaoAutomatica: config.atualizacaoAutomatica,
    callback: null
  };

  const opcoesFinais = { ...opcoesPadrao, ...opcoes };
  const chaveCache = `ods_${numeroODS}_indicadores`;
  
  // Verifica se já existe um carregamento ativo para este ODS
  if (carregamentosAtivos.has(numeroODS)) {
    console.log(`Carregamento para ODS ${numeroODS} já está em andamento`);
    return carregamentosAtivos.get(numeroODS);
  }

  // Cria uma Promise para o carregamento atual
  const promiseCarregamento = (async () => {
    try {
      console.time(`carregamento_ods_${numeroODS}`);
      
      // Verifica se temos dados em cache e não estamos forçando atualização
      if (!opcoesFinais.forcarAtualizacao && config.preferirCache) {
        const dadosCache = await obterDoCache(chaveCache);
        if (dadosCache) {
          console.log(`Usando dados em cache para ODS ${numeroODS}`);
          
          // Se a atualização automática estiver ativada, inicia em background
          if (opcoesFinais.ativarAtualizacaoAutomatica) {
            iniciarAtualizacaoAutomatica(numeroODS, opcoesFinais);
          }
          
          return dadosCache;
        }
      }
      
      // Se não temos cache ou precisamos atualizar, carrega os dados da API
      const dadosIndicadores = await carregarDadosDaAPI(numeroODS);
      
      // Armazena os dados em cache
      await adicionarAoCache(chaveCache, dadosIndicadores, config.tempoCache);
      
      // Se a atualização automática estiver ativada, inicia
      if (opcoesFinais.ativarAtualizacaoAutomatica) {
        iniciarAtualizacaoAutomatica(numeroODS, opcoesFinais);
      }
      
      return dadosIndicadores;
    } catch (erro) {
      console.error(`Erro ao carregar indicadores do ODS ${numeroODS}:`, erro);
      tratamentoErros.registrarErro('carregamento_indicadores', erro);
      
      // Chama o callback de erro, se existir
      if (config.callbacks.aoFalhar) {
        config.callbacks.aoFalhar(erro, numeroODS);
      }
      
      throw erro;
    } finally {
      console.timeEnd(`carregamento_ods_${numeroODS}`);
      carregamentosAtivos.delete(numeroODS);
    }
  })();
  
  // Registra a Promise de carregamento ativa
  carregamentosAtivos.set(numeroODS, promiseCarregamento);
  
  // Executa o callback, se fornecido
  const resultado = await promiseCarregamento;
  if (opcoesFinais.callback) {
    opcoesFinais.callback(resultado);
  }
  
  return resultado;
}

/**
 * Carrega dados da API para um ODS específico
 * 
 * @private
 * @param {number|string} numeroODS - Número do ODS
 * @returns {Promise<Object>} Dados dos indicadores
 */
async function carregarDadosDaAPI(numeroODS) {
  let tentativas = 0;
  let ultimoErro = null;
  
  while (tentativas < config.tentativasMaximas) {
    try {
      const url = `${config.urlBase}ods/${numeroODS}`;
      
      // Configura o timeout para a requisição
      const controlador = new AbortController();
      const timeoutId = setTimeout(() => controlador.abort(), config.timeouts.requisicao);
      
      console.log(`Buscando dados do ODS ${numeroODS} da API: ${url}`);
      const resposta = await fetch(url, { signal: controlador.signal });
      clearTimeout(timeoutId);
      
      if (!resposta.ok) {
        throw new Error(`Requisição falhou com status ${resposta.status}`);
      }
      
      const dados = await resposta.json();
      return processarDadosIndicadores(dados, numeroODS);
    } catch (erro) {
      tentativas++;
      ultimoErro = erro;
      
      console.warn(`Tentativa ${tentativas} falhou para ODS ${numeroODS}:`, erro);
      
      if (tentativas < config.tentativasMaximas) {
        // Espera um intervalo antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, config.intervaloTentativas));
      }
    }
  }
  
  throw new Error(`Falha ao carregar dados após ${config.tentativasMaximas} tentativas. Último erro: ${ultimoErro.message}`);
}

/**
 * Processa os dados dos indicadores antes de retornar
 * 
 * @private
 * @param {Object} dados - Dados brutos dos indicadores
 * @param {number|string} numeroODS - Número do ODS
 * @returns {Object} Dados processados
 */
function processarDadosIndicadores(dados, numeroODS) {
  // Adiciona metadados ao resultado
  return {
    ...dados,
    metadados: {
      fonte: 'API LIMFS',
      dataAtualizacao: new Date().toISOString(),
      versao: '2.0',
      numeroODS: numeroODS
    }
  };
}

/**
 * Inicia a atualização automática para um ODS
 * 
 * @private
 * @param {number|string} numeroODS - Número do ODS
 * @param {Object} opcoes - Opções de atualização
 */
function iniciarAtualizacaoAutomatica(numeroODS, opcoes) {
  // Cancela qualquer atualização automática existente
  pararAtualizacaoAutomatica(numeroODS);
  
  // Cria novo controlador de atualização
  const controlador = {
    intervalo: setInterval(() => {
      console.log(`Executando atualização automática para ODS ${numeroODS}`);
      
      if (config.callbacks.antesDaAtualizacao) {
        config.callbacks.antesDaAtualizacao(numeroODS);
      }
      
      // Executa a atualização em background
      carregarIndicadoresODS(numeroODS, { forcarAtualizacao: true })
        .then(dados => {
          if (config.callbacks.depoisDaAtualizacao) {
            config.callbacks.depoisDaAtualizacao(dados, numeroODS);
          }
          
          if (opcoes.callback) {
            opcoes.callback(dados);
          }
        })
        .catch(erro => {
          console.error(`Erro na atualização automática do ODS ${numeroODS}:`, erro);
          tratamentoErros.registrarErro('atualizacao_automatica', erro);
        });
    }, config.intervaloAtualizacao),
    ativo: true,
    ultimaAtualizacao: new Date()
  };
  
  controladoresAtualizacao.set(numeroODS, controlador);
  console.log(`Atualização automática ativada para ODS ${numeroODS} a cada ${config.intervaloAtualizacao / 1000} segundos`);
}

/**
 * Para a atualização automática para um ODS específico
 * 
 * @param {number|string} numeroODS - Número do ODS
 * @returns {boolean} True se parou alguma atualização, false caso contrário
 */
export function pararAtualizacaoAutomatica(numeroODS) {
  if (controladoresAtualizacao.has(numeroODS)) {
    const controlador = controladoresAtualizacao.get(numeroODS);
    clearInterval(controlador.intervalo);
    controlador.ativo = false;
    controladoresAtualizacao.delete(numeroODS);
    console.log(`Atualização automática desativada para ODS ${numeroODS}`);
    return true;
  }
  return false;
}

/**
 * Verifica se há atualização automática ativa para um ODS
 * 
 * @param {number|string} numeroODS - Número do ODS
 * @returns {boolean} True se há atualização ativa
 */
export function temAtualizacaoAutomatica(numeroODS) {
  return controladoresAtualizacao.has(numeroODS) && 
         controladoresAtualizacao.get(numeroODS).ativo;
}

/**
 * Limpa o cache de indicadores para um ODS específico
 * 
 * @param {number|string} numeroODS - Número do ODS
 * @returns {Promise<boolean>} Promise indicando sucesso
 */
export async function limparCacheIndicadores(numeroODS) {
  try {
    // Remove do cache multinível
    await adicionarAoCache(`ods_${numeroODS}_indicadores`, null, 0);
    console.log(`Cache limpo para ODS ${numeroODS}`);
    return true;
  } catch (erro) {
    console.error(`Erro ao limpar cache para ODS ${numeroODS}:`, erro);
    return false;
  }
}