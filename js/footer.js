/**
 * Insere o conteúdo do rodapé em todas as páginas
 */
document.addEventListener('DOMContentLoaded', function () {
    const rodapeElemento = document.querySelector('.rodape');

    if (rodapeElemento) {
        rodapeElemento.innerHTML = `
        <p>&copy; ${new Date().getFullYear()} LIMFS. Todos os direitos reservados.</p>
        <p>
          <a href="https://www.linkedin.com/company/mosaicosfuturos" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          |
          <a href="https://instagram.com/mosaicosfuturos" target="_blank" rel="noopener noreferrer">Instagram</a> |
          <a href="mailto:contato@mosaicosfuturos.com">Email</a>
        </p>
        <p>Telefone: (79) 99809-4165</p>
      `;
    }
});