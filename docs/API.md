# Documentação da API - LIMFS

## Visão Geral

A API (ou conjunto de APIs consumidas) pelo LIMFS integra múltiplas fontes de dados para fornecer indicadores atualizados dos ODS em Sergipe. Esta documentação descreve os principais endpoints externos utilizados.

## Endpoints Externos Utilizados

### IBGE SIDRA

API principal do IBGE para dados agregados.

#### Taxa de Pobreza (Exemplo)
```http
GET https://apisidra.ibge.gov.br/values/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201
```

**Parâmetros:**
- `t/6691`: Tabela de origem (PNAD Contínua - Rendimento de todas as fontes)
- `n6/28`: Nível geográfico (N6 = Unidade da Federação) e código (28 = Sergipe)
- `v/1836`: Variável (Pessoas abaixo da linha de extrema pobreza)
- `p/last`: Período (último disponível)
- `c2/6794`: Classificação (Sexo - Total)
- `d/v1836%201`: Formato da variável (valor)

**Resposta Esperada (Exemplo):**
```json
[
  {
    "NC": "Nível Territorial (Código)",
    "NN": "Nível Territorial",
    "MC": "Unidade de Medida (Código)",
    "MN": "Unidade de Medida",
    "V": "Valor",
    "D1C": "Ano (Código)",
    "D1N": "Ano",
    "D2C": "Sexo (Código)",
    "D2N": "Sexo",
    "D3C": "Unidade da Federação (Código)",
    "D3N": "Unidade da Federação",
    "D4C": "Variável (Código)",
    "D4N": "Variável"
  },
  {
    "NC": "3",
    "NN": "Unidade da Federação",
    "MC": "33",
    "MN": "%",
    "V": "8.1", // <- Valor do indicador
    "D1C": "2024",
    "D1N": "2024",
    "D2C": "6794",
    "D2N": "Total",
    "D3C": "28",
    "D3N": "Sergipe",
    "D4C": "1836",
    "D4N": "Pessoas abaixo da linha de extrema pobreza"
  }
]
```

*(Nota: Outros endpoints do SIDRA e ServiceDados são usados para diferentes indicadores, seguindo estrutura similar. Veja `js/atualizar-dados.js` para a lista completa)*

### ANEEL Dados Abertos

API para dados de geração distribuída (energia solar).

#### Geração Distribuída em Sergipe
```http
GET https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=b1bd71e7-d0ad-4214-9053-cbd58e9564a7&q=Sergipe
```

**Parâmetros:**
- `resource_id`: Identificador do conjunto de dados na plataforma.
- `q=Sergipe`: Filtro de busca textual (pode não ser o ideal, verificar se há filtros por UF).

**Resposta Esperada (Estrutura):**
```json
{
  "help": "...",
  "success": true,
  "result": {
    "resource_id": "b1bd71e7-d0ad-4214-9053-cbd58e9564a7",
    "fields": [ ... ],
    "records": [
      {
        "_id": 1,
        "DatGeracaoConjuntoDados": "...",
        "AnmPeriodoReferencia": "...",
        // ... outros campos ...
        "SigUF": "SE", // <- Campo importante para filtrar
        "MdaPotenciaInstaladaKW": "5.5", // <- Potência
        // ... outros campos ...
      },
      // ... mais registros ...
    ],
    "_links": { ... },
    "total": 14200 // Exemplo de total de registros para Sergipe
  }
}
```

*(Nota: A qualidade e estrutura dos dados da ANEEL podem variar. O script `atualizar-dados.js` realiza o processamento necessário.)*

## Estrutura de Dados

### Formato JSON Local

#### Estrutura Base
```json
{
  "dados": {
    "valor": number,
    "ano": number,
    "detalhes": Object
  },
  "ultimaAtualizacao": string,
  "fonte": string
}
```

#### Exemplo (educacao.json)
```json
{
  "dados": {
    "valor": 88.8,
    "ano": 2023,
    "detalhes": {
      "faixa_etaria": "15 anos ou mais",
      "metodologia": "PNAD Contínua"
    }
  },
  "ultimaAtualizacao": "2024-04-12T10:00:00Z",
  "fonte": "IBGE - PNAD Contínua Educação"
}
```

## Cache e Persistência

### localStorage

#### Formato de Cache
```javascript
{
  chave: `ods_sergipe_${endpoint}`,
  valor: {
    dados: Object,
    timestamp: number,
    expiracao: number
  }
}
```

#### Exemplo
```javascript
{
  chave: "ods_sergipe_educacao",
  valor: {
    dados: {
      valor: 88.8,
      ano: 2023
    },
    timestamp: 1681296000000,
    expiracao: 86400000
  }
}
```

## Política de Rate Limiting

### IBGE
- 100 requests/minuto por IP
- Timeout padrão: 10s
- Retry após: 60s

### ANEEL
- 50 requests/minuto por IP
- Timeout padrão: 8s
- Retry após: 120s

## Tratamento de Erros

### Códigos HTTP

- 200: Sucesso
- 304: Não modificado (cache válido)
- 400: Requisição inválida
- 404: Dados não encontrados
- 429: Limite de requisições excedido
- 500: Erro interno do servidor

### Formato de Erro
```json
{
  "erro": {
    "codigo": string,
    "mensagem": string,
    "timestamp": string,
    "detalhes": Object
  }
}
```

## Circuit Breaker

### Configuração
```javascript
{
  falhas_consecutivas_max: 5,
  periodo_pausa: 300000,
  periodo_verificacao: 60000
}
```

### Estados
```javascript
{
  ativo: boolean,
  falhas: number,
  ultima_falha: string,
  pausa_ate: string
}
```

## Monitoramento

### Métricas Coletadas
```javascript
{
  endpoint: string,
  tempo_resposta: number,
  status: string,
  timestamp: string,
  cache_hit: boolean
}
```

### Log de Erros
```javascript
{
  nivel: "ERROR" | "CRITICAL",
  mensagem: string,
  timestamp: string,
  contexto: {
    endpoint: string,
    tentativa: number,
    erro: string
  }
}
```

## Exemplos de Uso

### JavaScript

```javascript
// Buscar dados de um indicador
async function buscarIndicador(endpoint) {
  try {
    const dados = await buscarDadosAPI(endpoint);
    return dados;
  } catch (erro) {
    console.error(`Erro ao buscar ${endpoint}:`, erro);
    return null;
  }
}

// Exportar dados para CSV
function exportarDados(endpoint) {
  const dados = verificarCacheLocal(endpoint);
  if (dados) {
    downloadCSV(dados, `${endpoint}.csv`);
  }
}
```

### Exemplos de URLs

#### Desenvolvimento
```
http://localhost:8080/dados/indicadores/educacao.json
http://localhost:8080/dados/indicadores/pobreza.json
```

#### Produção
```
https://api.mosaicosfuturos.com/v1/indicadores/educacao
https://api.mosaicosfuturos.com/v1/indicadores/pobreza
```

## Versionamento

A API segue versionamento semântico (MAJOR.MINOR.PATCH).

### Compatibilidade

- MAJOR: Mudanças incompatíveis
- MINOR: Novas funcionalidades compatíveis
- PATCH: Correções de bugs

## Suporte

### Contato
- Email: api@limfs.com.br
- Discord: discord.gg/limfs
- GitHub: github.com/limfs/api

### Status
- Status da API: https://status.limfs.com.br
- Documentação: https://docs.limfs.com.br
- Changelog: https://github.com/limfs/changelog