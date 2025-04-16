/**
 * Utilitário para registro e gerenciamento de erros
 * Permite centralizar o tratamento de erros da aplicação
 */

const STORAGE_KEY = 'ods_sergipe_erros';
const MAX_ERROS = 100; // Limite máximo de erros no histórico

/**
 * Registra um erro persistente para análise posterior
 * @param {string} endpoint - Endpoint ou contexto do erro
 * @param {Error} erro - Objeto de erro
 * @param {Object} dadosAdicionais - Dados adicionais opcionais
 * @returns {boolean} Retorna true se registrado com sucesso
 */
export function registrarErroPersistente(endpoint, erro, dadosAdicionais = {}) {
  try {
    // Recupera erros anteriores ou inicia array vazio
    const errosAnteriores = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Formata o novo erro
    const novoErro = {
      endpoint,
      mensagem: erro.message || erro.toString(),
      timestamp: Date.now(),
      stack: erro.stack ? erro.stack.split('\n').slice(0, 3).join('\n') : null, // Captura só parte da stack
      ...dadosAdicionais
    };
    
    // Adiciona erro no início do array (mais recente primeiro)
    errosAnteriores.unshift(novoErro);
    
    // Limita o tamanho do histórico
    const errosLimitados = errosAnteriores.slice(0, MAX_ERROS);
    
    // Salva no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(errosLimitados));
    
    // Também mostra no console para facilitar debugging
    console.error(`[Erro ${endpoint}]:`, erro);
    
    return true;
  } catch (e) {
    // Em caso de erro ao salvar (localStorage cheio, etc), apenas log no console
    console.error('Não foi possível registrar erro:', e);
    console.error('Erro original:', erro);
    return false;
  }
}

/**
 * Retorna todos os erros registrados
 * @returns {Array} Lista de erros registrados
 */
export function obterErrosRegistrados() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    console.error('Erro ao recuperar histórico de erros:', e);
    return [];
  }
}

/**
 * Limpa o histórico de erros registrados
 */
export function limparErrosRegistrados() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Erro ao limpar histórico de erros:', e);
    return false;
  }
}

/**
 * Exporta um relatório de erros em formato CSV
 * @returns {string} Conteúdo CSV com os erros
 */
export function exportarErrosCSV() {
  const erros = obterErrosRegistrados();
  
  if (erros.length === 0) {
    return 'Nenhum erro registrado';
  }
  
  // Cabeçalho CSV
  let csv = 'Timestamp,Endpoint,Mensagem\n';
  
  // Adiciona cada erro
  erros.forEach(erro => {
    const timestamp = new Date(erro.timestamp).toISOString();
    const endpoint = erro.endpoint.replace(/,/g, ' ');
    const mensagem = erro.mensagem.replace(/"/g, '""').replace(/,/g, ' ');
    
    csv += `${timestamp},"${endpoint}","${mensagem}"\n`;
  });
  
  return csv;
}

export default {
  registrarErroPersistente,
  obterErrosRegistrados,
  limparErrosRegistrados,
  exportarErrosCSV
};
