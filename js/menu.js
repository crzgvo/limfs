/**
 * Controla o menu de navegação responsivo, incluindo
 * toggle, overlay e funcionalidades de acessibilidade (focus trap, ARIA).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Primeiro, verificar e renderizar o menu no container adequado
    const menuContainer = document.getElementById('menu-container');
    
    if (!menuContainer) {
        console.error('Menu: Container do menu (#menu-container) não encontrado na página');
        return;
    }
    
    // Renderiza o menu no container
    renderizarMenu(menuContainer);
    
    // Após renderizar o menu, procura os elementos necessários
    const menuToggle = document.querySelector('.menu-toggle');
    const navegacao = document.querySelector('.navegacao');
    
    // Verificação de segurança - só executa se os elementos existirem
    if (!menuToggle || !navegacao) {
        console.error('Menu: Elementos necessários não encontrados na página após renderização');
        return;
    }
    
    // Cria um overlay para fechar o menu ao clicar fora
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);
    
    // Verifica se o elemento visually-hidden existe, senão cria
    let srTextElement = menuToggle.querySelector('.visually-hidden');
    if (!srTextElement) {
        srTextElement = document.createElement('span');
        srTextElement.classList.add('visually-hidden');
        srTextElement.textContent = 'Menu fechado';
        menuToggle.appendChild(srTextElement);
    }
    
    /**
     * Fecha o menu de navegação e o overlay, atualizando atributos ARIA.
     */
    function fecharMenu() {
        navegacao.classList.remove('ativo');
        overlay.classList.remove('ativo');
        menuToggle.classList.remove('ativo');
        menuToggle.setAttribute('aria-expanded', 'false');
        // Atualiza texto acessível do botão toggle
        if (srTextElement) {
            srTextElement.textContent = 'Menu fechado';
        }
        document.body.classList.remove('menu-aberto'); // Remove classe do body
    }
    
    // Event listener para o botão de toggle do menu
    menuToggle.addEventListener('click', () => {
        const ativo = navegacao.classList.toggle('ativo');
        overlay.classList.toggle('ativo', ativo);
        menuToggle.classList.toggle('ativo');
        menuToggle.setAttribute('aria-expanded', ativo);
        // Atualiza texto acessível e classe do body
        if (srTextElement) {
            srTextElement.textContent = ativo ? 'Menu aberto' : 'Menu fechado';
        }
        document.body.classList.toggle('menu-aberto', ativo);
    
        // Move o foco para o primeiro item do menu quando aberto
        if (ativo) {
            // Garante que o elemento exista antes de focar
            const firstFocusable = navegacao.querySelector('a, button');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    });
    
    // Event listener para fechar o menu ao clicar no overlay
    overlay.addEventListener('click', fecharMenu);
    
    // Event listener para fechar o menu com a tecla 'Escape'
    document.addEventListener('keyup', (event) => {
        if (event.key === "Escape" && navegacao.classList.contains('ativo')) {
            fecharMenu();
        }
    });
    
    /**
     * Implementa um "focus trap" dentro do menu quando ele está ativo.
     * Impede que o foco do teclado saia do menu usando Tab ou Shift+Tab.
     */
    navegacao.addEventListener('keydown', (event) => {
        // Só aplica o trap se o menu estiver ativo
        if (!navegacao.classList.contains('ativo')) return;
    
        // Seleciona todos os elementos focáveis dentro da navegação
        const focusableElements = navegacao.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return; // Sai se não houver elementos focáveis
    
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
    
        // Se Shift+Tab no primeiro elemento, move o foco para o último
        if (event.key === 'Tab' && event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        }
        // Se Tab no último elemento, move o foco para o primeiro
        else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });
});

/**
 * Renderiza o conteúdo do menu no container especificado
 * @param {HTMLElement} container - O container onde o menu será renderizado
 */
function renderizarMenu(container) {
    // Obter número do ODS atual para destacar no menu
    const paginaAtual = document.body.getAttribute('data-pagina') || '';
    
    // Estrutura completa do menu
    container.innerHTML = `
        <button class="menu-toggle" aria-expanded="false" aria-controls="menu-navegacao">
            <span class="menu-icon">
                <span class="barra"></span>
                <span class="barra"></span>
                <span class="barra"></span>
            </span>
            <span class="visually-hidden">Menu fechado</span>
        </button>
        
        <nav class="navegacao" id="menu-navegacao" aria-label="Menu principal">
            <ul class="menu-principal">
                <li><a href="/index.html" class="${paginaAtual === 'home' ? 'ativo' : ''}">Início</a></li>
                <li class="dropdown">
                    <button class="dropdown-toggle" aria-expanded="false" aria-controls="submenu-ods">
                        Painéis ODS
                        <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <ul id="submenu-ods" class="submenu">
                        <li><a href="/painel-ods/ods1.html" class="${paginaAtual === 'ods1' ? 'ativo' : ''}">ODS 1 - Erradicação da Pobreza</a></li>
                        <li><a href="/painel-ods/ods2.html" class="${paginaAtual === 'ods2' ? 'ativo' : ''}">ODS 2 - Fome Zero</a></li>
                        <li><a href="/painel-ods/ods3.html" class="${paginaAtual === 'ods3' ? 'ativo' : ''}">ODS 3 - Saúde e Bem-Estar</a></li>
                        <li><a href="/painel-ods/ods4.html" class="${paginaAtual === 'ods4' ? 'ativo' : ''}">ODS 4 - Educação de Qualidade</a></li>
                        <li><a href="/painel-ods/ods5.html" class="${paginaAtual === 'ods5' ? 'ativo' : ''}">ODS 5 - Igualdade de Gênero</a></li>
                        <li><a href="/painel-ods/ods6.html" class="${paginaAtual === 'ods6' ? 'ativo' : ''}">ODS 6 - Água Potável</a></li>
                        <li><a href="/painel-ods/ods7.html" class="${paginaAtual === 'ods7' ? 'ativo' : ''}">ODS 7 - Energia Acessível</a></li>
                        <li><a href="/painel-ods/ods8.html" class="${paginaAtual === 'ods8' ? 'ativo' : ''}">ODS 8 - Trabalho Decente</a></li>
                    </ul>
                </li>
                <li><a href="/servicos/index.html" class="${paginaAtual === 'servicos' ? 'ativo' : ''}">Serviços</a></li>
                <li><a href="/sobre/index.html" class="${paginaAtual === 'sobre' ? 'ativo' : ''}">Sobre o LIMFS</a></li>
                <li><a href="/contato/index.html" class="${paginaAtual === 'contato' ? 'ativo' : ''}">Contato</a></li>
                <li><a href="/monitoramento/index.html" class="${paginaAtual === 'monitoramento' ? 'ativo' : ''}">Monitoramento</a></li>
            </ul>
            
            <div class="menu-acessibilidade">
                <button id="btn-aumentar-fonte" class="btn-acessibilidade" aria-label="Aumentar fonte">
                    <i class="fas fa-text-height" aria-hidden="true"></i>
                </button>
                <button id="btn-alto-contraste" class="btn-acessibilidade" aria-label="Alto contraste">
                    <i class="fas fa-adjust" aria-hidden="true"></i>
                </button>
            </div>
        </nav>
    `;
    
    // Adiciona listeners para o menu dropdown após renderizar
    const dropdownToggle = container.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            const expanded = this.getAttribute('aria-expanded') === 'true';
            
            this.setAttribute('aria-expanded', !expanded);
            submenu.classList.toggle('ativo');
        });
    }
}