/**
 * Script principal da página inicial do Painel ODS Sergipe
 */
import { ODS_COLORS, ODS_INDICATORS } from '../../constants/ods.js';
import { logger } from '../../services/monitoring.js';

document.addEventListener('DOMContentLoaded', () => {
  logger.info('Página inicial carregada');
  
  // Carrega grid de ODSs
  carregarGridODS();
  
  // Carrega indicadores em destaque
  carregarIndicadoresDestaque();
});

/**
 * Carrega o grid com os 17 ODSs na página inicial
 */
function carregarGridODS() {
  const odsGrid = document.querySelector('.ods-grid');
  if (!odsGrid) {
    logger.warn('Container do grid ODS não encontrado');
    return;
  }
  
  for (let i = 1; i <= 17; i++) {
    const odsKey = `ODS${i}`;
    const odsData = ODS_INDICATORS[odsKey] || {
      title: `ODS ${i}`,
      icon: '../../assets/images/logo-icons-coloridos-01.png'
    };

    const odsColor = ODS_COLORS[odsKey] || '#cccccc';
    
    const odsElement = document.createElement('div');
    odsElement.className = 'ods-item';
    odsElement.style.borderColor = odsColor;
    odsElement.innerHTML = `
      <img src="${odsData.icon}" alt="Ícone ODS ${i}" class="ods-icon">
      <h3>ODS ${i}</h3>
      <p>${odsData.title}</p>
    `;
    
    // Adiciona link para a página específica do ODS
    odsElement.addEventListener('click', () => {
      window.location.href = `../ods-specific/${i}/`;
    });
    
    odsGrid.appendChild(odsElement);
  }
}

/**
 * Carrega os indicadores em destaque na página inicial
 */
async function carregarIndicadoresDestaque() {
  const indicadoresGrid = document.querySelector('.indicators-grid');
  if (!indicadoresGrid) {
    logger.warn('Container de indicadores não encontrado');
    return;
  }
  
  try {
    // Indicadores destacados (poderia vir de uma API ou dados estáticos)
    const indicadoresDestaque = [
      {
        ods: 'ODS1',
        valor: '8.5%',
        titulo: 'Taxa de extrema pobreza',
        ano: '2023'
      },
      {
        ods: 'ODS6',
        valor: '76.2%',
        titulo: 'Cobertura de saneamento básico',
        ano: '2023'
      },
      {
        ods: 'ODS7',
        valor: '245 MW',
        titulo: 'Capacidade de energia solar instalada',
        ano: '2023'
      }
    ];
    
    // Renderiza cada indicador destacado
    indicadoresDestaque.forEach(indicador => {
      const odsNumber = indicador.ods.replace('ODS', '');
      const odsColor = ODS_COLORS[indicador.ods] || '#cccccc';
      
      const indicadorElement = document.createElement('div');
      indicadorElement.className = 'indicator-card';
      indicadorElement.style.borderTopColor = odsColor;
      
      indicadorElement.innerHTML = `
        <div class="indicator-header" style="background-color: ${odsColor}">
          <h3>ODS ${odsNumber}</h3>
        </div>
        <div class="indicator-body">
          <p class="indicator-title">${indicador.titulo}</p>
          <p class="indicator-value">${indicador.valor}</p>
          <p class="indicator-year">${indicador.ano}</p>
        </div>
        <div class="indicator-footer">
          <a href="../ods-specific/${odsNumber}/" class="btn btn-sm">Ver detalhes</a>
        </div>
      `;
      
      indicadoresGrid.appendChild(indicadorElement);
    });
  } catch (erro) {
    logger.error('Erro ao carregar indicadores destacados:', erro);
    indicadoresGrid.innerHTML = '<p class="error-message">Não foi possível carregar os indicadores destacados.</p>';
  }
}

// Exporta as funções para uso em testes
export {
  carregarGridODS,
  carregarIndicadoresDestaque
};
