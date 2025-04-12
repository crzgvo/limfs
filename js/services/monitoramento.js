/**
 * Sistema de Monitoramento - LIMFS
 * Responsável por verificar e exibir alertas do sistema
 */

// Configurações do sistema de monitoramento
const CONFIG_MONITORAMENTO = {
    intervalo_verificacao: 300000, // 5 minutos em milissegundos
    caminho_historico: '../../dados/sistema/historico-alertas.json',
    caminho_status: '../../dados/sistema/status-sistema.html',
    limite_historico: 50, // Número máximo de entradas no histórico
};

/**
 * Verificar o status atual do sistema
 * @returns {Promise<Object>} Objeto com informações do status
 */
async function verificarStatusSistema() {
    try {
        const resposta = await fetch(CONFIG_MONITORAMENTO.caminho_status);
        if (!resposta.ok) {
            throw new Error(`Erro ao carregar status: ${resposta.status}`);
        }
        
        const html = await resposta.text();
        // Extrair informações do HTML retornado
        const statusAtual = extrairStatusDoHTML(html);
        return statusAtual;
    } catch (erro) {
        console.error('Erro ao verificar status do sistema:', erro);
        return {
            status: 'desconhecido',
            mensagem: 'Não foi possível verificar o status atual do sistema',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Extrair informações de status do HTML da página de status
 * @param {string} html - Conteúdo HTML da página de status
 * @returns {Object} Informações de status extraídas
 */
function extrairStatusDoHTML(html) {
    // Implementação simplificada - em produção, usar DOMParser
    let status = 'normal';
    let mensagem = 'Sistemas operando normalmente';
    
    if (html.includes('class="alerta"')) {
        status = 'alerta';
        // Extrair mensagem entre as tags <div class="alerta">MENSAGEM</div>
        const match = html.match(/<div class="alerta">(.*?)<\/div>/);
        if (match && match[1]) {
            mensagem = match[1].trim();
        } else {
            mensagem = 'Atenção: Existem alertas no sistema';
        }
    } else if (html.includes('class="critico"')) {
        status = 'critico';
        const match = html.match(/<div class="critico">(.*?)<\/div>/);
        if (match && match[1]) {
            mensagem = match[1].trim();
        } else {
            mensagem = 'CRÍTICO: Sistema com problemas graves';
        }
    }
    
    return {
        status: status,
        mensagem: mensagem,
        timestamp: new Date().toISOString()
    };
}

/**
 * Carregar o histórico de alertas
 * @returns {Promise<Array>} Array com o histórico de alertas
 */
async function carregarHistoricoAlertas() {
    try {
        const resposta = await fetch(CONFIG_MONITORAMENTO.caminho_historico);
        if (!resposta.ok) {
            throw new Error(`Erro ao carregar histórico: ${resposta.status}`);
        }
        
        const historico = await resposta.json();
        return Array.isArray(historico) ? historico : [];
    } catch (erro) {
        console.error('Erro ao carregar histórico de alertas:', erro);
        return [];
    }
}

/**
 * Adicionar novo alerta ao histórico
 * @param {Object} alerta - Informações do alerta
 * @returns {Promise<boolean>} Resultado da operação
 */
async function adicionarAlerta(alerta) {
    try {
        // Em produção, isso seria feito via API
        const historico = await carregarHistoricoAlertas();
        
        // Adicionar novo alerta ao início
        historico.unshift({
            ...alerta,
            id: `alerta-${Date.now()}`,
            timestamp: new Date().toISOString()
        });
        
        // Limitar tamanho do histórico
        if (historico.length > CONFIG_MONITORAMENTO.limite_historico) {
            historico.splice(CONFIG_MONITORAMENTO.limite_historico);
        }
        
        // Em produção, atualizar via API
        console.log('Alerta adicionado ao histórico:', alerta);
        return true;
    } catch (erro) {
        console.error('Erro ao adicionar alerta:', erro);
        return false;
    }
}

/**
 * Inicializar o sistema de monitoramento
 */
function iniciarMonitoramento() {
    console.log('Sistema de monitoramento iniciado');
    
    // Verificação inicial
    verificarStatusSistema().then(status => {
        if (status.status !== 'normal') {
            exibirNotificacao(status);
        }
    });
    
    // Configurar verificação periódica
    setInterval(() => {
        verificarStatusSistema().then(status => {
            if (status.status !== 'normal') {
                exibirNotificacao(status);
            }
        });
    }, CONFIG_MONITORAMENTO.intervalo_verificacao);
}

/**
 * Exibir notificação de alerta na interface
 * @param {Object} alerta - Informações do alerta
 */
function exibirNotificacao(alerta) {
    // Adicionar o alerta ao histórico
    adicionarAlerta(alerta);
    
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-alerta ${alerta.status}`;
    notificacao.innerHTML = `
        <div class="notificacao-cabecalho">
            <span class="notificacao-titulo">${alerta.status === 'critico' ? '⚠️ ALERTA CRÍTICO' : '⚠️ Alerta'}</span>
            <button class="fechar-notificacao" aria-label="Fechar notificação">&times;</button>
        </div>
        <div class="notificacao-conteudo">
            <p>${alerta.mensagem}</p>
            <span class="notificacao-timestamp">${new Date().toLocaleString()}</span>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notificacao);
    
    // Configurar botão fechar
    notificacao.querySelector('.fechar-notificacao').addEventListener('click', () => {
        notificacao.classList.add('fechando');
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    });
    
    // Auto-remover após um tempo (para alertas não críticos)
    if (alerta.status !== 'critico') {
        setTimeout(() => {
            if (notificacao.parentElement) {
                notificacao.classList.add('fechando');
                setTimeout(() => {
                    notificacao.remove();
                }, 300);
            }
        }, 10000);
    }
}

// Exportar funções para uso em outros módulos
export {
    verificarStatusSistema,
    carregarHistoricoAlertas,
    adicionarAlerta,
    iniciarMonitoramento,
    exibirNotificacao
};