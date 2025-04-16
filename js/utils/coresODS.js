/**
 * Utilitário para obter cores padronizadas para os ODS
 */

// Paleta de cores dos ODSs (cores oficiais)
const CORES_ODS = {
  1: { primaria: '#e5243b', secundaria: '#f4a7b0' }, // Erradicação da Pobreza
  2: { primaria: '#dda63a', secundaria: '#f1d3a0' }, // Fome Zero
  3: { primaria: '#4c9f38', secundaria: '#b3d39b' }, // Saúde e Bem-Estar
  4: { primaria: '#c5192d', secundaria: '#f0a5ad' }, // Educação de Qualidade
  5: { primaria: '#ff3a21', secundaria: '#ff9d90' }, // Igualdade de Gênero
  6: { primaria: '#26bde2', secundaria: '#a3e4f3' }, // Água Potável e Saneamento
  7: { primaria: '#fcc30b', secundaria: '#fde5a6' }, // Energia Limpa e Acessível
  8: { primaria: '#a21942', secundaria: '#e3a4b5' }, // Trabalho Decente e Crescimento Econômico
  9: { primaria: '#fd6925', secundaria: '#feb992' }, // Indústria, Inovação e Infraestrutura
  10: { primaria: '#dd1367', secundaria: '#f08caf' }, // Redução das Desigualdades
  11: { primaria: '#fd9d24', secundaria: '#fed093' }, // Cidades e Comunidades Sustentáveis
  12: { primaria: '#cf8d2a', secundaria: '#ecd7af' }, // Consumo e Produção Responsáveis
  13: { primaria: '#3f7e44', secundaria: '#b2d0b6' }, // Ação Contra a Mudança Global do Clima
  14: { primaria: '#0a97d9', secundaria: '#9bdaf1' }, // Vida na Água
  15: { primaria: '#56c02b', secundaria: '#bdeba5' }, // Vida Terrestre
  16: { primaria: '#00689d', secundaria: '#99c7de' }, // Paz, Justiça e Instituições Eficazes
  17: { primaria: '#19486a', secundaria: '#a3b7c9' }  // Parcerias e Meios de Implementação
};

/**
 * Obtém a cor principal ou secundária para um ODS específico
 * @param {number} numeroOds - Número do ODS (1-17)
 * @param {boolean} secundaria - Se true, retorna a cor secundária, caso contrário a primária
 * @returns {string} Código hexadecimal da cor
 */
export function getOdsColor(numeroOds, secundaria = false) {
  // Trata números de ODS inválidos
  if (!numeroOds || numeroOds < 1 || numeroOds > 17) {
    console.warn(`Número de ODS inválido: ${numeroOds}. Usando ODS 1 como fallback.`);
    numeroOds = 1;
  }
  
  const tipo = secundaria ? 'secundaria' : 'primaria';
  return CORES_ODS[numeroOds][tipo];
}

/**
 * Obtém o objeto com as cores primária e secundária para um ODS
 * @param {number|string} numeroOds - Número do ODS (1-17) ou código (ods1-ods17)
 * @returns {object} Objeto com as cores primária e secundária
 */
export function obterCoresODS(numeroOds) {
  // Se for uma string como 'ods13', converte para número
  if (typeof numeroOds === 'string' && numeroOds.startsWith('ods')) {
    numeroOds = parseInt(numeroOds.replace('ods', ''));
  }
  
  // Trata números de ODS inválidos
  if (!numeroOds || isNaN(numeroOds) || numeroOds < 1 || numeroOds > 17) {
    console.warn(`Número de ODS inválido: ${numeroOds}. Usando ODS 1 como fallback.`);
    numeroOds = 1;
  }
  
  return CORES_ODS[numeroOds];
}

/**
 * Aplica as cores do ODS a elementos CSS
 * @param {number|string} numeroOds - Número do ODS (1-17) ou código (ods1-ods17)
 * @param {boolean} aplicarAoBody - Se true, aplica as cores também ao body como variáveis CSS
 */
export function aplicarCoresODS(numeroOds, aplicarAoBody = true) {
  const cores = obterCoresODS(numeroOds);
  
  if (aplicarAoBody) {
    document.body.style.setProperty('--cor-primaria-ods', cores.primaria);
    document.body.style.setProperty('--cor-secundaria-ods', cores.secundaria);
    
    // Adiciona uma classe para facilitar estilos CSS específicos
    document.body.classList.add('tema-ods');
    document.body.setAttribute('data-ods-tema', `ods${numeroOds}`);
  }
  
  return cores;
}