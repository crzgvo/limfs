/**
 * Configuração do Dashboard ODS 1 - Erradicação da Pobreza
 * Define os indicadores e parâmetros de visualização
 * 
 * @module ods1Config
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

const configODS1 = {
  // Metadados do ODS
  odsNumero: 1,
  odsTitulo: "Erradicação da Pobreza",
  odsDescricao: "Acabar com a pobreza em todas as suas formas, em todos os lugares",
  
  // Classes CSS específicas para personalização
  classesCss: {
    cardIndicadorPrincipal: "card-indicador-principal",
    cardIndicadorSecundario: "card-indicador",
    secaoRecomendacoes: "secao-recomendacoes",
    listaRecomendacoes: "lista-recomendacoes",
    cardRecomendacao: "card-recomendacao",
    secaoAcoesImpacto: "secao-acoes-impacto",
    listaAcoes: "lista-acoes",
    cardAcao: "card-acao",
    linkAcao: "link-acao"
  },
  
  // Indicador principal
  indicadorPrincipal: {
    id: "pobreza",
    titulo: "Taxa de Extrema Pobreza",
    descricao: "Percentual da população vivendo com menos de R$ 182 por mês",
    unidade: "%",
    fonte: "IBGE - PNAD Contínua",
    endpoint: "indicadores/pobreza",
    tipoGrafico: "linha",
    tituloEixoX: "Ano",
    tituloEixoY: "População (%)"
  },
  
  // Indicadores secundários
  indicadores: [
    {
      id: "distribuicao_renda",
      titulo: "Distribuição de Renda (Índice de Gini)",
      descricao: "Medida de desigualdade de distribuição de renda",
      unidade: "",
      fonte: "IBGE - PNAD Contínua",
      endpoint: "indicadores/distribuicao_renda",
      tipoGrafico: "linha",
      tituloEixoX: "Ano",
      tituloEixoY: "Índice de Gini"
    },
    {
      id: "acesso_beneficios",
      titulo: "Acesso a Programas Sociais",
      descricao: "Percentual da população beneficiada por programas de transferência de renda",
      unidade: "%",
      fonte: "Ministério da Cidadania",
      endpoint: "indicadores/acesso_beneficios",
      tipoGrafico: "barra",
      tituloEixoX: "Ano",
      tituloEixoY: "População (%)"
    }
  ],
  
  // Exibir gráfico comparativo
  exibirComparativo: true,
  
  // Configuração do gráfico comparativo
  configuracaoComparativo: {
    titulo: "Análise Comparativa - Pobreza e Acesso a Programas Sociais",
    descricao: "Relação entre a taxa de pobreza e o acesso a programas sociais ao longo do tempo",
    tipoGrafico: "linha",
    indicadores: ["pobreza", "acesso_beneficios"],
    periodoAnos: 5
  },
  
  // Recomendações de políticas públicas
  recomendacoes: [
    {
      titulo: "Ampliar programas de transferência de renda",
      descricao: "Expandir o alcance e valor dos programas de transferência de renda para famílias em situação de vulnerabilidade."
    },
    {
      titulo: "Fomentar geração de emprego e renda",
      descricao: "Implementar políticas de incentivo à geração de emprego e renda, especialmente em áreas de maior vulnerabilidade social."
    },
    {
      titulo: "Educação financeira e acesso a serviços bancários",
      descricao: "Promover programas de educação financeira e acesso a serviços bancários para população de baixa renda."
    }
  ],
  
  // Ações de impacto
  acoesImpacto: [
    {
      titulo: "Programa Renda Básica Sergipana",
      descricao: "Iniciativa estadual para complementação de renda de famílias em situação de vulnerabilidade.",
      link: "#programa-renda-sergipana",
      icone: "fa-solid fa-hand-holding-dollar"
    },
    {
      titulo: "Mapeamento de Vulnerabilidade Social",
      descricao: "Mapeamento das áreas com maior concentração de pobreza para direcionamento de políticas públicas.",
      link: "#mapeamento-vulnerabilidade",
      icone: "fa-solid fa-map-location-dot"
    }
  ],
  
  // Metadados para SEO e acessibilidade
  metadados: {
    titulo: "ODS 1 - Erradicação da Pobreza | Indicadores Sergipanos",
    descricao: "Acompanhe os indicadores de erradicação da pobreza em Sergipe de acordo com os Objetivos de Desenvolvimento Sustentável.",
    palavrasChave: "ODS 1, pobreza, desenvolvimento sustentável, indicadores sociais, Sergipe"
  }
};

export default configODS1;