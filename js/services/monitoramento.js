/**
 * Serviço de monitoramento para o Painel ODS Sergipe
 * Responsável pelo registro de logs e monitoramento do sistema
 */

// Constantes para níveis de log
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Configuração do nível mínimo de log (pode ser alterado em tempo de execução)
let nivelAtual = LOG_LEVELS.INFO;

/**
 * Classe de logger para registro de mensagens com diferentes níveis
 */
class Logger {
    constructor(prefix = '') {
        this.prefix = prefix ? `[${prefix}] ` : '';
    }

    /**
     * Obtém timestamp formatado para os logs
     */
    getTimestamp() {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    /**
     * Registra mensagem de depuração
     */
    debug(...args) {
        if (nivelAtual <= LOG_LEVELS.DEBUG) {
            console.debug(
                `%c${this.getTimestamp()} ${this.prefix}DEBUG:`, 
                'color: #6c757d', 
                ...args
            );
            this.armazenarLog('DEBUG', args.join(' '));
        }
    }

    /**
     * Registra mensagem informativa
     */
    info(...args) {
        if (nivelAtual <= LOG_LEVELS.INFO) {
            console.info(
                `%c${this.getTimestamp()} ${this.prefix}INFO:`, 
                'color: #0275d8', 
                ...args
            );
            this.armazenarLog('INFO', args.join(' '));
        }
    }

    /**
     * Registra mensagem de aviso
     */
    warn(...args) {
        if (nivelAtual <= LOG_LEVELS.WARN) {
            console.warn(
                `%c${this.getTimestamp()} ${this.prefix}WARN:`, 
                'color: #f0ad4e', 
                ...args
            );
            this.armazenarLog('WARN', args.join(' '));
        }
    }

    /**
     * Registra mensagem de erro
     */
    error(...args) {
        if (nivelAtual <= LOG_LEVELS.ERROR) {
            console.error(
                `%c${this.getTimestamp()} ${this.prefix}ERROR:`, 
                'color: #d9534f', 
                ...args
            );
            this.armazenarLog('ERROR', args.join(' '));
        }
    }

    /**
     * Armazena logs no localStorage para persistência
     */
    armazenarLog(nivel, mensagem) {
        try {
            const chave = 'ods_sergipe_logs';
            const logs = JSON.parse(localStorage.getItem(chave) || '[]');
            
            // Limitar o tamanho do histórico de logs (últimos 500)
            if (logs.length > 500) {
                logs.shift(); // Remove o log mais antigo
            }
            
            logs.push({
                timestamp: Date.now(),
                nivel,
                mensagem
            });
            
            localStorage.setItem(chave, JSON.stringify(logs));
        } catch (erro) {
            console.error('Erro ao armazenar log:', erro);
        }
    }

    /**
     * Recupera histórico de logs armazenados
     */
    obterHistoricoLogs() {
        try {
            const chave = 'ods_sergipe_logs';
            return JSON.parse(localStorage.getItem(chave) || '[]');
        } catch (erro) {
            console.error('Erro ao recuperar histórico de logs:', erro);
            return [];
        }
    }

    /**
     * Exporta histórico de logs para download
     */
    exportarLogs() {
        const logs = this.obterHistoricoLogs();
        if (logs.length === 0) {
            return 'Nenhum log encontrado.';
        }
        
        let conteudo = 'TIMESTAMP,NIVEL,MENSAGEM\n';
        logs.forEach(log => {
            const data = new Date(log.timestamp).toISOString();
            // Escapa aspas em mensagens CSV
            const mensagemEscapada = log.mensagem.replace(/"/g, '""');
            conteudo += `${data},"${log.nivel}","${mensagemEscapada}"\n`;
        });
        
        return conteudo;
    }
}

/**
 * Monitora e registra performance do sistema
 */
class MonitorPerformance {
    constructor() {
        this.metricas = {};
    }

    /**
     * Inicia medição de uma operação
     */
    iniciarMedicao(operacao) {
        if (!window.performance || !window.performance.now) return null;
        return {
            operacao,
            inicio: window.performance.now()
        };
    }

    /**
     * Finaliza a medição e registra o resultado
     */
    finalizarMedicao(medicao) {
        if (!medicao || !window.performance || !window.performance.now) return;
        
        const duracao = window.performance.now() - medicao.inicio;
        
        // Inicializa estatísticas para a operação se necessário
        if (!this.metricas[medicao.operacao]) {
            this.metricas[medicao.operacao] = {
                contagem: 0,
                total: 0,
                min: Infinity,
                max: -Infinity
            };
        }
        
        // Atualiza estatísticas
        const stats = this.metricas[medicao.operacao];
        stats.contagem++;
        stats.total += duracao;
        stats.min = Math.min(stats.min, duracao);
        stats.max = Math.max(stats.max, duracao);
        
        return duracao;
    }

    /**
     * Retorna estatísticas das operações monitoradas
     */
    obterEstatisticas() {
        const resultado = {};
        
        Object.entries(this.metricas).forEach(([operacao, stats]) => {
            resultado[operacao] = {
                contagem: stats.contagem,
                media: stats.total / stats.contagem,
                min: stats.min,
                max: stats.max
            };
        });
        
        return resultado;
    }
}

// Exporta instâncias únicas para uso em toda aplicação
export const logger = new Logger('LIMFS');
export const monitorPerformance = new MonitorPerformance();

// Funções para configuração global
export function configurarNivelLog(nivel) {
    if (LOG_LEVELS[nivel] !== undefined) {
        nivelAtual = LOG_LEVELS[nivel];
        logger.info(`Nível de log alterado para ${nivel}`);
        return true;
    }
    return false;
}

export function medicoesGlobais() {
    if (!window.performance || !window.performance.memory) {
        return {};
    }
    
    return {
        timeOrigin: window.performance.timeOrigin,
        memoria: {
            jsHeapSizeLimit: Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024)),
            totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024)),
            usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))
        }
    };
}