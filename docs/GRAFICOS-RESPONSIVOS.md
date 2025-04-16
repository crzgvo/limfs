# Guia de Uso: Gráficos Responsivos e Sistema de Cores ODS

*Versão 1.0.0 - Data: 14/04/2025*

Este documento descreve como utilizar o sistema de gráficos responsivos e o esquema de cores padronizado para os Objetivos de Desenvolvimento Sustentável (ODS) no projeto LIMFS.

## Índice
1. [Sistema de Cores dos ODS](#sistema-de-cores-dos-ods)
2. [Módulo de Gráficos Responsivos](#módulo-de-gráficos-responsivos)
3. [Exemplos de Implementação](#exemplos-de-implementação)
4. [Acessibilidade](#acessibilidade)
5. [Exportação de Gráficos](#exportação-de-gráficos)

## Sistema de Cores dos ODS

O arquivo `styles/components/ods-colors.css` define as cores oficiais para cada um dos ODS, seguindo a paleta da ONU. Este sistema inclui:

- Cores primárias para cada ODS
- Variantes claras para fundos e elementos secundários
- Variantes escuras para estados hover/active
- Classes utilitárias para aplicação rápida
- Suporte para modo de alto contraste

### Uso das Cores via CSS

```css
/* Usando variáveis CSS */
.meu-elemento {
  background-color: var(--ods1-color);  /* Cor primária do ODS 1 */
  color: var(--ods1-color-dark);        /* Versão escura para texto */
  border: 1px solid var(--ods1-color-light); /* Versão clara para bordas */
}

/* Usando classes utilitárias */
<div class="bg-ods1">Elemento com fundo do ODS 1</div>
<div class="bg-ods1-light">Elemento com fundo claro do ODS 1</div>
<div class="text-ods1">Texto colorido com a cor do ODS 1</div>
```

### Uso das Cores via JavaScript

```javascript
// Obtendo a cor de um ODS via getComputedStyle
const corOds1 = getComputedStyle(document.documentElement)
  .getPropertyValue('--ods1-color').trim();

// Usando a função auxiliar do módulo de gráficos
import { getOdsColor } from '../modules/graficoResponsivo.js';

const cor = getOdsColor(1);         // Cor primária do ODS 1
const corAlpha = getOdsColor(1, true); // Cor do ODS 1 com transparência
```

## Módulo de Gráficos Responsivos

O módulo `graficoResponsivo.js` fornece funções para criar diferentes tipos de gráficos que são:

- Responsivos para diferentes tamanhos de tela
- Acessíveis para leitores de tela
- Adaptáveis automaticamente a temas claro/escuro
- Compatíveis com a identidade visual dos ODS

### Tipos de Gráficos Disponíveis

1. **Gráficos de Barras**: `criarGraficoBarras()`
2. **Gráficos de Linha**: `criarGraficoLinha()`
3. **Gráficos de Pizza/Donut**: `criarGraficoPizza()`
4. **Gráficos de Radar**: `criarGraficoRadar()`
5. **Gráficos Comparativos**: `criarGraficoComparativo()`

### Exemplo Básico

```javascript
import { criarGraficoLinha, getOdsColor } from '../modules/graficoResponsivo.js';

// Dados para o gráfico
const dados = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Indicador de Pobreza',
      data: [12, 19, 3, 5, 2, 3],
      borderColor: getOdsColor(1),
      backgroundColor: getOdsColor(1, true)
    }
  ]
};

// Criar o gráfico
const grafico = criarGraficoLinha('meu-grafico', dados, {
  tituloGrafico: 'Evolução da Taxa de Pobreza',
  beginAtZero: false
});

// Adicionar descrição acessível
adicionarDescricaoAcessivel('meu-grafico', 
  'Gráfico de linha mostrando a evolução da taxa de pobreza ao longo dos meses, ' +
  'com valores entre 2% e 19%, observando-se uma tendência de queda após fevereiro.');

// Adicionar botão de exportação
adicionarBotaoExportacao('meu-grafico', 'taxa-pobreza');
```

## Exemplos de Implementação

Uma página de demonstração completa está disponível em `/exemplos-graficos.html`. Esta página mostra:

- Diferentes tipos de gráficos
- Uso de cores dos ODS
- Alternância entre temas claro/escuro
- Responsividade em diferentes dispositivos
- Recursos de acessibilidade

Para visualizar os exemplos, acesse `/exemplos-graficos.html` no seu navegador.

## Acessibilidade

O sistema foi desenvolvido seguindo as diretrizes WCAG 2.1, com foco em:

1. **Contraste adequado**: As cores são testadas para garantir contraste suficiente
2. **Texto alternativo**: Descrições automáticas para leitores de tela
3. **Navegação por teclado**: Todos os elementos interativos são acessíveis via teclado
4. **Preferências do usuário**: Respeito ao modo escuro e preferências de movimento reduzido

Para adicionar descrições acessíveis aos gráficos:

```javascript
// Gerar descrição automaticamente com base nos dados
const descricao = gerarDescricaoAcessivel(dados, 'line', 'Evolução da Taxa de Pobreza');
adicionarDescricaoAcessivel('meu-grafico', descricao);

// Ou adicionar descrição personalizada
adicionarDescricaoAcessivel('meu-grafico', 
  'Gráfico de linha mostrando tendência de queda na taxa de pobreza entre 2020 e 2024.');
```

## Exportação de Gráficos

Os usuários podem exportar qualquer gráfico como imagem PNG:

```javascript
// Programaticamente
import { exportarGraficoComoPNG } from '../modules/graficoResponsivo.js';
exportarGraficoComoPNG('meu-grafico', 'grafico-pobreza-2024');

// Via interface do usuário
adicionarBotaoExportacao('meu-grafico', 'grafico-pobreza-2024');
```

---

## Contribuição e Manutenção

Para contribuir com melhorias ou relatar problemas nestes módulos, entre em contato com a equipe do LIMFS ou abra um issue no repositório do projeto.

Última atualização: 14/04/2025