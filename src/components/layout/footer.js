/**
 * Insere o conteúdo do rodapé em todas as páginas
 */
document.addEventListener('DOMContentLoaded', function () {
    const rodapeElemento = document.querySelector('.rodape');

    if (rodapeElemento) {
        rodapeElemento.innerHTML = `
        <div class="container-rodape">
          <div class="secao-rodape info-institucional">
            <p>&copy; ${new Date().getFullYear()} LIMFS. Todos os direitos reservados.</p>
            <p>
              <a href="https://www.linkedin.com/company/mosaicosfuturos" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              |
              <a href="https://instagram.com/mosaicosfuturos" target="_blank" rel="noopener noreferrer">Instagram</a> |
              <a href="mailto:contato@mosaicosfuturos.com">Email</a>
            </p>
            <p>Telefone: (79) 99809-4165</p>
          </div>
          <div class="secao-rodape fontes-dados">
            <h4>Fontes de Dados (Atualizado em 12/04/2025)</h4>
            <ul>
              <li>IBGE - PNAD Contínua 2023-2024</li>
              <li>DATASUS - Sistema de Informações sobre Mortalidade 2022</li>
              <li>ANEEL - Geração Distribuída 2025</li>
              <li>IBGE - Censo Demográfico 2022</li>
              <li>SNIS - Sistema Nacional de Informações sobre Saneamento 2024</li>
            </ul>
          </div>
        </div>
      `;
    }
});