# 📊 Validação Técnica do Dashboard Comparativo Dinâmico (ODS)

Este documento apresenta instruções detalhadas para validar tecnicamente a implementação do Dashboard Comparativo Dinâmico de Objetivos de Desenvolvimento Sustentável (ODS), conforme as etapas definidas no plano de validação.

## 📋 Índice das Validações

1. [Validação da Função `gerarGraficoComparativo`](#1-validação-da-função-gerargraficocomparativo)
2. [Validação da Estrutura do JSON Centralizado](#2-validação-da-estrutura-do-json-centralizado)
3. [Validação de Acessibilidade (WCAG 2.1)](#3-validação-de-acessibilidade-wcag-21)
4. [Validação de Segurança (CSP)](#4-validação-de-segurança-csp)
5. [Validação do Sistema de Cache Local com TTL](#5-validação-do-sistema-de-cache-local-com-ttl)
6. [Validação de Escalabilidade (Inclusão de Novo ODS)](#6-validação-de-escalabilidade-inclusão-de-novo-ods)

## 🚀 Como Executar as Validações

Para cada uma das validações técnicas, siga as instruções detalhadas abaixo:

---

### 1. Validação da Função `gerarGraficoComparativo`

#### Objetivo
Garantir que a função JavaScript responsável pela geração dinâmica do gráfico comparativo esteja funcionando corretamente.

#### Passos para Execução

1. Abra o painel ODS no navegador (por exemplo: `http://localhost/painel-ods/index.html`).
2. Abra o console JavaScript do navegador (F12 → Console).
3. Execute o seguinte comando para carregar o script de validação:

```javascript
const script = document.createElement('script');
script.src = '/scripts/tests/test-grafico-comparativo.js';
document.head.appendChild(script);
```

**Alternativa:** Cole diretamente o conteúdo do arquivo `/scripts/tests/test-grafico-comparativo.js` no console.

#### Resultado Esperado
- Um gráfico comparativo deve ser gerado exibindo as linhas dos ODS 1, 4 e 5.
- O console deve exibir uma série de mensagens com ✅ indicando sucesso na geração do gráfico.

---

### 2. Validação da Estrutura do JSON Centralizado

#### Objetivo
Verificar se todos os ODS e indicadores têm endpoints válidos configurados no arquivo `ods-config.json`.

#### Passos para Execução

1. Abra o painel ODS no navegador.
2. Abra o console JavaScript do navegador (F12 → Console).
3. Execute o seguinte comando:

```javascript
const script = document.createElement('script');
script.src = '/scripts/validar-estrutura-ods.js';
document.head.appendChild(script);
```

#### Resultado Esperado
- O console mostrará uma lista de todos os ODS e seus indicadores, verificando se cada indicador possui endpoints válidos.
- Ao final, um resumo indicará se todos os indicadores possuem endpoints válidos.

---

### 3. Validação de Acessibilidade (WCAG 2.1)

#### Objetivo
Garantir que o painel e gráficos sejam acessíveis para usuários com deficiência, conforme WCAG 2.1.

#### Método 1: Utilizando o Script de Validação

1. Abra o painel ODS no navegador.
2. Abra o console JavaScript do navegador (F12 → Console).
3. Execute o seguinte comando:

```javascript
const script = document.createElement('script');
script.src = '/scripts/validar-acessibilidade.js';
document.head.appendChild(script);
```

#### Método 2: Utilizando o Lighthouse (recomendado para validação completa)

1. Abra o painel ODS no Google Chrome.
2. Pressione F12 para abrir o DevTools.
3. Clique na aba "Lighthouse".
4. Marque a opção "Accessibility".
5. Clique em "Generate report".

#### Resultado Esperado
- O script de validação verificará:
  - Uso de aria-label em elementos canvas (gráficos)
  - Presença de textos alternativos em imagens
  - Navegação por teclado
- O relatório do Lighthouse deve apresentar uma pontuação de acessibilidade de pelo menos 80/100.

---

### 4. Validação de Segurança (CSP)

#### Objetivo
Garantir que a Content Security Policy (CSP) esteja corretamente implementada e não haja violações.

#### Passos para Execução

1. Abra o painel ODS no navegador.
2. Abra o console JavaScript do navegador (F12 → Console).
3. Execute o seguinte comando:

```javascript
const script = document.createElement('script');
script.src = '/scripts/validar-csp.js';
document.head.appendChild(script);
```

#### Resultado Esperado
- O script verificará se há uma política CSP implementada via meta tag ou cabeçalho HTTP.
- Ele analisará as diretivas existentes e alertará sobre possíveis problemas de segurança.
- O console não deve mostrar erros relacionados a violações de CSP durante o uso normal do painel.

---

### 5. Validação do Sistema de Cache Local com TTL

#### Objetivo
Garantir que o cache com Time To Live (TTL) esteja funcionando corretamente.

#### Passos para Execução

1. Abra o painel ODS no navegador.
2. Abra o console JavaScript do navegador (F12 → Console).
3. Execute o seguinte comando:

```javascript
const script = document.createElement('script');
script.src = '/scripts/testar-cache-local.js';
document.head.appendChild(script);
```

#### Resultado Esperado
- O script executará três testes:
  1. Armazenamento e recuperação imediata
  2. Verificação de expiração do TTL (após 5 segundos)
  3. Sobrescrever valor em cache existente
- Ao final, um resumo mostrará se todos os testes foram bem-sucedidos.

---

### 6. Validação de Escalabilidade (Inclusão de Novo ODS)

#### Objetivo
Verificar se o sistema permite facilmente adicionar novos ODS sem modificar o código JavaScript principal.

#### Passos para Execução

1. Abra o painel ODS no navegador.
2. Abra o console JavaScript do navegador (F12 → Console).
3. Execute o seguinte comando:

```javascript
const script = document.createElement('script');
script.src = '/scripts/validar-escalabilidade-ods.js';
document.head.appendChild(script);
```

#### Resultado Esperado
- O script verificará se o sistema utiliza uma configuração centralizada para ODS.
- Simulará a adição de um novo ODS (ODS 13 - Ação contra a Mudança Global do Clima).
- Verificará se as funções necessárias para lidar com o novo ODS existem no sistema.
- Ao final, apresentará os passos necessários para adicionar efetivamente o novo ODS.

---

## 📝 Registro de Resultados das Validações

Recomenda-se criar um documento para registrar os resultados de cada validação:

| Validação | Data | Resultado | Observações |
|-----------|------|-----------|-------------|
| Função JS | | | |
| JSON Centralizado | | | |
| Acessibilidade | | | |
| Segurança CSP | | | |
| Cache Local | | | |
| Escalabilidade | | | |

## 🔍 Próximos Passos

Após concluir todas as validações:

1. Corrija eventuais erros ou problemas identificados durante as validações.
2. Documente as correções realizadas.
3. Execute novamente as validações para confirmar que os problemas foram resolvidos.
4. Publique as atualizações no ambiente de testes para validação final com usuários reais.

---

**Data da Validação:** ____/____/________

**Responsável pela Validação:** ____________________________