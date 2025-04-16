/**
 * Script para padronizar o layout de todos os arquivos ODS
 * baseado no modelo flexbox do ODS 13
 * 
 * Este script cria arquivos de cores específicos para cada ODS e
 * atualiza os cabeçalhos HTML para incluir os arquivos CSS globais
 * 
 * Autor: GitHub Copilot
 * Data: Abril 2025
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuração de diretórios para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de cores para todos os ODS
const odsColors = {
  'ods1': { 
    main: '#e5243b', 
    light: '#fad0d6', 
    dark: '#c81c31', 
    title: 'Erradicação da Pobreza'
  },
  'ods2': { 
    main: '#dda63a', 
    light: '#f7ecd5', 
    dark: '#b4871f', 
    title: 'Fome Zero e Agricultura Sustentável'
  },
  'ods3': { 
    main: '#4c9f38', 
    light: '#d8e6d3', 
    dark: '#3b7c2c', 
    title: 'Saúde e Bem-Estar'
  },
  'ods4': { 
    main: '#c5192d', 
    light: '#f5d1d6', 
    dark: '#9c1424', 
    title: 'Educação de Qualidade'
  },
  'ods5': { 
    main: '#ff3a21', 
    light: '#ffd5d0', 
    dark: '#cc2e1a', 
    title: 'Igualdade de Gênero'
  },
  'ods6': { 
    main: '#26bde2', 
    light: '#d1eef7', 
    dark: '#1e97b5', 
    title: 'Água Potável e Saneamento'
  },
  'ods7': { 
    main: '#fcc30b', 
    light: '#fef2cd', 
    dark: '#ca9c09', 
    title: 'Energia Limpa e Acessível'
  },
  'ods8': { 
    main: '#a21942', 
    light: '#e9d0d8', 
    dark: '#821435', 
    title: 'Trabalho Decente e Crescimento Econômico'
  },
  'ods9': { 
    main: '#fd6925', 
    light: '#feddd0', 
    dark: '#ca541e', 
    title: 'Indústria, Inovação e Infraestrutura'
  },
  'ods10': { 
    main: '#dd1367', 
    light: '#f7cedf', 
    dark: '#b10f52', 
    title: 'Redução das Desigualdades'
  },
  'ods11': { 
    main: '#fd9d24', 
    light: '#feebd1', 
    dark: '#ca7e1d', 
    title: 'Cidades e Comunidades Sustentáveis'
  },
  'ods12': { 
    main: '#bf8b2e', 
    light: '#efe6d1', 
    dark: '#996f25', 
    title: 'Consumo e Produção Responsáveis'
  },
  'ods13': { 
    main: '#3f7e44', 
    light: '#d4e5d6', 
    dark: '#326536', 
    title: 'Ação Contra a Mudança Global do Clima'
  },
  'ods14': { 
    main: '#0a97d9', 
    light: '#cde9f6', 
    dark: '#0879ae', 
    title: 'Vida na Água'
  },
  'ods15': { 
    main: '#56c02b', 
    light: '#dbf1d1', 
    dark: '#449a22', 
    title: 'Vida Terrestre'
  },
  'ods16': { 
    main: '#00689d', 
    light: '#cce1eb', 
    dark: '#00537d', 
    title: 'Paz, Justiça e Instituições Eficazes'
  },
  'ods17': { 
    main: '#19486a', 
    light: '#cfd8e2', 
    dark: '#143955', 
    title: 'Parcerias e Meios de Implementação'
  },
  'ods18': { 
    main: '#000000', // Personalizado caso exista um ODS 18
    light: '#d0d0d0', 
    dark: '#000000', 
    title: 'ODS Local'
  }
};

// Função para criar arquivo de cores para cada ODS
function createColorFile(ods, colors) {
  const filePath = path.join(__dirname, '..', 'styles', 'components', `${ods}-colors.css`);
  
  // Verifica se o arquivo já existe, para não sobrescrever personalizações
  if (fs.existsSync(filePath)) {
    console.log(`Arquivo ${ods}-colors.css já existe, pulando...`);
    return;
  }
  
  const content = `/**
 * Cores específicas e personalizações para o ${ods.toUpperCase()} - ${colors.title}
 * Este arquivo contém apenas as cores e personalizações específicas para o ${ods.toUpperCase()}
 * Para ser usado em conjunto com o ods-layout-global.css
 */

:root {
  --${ods}: ${colors.main};
  --${ods}-light: ${colors.light};
  --${ods}-dark: ${colors.dark};
  --${ods}-gradient: linear-gradient(135deg, ${colors.main} 0%, ${colors.dark} 100%);
}

/* Cabeçalho específico para ${ods.toUpperCase()} */
.header-${ods} {
  background-color: var(--${ods});
  background-image: var(--${ods}-gradient);
}

/* Botões e elementos de destaque */
.botao-filtrar.${ods}-botao,
.btn-contribuir.${ods}-botao,
.btn-atualizar.${ods}-botao,
.btn-exportar.${ods}-botao {
  background-color: var(--${ods});
}

.botao-filtrar.${ods}-botao:hover,
.btn-contribuir.${ods}-botao:hover,
.btn-atualizar.${ods}-botao:hover,
.btn-exportar.${ods}-botao:hover {
  background-color: var(--${ods}-dark);
}

/* Botão período ativo */
.botao-periodo.ativo.${ods}-periodo {
  background-color: var(--${ods});
  color: white;
}

/* Cores para títulos de seções */
.secao-recomendacoes h2.${ods}-titulo, 
.secao-acoes-impacto h3.${ods}-titulo,
.visualizacao-comparativa h3.${ods}-titulo {
  color: var(--${ods});
}

/* Cores para links e elementos destacados */
.link-acao.${ods}-link {
  color: var(--${ods});
}

/* Elementos visuais específicos */
.case-tag.${ods}-tag {
  background-color: var(--${ods}-light);
  color: var(--${ods});
}

.metric-value.${ods}-metric {
  color: var(--${ods});
}

/* Foco para acessibilidade específico para ${ods.toUpperCase()} */
.${ods}-page a:focus,
.${ods}-page button:focus,
.${ods}-page input:focus,
.${ods}-page select:focus,
.${ods}-page textarea:focus {
  outline: 3px solid rgba(${hexToRgb(colors.main)}, 0.5);
}

/* Classes específicas para melhor identificação ${ods.toUpperCase()} */
.${ods}-background { background-color: var(--${ods}); }
.${ods}-color { color: var(--${ods}); }
.${ods}-border { border-color: var(--${ods}); }
`;

  fs.writeFileSync(filePath, content);
  console.log(`Arquivo ${ods}-colors.css criado com sucesso!`);
}

// Função para converter hex para RGB
function hexToRgb(hex) {
  // Remove o caractere '#' se existir
  hex = hex.replace(/^#/, '');

  // Analisa o valor hexadecimal
  const bigint = parseInt(hex, 16);
  
  // Extrai os componentes de cor
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return `${r}, ${g}, ${b}`;
}

// Função para atualizar o cabeçalho HTML dos arquivos ODS
function updateOdsHtmlHeader(odsNumber) {
  const ods = `ods${odsNumber}`;
  const filePath = path.join(__dirname, '..', 'painel-ods', `${ods}.html`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Arquivo ${ods}.html não encontrado, pulando...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Encontra a tag head
  const headStart = content.indexOf('<head>');
  const headEnd = content.indexOf('</head>');
  
  if (headStart === -1 || headEnd === -1) {
    console.log(`Não foi possível encontrar as tags head no arquivo ${ods}.html`);
    return;
  }
  
  const headContent = content.substring(headStart, headEnd);
  
  // Novo conteúdo do head
  const newHeadContent = `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Dashboard ${ods.toUpperCase()} - ${odsColors[ods].title} | LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas">
  <!-- Content Security Policy adicionada -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com;
    img-src 'self' data:;
    font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
    connect-src 'self' https://api.mosaicosfuturos.com;
    object-src 'none';
    frame-ancestors 'none';
  ">
  <!-- Headers HTTP adicionais de segurança -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="Referrer-Policy" content="no-referrer">
  <title>${ods.toUpperCase()} - ${odsColors[ods].title} | LIMFS</title>
  
  <!-- CSS Global e Específico -->
  <link rel="stylesheet" href="../styles/global-fonts.css">
  <link rel="stylesheet" href="../styles/global-variables.css">
  <link rel="stylesheet" href="../styles/components/ods-layout-global.css">
  <link rel="stylesheet" href="../styles/components/${ods}-colors.css">
  <link rel="stylesheet" href="../styles/painel-ods.css">
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  
  <!-- Fonte Public Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script type="module" src="../js/painel-ods.js"></script>
  
  <!-- Metadados para compartilhamento social -->
  <meta property="og:title" content="${ods.toUpperCase()} - ${odsColors[ods].title} | LIMFS">
  <meta property="og:description" content="Conheça os indicadores de ${odsColors[ods].title} em Sergipe">
  <meta property="og:image" content="../img/logo-icons-coloridos-${odsNumber}.png">
  <meta property="og:url" content="https://www.mosaicosfuturos.com/painel-ods/${ods}.html">
  <meta name="twitter:card" content="summary_large_image">`;
  
  // Substitui o conteúdo do head
  content = content.replace(content.substring(headStart, headEnd + 7), newHeadContent + '</head>');
  
  // Adiciona classes ao body para o ODS específico
  const bodyRegex = /<body[^>]*>/;
  const bodyMatch = content.match(bodyRegex);
  
  if (bodyMatch && bodyMatch[0]) {
    // Se já tem class, adiciona, senão cria
    if (bodyMatch[0].includes('class="')) {
      content = content.replace(bodyRegex, bodyMatch[0].replace('class="', `class="${ods}-page `));
    } else {
      content = content.replace(bodyRegex, bodyMatch[0].replace('<body', `<body class="${ods}-page"`));
    }
    
    // Adiciona data-pagina se não existir
    if (!bodyMatch[0].includes('data-pagina')) {
      content = content.replace(bodyRegex, bodyMatch[0].replace('>', ` data-pagina="${ods}">`));
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Arquivo ${ods}.html atualizado com sucesso!`);
}

// Função para verificar e criar diretórios necessários
function ensureDirectoriesExist() {
  const dirs = [
    path.join(__dirname, '..', 'styles'),
    path.join(__dirname, '..', 'styles', 'components')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório ${dir} criado.`);
    }
  });
}

// Função principal
function main() {
  try {
    console.log('Iniciando padronização de layout ODS...');
    
    // Cria diretórios necessários
    ensureDirectoriesExist();
    
    // Cria arquivos de cores para cada ODS
    Object.entries(odsColors).forEach(([ods, colors]) => {
      createColorFile(ods, colors);
    });
    
    // Atualiza os cabeçalhos HTML
    for (let i = 1; i <= 18; i++) {
      updateOdsHtmlHeader(i);
    }
    
    console.log('\nPadronização concluída com sucesso!');
    console.log('Para verificar os resultados, acesse os arquivos HTML dos ODS e os novos arquivos CSS.');
    console.log('\nLembre-se de revisar as personalizações específicas de cada ODS que possam ter sido afetadas.');
    
  } catch (error) {
    console.error('Erro durante a padronização:', error);
    process.exit(1);
  }
}

// Executa o script
main();