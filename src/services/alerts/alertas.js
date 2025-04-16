/**
 * Sistema de alertas para o Painel ODS Sergipe
 * 
 * Este módulo gerencia o registro de falhas, envio de alertas por e-mail
 * e geração de relatórios sobre o estado do sistema.
 */

// Funções principais
const alertasService = {
  registrarFalha,
  registrarSucesso,
  salvarRelatorioStatus
};

// Configurações
const MAX_FALHAS_CONSECUTIVAS = 3; // Número de falhas consecutivas para disparar um alerta

// Intervalo mínimo entre alertas (em horas)
const MIN_INTERVALO_ALERTAS = 24;

// Histórico de alertas (simplificado para evitar dependências de sistema de arquivos)
let historico = { 
  falhas: { total: 0, consecutivas: 0, porIndicador: {}, ultimaFalha: null }, 
  alertas: { total: 0, ultimoAlerta: null } 
};

/**
 * Registra uma falha no sistema
 * @param {string} indicador - Nome do indicador que falhou
 * @param {Error} erro - Objeto de erro com detalhes
 */
function registrarFalha(indicador, erro) {
    const agora = new Date().toISOString();
    
    // Incrementar contadores
    historico.falhas.total++;
    historico.falhas.consecutivas++;
    historico.falhas.ultimaFalha = agora;
    
    // Inicializar ou atualizar contador específico do indicador
    if (!historico.falhas.porIndicador[indicador]) {
        historico.falhas.porIndicador[indicador] = { total: 0, ultimaFalha: null };
    }
    historico.falhas.porIndicador[indicador].total++;
    historico.falhas.porIndicador[indicador].ultimaFalha = agora;
    
    // Salvar histórico atualizado
    salvarHistorico();
    
    // Verificar se deve enviar alerta
    if (historico.falhas.consecutivas >= MAX_FALHAS_CONSECUTIVAS) {
        // Verifica se já passou o intervalo mínimo desde o último alerta
        const podeEnviarAlerta = !historico.alertas.ultimoAlerta || 
            (new Date() - new Date(historico.alertas.ultimoAlerta)) / (1000 * 60 * 60) >= MIN_INTERVALO_ALERTAS;
        
        if (podeEnviarAlerta) {
            enviarAlerta(indicador, erro);
        }
    }
}

/**
 * Registra uma atualização bem-sucedida
 */
function registrarSucesso() {
    // Resetar contador de falhas consecutivas
    historico.falhas.consecutivas = 0;
    salvarHistorico();
}

/**
 * Salva o histórico de alertas
 * Versão simplificada para browser
 */
function salvarHistorico() {
    try {
        // Versão simplificada - armazena no localStorage do navegador
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('limfs_alertas_historico', JSON.stringify(historico));
        }
        // No ambiente Node.js, salvaríamos em arquivo
    } catch (erro) {
        console.error('Erro ao salvar histórico de alertas:', erro);
    }
}

/**
 * Envia um alerta
 * Versão simplificada para browser
 */
async function enviarAlerta(indicador, erro) {
    try {
        console.log('⚠️ ALERTA: Falha na atualização de dados:', indicador, erro.message);
        
        // Registra o envio do alerta no histórico
        historico.alertas.total++;
        historico.alertas.ultimoAlerta = new Date().toISOString();
        salvarHistorico();
    } catch (erro) {
        console.error('Erro ao enviar alerta:', erro);
    }
}

/**
 * Gera um relatório detalhado do status do sistema
 * Versão simplificada para browser
 */
function salvarRelatorioStatus() {
    try {
        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR');
        
        // Status geral do sistema baseado na quantidade de falhas consecutivas
        let statusGeral = 'normal';
        
        if (historico.falhas.consecutivas > 0 && historico.falhas.consecutivas < MAX_FALHAS_CONSECUTIVAS) {
            statusGeral = 'atencao';
        } else if (historico.falhas.consecutivas >= MAX_FALHAS_CONSECUTIVAS) {
            statusGeral = 'critico';
        }
        
        console.log(`Relatório de status: ${statusGeral} (${dataFormatada})`);
        console.log(`Total de falhas: ${historico.falhas.total}`);
        console.log(`Falhas consecutivas: ${historico.falhas.consecutivas}`);
        
        return {
            status: statusGeral,
            timestamp: agora.toISOString(),
            falhas: historico.falhas,
            alertas: historico.alertas
        };
    } catch (erro) {
        console.error('Erro ao gerar relatório de status:', erro);
        return null;
    }
}

// Exportação compatível com ESM
export default alertasService;
export { registrarFalha, registrarSucesso, salvarRelatorioStatus };