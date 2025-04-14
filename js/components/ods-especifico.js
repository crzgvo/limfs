/**
 * ods-especifico.js
 * Componente responsável pela renderização e gerenciamento de um ODS específico
 */

import odsService from '../services/ods-service.js';

// Cores oficiais dos ODS
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
    },
    trabalho: {
        cor: '#A21942',
        corSecundaria: 'rgba(162, 25, 66, 0.2)',
        nomeLegenda: 'Taxa de Desemprego'
    },
    igualdade_racial: {
        cor: '#6F1D78',
        corSecundaria: 'rgba(111, 29, 120, 0.2)',
        nomeLegenda: 'Igualdade Racial'
    }
};

// Tooltips dos indicadores
const TOOLTIPS = {
    pobreza: "Percentual da população vivendo com menos de R$ 182 por mês (linha de extrema pobreza definida pelo Banco Mundial).",
    educacao: "Percentual da população com 15 anos ou mais de idade que sabe ler e escrever.",
    saneamento: "Percentual de domicílios que possuem acesso à rede geral de esgotamento sanitário.",
    mortalidade_infantil: "Número de óbitos de crianças menores de 1 ano de idade por mil nascidos vivos.",
    energia_solar: "Percentual de domicílios que possuem sistemas de energia solar fotovoltaica instalada.",
    residuos_reciclados: "Percentual do total de resíduos sólidos urbanos que são coletados seletivamente e reciclados.",
    trabalho: "Percentual da população economicamente ativa que está desempregada."
};

/**
 * Renderiza um card de indicador no DOM com os dados fornecidos.
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
    // Adiciona atributo ARIA para melhor acessibilidade quando o conteúdo é carregado
    conteudoIndicador.setAttribute('aria-busy', 'false');

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
        let mensagemFallback = `<i class="fas fa-exclamation-triangle" aria-hidden="true"></i> `;
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
                conteudoIndicador.setAttribute('aria-busy', 'true');

                try {
                    const dadosNovos = await odsService.buscarDadosAPI(endpoint);
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
 */
function gerarGrafico(endpoint, cores) {
    const dadosHistoricos = odsService.DADOS_HISTORICOS[endpoint];
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
            datasets: [
                {
                    label: cores.nomeLegenda || 'Dados históricos',
                    data: valores,
                    backgroundColor: cores.corSecundaria || 'rgba(0,123,255,0.1)',
                    borderColor: cores.cor || '#007bff',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        color: '#333',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#ccc',
                    borderWidth: 1,
                    padding: 10,
                    caretPadding: 5,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItem) {
                            return `Ano: ${tooltipItem[0].label}`;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.raw.toFixed(1).replace('.', ',') + '%';
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
}

/**
 * Exporta os dados de um indicador em formato CSV.
 */
function exportarDadosCSV(endpoint, titulo) {
    const dadosHistoricos = odsService.DADOS_HISTORICOS[endpoint];
    if (!dadosHistoricos || dadosHistoricos.length === 0) {
        console.warn(`Não há dados históricos para exportar do indicador ${endpoint}.`);
        alert('Não há dados disponíveis para exportar.');
        return;
    }

    const csvContent = [
        'Ano,Valor (%)',
        ...dadosHistoricos.map(item => `${item.ano},${String(item.valor).replace('.', ',')}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `dados-${endpoint}-${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Inicializa os componentes dinâmicos do dashboard ODS.
 * @param {string} paginaODS - ID do ODS (ex: 'ods1', 'ods10', etc.)
 */
async function inicializarDashboardODS(paginaODS) {
    try {
        // Identifica o número do ODS da página atual
        const match = paginaODS.match(/ods(\d+)/i);
        const odsNumero = match ? match[1] : null;
        
        if (!odsNumero) {
            console.error('Não foi possível identificar o número do ODS da página atual.');
            return;
        }
        
        console.log(`Inicializando dashboard para ODS ${odsNumero}`);
        
        // Busca a configuração do ODS
        const ods = await odsService.getODS(`ods${odsNumero}`);
        console.log('Configuração do ODS:', ods);
        
        // Inicializa a exibição dos indicadores
        inicializarIndicadoresODS(ods);
        
        // Configura eventos de compartilhamento e funcionalidades sociais
        configurarCompartilhamentoRedes();
        
        // Configura armazenamento offline para o dashboard
        configurarArmazenamentoOffline(ods);
        
    } catch (error) {
        console.error('Erro ao inicializar dashboard ODS:', error);
        document.getElementById('erro-carregamento').style.display = 'block';
    }
}

/**
 * Inicializa a exibição dos indicadores do ODS.
 */
async function inicializarIndicadoresODS(ods) {
    try {
        // Implementação depende dos indicadores específicos de cada ODS
        console.log(`Inicializando indicadores para ${ods.titulo}`);
        
        // Aqui viriam as chamadas para renderização específica de cada indicador
        // A implementação real depende da estrutura dos indicadores de cada ODS
        
    } catch (error) {
        console.error('Erro ao inicializar indicadores:', error);
    }
}

/**
 * Configura as opções de compartilhamento em redes sociais.
 */
function configurarCompartilhamentoRedes() {
    const botoesCompartilhar = document.querySelectorAll('.botao-compartilhar');
    botoesCompartilhar.forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            const rede = botao.dataset.rede;
            const titulo = document.title;
            const url = window.location.href;
            
            let shareUrl = '';
            switch (rede) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(titulo + ' ' + url)}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                    break;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });
}

/**
 * Configura o armazenamento offline para o ODS.
 */
function configurarArmazenamentoOffline(ods) {
    // Implementação da funcionalidade de armazenamento offline
    // Essa função depende dos requisitos específicos para armazenamento offline
    console.log(`Configurando armazenamento offline para ${ods.titulo}`);
}

// Registra handler para exportação de CSV
window.addEventListener('exportar-csv-indicador', (evento) => {
    const { endpoint, titulo } = evento.detail;
    if (endpoint && titulo) {
        exportarDadosCSV(endpoint, titulo);
    }
});

// Objeto do componente ODS específico para exportação
const odsEspecifico = {
    inicializarDashboardODS,
    renderizarIndicador,
    gerarGrafico
};

// Exporta o componente tanto como módulo ES6 quanto como objeto global
export default odsEspecifico;

// Para compatibilidade com código não-modular
window.odsEspecifico = odsEspecifico;