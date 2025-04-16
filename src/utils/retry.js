/**
 * Utilitário para implementação de retry em funções assíncronas
 * Permite tentar novamente uma operação em caso de falha
 */

/**
 * Aplica estratégia de retry a uma função assíncrona
 * @param {Function} fn - Função assíncrona a ser executada 
 * @param {Object} options - Opções de configuração
 * @param {number} options.maxRetries - Número máximo de tentativas (padrão: 3)
 * @param {number} options.delay - Atraso entre tentativas em ms (padrão: 1000)
 * @param {Function} options.shouldRetry - Função que decide se deve tentar novamente
 * @returns {Promise<any>} Resultado da função ou propaga o erro após tentativas
 */
export function comRetry(fn, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const delay = options.delay ?? 1000;
  const shouldRetry = options.shouldRetry ?? (() => true);
  
  return new Promise(async (resolve, reject) => {
    let tentativas = 0;
    let ultimoErro = null;
    
    while (tentativas <= maxRetries) {
      try {
        // Tenta executar a função
        const resultado = await fn();
        return resolve(resultado);
      } catch (erro) {
        tentativas++;
        ultimoErro = erro;
        
        // Se atingiu o número máximo de tentativas, rejeita com o último erro
        if (tentativas > maxRetries || !shouldRetry(erro, tentativas)) {
          return reject(ultimoErro);
        }
        
        // Aguarda antes de tentar novamente
        await new Promise(r => setTimeout(r, delay));
      }
    }
  });
}

export default {
  comRetry
};
