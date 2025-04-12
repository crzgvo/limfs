/**
 * Painel ODS Sergipe - Sistema de visualização de indicadores da Agenda 2030
 * Responsável por carregar, exibir e atualizar os dados dos indicadores no front-end
 */

// Configurações de API e endpoints
const API_CONFIG = {
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
const DADOS_HISTORICOS = {
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

// Cores oficiais dos ODS conforme identidade visual da ONU
const CORES_ODS = {
    pobreza: {
        cor: '#E5243B',
        corSecundaria: 'rgba(229, 36, 59, 0.2)',
        nomeLegenda: 'Extrema Pobreza'
    },
    educacao: {
        cor: '#C5192D',
        corSecundaria: 'rgba(197, 25, 45, 0.2)',
        nomeLegenda: 'Alfabetização'
    },
    saneamento: {
        cor: '#26BDE2',
        corSecundaria: 'rgba(38, 189, 226, 0.2)',
        nomeLegenda: 'Saneamento Básico'
    },
    mortalidade_infantil: {
        cor: '#4C9F38',
        corSecundaria: 'rgba(76, 159, 56, 0.2)',
        nomeLegenda: 'Mortalidade Infantil'
    },
    energia_solar: {
        cor: '#FCC30B',
        corSecundaria: 'rgba(252, 195, 11, 0.2)',
        nomeLegenda: 'Energia Solar'
    },
    residuos_reciclados: {
        cor: '#FD9D24',
        corSecundaria: 'rgba(253, 157, 36, 0.2)',
        nomeLegenda: 'Resíduos Reciclados'
    }
};

// Descrições explicativas para cada indicador (tooltips)
const TOOLTIPS = {
    pobreza: "Percentual da população vivendo com menos de R$ 182 por mês (linha de extrema pobreza definida pelo Banco Mundial).",
    educacao: "Percentual da população com 15 anos ou mais de idade que sabe ler e escrever.",
    saneamento: "Percentual de domicílios que possuem acesso à rede geral de esgotamento sanitário.",
    mortalidade_infantil: "Número de óbitos de crianças menores de 1 ano de idade por mil nascidos vivos.",
    energia_solar: "Percentual de domicílios que possuem sistemas de energia solar fotovoltaica instalada.",
    residuos_reciclados: "Percentual do total de resíduos sólidos urbanos que são coletados seletivamente e reciclados."
};

// Definições dos indicadores exibidos
const INDICADORES = [
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
            console.log(`Arquivo não encontrado em ${url}, tentando ${urlAlternativa}...`);
            response = await fetch(urlAlternativa, { cache: 'no-store' });
            
            if (!response.ok) {
                console.log(`Nenhum arquivo de dados encontrado para ${endpoint}`);
                return null;
            }
        }
        
        const dadosAtualizados = await response.json();
        
        // Validação da estrutura do arquivo
        if (!dadosAtualizados.dados || dadosAtualizados.dados.valor === undefined) {
            console.warn(`Estrutura de dados inválida para ${endpoint} no arquivo JSON`);
            return null;
        }
        
        // Verifica se os dados estão atualizados (menos de 30 dias)
        const ultimaAtualizacao = new Date(dadosAtualizados.ultimaAtualizacao);
        const agora = new Date();
        const diferencaDias = Math.floor((agora - ultimaAtualizacao) / (1000 * 60 * 60 * 24));
        
        if (diferencaDias > 30) {
            console.log(`Dados de ${endpoint} têm mais de ${diferencaDias} dias, considerando atualização via API`);
        }
        
        console.log(`Usando dados de arquivo JSON para ${endpoint} (${dadosAtualizados.ultimaAtualizacao})`);
        return {
            valor: dadosAtualizados.dados.valor,
            ano: dadosAtualizados.dados.ano || new Date(dadosAtualizados.ultimaAtualizacao).getFullYear(),
            usouFallback: false,
            dadosCompletos: dadosAtualizados.dados,
            ultimaAtualizacao: dadosAtualizados.ultimaAtualizacao
        };
    } catch (erro) {
        console.warn(`Erro ao carregar dados de arquivo para ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Gerencia cache local para reduzir requisições repetidas
 */
function armazenarCacheLocal(endpoint, dados) {
    try {
        const chaveCache = `ods_sergipe_${endpoint}`;
        const dadosCache = {
            timestamp: new Date().getTime(),
            dados: dados
        };
        
        localStorage.setItem(chaveCache, JSON.stringify(dadosCache));
        return true;
    } catch (erro) {
        console.warn(`Erro ao armazenar cache local para ${endpoint}:`, erro);
        return false;
    }
}

/**
 * Verifica a validade do cache local antes de fazer requisições
 */
function verificarCacheLocal(endpoint) {
    try {
        const chaveCache = `ods_sergipe_${endpoint}`;
        const cacheString = localStorage.getItem(chaveCache);
        
        if (!cacheString) {
            return null;
        }
        
        const cache = JSON.parse(cacheString);
        const agora = new Date().getTime();
        
        if ((agora - cache.timestamp) < API_CONFIG.arquivos_json.cache_expiration) {
            console.log(`Usando cache local para ${endpoint}`);
            return cache.dados;
        } else {
            console.log(`Cache local para ${endpoint} expirou`);
            localStorage.removeItem(chaveCache);
            return null;
        }
    } catch (erro) {
        console.warn(`Erro ao verificar cache local para ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Analisa as respostas das APIs conforme diferentes estruturas
 * Função crítica para extrair valores de diferentes formatos de resposta
 */
function analisarResposta(data, endpoint, endpointIndex) {
    try {
        let valor = null;
        let ano = new Date().getFullYear();

        if (endpoint !== 'energia_solar') {
            // Processamento para APIs do IBGE
            if (endpointIndex === 0) {
                // Formato SIDRA
                if (data && data.length > 0 && data[1]) {
                    valor = parseFloat(data[1].V || data[1].valor || '0');
                    const periodoInfo = data[1].D2N || data[1].D3N;
                    if (periodoInfo) {
                        ano = parseInt(periodoInfo);
                    }
                }
            } else if (endpointIndex === 1) {
                // Formato servicodados v3
                if (data && data[0]?.resultados?.[0]?.series?.[0]?.serie) {
                    const serie = data[0].resultados[0].series[0].serie;
                    const ultimoPeriodo = Object.keys(serie).sort().pop();
                    valor = parseFloat(serie[ultimoPeriodo] || '0');
                    ano = parseInt(ultimoPeriodo) || ano;
                }
            } else if (endpointIndex === 2) {
                // Formato servicodados v1
                if (data && data[0]?.res) {
                    const res = data[0].res;
                    const ultimoPeriodo = Object.keys(res).sort().pop();
                    valor = parseFloat(res[ultimoPeriodo] || '0');
                    ano = parseInt(ultimoPeriodo) || ano;
                }
            }
        } else {
            // Processamento específico para dados da ANEEL
            if (data && data.result?.records) {
                const records = data.result.records;
                const totalInstalacoes = records.length;
                const capacidadeTotal = records.reduce(
                    (acc, item) => acc + parseFloat(item.PotenciaKW || item.Potência || 0), 0
                );
                
                valor = parseFloat(((totalInstalacoes / 14200) * 11.3).toFixed(1));
                
                const dadosCompletos = {
                    instalacoes: totalInstalacoes,
                    capacidadeKW: capacidadeTotal.toFixed(2)
                };
                
                return {
                    valor: valor,
                    ano: ano,
                    dadosCompletos: dadosCompletos
                };
            }
        }

        if (valor === null || isNaN(valor)) {
            console.warn(`Não foi possível extrair um valor válido da resposta para ${endpoint}`);
            return null;
        }

        return {
            valor: valor,
            ano: ano
        };
    } catch (erro) {
        console.error(`Erro ao analisar resposta da API para ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Implementa o pattern Circuit Breaker para evitar requisições excessivas a APIs com falha
 * Tenta múltiplos endpoints até obter sucesso
 */
async function tentarMultiplosEndpoints(endpoint) {
    // Verificação de circuit breaker
    const circuitBreakerKey = `circuit_breaker_${endpoint}`;
    const circuitBreakerData = sessionStorage.getItem(circuitBreakerKey);
    
    if (circuitBreakerData) {
        const { timestamp, falhas } = JSON.parse(circuitBreakerData);
        const tempoDecorrido = Date.now() - timestamp;
        
        // Circuito aberto: muitas falhas recentes
        if (falhas >= 3 && tempoDecorrido < 300000) { // 5 minutos
            console.log(`🔄 Circuit breaker ativo para ${endpoint}. Usando dados de fallback.`);
            return null;
        }
        
        // Reset após período de espera
        if (tempoDecorrido > 300000) {
            sessionStorage.removeItem(circuitBreakerKey);
        }
    }
    
    // Verificação de endpoints disponíveis
    const endpointsDisponiveis = API_CONFIG.endpoints[endpoint] || [];
    if (endpointsDisponiveis.length === 0) {
        console.error(`Nenhum endpoint configurado para ${endpoint}`);
        return null;
    }

    let falhas = 0;
    
    // Tenta cada endpoint em sequência
    for (let i = 0; i < endpointsDisponiveis.length; i++) {
        try {
            let url = endpointsDisponiveis[i];
            
            // Constrói URL completa quando necessário
            if (url.startsWith('/t/')) {
                url = API_CONFIG.ibge_sidra_base + url;
            } else if (url.startsWith('/v')) {
                url = API_CONFIG.servicedados_base + url;
            }
            
            console.log(`Tentando endpoint ${i+1}/${endpointsDisponiveis.length} para ${endpoint}: ${url}`);
            
            // Implementa timeout para evitar bloqueios
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Status HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Processa os dados recebidos
            const dadosAnalisados = analisarResposta(data, endpoint, i);
            if (dadosAnalisados) {
                // Limpa o circuit breaker em caso de sucesso
                sessionStorage.removeItem(circuitBreakerKey);
                return dadosAnalisados;
            }
        } catch (erro) {
            console.warn(`Falha no endpoint ${i+1} para ${endpoint}:`, erro.message);
            falhas++;
            
            // Atualiza o circuit breaker
            const circuitBreakerAtual = JSON.parse(sessionStorage.getItem(circuitBreakerKey) || '{"falhas":0}');
            sessionStorage.setItem(circuitBreakerKey, JSON.stringify({
                timestamp: Date.now(),
                falhas: (circuitBreakerAtual.falhas || 0) + 1
            }));
        }
    }
    
    console.error(`Todos os ${endpointsDisponiveis.length} endpoints falharam para ${endpoint}`);
    return null;
}

/**
 * Função principal para busca de dados com estratégia em camadas:
 * 1. Cache local
 * 2. Arquivos JSON
 * 3. APIs externas
 * 4. Dados estáticos de fallback
 */
async function buscarDadosAPI(endpoint) {
    // Camada 1: Cache local
    const dadosCache = verificarCacheLocal(endpoint);
    if (dadosCache) {
        console.log(`✅ Usando dados em cache local para ${endpoint}`);
        return dadosCache;
    }
    
    // Camada 2: Arquivos JSON
    const dadosAtualizados = await carregarDadosAtualizados(endpoint);
    if (dadosAtualizados) {
        armazenarCacheLocal(endpoint, dadosAtualizados);
        return dadosAtualizados;
    }
    
    // Camada 3: APIs externas
    try {
        const dadosAPI = await tentarMultiplosEndpoints(endpoint);
        if (dadosAPI) {
            dadosAPI.usouFallback = false;
            armazenarCacheLocal(endpoint, dadosAPI);
            return dadosAPI;
        }
        
        // Camada 4: Dados estáticos de fallback
        return usarDadosFallback(endpoint);
    } catch (error) {
        console.error(`Erro geral ao buscar dados de ${endpoint}:`, error);
        return usarDadosFallback(endpoint);
    }
}

/**
 * Retorna dados históricos de fallback quando todas as camadas anteriores falham
 */
function usarDadosFallback(endpoint) {
    const dadosFallback = DADOS_HISTORICOS[endpoint];
    const dadoMaisRecente = dadosFallback[dadosFallback.length - 1];
    
    console.warn(`⚠️ Usando dados estáticos de fallback para ${endpoint} (${dadoMaisRecente.ano})`);
    
    return {
        valor: dadoMaisRecente.valor,
        ano: dadoMaisRecente.ano,
        usouFallback: true,
        fonte: 'Dados históricos (offline)'
    };
}

/**
 * Renderiza os dados de um indicador no DOM, incluindo avisos de fallback
 */
function renderizarIndicador(indicador, dados) {
    const container = document.getElementById(indicador.id);
    if (!container) return;

    const conteudoIndicador = container.querySelector('.conteudo-indicador');

    conteudoIndicador.innerHTML = '';
    conteudoIndicador.classList.remove('carregando');
    conteudoIndicador.classList.add('completo');

    const valorFormatado = dados.valor.toFixed(1).replace('.', ',');

    // Valor principal do indicador
    const valorElement = document.createElement('div');
    valorElement.className = 'valor-indicador';
    valorElement.textContent = `${valorFormatado}%`;
    valorElement.setAttribute('data-tooltip', TOOLTIPS[indicador.endpoint]);
    valorElement.setAttribute('tabindex', '0');
    valorElement.setAttribute('role', 'button');
    valorElement.setAttribute('aria-label', `${valorFormatado}% - ${TOOLTIPS[indicador.endpoint]}`);

    // Textos complementares
    const textoElement = document.createElement('div');
    textoElement.className = 'texto-indicador';
    textoElement.textContent = indicador.descricao;

    const contextoElement = document.createElement('div');
    contextoElement.className = 'texto-indicador-complementar';
    contextoElement.textContent = indicador.contexto;

    const fonteElement = document.createElement('div');
    fonteElement.className = 'texto-indicador-fonte';
    fonteElement.textContent = indicador.fonte;

    // Montagem do DOM
    conteudoIndicador.appendChild(valorElement);
    conteudoIndicador.appendChild(textoElement);
    conteudoIndicador.appendChild(contextoElement);
    conteudoIndicador.appendChild(fonteElement);

    // Exibição de aviso quando usando dados de fallback
    if (dados.usouFallback) {
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'texto-fallback';
        fallbackElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i> 
        Dados de ${dados.ano} (fonte alternativa) - API IBGE indisponível.
        <a href="https://sidra.ibge.gov.br/" target="_blank" rel="noopener noreferrer" 
           class="link-ibge" aria-label="Consultar dados oficiais no IBGE">
           Consultar IBGE <i class="fas fa-external-link-alt"></i>
        </a>
        <button class="retry-button" data-endpoint="${indicador.endpoint}">
          <i class="fas fa-sync-alt"></i> Tentar novamente
        </button>
      `;
        conteudoIndicador.insertBefore(fallbackElement, textoElement);
        
        // Evento para retry de carregamento
        const retryButton = fallbackElement.querySelector('.retry-button');
        retryButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const endpoint = retryButton.getAttribute('data-endpoint');
            
            // Limpa restrições para tentar novamente
            sessionStorage.removeItem(`circuit_breaker_${endpoint}`);
            localStorage.removeItem(`ods_sergipe_${endpoint}`);
            
            // Feedback visual de carregamento
            conteudoIndicador.innerHTML = '<p class="status-carregamento">Carregando dados...</p>';
            conteudoIndicador.classList.remove('completo');
            conteudoIndicador.classList.add('carregando');
            
            // Nova tentativa de carregamento
            const dadosAtualizados = await buscarDadosAPI(endpoint);
            renderizarIndicador(
                INDICADORES.find(ind => ind.endpoint === endpoint),
                dadosAtualizados
            );
        });
    }

    const espacoElement = document.createElement('div');
    espacoElement.style.height = '30px';
    conteudoIndicador.appendChild(espacoElement);

    // Botão para exportação CSV
    const botaoExportar = document.createElement('button');
    botaoExportar.className = 'botao-exportar-indicador';
    botaoExportar.innerHTML = '<i class="fas fa-download"></i> CSV';
    botaoExportar.setAttribute('aria-label', `Exportar dados de ${indicador.titulo} em CSV`);
    botaoExportar.addEventListener('click', () => {
        exportarCSVIndicador(indicador.endpoint, indicador.titulo);
    });

    conteudoIndicador.appendChild(botaoExportar);

    // Inicialização do gráfico e tooltips
    gerarGrafico(indicador.endpoint, CORES_ODS[indicador.endpoint]);
    
    tippy(valorElement, {
        content: TOOLTIPS[indicador.endpoint],
        animation: 'scale',
        theme: 'light-border',
        placement: 'top',
        arrow: true,
        appendTo: () => document.body,
        allowHTML: false,
        a11y: true,
        touch: 'hold',
        maxWidth: 300
    });
}

/**
 * Gera gráfico de linha para um indicador usando Chart.js
 */
function gerarGrafico(endpoint, cores) {
    const dados = DADOS_HISTORICOS[endpoint];
    const anos = dados.map(item => item.ano);
    const valores = dados.map(item => item.valor);

    const canvas = document.getElementById(`grafico-${endpoint}`);
    if (!canvas) return;

    // Remove gráfico anterior se existir
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: cores.nomeLegenda,
                data: valores,
                backgroundColor: cores.corSecundaria,
                borderColor: cores.cor,
                borderWidth: 2,
                pointBackgroundColor: cores.cor,
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Gera gráfico comparativo com dados de todos os indicadores
 */
function gerarGraficoComparativo() {
    const canvas = document.getElementById('grafico-comparativo');
    if (!canvas) return;

    const datasets = [];
    const anos = DADOS_HISTORICOS.pobreza.map(item => item.ano);

    // Prepara datasets para cada indicador
    for (const endpoint of Object.keys(DADOS_HISTORICOS)) {
        const dados = DADOS_HISTORICOS[endpoint];
        const cor = CORES_ODS[endpoint].cor;

        datasets.push({
            label: CORES_ODS[endpoint].nomeLegenda,
            data: dados.map(item => item.valor),
            backgroundColor: CORES_ODS[endpoint].corSecundaria,
            borderColor: cor,
            borderWidth: 2,
            pointBackgroundColor: cor,
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.4
        });
    }

    // Remove gráfico anterior se existir
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Exporta dados de um indicador para CSV
 */
function exportarCSVIndicador(endpoint, titulo) {
    const dados = DADOS_HISTORICOS[endpoint];
    const nomeArquivo = `dados-${endpoint}-sergipe.csv`;

    const cabecalho = ['Ano', 'Valor (%)'];
    const linhas = dados.map(item => [item.ano, item.valor]);

    const csv = [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");

    downloadCSV(csv, nomeArquivo);
    mostrarMensagemSucesso(`Dados de ${titulo} exportados com sucesso!`);
}

/**
 * Exporta todos os dados para CSV combinado
 */
function exportarTodosCSV() {
    const dadosParaExportar = [];

    INDICADORES.forEach(indicador => {
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

    const csv = [cabecalho, ...linhas]
        .map(e => e.join(","))
        .join("\n");

    downloadCSV(csv, 'indicadores-ods-sergipe.csv');
    mostrarMensagemSucesso('Todos os dados exportados com sucesso!');
}

/**
 * Utilitário para download de arquivo CSV
 */
function downloadCSV(conteudoCSV, nomeArquivo) {
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Exibe mensagem temporária de sucesso
 */
function mostrarMensagemSucesso(texto) {
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-sucesso';
    mensagem.textContent = texto;
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.style.opacity = '0';
        setTimeout(() => document.body.removeChild(mensagem), 500);
    }, 3000);
}

/**
 * Atualiza a data no rodapé
 */
function atualizarDataAtualizacao() {
    const dataElement = document.getElementById('data-atualizacao');
    if (dataElement) {
        const dataAtual = new Date();
        const opcoes = { month: 'long', year: 'numeric' };
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR', opcoes);
        const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
        dataElement.textContent = dataCapitalizada;
    }
}

/**
 * Registra erros persistentes para análise posterior
 */
function registrarErroPersistente(endpoint, erro) {
    try {
        const errosKey = 'ods_sergipe_erros';
        const errosAnteriores = JSON.parse(localStorage.getItem(errosKey) || '[]');
        
        errosAnteriores.push({
            endpoint: endpoint,
            mensagem: erro.message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // Limita a quantidade de erros armazenados
        const errosLimitados = errosAnteriores.slice(-20);
        localStorage.setItem(errosKey, JSON.stringify(errosLimitados));
        
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Erro persistente registrado:', erro);
        }
    } catch (e) {
        console.warn('Não foi possível registrar erro persistente:', e);
    }
}

/**
 * Inicializa o painel ODS completo
 */
async function inicializarPainel() {
    atualizarDataAtualizacao();
    
    const promessasCarregamento = [];
    
    // Carrega todos os indicadores em paralelo
    for (const indicador of INDICADORES) {
        const promessa = (async () => {
            try {
                const dados = await buscarDadosAPI(indicador.endpoint);
                renderizarIndicador(indicador, dados);
                return { sucesso: true, indicador: indicador.endpoint };
            } catch (erro) {
                console.error(`Erro ao carregar ${indicador.endpoint}:`, erro);
                const dadosFallback = usarDadosFallback(indicador.endpoint);
                renderizarIndicador(indicador, dadosFallback);
                registrarErroPersistente(indicador.endpoint, erro);
                return { sucesso: false, indicador: indicador.endpoint, erro: erro.message };
            }
        })();
        
        promessasCarregamento.push(promessa);
    }
    
    // Aguarda todos os carregamentos concluírem
    const resultados = await Promise.allSettled(promessasCarregamento);
    
    // Gera o gráfico comparativo após todos os dados estarem disponíveis
    gerarGraficoComparativo();

    // Configura evento para botão de exportação
    const btnExportarTodos = document.getElementById('btn-exportar-todos');
    if (btnExportarTodos) {
        btnExportarTodos.addEventListener('click', exportarTodosCSV);
    }
    
    // Verifica e relata falhas críticas
    const falhas = resultados.filter(r => r.status === 'rejected' || (r.value && !r.value.sucesso));
    if (falhas.length > 0) {
        console.warn(`⚠️ ${falhas.length} indicadores falharam no carregamento inicial.`);
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarPainel);