/**
 * @file segurancaDados.js
 * @description Módulo para implementação de segurança, validação e sanitização de dados
 * @version 1.0.0
 * @author LIMFS - Laboratório de Inovação Mosaicos e Futuros de Sergipe
 */

/**
 * Sanitiza strings para evitar injeção de código
 * @param {string} valor - Valor a ser sanitizado
 * @returns {string} - Valor sanitizado
 */
export function sanitizarString(valor) {
  if (typeof valor !== 'string') {
    return '';
  }
  
  // Escapa caracteres HTML especiais
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Valida e sanitiza objetos de dados antes de uso na aplicação
 * @param {Object} dados - Objeto com dados a serem validados
 * @param {Object} esquema - Esquema descrevendo a estrutura esperada
 * @returns {Object} - Objeto validado e sanitizado
 * @throws {Error} - Lança erro se validação falhar
 */
export function validarDados(dados, esquema) {
  if (!dados || typeof dados !== 'object') {
    throw new Error('Dados inválidos: objeto esperado');
  }
  
  if (!esquema || typeof esquema !== 'object') {
    throw new Error('Esquema de validação inválido');
  }
  
  const resultado = {};
  
  try {
    for (const campo in esquema) {
      // Se o campo é obrigatório, mas está ausente, lança erro
      if (esquema[campo].obrigatorio && (dados[campo] === undefined || dados[campo] === null)) {
        throw new Error(`Campo obrigatório ausente: ${campo}`);
      }
      
      // Se o campo está ausente mas não é obrigatório, usa valor padrão
      if (dados[campo] === undefined || dados[campo] === null) {
        resultado[campo] = esquema[campo].padrao;
        continue;
      }
      
      // Valida tipo
      if (esquema[campo].tipo) {
        const tipo = Array.isArray(dados[campo]) ? 'array' : typeof dados[campo];
        
        if (tipo !== esquema[campo].tipo) {
          throw new Error(`Tipo inválido para ${campo}: esperado ${esquema[campo].tipo}, recebido ${tipo}`);
        }
      }
      
      // Processa conforme o tipo
      switch (typeof dados[campo]) {
        case 'string':
          // Sanitiza strings
          resultado[campo] = sanitizarString(dados[campo]);
          
          // Valida tamanho mínimo/máximo se especificado
          if (esquema[campo].minComprimento !== undefined && resultado[campo].length < esquema[campo].minComprimento) {
            throw new Error(`Campo ${campo} abaixo do tamanho mínimo: ${esquema[campo].minComprimento}`);
          }
          
          if (esquema[campo].maxComprimento !== undefined && resultado[campo].length > esquema[campo].maxComprimento) {
            resultado[campo] = resultado[campo].substring(0, esquema[campo].maxComprimento);
          }
          break;
        
        case 'number':
          // Valida faixa numérica
          resultado[campo] = dados[campo];
          
          if (esquema[campo].min !== undefined && resultado[campo] < esquema[campo].min) {
            throw new Error(`Campo ${campo} abaixo do valor mínimo: ${esquema[campo].min}`);
          }
          
          if (esquema[campo].max !== undefined && resultado[campo] > esquema[campo].max) {
            throw new Error(`Campo ${campo} acima do valor máximo: ${esquema[campo].max}`);
          }
          break;
        
        case 'object':
          if (Array.isArray(dados[campo])) {
            // Para arrays, sanitiza e valida cada elemento
            resultado[campo] = dados[campo].map(item => {
              if (typeof item === 'string') {
                return sanitizarString(item);
              } else if (typeof item === 'object' && esquema[campo].esquemaItem) {
                return validarDados(item, esquema[campo].esquemaItem);
              }
              return item;
            });
            
            // Valida tamanho do array
            if (esquema[campo].minItens !== undefined && resultado[campo].length < esquema[campo].minItens) {
              throw new Error(`Array ${campo} abaixo do tamanho mínimo: ${esquema[campo].minItens}`);
            }
            
            if (esquema[campo].maxItens !== undefined && resultado[campo].length > esquema[campo].maxItens) {
              resultado[campo] = resultado[campo].slice(0, esquema[campo].maxItens);
            }
          } else {
            // Para objetos, valida recursivamente se houver esquema aninhado
            if (esquema[campo].esquemaAninhado) {
              resultado[campo] = validarDados(dados[campo], esquema[campo].esquemaAninhado);
            } else {
              // Caso contrário, copia o objeto como está
              resultado[campo] = dados[campo];
            }
          }
          break;
        
        default:
          // Outros tipos são copiados diretamente
          resultado[campo] = dados[campo];
      }
      
      // Validação personalizada se definida
      if (esquema[campo].validador && typeof esquema[campo].validador === 'function') {
        const validacao = esquema[campo].validador(resultado[campo]);
        
        if (validacao !== true) {
          throw new Error(validacao || `Validação personalizada falhou para o campo ${campo}`);
        }
      }
    }
    
    return resultado;
  } catch (erro) {
    console.error('Erro de validação:', erro);
    throw new Error(`Falha na validação de dados: ${erro.message}`);
  }
}

/**
 * Valida dados de indicadores ODS antes do carregamento
 * @param {Object} dadosIndicador - Dados do indicador a validar
 * @returns {Object} - Dados validados e sanitizados
 */
export function validarDadosIndicador(dadosIndicador) {
  // Define o esquema de validação para indicadores ODS
  const esquemaIndicador = {
    id: { tipo: 'string', obrigatorio: true },
    titulo: { tipo: 'string', obrigatorio: true, maxComprimento: 200 },
    descricao: { tipo: 'string', obrigatorio: false, padrao: '', maxComprimento: 1000 },
    unidade: { tipo: 'string', obrigatorio: false, padrao: '' },
    fonte: { tipo: 'string', obrigatorio: false, padrao: '' },
    anos: { tipo: 'array', obrigatorio: true, minItens: 1 },
    valores: { tipo: 'array', obrigatorio: true, minItens: 1 },
    meta: { tipo: 'number', obrigatorio: false },
    tendencia: { tipo: 'string', obrigatorio: false, padrao: 'neutro' }
  };
  
  return validarDados(dadosIndicador, esquemaIndicador);
}

/**
 * Valida dados de usuário antes de processar
 * @param {Object} dadosUsuario - Dados do usuário a validar
 * @returns {Object} - Dados validados e sanitizados
 */
export function validarDadosUsuario(dadosUsuario) {
  // Define o esquema de validação para dados de usuário
  const esquemaUsuario = {
    nome: { 
      tipo: 'string', 
      obrigatorio: true, 
      minComprimento: 3,
      maxComprimento: 100
    },
    email: { 
      tipo: 'string', 
      obrigatorio: true,
      validador: (email) => {
        // Validação básica de formato de email
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) || 'Formato de e-mail inválido';
      }
    },
    mensagem: {
      tipo: 'string',
      obrigatorio: true,
      minComprimento: 10,
      maxComprimento: 2000
    },
    telefone: {
      tipo: 'string',
      obrigatorio: false,
      padrao: '',
      validador: (tel) => {
        if (!tel) return true;
        // Validação básica de formato de telefone
        const re = /^[0-9\-\(\)\s\+]+$/;
        return re.test(tel) || 'Formato de telefone inválido';
      }
    }
  };
  
  return validarDados(dadosUsuario, esquemaUsuario);
}

/**
 * Detecta e previne XSS em conteúdo HTML
 * @param {string} html - Conteúdo HTML a sanitizar
 * @returns {string} - HTML sanitizado
 */
export function sanitizarHTML(html) {
  if (typeof html !== 'string') return '';
  
  // Lista de tags permitidas e seus atributos
  const tagsPermitidas = {
    'p': ['class', 'id'],
    'br': [],
    'strong': [],
    'em': [],
    'u': [],
    'ul': ['class'],
    'ol': ['class'],
    'li': [],
    'a': ['href', 'title', 'target', 'rel'],
    'h1': ['class', 'id'],
    'h2': ['class', 'id'],
    'h3': ['class', 'id'],
    'h4': ['class', 'id'],
    'h5': ['class', 'id'],
    'h6': ['class', 'id'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
    'table': ['class', 'id'],
    'thead': [],
    'tbody': [],
    'tr': [],
    'th': ['scope', 'colspan', 'rowspan'],
    'td': ['colspan', 'rowspan'],
    'div': ['class', 'id'],
    'span': ['class', 'id']
  };
  
  // Cria um elemento temporário para analisar o HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Função para sanitizar um elemento
  function sanitizarElemento(elemento) {
    // Se for um elemento texto, retorna seu valor
    if (elemento.nodeType === Node.TEXT_NODE) {
      return elemento.textContent;
    }
    
    // Se não for elemento, retorna string vazia
    if (elemento.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const tagName = elemento.tagName.toLowerCase();
    
    // Se a tag não é permitida, retorna apenas o conteúdo textual
    if (!tagsPermitidas[tagName]) {
      return elemento.textContent;
    }
    
    // Cria um novo elemento com a mesma tag
    const novoElemento = document.createElement(tagName);
    
    // Copia apenas os atributos permitidos
    for (const attr of elemento.attributes) {
      if (tagsPermitidas[tagName].includes(attr.name)) {
        // Sanitiza valores de href para prevenir javascript:
        if (attr.name === 'href' && attr.value.toLowerCase().trim().startsWith('javascript:')) {
          novoElemento.setAttribute(attr.name, '#');
        } else {
          novoElemento.setAttribute(attr.name, attr.value);
        }
      }
    }
    
    // Se for link, força atributos de segurança
    if (tagName === 'a') {
      if (novoElemento.hasAttribute('href') && !novoElemento.getAttribute('href').startsWith('#')) {
        novoElemento.setAttribute('target', '_blank');
        novoElemento.setAttribute('rel', 'noopener noreferrer');
      }
    }
    
    // Processa filhos recursivamente
    for (const filho of elemento.childNodes) {
      const conteudoFilho = sanitizarElemento(filho);
      
      if (typeof conteudoFilho === 'string') {
        novoElemento.appendChild(document.createTextNode(conteudoFilho));
      } else if (conteudoFilho) {
        novoElemento.appendChild(conteudoFilho);
      }
    }
    
    return novoElemento;
  }
  
  // Sanitiza todos os elementos e retorna o resultado
  const fragmento = document.createDocumentFragment();
  
  for (const filho of tempDiv.childNodes) {
    const elementoSanitizado = sanitizarElemento(filho);
    
    if (typeof elementoSanitizado === 'string') {
      fragmento.appendChild(document.createTextNode(elementoSanitizado));
    } else if (elementoSanitizado) {
      fragmento.appendChild(elementoSanitizado);
    }
  }
  
  const divResultado = document.createElement('div');
  divResultado.appendChild(fragmento);
  
  return divResultado.innerHTML;
}

/**
 * Verifica a força de uma senha
 * @param {string} senha - Senha a verificar
 * @returns {Object} - Objeto com pontuação e feedback
 */
export function verificarForcaSenha(senha) {
  let pontuacao = 0;
  const feedback = [];
  
  // Verifica comprimento
  if (senha.length < 8) {
    feedback.push('A senha deve ter pelo menos 8 caracteres');
  } else {
    pontuacao += 1;
  }
  
  if (senha.length >= 12) {
    pontuacao += 1;
  }
  
  // Verifica presença de números
  if (/\d/.test(senha)) {
    pontuacao += 1;
  } else {
    feedback.push('Adicione números à senha');
  }
  
  // Verifica letras minúsculas
  if (/[a-z]/.test(senha)) {
    pontuacao += 1;
  } else {
    feedback.push('Adicione letras minúsculas à senha');
  }
  
  // Verifica letras maiúsculas
  if (/[A-Z]/.test(senha)) {
    pontuacao += 1;
  } else {
    feedback.push('Adicione letras maiúsculas à senha');
  }
  
  // Verifica caracteres especiais
  if (/[^A-Za-z0-9]/.test(senha)) {
    pontuacao += 1;
  } else {
    feedback.push('Adicione caracteres especiais à senha');
  }
  
  // Verifica repetição de caracteres
  if (/(.)\1{2,}/.test(senha)) {
    pontuacao -= 1;
    feedback.push('Evite repetir caracteres');
  }
  
  // Classifica a força
  let forca;
  if (pontuacao < 3) {
    forca = 'fraca';
  } else if (pontuacao < 5) {
    forca = 'média';
  } else {
    forca = 'forte';
  }
  
  return {
    pontuacao,
    forca,
    feedback
  };
}

/**
 * Gera um token de segurança aleatorio
 * @param {number} comprimento - Comprimento do token (padrão: 32)
 * @returns {string} - Token gerado
 */
export function gerarToken(comprimento = 32) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  // Usa a API nativa de criptografia se disponível
  if (window.crypto && window.crypto.getRandomValues) {
    const valores = new Uint32Array(comprimento);
    window.crypto.getRandomValues(valores);
    
    for (let i = 0; i < comprimento; i++) {
      token += caracteres.charAt(valores[i] % caracteres.length);
    }
  } else {
    // Fallback menos seguro
    for (let i = 0; i < comprimento; i++) {
      token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
  }
  
  return token;
}

// Exporta funções públicas
export default {
  sanitizarString,
  validarDados,
  validarDadosIndicador,
  validarDadosUsuario,
  sanitizarHTML,
  verificarForcaSenha,
  gerarToken
};