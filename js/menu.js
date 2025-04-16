/**
 * Controla o menu de navegação responsivo, incluindo
 * toggle, overlay e funcionalidades de acessibilidade (focus trap, ARIA).
 */

const menuToggle = document.querySelector('.menu-toggle');
const navegacao = document.querySelector('.navegacao');

// Cria um overlay para fechar o menu ao clicar fora
const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.body.appendChild(overlay);

/**
 * Fecha o menu de navegação e o overlay, atualizando atributos ARIA.
 */
function fecharMenu() {
    navegacao.classList.remove('ativo');
    overlay.classList.remove('ativo');
    menuToggle.classList.remove('ativo');
    menuToggle.setAttribute('aria-expanded', 'false');
    // Atualiza texto acessível do botão toggle
    menuToggle.querySelector('.visually-hidden').textContent = 'Menu fechado';
    document.body.classList.remove('menu-aberto'); // Remove classe do body
}

// Event listener para o botão de toggle do menu
menuToggle.addEventListener('click', () => {
    const ativo = navegacao.classList.toggle('ativo');
    overlay.classList.toggle('ativo', ativo);
    menuToggle.classList.toggle('ativo');
    menuToggle.setAttribute('aria-expanded', ativo);
    // Atualiza texto acessível e classe do body
    menuToggle.querySelector('.visually-hidden').textContent = ativo ? 'Menu aberto' : 'Menu fechado';
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