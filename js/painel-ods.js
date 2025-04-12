/**
 * Lógica principal do front-end para o Painel ODS Sergipe.
 * Responsável por buscar, processar, exibir e permitir interações com os dados dos indicadores.
 */

// --- Configurações ---
const API_CONFIG = {
    arquivos_json: {
        base_url: '../dados/',
    },
    timeout: 8000
};

// Dados históricos usados como fallback se APIs e JSON falharem
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

// Cores oficiais dos ODS para gráficos e identidade visual
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

// Textos explicativos para tooltips dos indicadores
const TOOLTIPS = {
    pobreza: "Percentual da população vivendo com menos de R$ 182 por mês (linha de extrema pobreza definida pelo Banco Mundial).",
    educacao: "Percentual da população com 15 anos ou mais de idade que sabe ler e escrever.",
    saneamento: "Percentual de domicílios que possuem acesso à rede geral de esgotamento sanitário.",
    mortalidade_infantil: "Número de óbitos de crianças menores de 1 ano de idade por mil nascidos vivos.",
    energia_solar: "Percentual de domicílios que possuem sistemas de energia solar fotovoltaica instalada.",
    residuos_reciclados: "Percentual do total de resíduos sólidos urbanos que são coletados seletivamente e reciclados."
};

// Definições dos indicadores a serem exibidos no painel
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
 * Tenta carregar dados de um arquivo JSON local.
 * Usado como segunda camada na estratégia de busca de dados.
 * @param {string} endpoint - Identificador do indicador (nome do arquivo JSON).
 * @returns {Promise<object|null>} Dados do arquivo ou null se falhar.
 */
async function carregarDadosAtualizados(endpoint) {
    try {
        const url = `${API_CONFIG.arquivos_json.base_url}${endpoint}.json`;
        let response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            console.warn(`Arquivo de dados JSON não encontrado para ${endpoint} em ${url}`);
            return null;
        }

        const dadosAtualizados = await response.json();

        if (!dadosAtualizados || !dadosAtualizados.dados || typeof dadosAtualizados.dados.valor === 'undefined') {
            console.warn(`Estrutura inválida no arquivo JSON para ${endpoint}.`);
            return null;
        }

        const ultimaAtualizacao = dadosAtualizados.ultimaAtualizacao ? new Date(dadosAtualizados.ultimaAtualizacao) : null;
        if (ultimaAtualizacao) {
            const agora = new Date();
            const diferencaDias = Math.floor((agora - ultimaAtualizacao) / (1000 * 60 * 60 * 24));
            if (diferencaDias > 30) {
                console.log(`Dados de ${endpoint} do JSON têm ${diferencaDias} dias.`);
            }
            console.log(`✅ Usando dados de arquivo JSON para ${endpoint} (Atualizado em: ${dadosAtualizados.ultimaAtualizacao})`);
        } else {
            console.log(`✅ Usando dados de arquivo JSON para ${endpoint} (Data de atualização não especificada)`);
        }

        return {
            valor: dadosAtualizados.dados.valor,
            ano: dadosAtualizados.dados.ano || (ultimaAtualizacao ? ultimaAtualizacao.getFullYear() : new Date().getFullYear()),
            usouFallback: false,
            dadosCompletos: dadosAtualizados.dados,
            ultimaAtualizacao: dadosAtualizados.ultimaAtualizacao
        };

    } catch (erro) {
        console.error(`Erro ao carregar ou processar arquivo JSON para ${endpoint}:`, erro);
        return null;
    }
}

/**
 * Armazena dados no localStorage para cache rápido no cliente.
 * @param {string} chave - Chave para o item no localStorage.
 * @param {any} valor - Valor a ser armazenado (será convertido para JSON).
 */
function armazenarCacheLocal(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (error) {
    console.warn(`Falha ao salvar cache local para ${chave}:`, error);
  }
}

/**
 * Recupera dados do cache local (localStorage).
 * @param {string} chave - Chave do item no localStorage.
 * @returns {any|null} Valor parseado do cache ou null se não existir/erro.
 */
function verificarCacheLocal(chave) {
  try {
    const dado = localStorage.getItem(chave);
    if (dado && dado !== 'undefined' && dado !== 'null') {
        return JSON.parse(dado);
    }
    return null;
  } catch (error) {
    console.warn(`Falha ao ler cache local para ${chave}:`, error);
    localStorage.removeItem(chave);
    return null;
  }
}

/**
 * Analisa respostas de APIs (especialmente IBGE SIDRA/Servicodados).
 * Extrai valor e ano de diferentes formatos de resposta.
 * @param {Array|object} dados - Resposta da API.
 * @param {string} endpoint - Identificador do indicador.
 * @param {number} indice - Índice esperado para os dados na resposta (varia conforme API).
 * @returns {{valor: number, ano: number}|null} Objeto com valor e ano ou null.
 */
function analisarResposta(dados, endpoint, indice = 0) {
    if (Array.isArray(dados) && dados.length > indice + 1) {
        const itemDados = dados[indice + 1];
        const valorRaw = itemDados?.V ?? itemDados?.valor;
        const anoRaw = itemDados?.D2N;

        if (valorRaw !== undefined && valorRaw !== null && !isNaN(parseFloat(valorRaw))) {
            return {
                valor: parseFloat(valorRaw),
                ano: anoRaw ? parseInt(anoRaw, 10) : null
            };
        }
    }

    if (Array.isArray(dados) && dados.length > indice) {
       const resultados = dados[indice]?.resultados?.[0]?.series?.[0]?.serie;
       if (resultados) {
           const ultimoAno = Object.keys(resultados).pop();
           const valorRaw = resultados[ultimoAno];
           if (ultimoAno && valorRaw !== undefined && !isNaN(parseFloat(valorRaw))) {
               return {
                   valor: parseFloat(valorRaw),
                   ano: parseInt(ultimoAno, 10)
               };
           }
       }
    }

    if (Array.isArray(dados) && dados.length > indice) {
       const res = dados[indice]?.res;
       if (res) {
           const ultimoAno = Object.keys(res).pop();
           const valorRaw = res[ultimoAno];
            if (ultimoAno && valorRaw !== undefined && !isNaN(parseFloat(valorRaw))) {
               return {
                   valor: parseFloat(valorRaw),
                   ano: parseInt(ultimoAno, 10)
               };
           }
       }
    }

    if (endpoint === 'energia_solar' && dados?.result?.records) {
        console.warn("Análise direta da API ANEEL no front-end não implementada, usando JSON.");
        return null;
    }

    console.warn(`Não foi possível analisar a resposta da API para ${endpoint}. Estrutura inesperada:`, JSON.stringify(dados).substring(0, 100) + '...');
    return null;
}

/**
 * Implementa Circuit Breaker e Retry com Backoff para chamadas de API.
 * Tenta buscar dados de um endpoint, com retentativas e bloqueio temporário em caso de falhas.
 * NOTA: Esta função parece mais adequada para o backend (atualizar-dados.js).
 * No front-end, a complexidade pode ser excessiva e o sessionStorage é limitado.
 * A versão atual usa `buscarDadosAPI` que abstrai isso. Mantida para referência.
 * @param {string} endpoint - Identificador do indicador.
 * @param {string[]} urls - Lista de URLs a tentar para este endpoint.
 * @param {number} maxTentativas - Máximo de tentativas por URL.
 * @param {number} delayInicial - Delay inicial para backoff (ms).
 * @returns {Promise<object|null>} Dados da API ou null.
 */
async function tentarMultiplosEndpoints(endpoint, urls = [], maxTentativas = 3, delayInicial = 500) {
    const chaveCircuitBreaker = `circuit_breaker_${endpoint}`;
    let estadoCircuitBreaker;

    try {
        estadoCircuitBreaker = JSON.parse(sessionStorage.getItem(chaveCircuitBreaker)) || { falhas: 0, proximaTentativa: 0 };
    } catch (e) {
        console.warn("Erro ao ler estado do Circuit Breaker do sessionStorage. Resetando.");
        estadoCircuitBreaker = { falhas: 0, proximaTentativa: 0 };
    }

    if (estadoCircuitBreaker.proximaTentativa > Date.now()) {
        console.warn(`Circuit Breaker para ${endpoint} está aberto. Próxima tentativa em ${new Date(estadoCircuitBreaker.proximaTentativa).toLocaleTimeString()}.`);
        return null;
    }

    for (const url of urls) {
        let tentativas = 0;
        while (tentativas < maxTentativas) {
            tentativas++;
            try {
                console.log(`Tentativa ${tentativas}/${maxTentativas} para ${endpoint} via ${url}`);
                const response = await fetch(url, {
                    signal: AbortSignal.timeout(API_CONFIG.timeout)
                });

                if (!response.ok) {
                    throw new Error(`Status ${response.status}`);
                }

                const dados = await response.json();
                const resultado = analisarResposta(dados, endpoint);

                if (resultado) {
                    sessionStorage.removeItem(chaveCircuitBreaker);
                    console.log(`✅ Sucesso ao buscar ${endpoint} via ${url}`);
                    return resultado;
                } else {
                    console.warn(`Resposta OK, mas dados inválidos para ${endpoint} de ${url}`);
                    break;
                }

            } catch (erro) {
                console.error(`Falha na tentativa ${tentativas} para ${endpoint} (${url}): ${erro.message}`);

                if (tentativas >= maxTentativas) {
                    break;
                }

                const delay = delayInicial * Math.pow(2, tentativas - 1);
                console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Todas as tentativas para ${endpoint} falharam.`);
    estadoCircuitBreaker.falhas++;

    const MAX_FALHAS_CIRCUIT = 3;
    if (estadoCircuitBreaker.falhas >= MAX_FALHAS_CIRCUIT) {
        const tempoBloqueio = 5 * 60 * 1000;
        estadoCircuitBreaker.proximaTentativa = Date.now() + tempoBloqueio;
        console.warn(`Circuit Breaker para ${endpoint} aberto por ${tempoBloqueio / 1000}s devido a ${estadoCircuitBreaker.falhas} falhas.`);
    }

    try {
        sessionStorage.setItem(chaveCircuitBreaker, JSON.stringify(estadoCircuitBreaker));
    } catch (e) {
        console.warn("Erro ao salvar estado do Circuit Breaker no sessionStorage.");
    }

    registrarErroPersistente(endpoint, new Error("Todas as tentativas de API falharam"));
    return null;
}

/**
 * Função principal para buscar dados de um indicador, usando estratégia em camadas:
 * 1. Cache Local (localStorage): Rápido, mas pode estar desatualizado.
 * 2. Arquivo JSON (servidor): Dados pré-processados e mais recentes que o cache local.
 * 3. API Externa: Dados mais recentes, mas sujeito a falhas/lentidão (NÃO USADO DIRETAMENTE AQUI, ABSTRAÍDO).
 * 4. Dados Estáticos (fallback): Último recurso se tudo falhar.
 * @param {string} endpoint - Identificador do indicador.
 * @returns {Promise<object>} Objeto com os dados do indicador (valor, ano, usouFallback, etc.).
 */
async function buscarDadosAPI(endpoint) {
    const chaveCacheLocal = `ods_sergipe_${endpoint}`;

    const dadosCache = verificarCacheLocal(chaveCacheLocal);
    if (dadosCache) {
        const agora = Date.now();
        const TTL_CACHE_LOCAL = 1 * 60 * 60 * 1000;
        if (dadosCache.timestamp && (agora - dadosCache.timestamp < TTL_CACHE_LOCAL)) {
            console.log(`✅ Usando dados em cache local para ${endpoint}`);
            return { ...dadosCache };
        } else {
            console.log(`Cache local para ${endpoint} expirado ou sem timestamp.`);
        }
    }

    const dadosAtualizados = await carregarDadosAtualizados(endpoint);
    if (dadosAtualizados) {
        dadosAtualizados.timestamp = Date.now();
        armazenarCacheLocal(chaveCacheLocal, dadosAtualizados);
        return dadosAtualizados;
    }

    console.warn(`⚠️ Falha ao buscar dados de fontes primárias para ${endpoint}. Usando fallback estático.`);
    const dadosFallback = usarDadosFallback(endpoint);
    armazenarCacheLocal(chaveCacheLocal, { ...dadosFallback, timestamp: 0 });
    return dadosFallback;
}

/**
 * Retorna dados históricos estáticos como fallback.
 * @param {string} endpoint - Identificador do indicador.
 * @returns {object} Objeto com o último dado histórico e flag de fallback.
 */
function usarDadosFallback(endpoint) {
    const dadosHistoricos = DADOS_HISTORICOS[endpoint];
    const dadoMaisRecente = dadosHistoricos && dadosHistoricos.length > 0
        ? dadosHistoricos[dadosHistoricos.length - 1]
        : { valor: 'N/D', ano: 'N/A' };

    console.warn(`⚠️ Usando dados estáticos de fallback para ${endpoint} (Ano: ${dadoMaisRecente.ano})`);

    return {
        valor: dadoMaisRecente.valor,
        ano: dadoMaisRecente.ano,
        usouFallback: true,
        fonte: 'Dados históricos (offline)'
    };
}

/**
 * Renderiza um card de indicador no DOM com os dados fornecidos.
 * Inclui valor, textos, gráfico, botão de exportação e aviso de fallback.
 * @param {object} indicador - Objeto de configuração do indicador (de INDICADORES).
 * @param {object} dados - Dados a serem exibidos (resultado de buscarDadosAPI).
 */
function renderizarIndicador(indicador, dados) {
    const container = document.getElementById(indicador.id);
    if (!container) {
        console.error(`Container #${indicador.id} não encontrado no DOM.`);
        return;
    }

    const conteudoIndicador = container.querySelector('.conteudo-indicador');
    if (!conteudoIndicador) {
        console.error(`Elemento .conteudo-indicador não encontrado em #${indicador.id}.`);
        return;
    }

    conteudoIndicador.innerHTML = '';
    conteudoIndicador.classList.remove('carregando');
    conteudoIndicador.classList.add('completo');

    let valorFormatado;
    let valorTooltip = TOOLTIPS[indicador.endpoint] || indicador.titulo;
    if (dados.erro) {
        valorFormatado = 'Erro';
        valorTooltip = 'Falha ao carregar os dados deste indicador.';
    } else if (dados.valor === 'N/D') {
        valorFormatado = 'N/D';
         valorTooltip = 'Dado não disponível.';
    } else {
        valorFormatado = typeof dados.valor === 'number'
            ? dados.valor.toFixed(1).replace('.', ',') + '%'
            : String(dados.valor);
    }

    const valorElement = document.createElement('div');
    valorElement.className = 'valor-indicador';
    valorElement.textContent = valorFormatado;
    valorElement.setAttribute('data-tooltip', valorTooltip);
    valorElement.setAttribute('tabindex', '0');
    valorElement.setAttribute('role', 'button');
    valorElement.setAttribute('aria-label', `${valorFormatado} - ${valorTooltip}`);

    const textoElement = document.createElement('div');
    textoElement.className = 'texto-indicador';
    const anoDesc = dados.ano && dados.ano !== 'N/A' ? ` em ${dados.ano}` : '';
    textoElement.textContent = indicador.descricao.replace('em XXXX', anoDesc);

    const contextoElement = document.createElement('div');
    contextoElement.className = 'texto-indicador-complementar';
    contextoElement.textContent = indicador.contexto;

    const fonteElement = document.createElement('div');
    fonteElement.className = 'texto-indicador-fonte';
    fonteElement.textContent = dados.usouFallback ? dados.fonte : indicador.fonte;

    conteudoIndicador.appendChild(valorElement);
    conteudoIndicador.appendChild(textoElement);
    conteudoIndicador.appendChild(contextoElement);
    conteudoIndicador.appendChild(fonteElement);

    if (dados.usouFallback) {
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'texto-fallback';
        let mensagemFallback = `<i class="fas fa-exclamation-triangle"></i> `;
        if (dados.erro) {
             mensagemFallback += `Falha ao carregar dados.`;
        } else if (dados.valor === 'N/D') {
             mensagemFallback += `Dado não disponível (${dados.ano || 'sem ano'}).`;
        } else {
             mensagemFallback += `Usando dados de ${dados.ano} (offline).`;
        }

        fallbackElement.innerHTML = `
            ${mensagemFallback}
            <a href="https://ibge.gov.br/" target="_blank" rel="noopener noreferrer"
               class="link-ibge" aria-label="Consultar dados oficiais no IBGE (abre em nova aba)">
               Consultar IBGE <i class="fas fa-external-link-alt" aria-hidden="true"></i>
            </a>
            <button class="retry-button" data-endpoint="${indicador.endpoint}" aria-label="Tentar carregar dados novamente">
              <i class="fas fa-sync-alt" aria-hidden="true"></i> Tentar novamente
            </button>
        `;
        conteudoIndicador.insertBefore(fallbackElement, textoElement);

        const retryButton = fallbackElement.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', async (e) => {
                e.preventDefault();
                const endpoint = retryButton.getAttribute('data-endpoint');
                if (!endpoint) return;

                console.log(`Tentando recarregar ${endpoint}...`);

                localStorage.removeItem(`ods_sergipe_${endpoint}`);
                sessionStorage.removeItem(`circuit_breaker_${endpoint}`);

                conteudoIndicador.innerHTML = '<p class="status-carregamento">Recarregando dados...</p>';
                conteudoIndicador.classList.remove('completo');
                conteudoIndicador.classList.add('carregando');

                try {
                    const dadosNovos = await buscarDadosAPI(endpoint);
                    renderizarIndicador(
                        INDICADORES.find(ind => ind.endpoint === endpoint),
                        dadosNovos
                    );
                } catch (error) {
                    console.error(`Falha ao recarregar ${endpoint}:`, error);
                     renderizarIndicador(
                        INDICADORES.find(ind => ind.endpoint === endpoint),
                        { valor: 'Erro', ano: '', usouFallback: true, erro: true }
                    );
                }
            });
        }
    }

    const botaoExportar = document.createElement('button');
    botaoExportar.className = 'botao-exportar-indicador';
    botaoExportar.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i> CSV';
    botaoExportar.setAttribute('aria-label', `Exportar dados de ${indicador.titulo} em formato CSV`);
    botaoExportar.disabled = dados.erro || dados.valor === 'N/D';
    botaoExportar.addEventListener('click', () => {
        const evento = new CustomEvent('exportar-csv-indicador', {
            detail: { endpoint: indicador.endpoint, titulo: indicador.titulo }
        });
        window.dispatchEvent(evento);
    });
    conteudoIndicador.appendChild(botaoExportar);

    if (!dados.erro && dados.valor !== 'N/D') {
        try {
            gerarGrafico(indicador.endpoint, CORES_ODS[indicador.endpoint]);
        } catch (error) {
            console.error(`Erro ao gerar gráfico para ${indicador.endpoint}:`, error);
            const graficoContainer = container.querySelector('.grafico-container');
            if (graficoContainer) {
                graficoContainer.innerHTML = '<p class="erro-grafico">Erro ao gerar gráfico.</p>';
            }
        }
    } else {
         const graficoContainer = container.querySelector('.grafico-container');
         const canvas = graficoContainer?.querySelector('canvas');
         if (canvas) canvas.remove();
         if (graficoContainer) graficoContainer.innerHTML = '<p class="info-grafico">Gráfico indisponível.</p>';
    }

    if (valorElement && typeof tippy === 'function') {
        tippy(valorElement, {
            content: valorTooltip,
            animation: 'scale',
            theme: 'light-border',
            placement: 'top',
            arrow: true,
            appendTo: () => document.body,
            allowHTML: false,
            touch: ['hold', 500],
            maxWidth: 300,
            interactive: false,
        });
    } else if (typeof tippy !== 'function') {
        console.warn("Tippy.js não carregado. Tooltips não funcionarão.");
    }
}

/**
 * Gera ou atualiza o gráfico de linha para um indicador específico.
 * @param {string} endpoint - Identificador do indicador.
 * @param {object} cores - Objeto com cores primária e secundária do ODS.
 */
function gerarGrafico(endpoint, cores) {
    const dadosHistoricos = DADOS_HISTORICOS[endpoint];
    if (!dadosHistoricos || dadosHistoricos.length === 0) {
        console.warn(`Dados históricos não encontrados para ${endpoint}. Gráfico não gerado.`);
        return;
    }

    const anos = dadosHistoricos.map(item => item.ano);
    const valores = dadosHistoricos.map(item => item.valor);

    const canvasId = `grafico-${endpoint}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas #${canvasId} não encontrado para o gráfico.`);
        return;
    }

    const chartInstance = Chart.getChart(canvas);
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: cores.nomeLegenda || endpoint.replace('_', ' ').toUpperCase(),
                data: valores,
                backgroundColor: cores.corSecundaria || 'rgba(0, 123, 255, 0.2)',
                borderColor: cores.cor || '#007bff',
                borderWidth: 2,
                pointBackgroundColor: cores.cor || '#007bff',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
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
                            return typeof value === 'number' ? value + '%' : value;
                        }
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                x: {
                     grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1).replace('.', ',') + '%';
                            }
                            return label;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 4
                }
            },
        }
    });
}

/**
 * Gera o gráfico comparativo com as séries históricas de todos os indicadores.
 */
function gerarGraficoComparativo() {
    const canvasId = 'grafico-comparativo';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas #${canvasId} não encontrado para o gráfico comparativo.`);
        return;
    }

    const datasets = [];
    const anos = DADOS_HISTORICOS[Object.keys(DADOS_HISTORICOS)[0]]?.map(item => item.ano);

    if (!anos || anos.length === 0) {
        console.error("Não foi possível obter anos para o gráfico comparativo.");
        return;
    }

    for (const endpoint of Object.keys(DADOS_HISTORICOS)) {
        const dados = DADOS_HISTORICOS[endpoint];
        const configCores = CORES_ODS[endpoint];

        if (dados && configCores) {
            datasets.push({
                label: configCores.nomeLegenda || endpoint.replace('_', ' ').toUpperCase(),
                data: dados.map(item => item.valor),
                borderColor: configCores.cor,
                backgroundColor: configCores.corSecundaria,
                borderWidth: 2,
                pointBackgroundColor: configCores.cor,
                pointBorderColor: '#fff',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false,
                tension: 0.3
            });
        }
    }

    if (datasets.length === 0) {
        console.error("Nenhum dataset válido para o gráfico comparativo.");
        return;
    }

    const chartInstance = Chart.getChart(canvas);
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
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
                            return typeof value === 'number' ? value + '%' : value;
                        }
                    },
                     grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                 x: {
                     grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                     labels: {
                        boxWidth: 12,
                        padding: 15,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1).replace('.', ',') + '%';
                            }
                            return label;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 4,
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
        }
    });
}

/**
 * Exibe uma mensagem de sucesso temporária na tela.
 */
function mostrarMensagemSucesso(texto) {
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-sucesso';
    mensagem.textContent = texto;
    mensagem.setAttribute('role', 'status');
    mensagem.setAttribute('aria-live', 'polite');
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(mensagem)) {
                document.body.removeChild(mensagem);
            }
        }, 600);
    }, 3000);
}

/**
 * Atualiza o elemento no DOM que exibe a data da última atualização.
 */
function atualizarDataAtualizacao() {
    const dataElement = document.getElementById('data-atualizacao');
    if (dataElement) {
        const dataAtual = new Date();
        const opcoes = { month: 'long', year: 'numeric' };
        try {
            const dataFormatada = dataAtual.toLocaleDateString('pt-BR', opcoes);
            const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
            dataElement.textContent = dataCapitalizada;
        } catch (e) {
            console.error("Erro ao formatar data de atualização:", e);
            dataElement.textContent = dataAtual.toLocaleDateString('pt-BR');
        }
    } else {
        console.warn("Elemento #data-atualizacao não encontrado para atualizar.");
    }
}

/**
 * Registra erros persistentes no localStorage para depuração posterior.
 * Limita o número de erros armazenados para não lotar o localStorage.
 * @param {string} endpoint - Indicador associado ao erro.
 * @param {Error} erro - Objeto de erro.
 */
function registrarErroPersistente(endpoint, erro) {
  const chave = 'ods_sergipe_erros';
  const MAX_ERROS_ARMAZENADOS = 50;

  try {
    const erroFormatado = {
      endpoint: endpoint,
      mensagem: erro.message || String(erro),
      timestamp: new Date().toISOString(),
    };

    let errosAtuais = [];
    const errosSalvos = localStorage.getItem(chave);
    if (errosSalvos) {
        try {
            errosAtuais = JSON.parse(errosSalvos);
            if (!Array.isArray(errosAtuais)) errosAtuais = [];
        } catch (e) {
             console.warn("Erro ao parsear erros persistentes do localStorage. Resetando.");
             errosAtuais = [];
        }
    }

    errosAtuais.push(erroFormatado);

    if (errosAtuais.length > MAX_ERROS_ARMAZENADOS) {
      errosAtuais = errosAtuais.slice(errosAtuais.length - MAX_ERROS_ARMAZENADOS);
    }

    localStorage.setItem(chave, JSON.stringify(errosAtuais));

  } catch (storageError) {
    console.warn("Não foi possível registrar erro persistente no localStorage:", storageError);
  }
}

/**
 * Função de inicialização principal do painel.
 * Carrega e renderiza todos os indicadores e o gráfico comparativo.
 */
async function inicializarPainel() {
    console.log("🚀 Inicializando Painel ODS...");
    atualizarDataAtualizacao();

    const promessasCarregamento = [];

    for (const indicador of INDICADORES) {
        const promessa = (async () => {
            try {
                const dados = await buscarDadosAPI(indicador.endpoint);
                renderizarIndicador(indicador, dados);
                return { sucesso: true, indicador: indicador.endpoint, usouFallback: dados.usouFallback };
            } catch (erro) {
                console.error(`❌ Erro crítico ao carregar/renderizar ${indicador.endpoint}:`, erro);
                try {
                    renderizarIndicador(indicador, { valor: 'Erro', ano: '', usouFallback: true, erro: true });
                } catch (renderError) {
                     console.error(`Falha até ao renderizar erro para ${indicador.endpoint}:`, renderError);
                }
                registrarErroPersistente(indicador.endpoint, erro);
                return { sucesso: false, indicador: indicador.endpoint, erro: erro.message };
            }
        })();
        promessasCarregamento.push(promessa);
    }

    const resultados = await Promise.allSettled(promessasCarregamento);

    try {
        gerarGraficoComparativo();
    } catch(error) {
        console.error("Erro ao gerar gráfico comparativo:", error);
    }

    const btnExportarTodos = document.getElementById('btn-exportar-todos');
    if (btnExportarTodos) {
        btnExportarTodos.addEventListener('click', () => {
             const evento = new CustomEvent('exportar-todos-csv');
             window.dispatchEvent(evento);
        });
    } else {
         console.warn("Botão #btn-exportar-todos não encontrado.");
    }

    const falhas = resultados.filter(r => r.status === 'rejected' || (r.value && !r.value.sucesso));
    const fallbacks = resultados.filter(r => r.status === 'fulfilled' && r.value && r.value.sucesso && r.value.usouFallback);

    if (falhas.length > 0) {
        console.warn(`⚠️ ${falhas.length} indicador(es) falharam criticamente no carregamento.`);
    }
    if (fallbacks.length > 0) {
        console.warn(`ℹ️ ${fallbacks.length} indicador(es) usaram dados de fallback.`);
    }
    if (falhas.length === 0 && fallbacks.length === 0) {
         console.log("✅ Todos os indicadores carregados com sucesso de fontes primárias (JSON/Cache).");
    }

    console.log("🏁 Painel ODS inicializado.");
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarPainel);
}

module.exports = {
  inicializarPainel,
  buscarDadosAPI,
  renderizarIndicador,
  analisarResposta,
  verificarCacheLocal,
  armazenarCacheLocal,
  usarDadosFallback,
  registrarErroPersistente
};