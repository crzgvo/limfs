/**
 * Componente de acessibilidade do painel ODS.
 * @module acessibilidade
 */

/**
 * Adiciona atributos ARIA e eventos de teclado aos elementos.
 * @param {string} seletorCard - Seletor dos cards de indicadores
 */
export function configurarAcessibilidade(seletorCard = '.card-indicador') {
    const cards = document.querySelectorAll(seletorCard);
    
    cards.forEach(card => {
        const valor = card.querySelector('.valor-indicador');
        const texto = card.querySelector('.texto-indicador');
        const grafico = card.querySelector('.grafico-container');
        
        // Atributos ARIA para o card
        card.setAttribute('role', 'region');
        card.setAttribute('tabindex', '0');
        
        if (valor) {
            valor.setAttribute('role', 'text');
            valor.setAttribute('aria-label', `Valor atual: ${valor.textContent}`);
        }
        
        if (grafico) {
            grafico.setAttribute('role', 'img');
            grafico.setAttribute('aria-label', texto?.textContent || 'Gráfico do indicador');
        }
        
        // Navegação por teclado
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

/**
 * Atualiza o texto de leitura de tela para um indicador.
 * @param {string} idCard - ID do card do indicador
 * @param {Object} dados - Dados atualizados
 */
export function atualizarAriaLive(idCard, dados) {
    const card = document.getElementById(idCard);
    if (!card) return;
    
    const valor = card.querySelector('.valor-indicador');
    if (valor) {
        valor.setAttribute('aria-label', `Valor atualizado: ${dados.valor}% em ${dados.ano}`);
    }
    
    // Região live para anunciar atualizações
    const live = card.querySelector('.atualizacao-live') || criarRegiaoLive(card);
    live.textContent = `Dados atualizados. ${dados.valor}% em ${dados.ano}`;
}

/**
 * Cria região live para anúncios de screen reader.
 * @private
 */
function criarRegiaoLive(container) {
    const live = document.createElement('div');
    live.className = 'atualizacao-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.style.position = 'absolute';
    live.style.width = '1px';
    live.style.height = '1px';
    live.style.padding = '0';
    live.style.margin = '-1px';
    live.style.overflow = 'hidden';
    live.style.clip = 'rect(0, 0, 0, 0)';
    live.style.whiteSpace = 'nowrap';
    live.style.border = '0';
    container.appendChild(live);
    return live;
}

/**
 * Configura atalhos de teclado globais.
 */
export function configurarAtalhosGlobais() {
    document.addEventListener('keydown', (e) => {
        // Alt + H: Foco no cabeçalho
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            document.querySelector('h1')?.focus();
        }
        
        // Alt + I: Lista de indicadores
        if (e.altKey && e.key === 'i') {
            e.preventDefault();
            document.querySelector('.grade-indicadores')?.focus();
        }
        
        // Alt + C: Gráfico comparativo
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            document.querySelector('.visualizacao-comparativa')?.focus();
        }
    });
}