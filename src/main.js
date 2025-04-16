/**
 * Arquivo principal de entrada para o Painel ODS Sergipe
 * Desenvolvido pelo LIMFS - Laboratório de Inovação, Mosaicos e Futuros Sustentáveis
 */

import { inicializarMonitoramento } from './services/monitoring/monitoramento';
import { carregarConfiguracoes } from './services/api/carregadorDados';
import { verificarCache, limparCacheExpirado } from './utils/cache';
import { registrarErroPersistente } from './utils/error-logging';
import { inicializarAcessibilidade } from './components/accessibility/acessibilidade';

// Constantes
import { ODS_CONFIG } from './constants/ods';
import { API_CONFIG } from './constants/api';
import { THEME } from './constants/theme';

/**
 * Inicializa o aplicativo
 */
async function inicializarApp() {
  try {
    console.log('Inicializando Painel ODS Sergipe...');
    
    // Limpa cache expirado
    limparCacheExpirado();
    
    // Inicializa o sistema de monitoramento
    inicializarMonitoramento({
      intervalCheck: 300000, // 5 minutos
      logLevel: 'info'
    });
    
    // Carrega configurações
    const configuracoes = await carregarConfiguracoes();
    if (!configuracoes) {
      throw new Error('Falha ao carregar configurações iniciais');
    }
    
    // Inicializa recursos de acessibilidade
    inicializarAcessibilidade();
    
    // Carrega dados principais e inicializa UI conforme a página atual
    await carregarDadosPagina();
    
    console.log('Painel ODS inicializado com sucesso!');
  } catch (erro) {
    console.error('Erro ao inicializar aplicação:', erro);
    registrarErroPersistente('inicializacao', erro);
    
    // Mostra mensagem de erro amigável para o usuário
    exibirErroInicializacao();
  }
}

/**
 * Carrega os dados específicos da página atual
 */
async function carregarDadosPagina() {
  const paginaAtual = window.location.pathname;
  
  // Verifica se é uma página de ODS específico
  if (paginaAtual.includes('/ods')) {
    const odsId = extrairOdsIdDaUrl(paginaAtual);
    if (odsId) {
      await carregarDadosOdsEspecifico(odsId);
    }
  } 
  // Verifica se é a página de comparativo
  else if (paginaAtual.includes('/comparativo')) {
    await carregarDadosComparativo();
  }
  // Página principal/dashboard
  else if (paginaAtual.includes('/painel-ods') || paginaAtual === '/') {
    await carregarDadosDashboard();
  }
  
  // Inicializa eventos e interações
  inicializarEventos();
}

/**
 * Extrai o ID do ODS da URL
 */
function extrairOdsIdDaUrl(url) {
  const match = url.match(/ods(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Carrega dados para um ODS específico
 */
async function carregarDadosOdsEspecifico(odsId) {
  console.log(`Carregando dados do ODS ${odsId}...`);
  // Implementação real seria feita aqui
}

/**
 * Carrega dados para a página de comparativo
 */
async function carregarDadosComparativo() {
  console.log('Carregando dados de comparativo...');
  // Implementação real seria feita aqui
}

/**
 * Carrega dados para o dashboard principal
 */
async function carregarDadosDashboard() {
  console.log('Carregando dados do dashboard principal...');
  // Implementação real seria feita aqui
}

/**
 * Inicializa eventos de UI
 */
function inicializarEventos() {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando eventos...');
    // Inicialização de eventos reais seria feita aqui
  });
}

/**
 * Exibe uma mensagem amigável em caso de erro de inicialização
 */
function exibirErroInicializacao() {
  const container = document.querySelector('#app') || document.body;
  const mensagemErro = document.createElement('div');
  mensagemErro.className = 'error-container';
  mensagemErro.innerHTML = `
    <h2>Ops! Algo deu errado.</h2>
    <p>Não foi possível carregar o Painel ODS. Por favor, tente novamente em alguns instantes.</p>
    <button class="retry-button">Tentar Novamente</button>
  `;
  
  // Adiciona evento para recarregar a página
  const btnRetry = mensagemErro.querySelector('.retry-button');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => window.location.reload());
  }
  
  container.appendChild(mensagemErro);
}

// Inicializa a aplicação quando o script for carregado
document.addEventListener('DOMContentLoaded', inicializarApp);

// Exporta funções principais para uso em outros módulos
export {
  inicializarApp,
  carregarDadosPagina
};