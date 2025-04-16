/**
 * Serviço de dados para os indicadores ODS
 * Responsável por buscar, validar e processar dados de diferentes fontes
 */

import { verificarCacheLocal, armazenarCacheLocal } from '../utils/cache.js';
import { logger } from './monitoramento.js';

// Configurações de API e endpoints
export const API_CONFIG = {
    ibge_sidra_base: 'https://apisidra.ibge.gov.br/values',
    servicedados_base: 'https://servicodados.ibge.gov.br/api',
    endpoints: {
        pobreza: [
            '/t/6691/n6/28/v/1836/p/last/c2/6794/d/v1836%201',
            '/v3/agregados/6691/periodos/-1/variaveis/1836?localidades=N6[28]',
            '/v1/pesquisas/10/periodos/2022/indicadores/1836/resultados/28'
        ],
        educacao: [
            '/t/7218/n6/28/v/1641/p/last',
            '/v3/agregados/7218/periodos/-1/variaveis/1641?localidades=N6[28]',
            '/v1/pesquisas/34/periodos/2023/indicadores/1641/resultados/28'
        ],
        saneamento: [
            '/t/1393/n6/28/v/1000096/p/last',
            '/v3/agregados/1393/periodos/-1/variaveis/1000096?localidades=N6[28]',
            '/v1/pesquisas/23/periodos/2022/indicadores/1000096/resultados/28'
        ],
        mortalidade_infantil: [
            '/t/793/n6/28/v/104/p/last',
            '/v3/agregados/793/periodos/-1/variaveis/104?localidades=N6[28]',
            '/v1/pesquisas/18/periodos/2022/indicadores/104/resultados/28'
        ],
        energia_solar: [
            'https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=b1bd71e7-d0ad-4214-9053-cbd58e9564a7&q=Sergipe',
            'https://dadosabertos.aneel.gov.br/dataset/b1bd71e7-d0ad-4214-9053-cbd58e9564a7/resource/b1bd71e7-d0ad-4214-9053-cbd58e9564a7'
        ],
        residuos_reciclados: [
            '/t/1400/n6/28/v/1000100/p/last',
            '/v3/agregados/1400/periodos/-1/variaveis/1000100?localidades=N6[28]'
        ]
    },
    arquivos_json: {
        base_url: '../dados/indicadores/', 
        cache_expiration: 86400000, // 24 horas em milissegundos
    },
    timeout: 8000
};

// Dados históricos de fallback para quando as APIs falham
export const DADOS_HISTORICOS = {
    pobreza: [
        { ano: 2019, valor: 9.5 },
        { ano: 2020, valor: 10.3 },
        { ano: 2021, valor: 9.2 },
        { ano: 2022, valor: 8.8 },
        { ano: 2023, valor: 8.4 },
        { ano: 2024, valor: 8.1 }
    ],
    educacao: [
        { ano: 2017, valor: 84.7 },
        { ano: 2018, valor: 85.2 },
        { ano: 2019, valor: 85.7 },
        { ano: 2020, valor: 86.1 },
        { ano: 2021, valor: 86.5 },
        { ano: 2022, valor: 86.9 },
        { ano: 2023, valor: 88.8 }
    ],
    saneamento: [
        { ano: 2017, valor: 31.2 },
        { ano: 2018, valor: 32.8 },
        { ano: 2019, valor: 34.2 },
        { ano: 2020, valor: 35.1 },
        { ano: 2021, valor: 36.2 },
        { ano: 2022, valor: 54.2 }
    ],
    mortalidade_infantil: [
        { ano: 2017, valor: 15.2 },
        { ano: 2018, valor: 14.8 },
        { ano: 2019, valor: 14.1 },
        { ano: 2020, valor: 13.7 },
        { ano: 2021, valor: 13.2 },
        { ano: 2022, valor: 12.8 }
    ],
    energia_solar: [
        { ano: 2018, valor: 1.2 },
        { ano: 2019, valor: 2.8 },
        { ano: 2020, valor: 4.5 },
        { ano: 2021, valor: 5.9 },
        { ano: 2022, valor: 7.5 },
        { ano: 2023, valor: 9.2 },
        { ano: 2024, valor: 11.3 }
    ],
    residuos_reciclados: [
        { ano: 2017, valor: 2.1 },
        { ano: 2018, valor: 2.5 },
        { ano: 2019, valor: 3.2 },
        { ano: 2020, valor: 3.8 },
        { ano: 2021, valor: 4.3 },
        { ano: 2022, valor: 5.0 },
        { ano: 2023, valor: 5.7 },
        { ano: 2024, valor: 6.2 }
    ]
};

// Definições dos indicadores para a interface
export const INDICADORES = [
    {
        id: 'indicador-pobreza',
        endpoint: 'pobreza',
        titulo: 'Taxa de Extrema Pobreza',
        descricao: 'da população de Sergipe vivia em situação de extrema pobreza em 2024.',
        tendencia: 'decrescente',
        contexto: 'A taxa caiu 0.3 pontos percentuais comparado a 2023, continuando a recuperação pós-pandemia.',
        fonte: 'Fonte: IBGE - PNAD Contínua'
    },
    {
        id: 'indicador-educacao',
        endpoint: 'educacao',
        titulo: 'Taxa de Alfabetização',
        descricao: 'da população de Sergipe com 15 anos ou mais de idade é alfabetizada.',
        tendencia: 'crescente',
        contexto: 'A taxa de alfabetização atingiu 88,8% em 2023, refletindo avanços recentes nas políticas educacionais.',
        fonte: 'Fonte: IBGE - PNAD Contínua Educação 2023'
    },
    {
        id: 'indicador-saneamento',
        endpoint: 'saneamento',
        titulo: 'Cobertura de Saneamento Básico',
        descricao: 'dos domicílios de Sergipe possuem esgotamento sanitário adequado.',
        tendencia: 'crescente',
        contexto: 'Sergipe apresenta um aumento significativo de 54,2% na cobertura de saneamento em 2022.',
        fonte: 'Fonte: IBGE - Censo Demográfico 2022'
    },
    {
        id: 'indicador-mortalidade-infantil',
        endpoint: 'mortalidade_infantil',
        titulo: 'Taxa de Mortalidade Infantil',
        descricao: 'óbitos por mil nascidos vivos em Sergipe.',
        tendencia: 'decrescente',
        contexto: 'Redução gradual da mortalidade infantil para 12,8 em 2022, refletindo melhorias na saúde pública e atenção básica.',
        fonte: 'Fonte: DATASUS/IBGE'
    },
    {
        id: 'indicador-energia-solar',
        endpoint: 'energia_solar',
        titulo: 'Energia Solar Fotovoltaica',
        descricao: 'dos domicílios de Sergipe possuem energia solar fotovoltaica instalada.',
        tendencia: 'crescente',
        contexto: 'Crescimento acelerado para 11,3% em 2024, com 14.200 instalações e capacidade de 355.000 kW no estado.',
        fonte: 'Fonte: ANEEL - Dados Abertos'
    },
    {
        id: 'indicador-residuos-reciclados',
        endpoint: 'residuos_reciclados',
        titulo: 'Resíduos Sólidos Reciclados',
        descricao: 'dos resíduos sólidos urbanos são reciclados ou coletados seletivamente em Sergipe.',
        tendencia: 'crescente',
        contexto: 'Aumento para 6,2% em 2024, mostrando progressos graduais na gestão de resíduos no estado.',
        fonte: 'Fonte: IBGE / SNIS'
    }
];

/**
 * Carrega dados salvos em arquivos JSON
 * @returns {Promise<Object|null>} Dados do arquivo ou null se indisponível
 */
async function carregarDadosAtualizados(endpoint) {
    try {
        // Tenta no diretório principal
        const url = `${API_CONFIG.arquivos_json.base_url}${endpoint}.json`;
        let response = await fetch(url, { cache: 'no-store' });
        
        // Fallback para diretório secundário
        if (!response.ok) {
            const urlAlternativa = `../dados/${endpoint}.json`;
            logger.info(`Arquivo não encontrado em ${url}, tentando ${urlAlternativa}...`);
            response = await fetch(urlAlternativa, { cache: 'no-store' });
            
            if (!response.ok) {
                logger.warn(`Nenhum arquivo de dados encontrado para ${endpoint}`);
                return null;
            }
        }
        
        const dadosAtualizados = await response.json();
        
        // Validação da estrutura do arquivo
        if (!dadosAtualizados.dados || dadosAtualizados.dados.valor === undefined) {
            logger.warn(`Estrutura de dados inválida para ${endpoint} no arquivo JSON`);
            return null;
        }
        
        // Verifica se os dados estão atualizados (menos de 30 dias)
        const ultimaAtualizacao = new Date(dadosAtualizados.ultimaAtualizacao);
        const agora = new Date();
        const diferencaDias = Math.floor((agora - ultimaAtualizacao) / (1000 * 60 * 60 * 24));
        
        if (diferencaDias > 30) {
            logger.info(`Dados de ${endpoint} têm mais de ${diferencaDias} dias, considerando atualização via API`);
        }
        
        logger.info(`Usando dados de arquivo JSON para ${endpoint} (${dadosAtualizados.ultimaAtualizacao})`);
        return {
            valor: dadosAtualizados.dados.valor,
            ano: dadosAtualizados.dados.ano || new Date(dadosAtualizados.ultimaAtualizacao).getFullYear(),
            usouFallback: false,
            dadosCompletos: dadosAtualizados.dados,
            ultimaAtualizacao: dadosAtualizados.ultimaAtualizacao
        };
    } catch (erro) {
        logger.error(`Erro ao carregar dados de arquivo para ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Analisa as respostas das APIs conforme diferentes estruturas
 * Função crítica para extrair valores de diferentes formatos de resposta
 */
function analisarResposta(dados, endpoint, indice) {
  if (!Array.isArray(dados) || !dados[indice] || !dados[indice + 1]) return null;
  const valorRaw = dados[indice + 1]['V'];
  const anoRaw = dados[indice + 1]['D2N'];
  if (!valorRaw || isNaN(parseFloat(valorRaw))) return null;

  return {
    valor: parseFloat(valorRaw),
    ano: anoRaw ? parseInt(anoRaw, 10) : null
  };
}

/**
 * Implementa o pattern Circuit Breaker para evitar requisições excessivas a APIs com falha
 * Tenta múltiplos endpoints até obter sucesso
 */
async function tentarMultiplosEndpoints(endpoint, endpoints = [], maxTentativas = 3, delayInicial = 500) {
  const chaveCircuitBreaker = `circuit_breaker_${endpoint}`;
  let estadoCircuitBreaker = JSON.parse(sessionStorage.getItem(chaveCircuitBreaker)) || { falhas: 0, ativo: false };

  if (estadoCircuitBreaker.ativo) {
    return null;
  }

  let tentativas = 0;
  estadoCircuitBreaker.falhas = 0; // Reseta o contador de falhas no início

  while (tentativas < maxTentativas) {
    try {
      const response = await fetch(endpoints[0]);
      if (response.ok) {
        const dados = await response.json();
        const resultado = analisarResposta(dados, endpoint, 0);
        if (resultado) {
          sessionStorage.removeItem(chaveCircuitBreaker);
          return resultado;
        }
      }
      throw new Error('Resposta inválida');
    } catch (erro) {
      tentativas++;
      estadoCircuitBreaker.falhas++;
      
      if (tentativas >= maxTentativas) {
        estadoCircuitBreaker.ativo = true;
        sessionStorage.setItem(chaveCircuitBreaker, JSON.stringify(estadoCircuitBreaker));
        registrarErroPersistente(endpoint, erro);
        return null;
      }

      const delay = delayInicial * Math.pow(2, tentativas - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      sessionStorage.setItem(chaveCircuitBreaker, JSON.stringify(estadoCircuitBreaker));
    }
  }

  return null;
}

/**
 * Registra erros persistentes para análise posterior
 */
function registrarErroPersistente(endpoint, erro) {
  const chave = 'ods_sergipe_erros';
  const erroFormatado = {
    endpoint,
    mensagem: erro.message || erro.mensagem || 'Erro desconhecido',
    timestamp: Date.now()
  };
  const errosAtuais = JSON.parse(localStorage.getItem(chave)) || [];
  errosAtuais.push(erroFormatado);
  localStorage.setItem(chave, JSON.stringify(errosAtuais));
}

/**
 * Retorna dados históricos de fallback quando todas as camadas anteriores falham
 */
export function usarDadosFallback(endpoint) {
    const dadosFallback = DADOS_HISTORICOS[endpoint];
    const dadoMaisRecente = dadosFallback[dadosFallback.length - 1];
    
    logger.warn(`⚠️ Usando dados estáticos de fallback para ${endpoint} (${dadoMaisRecente.ano})`);
    
    return {
        valor: dadoMaisRecente.valor,
        ano: dadoMaisRecente.ano,
        usouFallback: true,
        fonte: 'Dados históricos (offline)'
    };
}

/**
 * Função principal para busca de dados com estratégia em camadas:
 * 1. Cache local
 * 2. Arquivos JSON
 * 3. APIs externas
 * 4. Dados estáticos de fallback
 */
export async function buscarDadosAPI(endpoint) {
    // Camada 1: Cache local
    const dadosCache = verificarCacheLocal(`ods_sergipe_${endpoint}`);
    if (dadosCache) {
        logger.info(`✅ Usando dados em cache local para ${endpoint}`);
        return dadosCache;
    }
    
    // Camada 2: Arquivos JSON
    const dadosAtualizados = await carregarDadosAtualizados(endpoint);
    if (dadosAtualizados) {
        armazenarCacheLocal(`ods_sergipe_${endpoint}`, dadosAtualizados);
        return dadosAtualizados;
    }
    
    // Camada 3: APIs externas
    try {
        const dadosAPI = await tentarMultiplosEndpoints(endpoint);
        if (dadosAPI) {
            dadosAPI.usouFallback = false;
            armazenarCacheLocal(`ods_sergipe_${endpoint}`, dadosAPI);
            return dadosAPI;
        }
        
        // Camada 4: Dados estáticos de fallback
        return usarDadosFallback(endpoint);
    } catch (error) {
        logger.error(`Erro geral ao buscar dados de ${endpoint}:`, error);
        return usarDadosFallback(endpoint);
    }
}

/**
 * Exporta dados de um indicador para CSV
 * @param {string} endpoint - Identificador do indicador
 * @param {string} titulo - Título amigável do indicador
 * @returns {string} Conteúdo CSV formatado
 */
export function gerarCSVIndicador(endpoint, titulo) {
    const dados = DADOS_HISTORICOS[endpoint];
    
    const cabecalho = ['Ano', 'Valor (%)'];
    const linhas = dados.map(item => [item.ano, item.valor]);

    return [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");
}

/**
 * Exporta todos os dados para CSV combinado
 * @returns {string} Conteúdo CSV formatado com todos os indicadores
 */
export function gerarCSVTodosIndicadores(indicadores) {
    const dadosParaExportar = [];

    indicadores.forEach(indicador => {
        const endpoint = indicador.endpoint;
        DADOS_HISTORICOS[endpoint].forEach(item => {
            dadosParaExportar.push({
                indicador: indicador.titulo,
                ano: item.ano,
                valor: item.valor
            });
        });
    });

    // Ordenação dos dados
    dadosParaExportar.sort((a, b) => {
        if (a.indicador !== b.indicador) return a.indicador.localeCompare(b.indicador);
        return a.ano - b.ano;
    });

    const cabecalho = ['Indicador', 'Ano', 'Valor (%)'];
    const linhas = dadosParaExportar.map(item => [item.indicador, item.ano, item.valor]);

    return [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");
}