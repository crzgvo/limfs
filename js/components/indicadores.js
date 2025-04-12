/**
 * Componente de visualização de indicadores do Painel ODS
 * Responsável por renderizar e atualizar os gráficos e dados visuais
 */

import { verificarCacheLocal, armazenarCacheLocal } from '../utils/cache.js';

// Cores oficiais dos ODS conforme identidade visual da ONU
export const CORES_ODS = {
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
export const TOOLTIPS = {
    pobreza: "Percentual da população vivendo com menos de R$ 182 por mês (linha de extrema pobreza definida pelo Banco Mundial).",
    educacao: "Percentual da população com 15 anos ou mais de idade que sabe ler e escrever.",
    saneamento: "Percentual de domicílios que possuem acesso à rede geral de esgotamento sanitário.",
    mortalidade_infantil: "Número de óbitos de crianças menores de 1 ano de idade por mil nascidos vivos.",
    energia_solar: "Percentual de domicílios que possuem sistemas de energia solar fotovoltaica instalada.",
    residuos_reciclados: "Percentual do total de resíduos sólidos urbanos que são coletados seletivamente e reciclados."
};

/**
 * Renderiza os dados de um indicador no DOM, incluindo avisos de fallback
 * @param {Object} indicador - Definição do indicador
 * @param {Object} dados - Dados a serem exibidos
 * @param {Function} buscarDadosAPI - Função para buscar dados da API
 * @param {Array} indicadores - Lista completa de indicadores
 */
export function renderizarIndicador(indicador, dados, buscarDadosAPI, indicadores) {
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
                indicadores.find(ind => ind.endpoint === endpoint),
                dadosAtualizados,
                buscarDadosAPI,
                indicadores
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
        window.dispatchEvent(new CustomEvent('exportar-csv-indicador', {
            detail: {
                endpoint: indicador.endpoint,
                titulo: indicador.titulo
            }
        }));
    });

    conteudoIndicador.appendChild(botaoExportar);

    // Inicialização do gráfico e tooltips
    gerarGrafico(indicador.endpoint, CORES_ODS[indicador.endpoint]);
    
    if (window.tippy) {
        window.tippy(valorElement, {
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
}

/**
 * Gera gráfico de linha para um indicador usando Chart.js
 * @param {string} endpoint - Identificador do indicador
 * @param {Object} cores - Configuração de cores para o gráfico
 * @param {Array} dadosHistoricos - Dados históricos do indicador
 */
export function gerarGrafico(endpoint, cores, dadosHistoricos) {
    const dados = dadosHistoricos[endpoint];
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
 * @param {Object} dadosHistoricos - Objeto com dados históricos de todos os indicadores
 */
export function gerarGraficoComparativo(dadosHistoricos) {
    const canvas = document.getElementById('grafico-comparativo');
    if (!canvas) return;

    const datasets = [];
    const anos = dadosHistoricos.pobreza.map(item => item.ano);

    // Prepara datasets para cada indicador
    for (const endpoint of Object.keys(dadosHistoricos)) {
        const dados = dadosHistoricos[endpoint];
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
 * Exibe mensagem temporária de sucesso
 * @param {string} texto - Mensagem a ser exibida
 */
export function mostrarMensagemSucesso(texto) {
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
export function atualizarDataAtualizacao() {
    const dataElement = document.getElementById('data-atualizacao');
    if (dataElement) {
        const dataAtual = new Date();
        const opcoes = { month: 'long', year: 'numeric' };
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR', opcoes);
        const dataCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
        dataElement.textContent = dataCapitalizada;
    }
}