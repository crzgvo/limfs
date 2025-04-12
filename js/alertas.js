/**
 * Sistema de alertas para o Painel ODS Sergipe
 * Gerencia registro de falhas, envio de alertas e relatórios de status.
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// --- Configurações ---
const HISTORICO_ALERTAS = path.join(__dirname, '..', 'dados', 'sistema', 'historico-alertas.json');
const RELATORIO_STATUS = path.join(__dirname, '..', 'dados', 'sistema', 'status-sistema.html');
// Número de falhas consecutivas para disparar um alerta
const MAX_FALHAS_CONSECUTIVAS = 3;
// Intervalo mínimo entre alertas (em horas)
const MIN_INTERVALO_ALERTAS = 24;

// Carrega ou inicializa o histórico de alertas
let historico = { falhas: { total: 0, consecutivas: 0, porIndicador: {}, ultimaFalha: null }, alertas: { total: 0, ultimoAlerta: null } };

try {
    if (fs.existsSync(HISTORICO_ALERTAS)) {
        historico = JSON.parse(fs.readFileSync(HISTORICO_ALERTAS, 'utf8'));
    }
} catch (erro) {
    console.error('Erro ao carregar histórico de alertas:', erro);
}

/**
 * Configura o transportador de e-mail usando variáveis de ambiente.
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
 * Registra uma falha no sistema.
 * @param {string} indicador - Nome do indicador que falhou.
 * @param {Error} erro - Objeto de erro com detalhes.
 */
function registrarFalha(indicador, erro) {
    const agora = new Date().toISOString();

    historico.falhas.total++;
    historico.falhas.consecutivas++;
    historico.falhas.ultimaFalha = agora;

    // Inicializa ou atualiza contador específico do indicador
    if (!historico.falhas.porIndicador[indicador]) {
        historico.falhas.porIndicador[indicador] = { total: 0, ultimaFalha: null };
    }
    historico.falhas.porIndicador[indicador].total++;
    historico.falhas.porIndicador[indicador].ultimaFalha = agora;

    salvarHistorico();

    // Verifica se deve enviar alerta baseado em falhas consecutivas e intervalo mínimo
    if (historico.falhas.consecutivas >= MAX_FALHAS_CONSECUTIVAS) {
        const podeEnviarAlerta = !historico.alertas.ultimoAlerta ||
            (new Date() - new Date(historico.alertas.ultimoAlerta)) / (1000 * 60 * 60) >= MIN_INTERVALO_ALERTAS;

        if (podeEnviarAlerta) {
            enviarAlerta(indicador, erro);
        }
    }
}

/**
 * Registra uma atualização bem-sucedida, resetando falhas consecutivas.
 */
function registrarSucesso() {
    historico.falhas.consecutivas = 0;
    salvarHistorico();
}

/**
 * Salva o histórico de alertas em arquivo JSON.
 */
function salvarHistorico() {
    try {
        fs.writeFileSync(HISTORICO_ALERTAS, JSON.stringify(historico, null, 2));
    } catch (erro) {
        console.error('Erro ao salvar histórico de alertas:', erro);
    }
}

/**
 * Envia um alerta por e-mail com detalhes da falha.
 * @param {string} indicador - Nome do indicador que falhou.
 * @param {Error} erro - Objeto de erro com detalhes.
 */
async function enviarAlerta(indicador, erro) {
    try {
        const destinatarios = process.env.EMAIL_ALERT_TO || '';
        if (!destinatarios) {
            console.warn('⚠️ Destinatários de alerta não configurados. Verifique a variável EMAIL_ALERT_TO.');
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
 * Gera um relatório HTML detalhado do status do sistema.
 * @returns {string} Caminho do arquivo de relatório.
 */
function salvarRelatorioStatus() {
    try {
        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR');

        // Define status geral baseado nas falhas consecutivas
        let statusGeral = 'normal';
        let corStatus = '#28a745'; // Verde
        let mensagemStatus = 'Sistema funcionando normalmente.';

        if (historico.falhas.consecutivas > 0 && historico.falhas.consecutivas < MAX_FALHAS_CONSECUTIVAS) {
            statusGeral = 'alerta';
            corStatus = '#ffc107'; // Amarelo
            mensagemStatus = `Sistema registrou ${historico.falhas.consecutivas} falha(s) consecutiva(s). Monitorando...`;
        } else if (historico.falhas.consecutivas >= MAX_FALHAS_CONSECUTIVAS) {
            statusGeral = 'critico';
            corStatus = '#dc3545'; // Vermelho
            mensagemStatus = `Sistema em estado crítico! ${historico.falhas.consecutivas} falhas consecutivas registradas.`;
        }

        // Formata a lista de falhas por indicador
        let listaFalhas = '';
        if (Object.keys(historico.falhas.porIndicador).length > 0) {
            listaFalhas = '<ul>';
            for (const [indicador, dados] of Object.entries(historico.falhas.porIndicador)) {
                listaFalhas += `<li><strong>${indicador}:</strong> ${dados.total} falha(s) (última em ${new Date(dados.ultimaFalha).toLocaleString('pt-BR')})</li>`;
            }
            listaFalhas += '</ul>';
        } else {
            listaFalhas = '<p>Nenhuma falha registrada por indicador.</p>';
        }

        // Cria o conteúdo HTML do relatório
        const relatorioHTML = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório de Status - Painel ODS Sergipe</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
                    .container { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h1, h2 { color: #0056b3; }
                    .status { padding: 15px; border-radius: 5px; margin-bottom: 20px; color: #fff; font-weight: bold; }
                    .status.normal { background-color: ${corStatus}; }
                    .status.alerta { background-color: ${corStatus}; color: #333; }
                    .status.critico { background-color: ${corStatus}; }
                    .info-section { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
                    ul { padding-left: 20px; }
                    li { margin-bottom: 8px; }
                    footer { margin-top: 30px; font-size: 0.9em; color: #777; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Relatório de Status - Painel ODS Sergipe</h1>
                    <p>Gerado em: ${dataFormatada}</p>

                    <div class="status ${statusGeral}">
                        Status Geral: ${mensagemStatus}
                    </div>

                    <div class="info-section">
                        <h2>Resumo de Falhas</h2>
                        <p><strong>Total de Falhas Registradas:</strong> ${historico.falhas.total}</p>
                        <p><strong>Falhas Consecutivas Atuais:</strong> ${historico.falhas.consecutivas}</p>
                        <p><strong>Última Falha Registrada:</strong> ${historico.falhas.ultimaFalha ? new Date(historico.falhas.ultimaFalha).toLocaleString('pt-BR') : 'Nenhuma'}</p>
                    </div>

                    <div class="info-section">
                        <h2>Falhas por Indicador/Endpoint</h2>
                        ${listaFalhas}
                    </div>

                    <div class="info-section">
                        <h2>Histórico de Alertas Enviados</h2>
                        <p><strong>Total de Alertas Enviados:</strong> ${historico.alertas.total}</p>
                        <p><strong>Último Alerta Enviado:</strong> ${historico.alertas.ultimoAlerta ? new Date(historico.alertas.ultimoAlerta).toLocaleString('pt-BR') : 'Nenhum'}</p>
                    </div>

                    <footer>
                        Painel ODS Sergipe - Sistema de Monitoramento Automático | LIMFS
                    </footer>
                </div>
            </body>
            </html>
        `;

        // Salva o relatório em arquivo
        fs.writeFileSync(RELATORIO_STATUS, relatorioHTML);
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