const menuToggle = document.querySelector('.menu-toggle');
const navegacao = document.querySelector('.navegacao');

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.body.appendChild(overlay);

function fecharMenu() {
    navegacao.classList.remove('ativo');
    overlay.classList.remove('ativo');
    menuToggle.classList.remove('ativo');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.visually-hidden').textContent = 'Menu fechado';
    document.body.classList.remove('menu-aberto');
}

menuToggle.addEventListener('click', () => {
    const ativo = navegacao.classList.toggle('ativo');
    overlay.classList.toggle('ativo', ativo);
    menuToggle.classList.toggle('ativo');
    menuToggle.setAttribute('aria-expanded', ativo);
    menuToggle.querySelector('.visually-hidden').textContent = ativo ? 'Menu aberto' : 'Menu fechado';
    document.body.classList.toggle('menu-aberto', ativo);
    
    if (ativo) {
        navegacao.querySelector('a').focus();
    }
});

overlay.addEventListener('click', fecharMenu);

document.addEventListener('keyup', (event) => {
    if (event.key === "Escape" && navegacao.classList.contains('ativo')) {
        fecharMenu();
    }
});

navegacao.addEventListener('keydown', (event) => {
    if (!navegacao.classList.contains('ativo')) return;

    const focusableElements = navegacao.querySelectorAll('a, button');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab' && event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    }
    else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
});