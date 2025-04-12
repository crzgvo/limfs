/**
 * Módulo de alertas e monitoramento para o Painel ODS Sergipe
 * 
 * Este módulo gerencia notificações por e-mail para alertar sobre 
 * falhas nas atualizações de dados e problemas com as APIs.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de histórico de falhas
const ARQUIVO_HISTORICO = path.join(__dirname, '..', 'dados', 'historico-alertas.json');
// Número máximo de falhas consecutivas antes de enviar alerta
const MAX_FALHAS_CONSECUTIVAS = 3;
// Intervalo mínimo entre alertas (em horas)
const INTERVALO_MINIMO_ALERTAS = 24; 

/**
 * Configura o transporter do Nodemailer
 * Nota: As credenciais devem ser configuradas em variáveis de ambiente
 */
function criarTransporter() {
    // Primeiro verifica se as variáveis de ambiente estão configuradas
    // Se não, usa configurações padrão para desenvolvimento
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const porta = process.env.EMAIL_PORT || 587;
    const usuario = process.env.EMAIL_USER || 'exemplo@gmail.com';
    const senha = process.env.EMAIL_PASSWORD || 'sua_senha_app';
    
    return nodemailer.createTransport({
        host: host,
        port: porta,
        secure: porta === 465,
        auth: {
            user: usuario,
            pass: senha,
        },
    });
}

/**
 * Carrega o histórico de falhas e alertas
 */
function carregarHistorico() {
    try {
        if (fs.existsSync(ARQUIVO_HISTORICO)) {
            const dados = fs.readFileSync(ARQUIVO_HISTORICO, 'utf8');
            return JSON.parse(dados);
        }
    } catch (erro) {
        console.error(`Erro ao carregar histórico de alertas: ${erro.message}`);
    }
    
    // Se o arquivo não existe ou há um erro, cria um histórico novo
    return {
        falhas: {
            total: 0,
            consecutivas: 0,
            porIndicador: {},
            ultimaFalha: null
        },
        alertas: {
            total: 0,
            ultimoAlerta: null
        }
    };
}

/**
 * Salva o histórico de falhas e alertas
 * @param {Object} historico - O objeto de histórico a ser salvo
 */
function salvarHistorico(historico) {
    try {
        const diretorio = path.dirname(ARQUIVO_HISTORICO);
        if (!fs.existsSync(diretorio)) {
            fs.mkdirSync(diretorio, { recursive: true });
        }
        
        fs.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(historico, null, 2));
    } catch (erro) {
        console.error(`Erro ao salvar histórico de alertas: ${erro.message}`);
    }
}

/**
 * Registra uma falha na atualização de dados
 * @param {string} indicador - Nome do indicador que falhou
 * @param {Error} erro - Objeto de erro capturado
 */
function registrarFalha(indicador, erro) {
    const historico = carregarHistorico();
    const agora = new Date();
    
    // Incrementa contadores
    historico.falhas.total++;
    historico.falhas.consecutivas++;
    historico.falhas.ultimaFalha = agora.toISOString();
    
    // Registra falha por indicador
    if (!historico.falhas.porIndicador[indicador]) {
        historico.falhas.porIndicador[indicador] = {
            total: 0,
            ultimaFalha: null,
            erros: []
        };
    }
    
    historico.falhas.porIndicador[indicador].total++;
    historico.falhas.porIndicador[indicador].ultimaFalha = agora.toISOString();
    
    // Guarda os últimos 10 erros para este indicador
    const erroInfo = {
        data: agora.toISOString(),
        mensagem: erro.message,
        stack: erro.stack
    };
    
    historico.falhas.porIndicador[indicador].erros.push(erroInfo);
    // Mantém apenas os 10 erros mais recentes
    if (historico.falhas.porIndicador[indicador].erros.length > 10) {
        historico.falhas.porIndicador[indicador].erros.shift();
    }
    
    // Verifica se deve enviar alerta
    const deveEnviarAlerta = verificarNecessidadeAlerta(historico);
    
    // Salva o histórico atualizado
    salvarHistorico(historico);
    
    // Envia alerta se necessário
    if (deveEnviarAlerta) {
        enviarAlertaEmail(historico);
    }
    
    return historico;
}

/**
 * Registra uma atualização bem-sucedida
 */
function registrarSucesso() {
    const historico = carregarHistorico();
    
    // Reseta contador de falhas consecutivas
    historico.falhas.consecutivas = 0;
    
    // Salva o histórico atualizado
    salvarHistorico(historico);
    
    return historico;
}

/**
 * Verifica se é necessário enviar um alerta
 * @param {Object} historico - O histórico de falhas e alertas
 * @returns {boolean} - Se deve ou não enviar um alerta
 */
function verificarNecessidadeAlerta(historico) {
    // Verifica se há falhas consecutivas suficientes
    if (historico.falhas.consecutivas < MAX_FALHAS_CONSECUTIVAS) {
        return false;
    }
    
    // Verifica se já foi enviado um alerta recentemente
    if (historico.alertas.ultimoAlerta) {
        const ultimoAlerta = new Date(historico.alertas.ultimoAlerta);
        const agora = new Date();
        const horasDesdeUltimoAlerta = (agora - ultimoAlerta) / (1000 * 60 * 60);
        
        // Se o último alerta foi enviado há menos tempo que o intervalo mínimo
        if (horasDesdeUltimoAlerta < INTERVALO_MINIMO_ALERTAS) {
            return false;
        }
    }
    
    return true;
}

/**
 * Envia um alerta por e-mail
 * @param {Object} historico - O histórico de falhas e alertas
 */
async function enviarAlertaEmail(historico) {
    try {
        const transporter = criarTransporter();
        const destinatarios = process.env.EMAIL_ALERT_TO || 'admin@limfs.org';
        
        // Prepara a mensagem de e-mail
        const assunto = `🚨 ALERTA: Falhas na atualização do Painel ODS Sergipe`;
        const conteudo = `
            <h2>🚨 ALERTA: Falhas na atualização do Painel ODS</h2>
            
            <p>O sistema de atualização automática do Painel ODS Sergipe registrou <strong>${historico.falhas.consecutivas} falhas consecutivas</strong>.</p>
            
            <h3>Resumo das falhas:</h3>
            <ul>
                <li><strong>Total de falhas registradas:</strong> ${historico.falhas.total}</li>
                <li><strong>Falhas consecutivas:</strong> ${historico.falhas.consecutivas}</li>
                <li><strong>Última falha registrada:</strong> ${new Date(historico.falhas.ultimaFalha).toLocaleString('pt-BR')}</li>
            </ul>
            
            <h3>Falhas por indicador:</h3>
            <table style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Indicador</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total de falhas</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Última falha</th>
                </tr>
                ${Object.entries(historico.falhas.porIndicador).map(([indicador, info]) => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${indicador}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${info.total}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(info.ultimaFalha).toLocaleString('pt-BR')}</td>
                    </tr>
                `).join('')}
            </table>
            
            <h3>Últimas mensagens de erro:</h3>
            ${Object.entries(historico.falhas.porIndicador).map(([indicador, info]) => `
                <details style="margin-bottom: 10px;">
                    <summary style="cursor: pointer; padding: 5px; background-color: #f8f8f8;">
                        <strong>${indicador}</strong> (${info.erros.length} erros recentes)
                    </summary>
                    <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #eee; margin-top: 5px;">
                        ${info.erros.map((erro, index) => `
                            <div style="margin-bottom: 8px; ${index < info.erros.length - 1 ? 'border-bottom: 1px dashed #ddd;' : ''} padding-bottom: 8px;">
                                <strong>Data:</strong> ${new Date(erro.data).toLocaleString('pt-BR')}<br>
                                <strong>Mensagem:</strong> ${erro.mensagem}
                            </div>
                        `).join('')}
                    </div>
                </details>
            `).join('')}
            
            <p>Por favor, verifique o funcionamento das APIs e a conexão do servidor.</p>
            
            <hr>
            <p style="color: #666; font-size: 12px;">
                Este é um e-mail automático enviado pelo sistema de monitoramento do Painel ODS Sergipe.<br>
                Não responda a este e-mail.
            </p>
        `;
        
        // Envia o e-mail
        const info = await transporter.sendMail({
            from: `"Sistema Painel ODS" <${process.env.EMAIL_USER || 'sistema@limfs.org'}>`,
            to: destinatarios,
            subject: assunto,
            html: conteudo
        });
        
        console.log(`✉️ Alerta enviado: ${info.messageId}`);
        
        // Atualiza o histórico de alertas
        historico.alertas.total++;
        historico.alertas.ultimoAlerta = new Date().toISOString();
        salvarHistorico(historico);
        
        return true;
    } catch (erro) {
        console.error(`Erro ao enviar alerta por e-mail: ${erro.message}`);
        return false;
    }
}

/**
 * Gera um relatório de status em HTML para monitoramento
 * @returns {string} - HTML do relatório
 */
function gerarRelatorioHTML() {
    const historico = carregarHistorico();
    const agora = new Date();
    
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Status do Sistema - Painel ODS Sergipe</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
                h1 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
                h2 { color: #0056b3; margin-top: 30px; }
                .card { background-color: #f9f9f9; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 15px; margin-bottom: 20px; }
                .status-ok { color: #28a745; }
                .status-warning { color: #ffc107; }
                .status-error { color: #dc3545; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f5f5f5; }
                .timestamp { color: #777; font-size: 13px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <h1>Status do Sistema - Painel ODS Sergipe</h1>
            
            <div class="card">
                <h2>Resumo</h2>
                <p>
                    <strong>Status do sistema:</strong> 
                    ${historico.falhas.consecutivas > 0 
                        ? historico.falhas.consecutivas >= MAX_FALHAS_CONSECUTIVAS 
                            ? '<span class="status-error">⚠️ CRÍTICO - Múltiplas falhas consecutivas</span>' 
                            : '<span class="status-warning">⚠️ ATENÇÃO - Falhas recentes detectadas</span>'
                        : '<span class="status-ok">✅ NORMAL - Sistema operando normalmente</span>'}
                </p>
                <p><strong>Total de falhas registradas:</strong> ${historico.falhas.total}</p>
                <p><strong>Falhas consecutivas atuais:</strong> ${historico.falhas.consecutivas}</p>
                <p><strong>Total de alertas enviados:</strong> ${historico.alertas.total}</p>
                ${historico.falhas.ultimaFalha 
                    ? `<p><strong>Última falha registrada:</strong> ${new Date(historico.falhas.ultimaFalha).toLocaleString('pt-BR')}</p>` 
                    : ''}
                ${historico.alertas.ultimoAlerta 
                    ? `<p><strong>Último alerta enviado:</strong> ${new Date(historico.alertas.ultimoAlerta).toLocaleString('pt-BR')}</p>` 
                    : ''}
            </div>
            
            <h2>Detalhes por Indicador</h2>
            
            <table>
                <tr>
                    <th>Indicador</th>
                    <th>Total de falhas</th>
                    <th>Última falha</th>
                    <th>Status</th>
                </tr>
                ${Object.entries(historico.falhas.porIndicador).map(([indicador, info]) => {
                    // Calcula se a falha é recente (nas últimas 24h)
                    const ultimaFalha = new Date(info.ultimaFalha);
                    const horasDesdeUltimaFalha = (agora - ultimaFalha) / (1000 * 60 * 60);
                    const falhaRecente = horasDesdeUltimaFalha < 24;
                    
                    let statusClass = 'status-ok';
                    let statusText = 'Normal';
                    
                    if (falhaRecente) {
                        statusClass = 'status-warning';
                        statusText = 'Atenção';
                    }
                    
                    if (info.erros.length >= 3 && falhaRecente) {
                        statusClass = 'status-error';
                        statusText = 'Crítico';
                    }
                    
                    return `
                        <tr>
                            <td>${indicador}</td>
                            <td>${info.total}</td>
                            <td>${new Date(info.ultimaFalha).toLocaleString('pt-BR')}</td>
                            <td class="${statusClass}">${statusText}</td>
                        </tr>
                    `;
                }).join('')}
            </table>
            
            <h2>Últimas Mensagens de Erro</h2>
            
            ${Object.entries(historico.falhas.porIndicador).map(([indicador, info]) => {
                if (info.erros.length === 0) return '';
                
                return `
                    <div class="card">
                        <h3>${indicador}</h3>
                        <table>
                            <tr>
                                <th>Data</th>
                                <th>Mensagem</th>
                            </tr>
                            ${info.erros.slice().reverse().map(erro => `
                                <tr>
                                    <td>${new Date(erro.data).toLocaleString('pt-BR')}</td>
                                    <td>${erro.mensagem}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `;
            }).join('')}
            
            <p class="timestamp">Relatório gerado em: ${agora.toLocaleString('pt-BR')}</p>
        </body>
        </html>
    `;
}

/**
 * Gera e salva um relatório de status para monitoramento
 * @returns {string} - Caminho do arquivo salvo
 */
function salvarRelatorioStatus() {
    try {
        const htmlRelatorio = gerarRelatorioHTML();
        const caminhoRelatorio = path.join(__dirname, '..', 'dados', 'status-sistema.html');
        
        fs.writeFileSync(caminhoRelatorio, htmlRelatorio);
        console.log(`Relatório de status salvo em: ${caminhoRelatorio}`);
        
        return caminhoRelatorio;
    } catch (erro) {
        console.error(`Erro ao salvar relatório de status: ${erro.message}`);
        return null;
    }
}

module.exports = {
    registrarFalha,
    registrarSucesso,
    enviarAlertaEmail,
    salvarRelatorioStatus,
    gerarRelatorioHTML
};