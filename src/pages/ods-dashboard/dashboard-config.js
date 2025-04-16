/**
 * Configurações do Dashboard principal do Painel ODS Sergipe
 */
import { ODS_COLORS, ODS_INDICATORS } from '../../constants/ods.js';

// Configuração dos painéis de indicadores
export const DASHBOARD_CONFIG = {
  // Indicadores em destaque na página principal
  indicadoresDestaque: [
    {
      id: 'pobreza-extrema',
      ods: 1,
      titulo: 'Taxa de Extrema Pobreza',
      descricao: 'Percentual da população vivendo abaixo da linha de extrema pobreza',
      unidade: '%',
      fonte: 'IBGE/PNAD',
      endpoint: 'POBREZA',
      metaODS: 'Erradicar a pobreza extrema para todas as pessoas em todos os lugares até 2030',
      ehDestaque: true
    },
    {
      id: 'alfabetizacao',
      ods: 4,
      titulo: 'Taxa de Alfabetização',
      descricao: 'Percentual da população com 15 anos ou mais alfabetizada',
      unidade: '%',
      fonte: 'IBGE/PNAD',
      endpoint: 'EDUCACAO',
      metaODS: 'Garantir que todos os jovens e adultos estejam alfabetizados até 2030',
      ehDestaque: true
    },
    {
      id: 'saneamento',
      ods: 6,
      titulo: 'Cobertura de Saneamento Básico',
      descricao: 'Percentual da população com acesso a saneamento básico',
      unidade: '%',
      fonte: 'SNIS',
      endpoint: 'SANEAMENTO',
      metaODS: 'Alcançar o acesso universal e equitativo a saneamento básico até 2030',
      ehDestaque: true
    },
    {
      id: 'energia-solar',
      ods: 7,
      titulo: 'Energia Solar Fotovoltaica',
      descricao: 'Capacidade instalada de energia solar fotovoltaica',
      unidade: 'MW',
      fonte: 'ANEEL',
      endpoint: 'ENERGIA_SOLAR',
      metaODS: 'Aumentar substancialmente a participação de energias renováveis até 2030',
      ehDestaque: true
    },
    {
      id: 'desemprego',
      ods: 8,
      titulo: 'Taxa de Desemprego',
      descricao: 'Percentual da população economicamente ativa desempregada',
      unidade: '%',
      fonte: 'IBGE/PNAD',
      endpoint: 'TRABALHO',
      metaODS: 'Alcançar o emprego pleno e produtivo para todas as pessoas até 2030',
      ehDestaque: true
    },
    {
      id: 'residuos-reciclados',
      ods: 12,
      titulo: 'Resíduos Sólidos Reciclados',
      descricao: 'Percentual de resíduos sólidos urbanos reciclados',
      unidade: '%',
      fonte: 'SNIS',
      endpoint: 'RESIDUOS',
      metaODS: 'Reduzir substancialmente a geração de resíduos através da prevenção, redução, reciclagem e reuso até 2030',
      ehDestaque: true
    },
  ],
  
  // Configurações de visualização
  visualizacao: {
    // Lista de ODSs a serem exibidos na página principal
    odsVisiveis: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    
    // Layout do grid
    grid: {
      colunasPadrao: 3,
      colunasTablet: 2,
      colunasMobile: 1
    },
    
    // Gráficos comparativos na página principal
    graficosComparativos: [
      {
        id: 'grafico-comparativo-social',
        titulo: 'Indicadores Sociais',
        tipo: 'linha',
        indicadores: ['pobreza-extrema', 'alfabetizacao'],
        periodoInicial: 2015,
        periodoFinal: 2023
      },
      {
        id: 'grafico-comparativo-ambiental',
        titulo: 'Indicadores Ambientais',
        tipo: 'linha',
        indicadores: ['saneamento', 'residuos-reciclados'],
        periodoInicial: 2015,
        periodoFinal: 2023
      }
    ]
  },
  
  // Configurações de filtro e busca
  filtros: {
    dimensoes: [
      { id: 'social', nome: 'Social', ods: [1, 3, 4, 5, 10] },
      { id: 'ambiental', nome: 'Ambiental', ods: [6, 11, 12, 13, 14, 15] },
      { id: 'economica', nome: 'Econômica', ods: [2, 7, 8, 9, 17] },
      { id: 'institucional', nome: 'Institucional', ods: [16] }
    ],
    anos: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    regioes: [
      { id: 'sergipe', nome: 'Todo o Estado' },
      { id: 'grande-aracaju', nome: 'Grande Aracaju' },
      { id: 'agreste', nome: 'Agreste Sergipano' },
      { id: 'sertao', nome: 'Sertão Sergipano' },
      { id: 'leste', nome: 'Leste Sergipano' },
      { id: 'sul', nome: 'Sul Sergipano' }
    ]
  },
  
  // Metas e limites para exibição visual dos indicadores
  metas: {
    'pobreza-extrema': {
      meta2030: 0,
      limiteAlerta: 5,
      limiteCritico: 10
    },
    'alfabetizacao': {
      meta2030: 100,
      limiteAlerta: 90,
      limiteCritico: 80
    },
    'saneamento': {
      meta2030: 100,
      limiteAlerta: 80,
      limiteCritico: 60
    },
    'energia-solar': {
      meta2030: 500,
      limiteAlerta: 250,
      limiteCritico: 100
    },
    'desemprego': {
      meta2030: 5,
      limiteAlerta: 10,
      limiteCritico: 15
    },
    'residuos-reciclados': {
      meta2030: 45,
      limiteAlerta: 25,
      limiteCritico: 10
    }
  }
};

/**
 * Recupera a configuração de um indicador específico pelo ID
 * @param {string} indicadorId - ID do indicador
 * @returns {Object|null} Configuração do indicador ou null se não encontrado
 */
export function getIndicadorConfig(indicadorId) {
  return DASHBOARD_CONFIG.indicadoresDestaque.find(i => i.id === indicadorId) || null;
}

/**
 * Recupera a cor associada a um ODS específico
 * @param {number} odsNumero - Número do ODS (1 a 17)
 * @returns {string} Código de cor hexadecimal
 */
export function getOdsColor(odsNumero) {
  if (odsNumero < 1 || odsNumero > 17) return '#666666';
  return ODS_COLORS[`ODS${odsNumero}`] || '#666666';
}

/**
 * Verifica se um indicador atingiu sua meta ou está em situação crítica/alerta
 * @param {string} indicadorId - ID do indicador
 * @param {number} valor - Valor atual do indicador
 * @returns {Object} Status do indicador (atingiu, alerta, critico) e informações adicionais
 */
export function verificarStatusMeta(indicadorId, valor) {
  const meta = DASHBOARD_CONFIG.metas[indicadorId];
  
  if (!meta) return { status: 'indefinido' };
  
  const valorNumerico = Number(valor);
  if (isNaN(valorNumerico)) return { status: 'invalido', mensagem: 'Valor inválido para avaliação' };
  
  const {meta2030, limiteAlerta, limiteCritico} = meta;
  
  // Se a meta é atingir um valor mínimo (crescente como alfabetização)
  if (meta2030 > limiteCritico) {
    if (valorNumerico >= meta2030) {
      return {
        status: 'atingiu',
        percentualMeta: 100,
        mensagem: 'Meta ODS atingida!'
      };
    } else if (valorNumerico >= limiteAlerta) {
      const percentual = ((valorNumerico - limiteCritico) / (meta2030 - limiteCritico) * 100).toFixed(1);
      return {
        status: 'alerta',
        percentualMeta: percentual,
        mensagem: `Em progresso (${percentual}% da meta atingida)`
      };
    } else {
      const percentual = ((valorNumerico - 0) / (limiteCritico - 0) * 100).toFixed(1);
      return {
        status: 'critico',
        percentualMeta: percentual,
        mensagem: `Em nível crítico (${percentual}% da meta atingida)`
      };
    }
  }
  // Se a meta é atingir um valor máximo (decrescente como pobreza)
  else {
    if (valorNumerico <= meta2030) {
      return {
        status: 'atingiu',
        percentualMeta: 100,
        mensagem: 'Meta ODS atingida!'
      };
    } else if (valorNumerico <= limiteAlerta) {
      const percentual = ((limiteCritico - valorNumerico) / (limiteCritico - meta2030) * 100).toFixed(1);
      return {
        status: 'alerta',
        percentualMeta: percentual,
        mensagem: `Em progresso (${percentual}% da meta atingida)`
      };
    } else {
      const percentual = ((limiteCritico - valorNumerico) / limiteCritico * 100).toFixed(1);
      return {
        status: 'critico',
        percentualMeta: Math.max(0, percentual),
        mensagem: `Em nível crítico (${Math.max(0, percentual)}% da meta atingida)`
      };
    }
  }
}
