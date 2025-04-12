/**
 * Sistema de Monitoramento LIMFS
 * Responsável por monitorar a saúde do sistema, registrar erros e enviar alertas
 */

// Configuração do sistema de monitoramento
const CONFIG_MONITORAMENTO = {
    niveisSeveridade: {
        INFO: 0,
        WARN: 1,
        ERROR: 2,
        CRITICAL: 3
    },
    nivelMinimo: 0, // INFO
    maxLogsSalvos: 100,
    maxErrosSalvos: 50,
    chaveLocalStorage: 'limfs_monitoramento',
    chaveErrosAPI: 'limfs_erros_api',
    endpointRelatorioCentral: '/api/monitoramento/relatorio', // Em produção, apontaria para um endpoint real
    intervaloEnvioRelatorios: 3600000, // 1 hora
    maxTentativasEnvio: 3,
    toleranciaFalhas: {
        falhas_consecutivas_max: 5,
        periodo_pausa: 300000, // 5 minutos
        periodo_verificacao: 60000 // 1 minuto
    }
};

// Estado do sistema de monitoramento
const ESTADO_MONITORAMENTO = {
    logs: [],
    errosAPI: {}, // Rastreamento de erros por endpoint
    ultimoEnvioRelatorio: null,
    pausas: {},
    envioAgendado: null
};

/**
 * Logger para registrar eventos do sistema com níveis de severidade
 */
const logger = {
    /**
     * Registra uma mensagem informativa
     * @param {string} mensagem - Mensagem de log
     * @param {*} dados - Dados adicionais (opcional)
     */
    info: function(mensagem, dados = null) {
        this._log('INFO', mensagem, dados);
    },
    
    /**
     * Registra um alerta (situação suspeita, mas não criticamente errada)
     * @param {string} mensagem - Mensagem de alerta
     * @param {*} dados - Dados adicionais (opcional)
     */
    warn: function(mensagem, dados = null) {
        this._log('WARN', mensagem, dados);
    },
    
    /**
     * Registra um erro (falha não crítica que afeta uma operação específica)
     * @param {string} mensagem - Mensagem de erro
     * @param {*} dados - Dados adicionais (opcional)
     */
    error: function(mensagem, dados = null) {
        this._log('ERROR', mensagem, dados);
    },
    
    /**
     * Registra um erro crítico (falha que afeta o funcionamento global do sistema)
     * @param {string} mensagem - Mensagem de erro crítico
     * @param {*} dados - Dados adicionais (opcional)
     */
    critical: function(mensagem, dados = null) {
        this._log('CRITICAL', mensagem, dados);
    },
    
    /**
     * Registra erro específico de API
     * @param {string} endpoint - Endpoint da API
     * @param {string} url - URL completa da requisição
     * @param {*} erro - Objeto de erro ou mensagem
     */
    apiError: function(endpoint, url, erro) {
        // Registra no log geral
        this.error(`Falha na API ${endpoint}: ${erro.message || erro}`, { endpoint, url });
        
        // Registra erro específico no rastreamento de APIs
        registrarErroAPI(endpoint, url, erro);
    },
    
    /**
     * Método interno de log
     * @private
     */
    _log: function(nivel, mensagem, dados) {
        // Verifica se o nível está acima do mínimo configurado
        if (CONFIG_MONITORAMENTO.niveisSeveridade[nivel] < CONFIG_MONITORAMENTO.nivelMinimo) {
            return;
        }
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            nivel: nivel,
            mensagem: mensagem,
            dados: dados
        };
        
        // Log no console com formatação apropriada
        const estilos = {
            INFO: 'color: #4A90E2',
            WARN: 'color: #F5A623; font-weight: bold',
            ERROR: 'color: #D0021B; font-weight: bold',
            CRITICAL: 'color: #FFFFFF; background: #D0021B; font-weight: bold; padding: 2px 5px'
        };
        
        console.log(`%c[${nivel}] ${new Date().toLocaleTimeString()}`, estilos[nivel], mensagem);
        
        if (dados) {
            console.log('  → Dados:', dados);
        }
        
        // Adiciona ao array de logs
        ESTADO_MONITORAMENTO.logs.unshift(logEntry);
        
        // Limita o tamanho do array de logs
        if (ESTADO_MONITORAMENTO.logs.length > CONFIG_MONITORAMENTO.maxLogsSalvos) {
            ESTADO_MONITORAMENTO.logs.pop();
        }
        
        // Salva logs no localStorage periodicamente (erros e críticos apenas)
        if (nivel === 'ERROR' || nivel === 'CRITICAL') {
            salvarLogsLocalmente();
        }
        
        // Se for crítico, agenda um envio imediato de relatório
        if (nivel === 'CRITICAL') {
            agendarEnvioRelatorio(true);
        }
    }
};

/**
 * Salva logs no localStorage
 */
function salvarLogsLocalmente() {
    try {
        // Filtra apenas logs importantes (WARNING, ERROR, CRITICAL)
        const logsImportantes = ESTADO_MONITORAMENTO.logs.filter(
            log => CONFIG_MONITORAMENTO.niveisSeveridade[log.nivel] >= CONFIG_MONITORAMENTO.niveisSeveridade.WARN
        );
        
        // Limita ao número máximo
        const logsParaSalvar = logsImportantes.slice(0, CONFIG_MONITORAMENTO.maxLogsSalvos);
        
        localStorage.setItem(
            CONFIG_MONITORAMENTO.chaveLocalStorage,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                logs: logsParaSalvar
            })
        );
    } catch (erro) {
        console.error('Erro ao salvar logs localmente:', erro);
    }
}

/**
 * Registra um erro de API e mantém estatísticas
 */
function registrarErroAPI(endpoint, url, erro) {
    try {
        // Inicializa objeto de rastreamento se não existir
        if (!ESTADO_MONITORAMENTO.errosAPI[endpoint]) {
            ESTADO_MONITORAMENTO.errosAPI[endpoint] = {
                falhas_consecutivas: 0,
                falhas_total: 0,
                ultimo_erro: null,
                erros_detalhados: [],
                em_pausa: false,
                pausa_ate: null
            };
        }
        
        const rastreamento = ESTADO_MONITORAMENTO.errosAPI[endpoint];
        
        // Incrementa contadores
        rastreamento.falhas_consecutivas++;
        rastreamento.falhas_total++;
        rastreamento.ultimo_erro = new Date().toISOString();
        
        // Adiciona erro detalhado
        const erroDetalhado = {
            timestamp: new Date().toISOString(),
            url: url,
            mensagem: erro.message || erro.toString(),
            codigo: erro.status || erro.code || 'unknown'
        };
        
        rastreamento.erros_detalhados.unshift(erroDetalhado);
        
        // Limita o número de erros armazenados
        if (rastreamento.erros_detalhados.length > CONFIG_MONITORAMENTO.maxErrosSalvos) {
            rastreamento.erros_detalhados.pop();
        }
        
        // Salva no localStorage
        salvarErrosAPILocalmente();
        
        // Verifica se precisa implementar pausa (circuit breaker)
        if (rastreamento.falhas_consecutivas >= CONFIG_MONITORAMENTO.toleranciaFalhas.falhas_consecutivas_max) {
            implementarPausaEndpoint(endpoint);
        }
        
        // Se estiver acima do limite, agenda um envio de relatório
        if (rastreamento.falhas_consecutivas >= 3) {
            agendarEnvioRelatorio(true);
        }
    } catch (erro) {
        console.error('Erro ao registrar erro de API:', erro);
    }
}

/**
 * Salva erros de API no localStorage
 */
function salvarErrosAPILocalmente() {
    try {
        localStorage.setItem(
            CONFIG_MONITORAMENTO.chaveErrosAPI,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                erros: ESTADO_MONITORAMENTO.errosAPI
            })
        );
    } catch (erro) {
        console.error('Erro ao salvar erros de API localmente:', erro);
    }
}

/**
 * Implementa uma pausa de requisições para um endpoint com falhas (Circuit Breaker)
 * @param {string} endpoint - Nome do endpoint
 */
function implementarPausaEndpoint(endpoint) {
    const rastreamento = ESTADO_MONITORAMENTO.errosAPI[endpoint];
    
    if (!rastreamento || rastreamento.em_pausa) {
        return;
    }
    
    // Define pausa
    const agora = new Date().getTime();
    const pausaAte = agora + CONFIG_MONITORAMENTO.toleranciaFalhas.periodo_pausa;
    
    rastreamento.em_pausa = true;
    rastreamento.pausa_ate = new Date(pausaAte).toISOString();
    
    logger.warn(`Circuit breaker ativado para ${endpoint} após ${rastreamento.falhas_consecutivas} falhas consecutivas. Pausado por ${CONFIG_MONITORAMENTO.toleranciaFalhas.periodo_pausa/60000} minutos.`);
    
    // Agenda verificação para reativar após o período
    ESTADO_MONITORAMENTO.pausas[endpoint] = setTimeout(() => {
        reativarEndpoint(endpoint);
    }, CONFIG_MONITORAMENTO.toleranciaFalhas.periodo_pausa);
    
    // Dispara notificação na interface
    dispararNotificacao({
        tipo: 'circuitBreaker',
        titulo: `Pausa automática em requisições para ${endpoint}`,
        mensagem: `O sistema pausou temporariamente as requisições para este endpoint após múltiplas falhas consecutivas. Tentaremos novamente em ${CONFIG_MONITORAMENTO.toleranciaFalhas.periodo_pausa/60000} minutos.`,
        severidade: 'warning'
    });
    
    // Registra evento no Analytics
    if (window.gtag) {
        window.gtag('event', 'circuit_breaker_ativado', {
            event_category: 'monitoramento',
            event_label: endpoint,
            value: rastreamento.falhas_consecutivas
        });
    }
}

/**
 * Reativa um endpoint após período de pausa
 * @param {string} endpoint - Nome do endpoint
 */
function reativarEndpoint(endpoint) {
    const rastreamento = ESTADO_MONITORAMENTO.errosAPI[endpoint];
    
    if (!rastreamento || !rastreamento.em_pausa) {
        return;
    }
    
    // Limpa timeout se existir
    if (ESTADO_MONITORAMENTO.pausas[endpoint]) {
        clearTimeout(ESTADO_MONITORAMENTO.pausas[endpoint]);
        delete ESTADO_MONITORAMENTO.pausas[endpoint];
    }
    
    // Reativa o endpoint
    rastreamento.em_pausa = false;
    rastreamento.pausa_ate = null;
    rastreamento.falhas_consecutivas = 0; // Reinicia contador
    
    logger.info(`Circuit breaker desativado, endpoint ${endpoint} reativado.`);
    
    // Log no Analytics
    if (window.gtag) {
        window.gtag('event', 'circuit_breaker_desativado', {
            event_category: 'monitoramento',
            event_label: endpoint
        });
    }
}

/**
 * Verifica se um endpoint está em pausa
 * @param {string} endpoint - Nome do endpoint
 * @returns {boolean} - True se estiver em pausa
 */
function endpointEmPausa(endpoint) {
    const rastreamento = ESTADO_MONITORAMENTO.errosAPI[endpoint];
    
    if (!rastreamento || !rastreamento.em_pausa) {
        return false;
    }
    
    // Verifica se o período de pausa já expirou
    const agora = new Date().getTime();
    const pausaAte = new Date(rastreamento.pausa_ate).getTime();
    
    if (agora > pausaAte) {
        // O tempo já expirou, mas o timeout ainda não foi executado
        // Reativa manualmente
        reativarEndpoint(endpoint);
        return false;
    }
    
    return true;
}

/**
 * Registra um sucesso em um endpoint
 * @param {string} endpoint - Nome do endpoint
 */
function registrarSucessoAPI(endpoint) {
    if (!ESTADO_MONITORAMENTO.errosAPI[endpoint]) {
        return; // Não há histórico para este endpoint
    }
    
    const rastreamento = ESTADO_MONITORAMENTO.errosAPI[endpoint];
    
    // Reinicia contador de falhas consecutivas
    rastreamento.falhas_consecutivas = 0;
    
    // Se estiver em pausa, mantém a pausa
}

/**
 * Agenda envio de relatório para o servidor central
 * @param {boolean} imediato - Se true, envia imediatamente, caso contrário agenda
 */
function agendarEnvioRelatorio(imediato = false) {
    // Cancela agendamento existente
    if (ESTADO_MONITORAMENTO.envioAgendado) {
        clearTimeout(ESTADO_MONITORAMENTO.envioAgendado);
        ESTADO_MONITORAMENTO.envioAgendado = null;
    }
    
    // Define função de envio
    const enviar = () => {
        enviarRelatorioParaServidor()
            .then(() => {
                // Agenda próximo envio após intervalo configurado
                ESTADO_MONITORAMENTO.envioAgendado = setTimeout(() => {
                    agendarEnvioRelatorio();
                }, CONFIG_MONITORAMENTO.intervaloEnvioRelatorios);
            })
            .catch(erro => {
                logger.error(`Falha ao enviar relatório para o servidor: ${erro.message}`);
                
                // Reagenda tentativa em 15 minutos
                ESTADO_MONITORAMENTO.envioAgendado = setTimeout(() => {
                    agendarEnvioRelatorio();
                }, 15 * 60 * 1000);
            });
    };
    
    if (imediato) {
        enviar();
    } else {
        // Verifica se já enviou recentemente
        const agora = new Date().getTime();
        const ultimoEnvio = ESTADO_MONITORAMENTO.ultimoEnvioRelatorio 
            ? new Date(ESTADO_MONITORAMENTO.ultimoEnvioRelatorio).getTime() 
            : 0;
        
        const intervaloDesdeUltimoEnvio = agora - ultimoEnvio;
        
        if (intervaloDesdeUltimoEnvio >= CONFIG_MONITORAMENTO.intervaloEnvioRelatorios) {
            enviar();
        } else {
            // Agenda para o intervalo correto
            const tempoRestante = CONFIG_MONITORAMENTO.intervaloEnvioRelatorios - intervaloDesdeUltimoEnvio;
            ESTADO_MONITORAMENTO.envioAgendado = setTimeout(enviar, tempoRestante);
        }
    }
}

/**
 * Envia relatório para o servidor central de monitoramento
 * @returns {Promise<void>}
 */
async function enviarRelatorioParaServidor() {
    try {
        // Em um ambiente real, isso enviaria para um endpoint do backend
        // Aqui apenas simulamos o comportamento
        
        // Prepara relatório completo
        const relatorio = {
            timestamp: new Date().toISOString(),
            pagina: window.location.pathname,
            navegador: navigator.userAgent,
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            performance: {
                // Métricas de performance se disponíveis
                timing: window.performance?.timing ? {
                    pageLoadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
                    domReady: window.performance.timing.domComplete - window.performance.timing.domLoading
                } : null
            },
            logs: ESTADO_MONITORAMENTO.logs.filter(
                log => CONFIG_MONITORAMENTO.niveisSeveridade[log.nivel] >= CONFIG_MONITORAMENTO.niveisSeveridade.WARN
            ).slice(0, 50), // Apenas os 50 logs mais recentes de severidade WARN ou acima
            errosAPI: ESTADO_MONITORAMENTO.errosAPI
        };
        
        logger.info(`Enviando relatório de monitoramento para o servidor central`, {
            tamanhoLogs: relatorio.logs.length,
            tamanhoErrosAPI: Object.keys(relatorio.errosAPI).length
        });
        
        // Em produção, faria um fetch real para o backend
        /* 
        const resposta = await fetch(CONFIG_MONITORAMENTO.endpointRelatorioCentral, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(relatorio)
        });
        
        if (!resposta.ok) {
            throw new Error(`HTTP error! status: ${resposta.status}`);
        }
        */
        
        // Armazena timestamp do último envio
        ESTADO_MONITORAMENTO.ultimoEnvioRelatorio = new Date().toISOString();
        
        logger.info('Relatório enviado com sucesso para o servidor central');
        
        return Promise.resolve();
    } catch (erro) {
        logger.error(`Falha ao enviar relatório: ${erro.message}`);
        return Promise.reject(erro);
    }
}

/**
 * Disparar notificação visual na interface
 * @param {Object} config - Configuração da notificação
 */
function dispararNotificacao(config) {
    const { tipo, titulo, mensagem, severidade = 'info', duracao = 8000 } = config;
    
    try {
        // Cria elemento de notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-monitoramento notificacao-${severidade}`;
        notificacao.setAttribute('role', 'alert');
        notificacao.setAttribute('aria-live', 'assertive');
        
        const icones = {
            info: '<i class="fas fa-info-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            warning: '<i class="fas fa-exclamation-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            circuitBreaker: '<i class="fas fa-shield-alt"></i>'
        };
        
        notificacao.innerHTML = `
            <div class="notificacao-cabecalho">
                ${icones[tipo] || icones[severidade]}
                <span class="notificacao-titulo">${titulo}</span>
                <button class="notificacao-fechar" aria-label="Fechar notificação">×</button>
            </div>
            <div class="notificacao-conteudo">
                ${mensagem}
            </div>
            <div class="notificacao-progresso"></div>
        `;
        
        // Adiciona ao DOM
        const container = document.querySelector('.notificacoes-container') || criarContainerNotificacoes();
        container.appendChild(notificacao);
        
        // Adiciona lógica de fechamento
        const botaoFechar = notificacao.querySelector('.notificacao-fechar');
        botaoFechar.addEventListener('click', () => {
            notificacao.classList.add('fechando');
            setTimeout(() => {
                if (container.contains(notificacao)) {
                    container.removeChild(notificacao);
                }
                if (container.children.length === 0) {
                    document.body.removeChild(container);
                }
            }, 300);
        });
        
        // Inicia animação da barra de progresso
        const barraProgresso = notificacao.querySelector('.notificacao-progresso');
        barraProgresso.style.transition = `width ${duracao}ms linear`;
        
        // Força reflow para iniciar a animação
        void barraProgresso.offsetWidth;
        barraProgresso.style.width = '0';
        
        // Remove após duração configurada
        setTimeout(() => {
            notificacao.classList.add('fechando');
            setTimeout(() => {
                if (container.contains(notificacao)) {
                    container.removeChild(notificacao);
                }
                if (container.children.length === 0 && document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            }, 300);
        }, duracao);
        
        // Registra no Analytics
        if (window.gtag) {
            window.gtag('event', 'notificacao', {
                event_category: 'monitoramento',
                event_label: tipo,
                non_interaction: true
            });
        }
    } catch (erro) {
        console.error('Erro ao criar notificação:', erro);
    }
}

/**
 * Cria container para notificações
 * @returns {HTMLElement}
 */
function criarContainerNotificacoes() {
    const container = document.createElement('div');
    container.className = 'notificacoes-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Inicializa sistema de monitoramento
 */
function inicializarMonitoramento() {
    logger.info('Inicializando sistema de monitoramento LIMFS');
    
    // Carrega dados salvos no localStorage (se houver)
    carregarEstadoSalvo();
    
    // Agenda envio periódico de relatórios
    agendarEnvioRelatorio();
    
    // Monitora erros não capturados
    window.addEventListener('error', evento => {
        logger.critical('Erro não capturado:', {
            mensagem: evento.message,
            origem: evento.filename,
            linha: evento.lineno,
            coluna: evento.colno,
            erro: evento.error?.stack || 'Stack indisponível'
        });
        
        // Não previne o comportamento padrão
        return false;
    });
    
    // Monitora rejeições de promessas não tratadas
    window.addEventListener('unhandledrejection', evento => {
        logger.critical('Promessa rejeitada não tratada:', {
            motivo: evento.reason?.message || evento.reason || 'Motivo desconhecido',
            stack: evento.reason?.stack || 'Stack indisponível'
        });
        
        // Não previne o comportamento padrão
        return false;
    });
    
    // Monitora alterações de conexão
    if (navigator.connection) {
        navigator.connection.addEventListener('change', () => {
            logger.info('Mudança na conexão de rede detectada', {
                online: navigator.onLine,
                tipo: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            });
        });
    }
    
    // Monitora alterações de status online/offline
    window.addEventListener('online', () => {
        logger.info('Conexão com a internet restaurada');
        // Tenta reenviar relatórios pendentes
        agendarEnvioRelatorio(true);
        
        // Notifica o usuário
        dispararNotificacao({
            tipo: 'success',
            titulo: 'Conexão restaurada',
            mensagem: 'A conexão com a internet foi restabelecida. Os dados serão atualizados automaticamente.',
            severidade: 'success',
            duracao: 5000
        });
    });
    
    window.addEventListener('offline', () => {
        logger.warn('Conexão com a internet perdida');
        
        // Notifica o usuário
        dispararNotificacao({
            tipo: 'warning',
            titulo: 'Sem conexão',
            mensagem: 'A conexão com a internet foi perdida. O sistema usará dados em cache.',
            severidade: 'warning',
            duracao: 0 // Não desaparece automaticamente
        });
    });
    
    logger.info('Sistema de monitoramento inicializado com sucesso');
}

/**
 * Carrega estado salvo do localStorage
 */
function carregarEstadoSalvo() {
    try {
        // Carrega logs
        const logsSalvos = localStorage.getItem(CONFIG_MONITORAMENTO.chaveLocalStorage);
        if (logsSalvos) {
            const dadosLogs = JSON.parse(logsSalvos);
            // Mescla apenas se forem do mesmo dia
            if (new Date(dadosLogs.timestamp).toDateString() === new Date().toDateString()) {
                logger.info('Carregando logs salvos do localStorage');
                // Mescla com logs atuais
                ESTADO_MONITORAMENTO.logs = [...dadosLogs.logs, ...ESTADO_MONITORAMENTO.logs]
                    .filter((log, index, self) => 
                        index === self.findIndex((t) => t.timestamp === log.timestamp)
                    )
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, CONFIG_MONITORAMENTO.maxLogsSalvos);
            }
        }
        
        // Carrega erros de API
        const errosAPISalvos = localStorage.getItem(CONFIG_MONITORAMENTO.chaveErrosAPI);
        if (errosAPISalvos) {
            const dadosErros = JSON.parse(errosAPISalvos);
            // Carrega apenas se forem recentes (últimas 24h)
            const agora = new Date().getTime();
            const timestampErros = new Date(dadosErros.timestamp).getTime();
            if (agora - timestampErros < 86400000) { // 24 horas
                logger.info('Carregando registro de erros de API do localStorage');
                ESTADO_MONITORAMENTO.errosAPI = dadosErros.erros || {};
                
                // Reconfigura circuit breakers se necessário
                Object.keys(ESTADO_MONITORAMENTO.errosAPI).forEach(endpoint => {
                    const rastreamento = ESTADO_MONITORAMENTO.errosAPI[endpoint];
                    if (rastreamento.em_pausa && rastreamento.pausa_ate) {
                        const pausaAte = new Date(rastreamento.pausa_ate).getTime();
                        const agora = new Date().getTime();
                        
                        if (pausaAte > agora) {
                            // Ainda deve estar em pausa
                            const tempoRestante = pausaAte - agora;
                            logger.info(`Restaurando circuit breaker para ${endpoint} por mais ${Math.round(tempoRestante/1000)}s`);
                            
                            // Recria o timeout
                            ESTADO_MONITORAMENTO.pausas[endpoint] = setTimeout(() => {
                                reativarEndpoint(endpoint);
                            }, tempoRestante);
                        } else {
                            // A pausa já expirou
                            rastreamento.em_pausa = false;
                            rastreamento.pausa_ate = null;
                        }
                    }
                });
            }
        }
    } catch (erro) {
        console.error('Erro ao carregar estado salvo do monitoramento:', erro);
    }
}

// Interface pública do sistema de monitoramento
export {
    logger,
    endpointEmPausa,
    registrarSucessoAPI,
    dispararNotificacao,
    inicializarMonitoramento
};