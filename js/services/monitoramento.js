/**
 * Serviço de monitoramento para o Painel ODS Sergipe
 * Gerencia logs e métricas de performance
 */

// Níveis de log em ordem crescente de severidade
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Configuração inicial (pode ser alterada em runtime)
let nivelAtual = LOG_LEVELS.INFO;

/**
 * Logger para registro de mensagens com diferentes níveis de severidade
 */
class Logger {
    constructor(prefix = '') {
        this.prefix = prefix ? `[${prefix}] ` : '';
    }

    getTimestamp() {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

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
     * Armazena logs no localStorage com limite de 500 entradas
     */
    armazenarLog(nivel, mensagem) {
        try {
            const chave = 'ods_sergipe_logs';
            const logs = JSON.parse(localStorage.getItem(chave) || '[]');
            
            if (logs.length > 500) {
                logs.shift();
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
     * Recupera histórico de logs do localStorage
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
     * Exporta logs em formato CSV para download
     */
    exportarLogs() {
        const logs = this.obterHistoricoLogs();
        if (logs.length === 0) {
            return 'Nenhum log encontrado.';
        }
        
        let conteudo = 'TIMESTAMP,NIVEL,MENSAGEM\n';
        logs.forEach(log => {
            const data = new Date(log.timestamp).toISOString();
            const mensagemEscapada = log.mensagem.replace(/"/g, '""');
            conteudo += `${data},"${log.nivel}","${mensagemEscapada}"\n`;
        });
        
        return conteudo;
    }
}

/**
 * Monitor de performance para métricas de tempo de execução
 */
class MonitorPerformance {
    constructor() {
        this.metricas = {};
    }

    /**
     * Inicia medição de uma operação
     * @returns {Object} Token de medição para posterior finalização
     */
    iniciarMedicao(operacao) {
        if (!window.performance || !window.performance.now) return null;
        
        return {
            operacao,
            inicio: window.performance.now()
        };
    }

    /**
     * Finaliza medição e registra estatísticas
     * @returns {number} Duração em milissegundos
     */
    finalizarMedicao(medicao) {
        if (!medicao || !window.performance || !window.performance.now) return;
        
        const duracao = window.performance.now() - medicao.inicio;
        
        if (!this.metricas[medicao.operacao]) {
            this.metricas[medicao.operacao] = {
                contagem: 0,
                total: 0,
                min: Infinity,
                max: -Infinity
            };
        }
        
        const stats = this.metricas[medicao.operacao];
        stats.contagem++;
        stats.total += duracao;
        stats.min = Math.min(stats.min, duracao);
        stats.max = Math.max(stats.max, duracao);
        
        return duracao;
    }

    /**
     * Retorna estatísticas agregadas das operações monitoradas
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

// Instâncias singleton para uso em toda aplicação
export const logger = new Logger('LIMFS');
export const monitorPerformance = new MonitorPerformance();

/**
 * Configura o nível de log global
 * @param {string} nivel - Nome do nível (DEBUG, INFO, WARN, ERROR)
 * @returns {boolean} Sucesso da configuração
 */
export function configurarNivelLog(nivel) {
    if (LOG_LEVELS[nivel] !== undefined) {
        nivelAtual = LOG_LEVELS[nivel];
        logger.info(`Nível de log alterado para ${nivel}`);
        return true;
    }
    return false;
}

/**
 * Retorna métricas do ambiente de execução (memória, etc)
 * Útil para diagnóstico de problemas de performance
 */
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