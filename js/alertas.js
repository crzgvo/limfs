/**
 * Sistema de alertas para o Painel ODS Sergipe
 * 
 * Este módulo gerencia o registro de falhas, envio de alertas por e-mail
 * e geração de relatórios sobre o estado do sistema.
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Configurações
const HISTORICO_ALERTAS = path.join(__dirname, '..', 'dados', 'historico-alertas.json');
const RELATORIO_STATUS = path.join(__dirname, '..', 'dados', 'status-sistema.html');
const MAX_FALHAS_CONSECUTIVAS = 3; // Número de falhas consecutivas para disparar um alerta

// Intervalo mínimo entre alertas (em horas)
const MIN_INTERVALO_ALERTAS = 24;

// Carrega ou cria o histórico de alertas
let historico = { falhas: { total: 0, consecutivas: 0, porIndicador: {}, ultimaFalha: null }, alertas: { total: 0, ultimoAlerta: null } };

try {
    if (fs.existsSync(HISTORICO_ALERTAS)) {
        historico = JSON.parse(fs.readFileSync(HISTORICO_ALERTAS, 'utf8'));
    }
} catch (erro) {
    console.error('Erro ao carregar histórico de alertas:', erro);
}

/**
 * Configurar o transportador de e-mail usando as variáveis de ambiente
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

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
 * Salva o histórico de alertas em um arquivo JSON
 */
function salvarHistorico() {
    try {
        fs.writeFileSync(HISTORICO_ALERTAS, JSON.stringify(historico, null, 2));
    } catch (erro) {
        console.error('Erro ao salvar histórico de alertas:', erro);
    }
}

/**
 * Envia um alerta por e-mail
 * @param {string} indicador - Nome do indicador que falhou
 * @param {Error} erro - Objeto de erro com detalhes
 */
async function enviarAlerta(indicador, erro) {
    try {
        const destinatarios = process.env.EMAIL_ALERT_TO || '';
        if (!destinatarios) {
            console.log('⚠️ Nenhum destinatário configurado para alertas. Configure EMAIL_ALERT_TO no .env');
            return;
        }
        
        const dataFormatada = new Date().toLocaleString('pt-BR');
        const assunto = `🚨 ALERTA: Falha na atualização de dados do Painel ODS Sergipe`;
        
        const mensagemHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #dc3545; margin-top: 0;">🚨 Alerta de Falha no Sistema</h2>
                <p style="margin-bottom: 20px; font-size: 16px;">Foi detectada uma sequência de falhas na atualização de dados do Painel ODS Sergipe.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #333;">Detalhes da Falha:</h3>
                    <ul style="padding-left: 20px;">
                        <li><strong>Indicador:</strong> ${indicador}</li>
                        <li><strong>Erro:</strong> ${erro.message}</li>
                        <li><strong>Data/Hora:</strong> ${dataFormatada}</li>
                        <li><strong>Falhas consecutivas:</strong> ${historico.falhas.consecutivas}</li>
                        <li><strong>Total de falhas:</strong> ${historico.falhas.total}</li>
                    </ul>
                </div>
                
                <p style="font-size: 14px; color: #555;">Este é um e-mail automático do sistema de monitoramento do Painel ODS Sergipe. Por favor, verifique o problema e tome as medidas necessárias.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                    <p>Painel ODS Sergipe - Sistema de Monitoramento Automático</p>
                    <p>LIMFS - Laboratório de Inovação em Mosaicos Futuros Sustentáveis</p>
                </div>
            </div>
        `;
        
        await transporter.sendMail({
            from: `"Sistema de Monitoramento ODS" <${process.env.EMAIL_USER}>`,
            to: destinatarios,
            subject: assunto,
            html: mensagemHTML
        });
        
        console.log('✅ Alerta por e-mail enviado com sucesso!');
        
        // Registra o envio do alerta no histórico
        historico.alertas.total++;
        historico.alertas.ultimoAlerta = new Date().toISOString();
        salvarHistorico();
        
    } catch (erro) {
        console.error('Erro ao enviar alerta por e-mail:', erro);
    }
}

/**
 * Gera um relatório detalhado do status do sistema e salva como HTML
 * @returns {string} Caminho do arquivo de relatório
 */
function salvarRelatorioStatus() {
    try {
        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR');
        
        // Status geral do sistema baseado na quantidade de falhas consecutivas
        let statusGeral = 'normal';
        let corStatus = '#28a745';
        let mensagemStatus = 'Sistema funcionando normalmente';
        
        if (historico.falhas.consecutivas > 0 && historico.falhas.consecutivas < MAX_FALHAS_CONSECUTIVAS) {
            statusGeral = 'atencao';
            corStatus = '#ffc107';
            mensagemStatus = 'Sistema funcionando com alerta de atenção';
        } else if (historico.falhas.consecutivas >= MAX_FALHAS_CONSECUTIVAS) {
            statusGeral = 'critico';
            corStatus = '#dc3545';
            mensagemStatus = 'Sistema em estado crítico';
        }
        
        // Listagem de falhas por indicador
        let listaFalhas = '';
        for (const [indicador, dados] of Object.entries(historico.falhas.porIndicador)) {
            const dataFalha = dados.ultimaFalha ? new Date(dados.ultimaFalha).toLocaleString('pt-BR') : 'N/A';
            listaFalhas += `
                <tr>
                    <td>${indicador}</td>
                    <td>${dados.total}</td>
                    <td>${dataFalha}</td>
                </tr>
            `;
        }
        
        // Cria o HTML do relatório
        const htmlRelatorio = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Status - Painel ODS Sergipe</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .status-badge {
                    display: inline-block;
                    padding: 8px 15px;
                    border-radius: 4px;
                    color: white;
                    font-weight: bold;
                }
                .normal { background-color: #28a745; }
                .atencao { background-color: #ffc107; color: #333; }
                .critico { background-color: #dc3545; }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th, td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #ddd;
                    text-align: left;
                }
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                tr:hover {
                    background-color: #f5f5f5;
                }
                .summary-box {
                    background-color: #f8f9fa;
                    border-radius: 5px;
                    padding: 20px;
                    margin-bottom: 30px;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 0.9em;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Status do Sistema</h1>
                <p>Painel ODS Sergipe - Monitoramento Automático</p>
                <p><strong>Gerado em:</strong> ${dataFormatada}</p>
            </div>
            
            <div class="summary-box">
                <h2>Status Atual: <span class="status-badge ${statusGeral}" style="background-color: ${corStatus};">${mensagemStatus}</span></h2>
                <p>Este relatório apresenta o status do sistema de atualização automática de dados do Painel ODS Sergipe.</p>
                <ul>
                    <li><strong>Total de falhas registradas:</strong> ${historico.falhas.total}</li>
                    <li><strong>Falhas consecutivas:</strong> ${historico.falhas.consecutivas}</li>
                    <li><strong>Última falha:</strong> ${historico.falhas.ultimaFalha ? new Date(historico.falhas.ultimaFalha).toLocaleString('pt-BR') : 'N/A'}</li>
                    <li><strong>Alertas enviados:</strong> ${historico.alertas.total}</li>
                    <li><strong>Último alerta:</strong> ${historico.alertas.ultimoAlerta ? new Date(historico.alertas.ultimoAlerta).toLocaleString('pt-BR') : 'N/A'}</li>
                </ul>
            </div>
            
            <h2>Falhas por Indicador</h2>
            <table>
                <thead>
                    <tr>
                        <th>Indicador</th>
                        <th>Total de Falhas</th>
                        <th>Última Falha</th>
                    </tr>
                </thead>
                <tbody>
                    ${listaFalhas || '<tr><td colspan="3">Nenhuma falha registrada</td></tr>'}
                </tbody>
            </table>
            
            <div class="summary-box">
                <h2>Recomendações</h2>
                <ul>
                    <li>Se o número de falhas consecutivas for maior que ${MAX_FALHAS_CONSECUTIVAS}, verifique a conectividade com as APIs externas.</li>
                    <li>Verifique se houve mudanças nas estruturas de dados das APIs utilizadas.</li>
                    <li>Em caso de persistência do problema, considere atualizar os endpoints alternativos.</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>LIMFS - Laboratório de Inovação em Mosaicos Futuros Sustentáveis</p>
                <p>Relatório gerado automaticamente pelo sistema de monitoramento.</p>
            </div>
        </body>
        </html>
        `;
        
        fs.writeFileSync(RELATORIO_STATUS, htmlRelatorio);
        return RELATORIO_STATUS;
        
    } catch (erro) {
        console.error('Erro ao gerar relatório de status:', erro);
        return null;
    }
}

module.exports = {
    registrarFalha,
    registrarSucesso,
    salvarRelatorioStatus
};