# Documentação da API - LIMFS

## Visão Geral

A API do LIMFS integra múltiplas fontes de dados para fornecer indicadores atualizados dos ODS em Sergipe.

## Endpoints

### IBGE SIDRA

#### Taxa de Pobreza
```http
GET https://apisidra.ibge.gov.br/values/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201
```

**Parâmetros:**
- `n6/28`: Código de Sergipe
- `v/1836`: Variável de pobreza
- `p/last`: Último período disponível

**Resposta:**
```json
[
  {
    "D2N": "2024",
    "D3N": "Total",
    "D4N": "Percentual",
    "V": "8.1"
  }
]
```

#### Taxa de Alfabetização
```http
GET https://apisidra.ibge.gov.br/values/t/7218/n6/28/v/1641/p/last
```

**Resposta:**
```json
[
  {
    "D2N": "2023",
    "V": "88.8"
  }
]
```

### ANEEL

#### Energia Solar
```http
GET https://dadosabertos.aneel.gov.br/api/3/action/datastore_search
```

**Parâmetros:**
```json
{
  "resource_id": "b1bd71e7-d0ad-4214-9053-cbd58e9564a7",
  "q": "Sergipe"
}
```

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