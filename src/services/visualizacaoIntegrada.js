/**
 * @file visualizacaoIntegrada.js
 * @description Módulo para visualização integrada de indicadores entre múltiplos ODS
 * @version 1.0.0
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 */

import { carregarDadosODS, carregarDadosIndicador } from './carregadorDados.js';
import { gerarMatrizCorrelacao, identificarODSRelacionados } from './integradorODS.js';

/**
 * Gera um dashboard comparativo entre múltiplos ODS
 * @param {Array<string>} odsIds - Lista de IDs dos ODS a comparar
 * @param {Array<string>} indicadorIds - Lista de IDs dos indicadores a comparar
 * @param {string} elementoId - ID do elemento DOM onde será renderizado o dashboard
 * @param {Object} opcoes - Opções de configuração
 * @returns {Promise<Object>} - Objeto com informações do dashboard gerado
 */
export async function gerarDashboardComparativo(odsIds, indicadorIds, elementoId, opcoes = {}) {
  try {
    // Validação de parâmetros
    if (!odsIds || !Array.isArray(odsIds) || odsIds.length === 0) {
      throw new Error('Lista de ODS inválida');
    }
    
    if (!elementoId || !document.getElementById(elementoId)) {
      throw new Error('Elemento de destino não encontrado');
    }
    
    // Elemento onde será renderizado o dashboard
    const elementoDestino = document.getElementById(elementoId);
    elementoDestino.innerHTML = '<div class="loading-comparativo">Carregando dados comparativos...</div>';
    
    // Opções padrão
    const opcoesDefault = {
      tipoGrafico: 'linha', // linha, barra, radar
      mostrarCorrelacao: true,
      mostrarLegenda: true,
      mostrarTabela: false,
      periodoInicial: 2015,
      periodoFinal: new Date().getFullYear(),
      acessivel: true
    };
    
    // Mescla opções padrão com as fornecidas
    const config = { ...opcoesDefault, ...opcoes };
    
    // Carrega os dados de todos os ODS solicitados
    const dadosODS = await Promise.all(odsIds.map(id => carregarDadosODS(id, { semIndicadoresUI: true })));
    
    // Extrai os dados dos indicadores específicos de cada ODS
    const dadosIndicadores = [];
    
    for (let i = 0; i < odsIds.length; i++) {
      const ods = dadosODS[i];
      const indicadoresODS = ods.indicadores || {};
      
      // Se indicadores específicos foram solicitados, usa apenas esses
      // Caso contrário, usa o indicador principal do ODS
      const indicadoresParaUsar = indicadorIds && indicadorIds.length > 0 
        ? indicadorIds
        : [ods.indicador_principal || Object.keys(indicadoresODS)[0]];
      
      for (const indId of indicadoresParaUsar) {
        if (indicadoresODS[indId]) {
          dadosIndicadores.push({
            odsId: odsIds[i],
            indicadorId: indId,
            titulo: indicadoresODS[indId].titulo || `Indicador ${indId}`,
            dados: indicadoresODS[indId].valores || [],
            anos: indicadoresODS[indId].anos || [],
            cor: obterCorODS(odsIds[i]),
            unidade: indicadoresODS[indId].unidade || ''
          });
        }
      }
    }
    
    // Se não encontrou nenhum indicador válido
    if (dadosIndicadores.length === 0) {
      elementoDestino.innerHTML = '<div class="erro-comparativo">Não foi possível obter dados para comparação.</div>';
      return { sucesso: false, erro: 'Dados insuficientes para comparação' };
    }
    
    // Prepara dados para visualização
    const dadosProcessados = processarDadosIndicadores(dadosIndicadores, config);
    
    // Gera matriz de correlação entre os indicadores
    let matrizCorrelacao = null;
    if (config.mostrarCorrelacao) {
      matrizCorrelacao = calcularMatrizCorrelacaoIndicadores(dadosIndicadores);
    }
    
    // Limpa o elemento de destino
    elementoDestino.innerHTML = '';
    
    // Cria container para visualização
    const container = document.createElement('div');
    container.className = 'dashboard-comparativo-container';
    
    // Adiciona título ao dashboard
    const titulo = document.createElement('h3');
    titulo.textContent = 'Análise Comparativa de Indicadores ODS';
    titulo.className = 'dashboard-titulo';
    container.appendChild(titulo);
    
    // Adiciona descrição acessível (para leitores de tela)
    if (config.acessivel) {
      const descricaoAcessivel = document.createElement('div');
      descricaoAcessivel.className = 'screen-reader-only';
      descricaoAcessivel.setAttribute('role', 'region');
      descricaoAcessivel.setAttribute('aria-live', 'polite');
      descricaoAcessivel.textContent = `Comparação entre ${dadosIndicadores.length} indicadores de ODS: ${
        dadosIndicadores.map(ind => `${ind.titulo} (ODS ${ind.odsId.replace('ods', '')})`).join(', ')
      }`;
      container.appendChild(descricaoAcessivel);
    }
    
    // Adiciona filtros e controles
    const controles = criarControlesDashboard(dadosIndicadores, config, atualizarVisualizacao);
    container.appendChild(controles);
    
    // Cria área do gráfico
    const areaGrafico = document.createElement('div');
    areaGrafico.className = 'grafico-comparativo-area';
    areaGrafico.innerHTML = '<canvas id="grafico-comparativo"></canvas>';
    container.appendChild(areaGrafico);
    
    // Se solicitado, adiciona tabela de dados
    if (config.mostrarTabela) {
      const tabelaDados = criarTabelaDados(dadosProcessados);
      container.appendChild(tabelaDados);
    }
    
    // Se temos matriz de correlação, adiciona visualização
    if (matrizCorrelacao) {
      const areaCorrelacao = document.createElement('div');
      areaCorrelacao.className = 'correlacao-area';
      areaCorrelacao.innerHTML = '<h4>Correlação entre Indicadores</h4>';
      
      const tabelaCorrelacao = criarTabelaCorrelacao(matrizCorrelacao, dadosIndicadores);
      areaCorrelacao.appendChild(tabelaCorrelacao);
      
      container.appendChild(areaCorrelacao);
    }
    
    // Adiciona informações sobre os ODS comparados
    const infoArea = document.createElement('div');
    infoArea.className = 'info-comparativa-area';
    
    // Para cada ODS, adiciona uma carta com info resumida
    odsIds.forEach(async (odsId, index) => {
      const cartaODS = document.createElement('div');
      cartaODS.className = 'carta-ods';
      cartaODS.style.borderColor = obterCorODS(odsId);
      
      const ods = dadosODS[index];
      
      cartaODS.innerHTML = `
        <h4>ODS ${odsId.replace('ods', '')}: ${ods.titulo || 'Objetivo de Desenvolvimento Sustentável'}</h4>
        <p class="ods-descricao">${ods.descricao_curta || ''}</p>
        <div class="ods-indicadores-principais">
          <strong>Indicadores principais:</strong>
          <ul>
            ${Object.keys(ods.indicadores || {}).slice(0, 3).map(indId => 
              `<li>${ods.indicadores[indId].titulo || indId}</li>`
            ).join('')}
          </ul>
        </div>
        <a href="/painel-ods/${odsId}.html" class="btn-ver-mais">Ver detalhes</a>
      `;
      
      infoArea.appendChild(cartaODS);
    });
    
    container.appendChild(infoArea);
    
    // Adiciona o container ao elemento de destino
    elementoDestino.appendChild(container);
    
    // Renderiza o gráfico
    const grafico = renderizarGraficoComparativo('grafico-comparativo', dadosProcessados, config);
    
    // Função para atualizar a visualização quando os controles são alterados
    function atualizarVisualizacao(novaConfig) {
      // Atualiza a configuração
      Object.assign(config, novaConfig);
      
      // Reprocessa os dados
      const novosDadosProcessados = processarDadosIndicadores(dadosIndicadores, config);
      
      // Atualiza o gráfico
      atualizarGraficoComparativo(grafico, novosDadosProcessados, config);
      
      // Se tabela está visível, atualiza
      if (config.mostrarTabela) {
        const tabelaExistente = document.querySelector('.tabela-dados-comparativos');
        if (tabelaExistente) {
          tabelaExistente.remove();
        }
        container.appendChild(criarTabelaDados(novosDadosProcessados));
      } else {
        // Remove tabela se existir mas não deve mais ser mostrada
        const tabelaExistente = document.querySelector('.tabela-dados-comparativos');
        if (tabelaExistente) {
          tabelaExistente.remove();
        }
      }
    }
    
    return { 
      sucesso: true,
      grafico, 
      config,
      dadosIndicadores,
      matrizCorrelacao,
      atualizarVisualizacao 
    };
  } catch (erro) {
    console.error('Erro ao gerar dashboard comparativo:', erro);
    
    // Elemento onde seria renderizado o dashboard
    const elementoDestino = document.getElementById(elementoId);
    if (elementoDestino) {
      elementoDestino.innerHTML = `
        <div class="erro-comparativo">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erro ao gerar dashboard comparativo: ${erro.message}</p>
        </div>
      `;
    }
    
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * Processa os dados dos indicadores para formato utilizável pela visualização
 * @param {Array<Object>} indicadores - Lista de indicadores com seus dados
 * @param {Object} config - Configurações de processamento
 * @returns {Object} - Dados processados prontos para visualização
 * @private
 */
function processarDadosIndicadores(indicadores, config) {
  // Determina o período comum para todos os indicadores
  const periodoInicial = config.periodoInicial || Math.min(
    ...indicadores.map(ind => Math.min(...(ind.anos || [])))
  );
  
  const periodoFinal = config.periodoFinal || Math.max(
    ...indicadores.map(ind => Math.max(...(ind.anos || [])))
  );
  
  // Cria array de anos para o eixo X
  const anos = [];
  for (let ano = periodoInicial; ano <= periodoFinal; ano++) {
    anos.push(ano);
  }
  
  // Prepara dados para cada indicador
  const datasets = indicadores.map(indicador => {
    // Mapeia os dados para o período completo, preenchendo lacunas com null
    const valores = anos.map(ano => {
      const indexAno = indicador.anos ? indicador.anos.indexOf(ano) : -1;
      return indexAno >= 0 ? indicador.dados[indexAno] : null;
    });
    
    return {
      label: `${indicador.titulo} (ODS ${indicador.odsId.replace('ods', '')})`,
      data: valores,
      backgroundColor: indicador.cor,
      borderColor: indicador.cor,
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointRadius: 3,
      pointHoverRadius: 5,
      odsId: indicador.odsId,
      indicadorId: indicador.indicadorId,
      unidade: indicador.unidade
    };
  });
  
  return {
    labels: anos,
    datasets
  };
}

/**
 * Cria controles interativos para o dashboard
 * @param {Array<Object>} indicadores - Lista de indicadores disponíveis
 * @param {Object} configInicial - Configuração inicial
 * @param {Function} callbackAtualizacao - Função chamada quando configurações mudam
 * @returns {HTMLElement} - Elemento DOM com os controles
 * @private
 */
function criarControlesDashboard(indicadores, configInicial, callbackAtualizacao) {
  const containerControles = document.createElement('div');
  containerControles.className = 'controles-dashboard';
  
  // Controle de tipo de gráfico
  const tiposGrafico = [
    { id: 'linha', label: 'Linha', icon: 'fa-chart-line' },
    { id: 'barra', label: 'Barra', icon: 'fa-chart-bar' },
    { id: 'radar', label: 'Radar', icon: 'fa-chart-pie' }
  ];
  
  const selectorTipo = document.createElement('div');
  selectorTipo.className = 'selector-tipo-grafico';
  selectorTipo.innerHTML = `
    <label>Tipo de Visualização:</label>
    <div class="opcoes-tipo">
      ${tiposGrafico.map(tipo => `
        <button class="btn-tipo ${configInicial.tipoGrafico === tipo.id ? 'ativo' : ''}" 
                data-tipo="${tipo.id}" 
                aria-label="Visualizar como ${tipo.label}"
                title="Visualizar como ${tipo.label}">
          <i class="fas ${tipo.icon}"></i>
          <span>${tipo.label}</span>
        </button>
      `).join('')}
    </div>
  `;
  
  // Adiciona event listeners aos botões de tipo
  selectorTipo.querySelectorAll('.btn-tipo').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove classe ativo de todos os botões
      selectorTipo.querySelectorAll('.btn-tipo').forEach(b => b.classList.remove('ativo'));
      // Adiciona classe ativo ao botão clicado
      btn.classList.add('ativo');
      
      // Chama callback com nova configuração
      callbackAtualizacao({
        tipoGrafico: btn.dataset.tipo
      });
    });
  });
  
  containerControles.appendChild(selectorTipo);
  
  // Controle de período
  const selectorPeriodo = document.createElement('div');
  selectorPeriodo.className = 'selector-periodo';
  
  // Encontra o período mínimo e máximo disponível em todos os indicadores
  const todosAnos = indicadores.flatMap(ind => ind.anos || []);
  const anoMinimo = Math.min(...todosAnos);
  const anoMaximo = Math.max(...todosAnos);
  
  selectorPeriodo.innerHTML = `
    <label>Período:</label>
    <div class="controle-periodo">
      <select id="ano-inicial" aria-label="Ano inicial">
        ${Array.from({ length: anoMaximo - anoMinimo + 1 }, (_, i) => anoMinimo + i)
          .map(ano => `<option value="${ano}" ${ano === configInicial.periodoInicial ? 'selected' : ''}>${ano}</option>`)
          .join('')}
      </select>
      <span>até</span>
      <select id="ano-final" aria-label="Ano final">
        ${Array.from({ length: anoMaximo - anoMinimo + 1 }, (_, i) => anoMinimo + i)
          .map(ano => `<option value="${ano}" ${ano === configInicial.periodoFinal ? 'selected' : ''}>${ano}</option>`)
          .join('')}
      </select>
    </div>
  `;
  
  // Adiciona event listeners aos seletores de período
  selectorPeriodo.querySelector('#ano-inicial').addEventListener('change', e => {
    const novoAnoInicial = parseInt(e.target.value);
    const anoFinal = parseInt(selectorPeriodo.querySelector('#ano-final').value);
    
    // Garante que o ano inicial não seja maior que o final
    if (novoAnoInicial > anoFinal) {
      selectorPeriodo.querySelector('#ano-final').value = novoAnoInicial;
      callbackAtualizacao({
        periodoInicial: novoAnoInicial,
        periodoFinal: novoAnoInicial
      });
    } else {
      callbackAtualizacao({
        periodoInicial: novoAnoInicial
      });
    }
  });
  
  selectorPeriodo.querySelector('#ano-final').addEventListener('change', e => {
    const novoAnoFinal = parseInt(e.target.value);
    const anoInicial = parseInt(selectorPeriodo.querySelector('#ano-inicial').value);
    
    // Garante que o ano final não seja menor que o inicial
    if (novoAnoFinal < anoInicial) {
      selectorPeriodo.querySelector('#ano-inicial').value = novoAnoFinal;
      callbackAtualizacao({
        periodoInicial: novoAnoFinal,
        periodoFinal: novoAnoFinal
      });
    } else {
      callbackAtualizacao({
        periodoFinal: novoAnoFinal
      });
    }
  });
  
  containerControles.appendChild(selectorPeriodo);
  
  // Checkbox para tabela de dados
  const checkboxTabela = document.createElement('div');
  checkboxTabela.className = 'checkbox-container';
  checkboxTabela.innerHTML = `
    <label class="checkbox-label">
      <input type="checkbox" id="mostrar-tabela" ${configInicial.mostrarTabela ? 'checked' : ''}>
      Mostrar tabela de dados
    </label>
  `;
  
  checkboxTabela.querySelector('#mostrar-tabela').addEventListener('change', e => {
    callbackAtualizacao({
      mostrarTabela: e.target.checked
    });
  });
  
  containerControles.appendChild(checkboxTabela);
  
  return containerControles;
}

/**
 * Renderiza o gráfico comparativo usando Chart.js
 * @param {string} elementoId - ID do elemento canvas para renderizar o gráfico
 * @param {Object} dados - Dados processados para o gráfico
 * @param {Object} config - Configurações do gráfico
 * @returns {Object} - Instância do gráfico criado
 * @private
 */
function renderizarGraficoComparativo(elementoId, dados, config) {
  const canvas = document.getElementById(elementoId);
  if (!canvas) return null;
  
  // Determina o tipo de gráfico a usar
  let tipoChart;
  switch (config.tipoGrafico) {
    case 'barra':
      tipoChart = 'bar';
      break;
    case 'radar':
      tipoChart = 'radar';
      break;
    case 'linha':
    default:
      tipoChart = 'line';
      break;
  }
  
  // Configurações específicas para cada tipo de gráfico
  const opcoesEspecificas = {};
  
  if (tipoChart === 'bar') {
    opcoesEspecificas.barPercentage = 0.8;
    opcoesEspecificas.categoryPercentage = 0.9;
  } else if (tipoChart === 'radar') {
    opcoesEspecificas.elements = {
      line: {
        borderWidth: 3
      }
    };
  }
  
  // Cria o gráfico
  const grafico = new Chart(canvas, {
    type: tipoChart,
    data: dados,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          display: config.mostrarLegenda
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const dataset = context.dataset;
              const value = context.parsed.y || context.parsed || 0;
              const unidade = dataset.unidade || '';
              return `${dataset.label}: ${value}${unidade ? ` ${unidade}` : ''}`;
            }
          }
        }
      },
      scales: tipoChart !== 'radar' ? {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              // Verifica se algum dataset tem unidade
              const unidades = new Set(dados.datasets.map(d => d.unidade).filter(Boolean));
              // Se todas as unidades são iguais, mostra junto ao valor
              if (unidades.size === 1) {
                return `${value} ${Array.from(unidades)[0]}`;
              }
              return value;
            }
          }
        }
      } : {},
      ...opcoesEspecificas
    }
  });
  
  return grafico;
}

/**
 * Atualiza um gráfico existente com novos dados
 * @param {Object} grafico - Instância do gráfico a atualizar
 * @param {Object} dados - Novos dados para o gráfico
 * @param {Object} config - Novas configurações
 * @private
 */
function atualizarGraficoComparativo(grafico, dados, config) {
  if (!grafico) return;
  
  // Determina o tipo de gráfico a usar
  let tipoChart;
  switch (config.tipoGrafico) {
    case 'barra':
      tipoChart = 'bar';
      break;
    case 'radar':
      tipoChart = 'radar';
      break;
    case 'linha':
    default:
      tipoChart = 'line';
      break;
  }
  
  // Atualiza o tipo de gráfico
  grafico.config.type = tipoChart;
  
  // Atualiza os dados
  grafico.data.labels = dados.labels;
  grafico.data.datasets = dados.datasets;
  
  // Atualiza configurações específicas para cada tipo de gráfico
  if (tipoChart === 'bar') {
    grafico.options.barPercentage = 0.8;
    grafico.options.categoryPercentage = 0.9;
  } else if (tipoChart === 'radar') {
    grafico.options.elements = {
      line: {
        borderWidth: 3
      }
    };
  }
  
  // Atualiza visibilidade da legenda
  grafico.options.plugins.legend.display = config.mostrarLegenda;
  
  // Atualiza o gráfico
  grafico.update();
}

/**
 * Cria uma tabela HTML com os dados dos indicadores
 * @param {Object} dados - Dados processados dos indicadores
 * @returns {HTMLElement} - Elemento tabela com os dados
 * @private
 */
function criarTabelaDados(dados) {
  const container = document.createElement('div');
  container.className = 'tabela-dados-comparativos';
  
  // Cria título para a tabela
  const titulo = document.createElement('h4');
  titulo.textContent = 'Dados Comparativos';
  container.appendChild(titulo);
  
  // Cria a tabela
  const tabela = document.createElement('table');
  tabela.className = 'tabela-indicadores';
  tabela.setAttribute('aria-label', 'Tabela de dados comparativos entre indicadores');
  
  // Cria cabeçalho
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Célula de Ano
  const thAno = document.createElement('th');
  thAno.textContent = 'Ano';
  thAno.setAttribute('scope', 'col');
  headerRow.appendChild(thAno);
  
  // Células para cada indicador
  dados.datasets.forEach(dataset => {
    const th = document.createElement('th');
    th.textContent = dataset.label;
    th.setAttribute('scope', 'col');
    th.style.borderBottomColor = dataset.borderColor;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  tabela.appendChild(thead);
  
  // Cria corpo da tabela
  const tbody = document.createElement('tbody');
  
  // Para cada ano, cria uma linha com os valores de cada indicador
  dados.labels.forEach((ano, index) => {
    const row = document.createElement('tr');
    
    // Célula de ano
    const tdAno = document.createElement('td');
    tdAno.textContent = ano;
    tdAno.setAttribute('scope', 'row');
    row.appendChild(tdAno);
    
    // Células para cada indicador
    dados.datasets.forEach(dataset => {
      const td = document.createElement('td');
      const valor = dataset.data[index];
      
      if (valor === null || valor === undefined) {
        td.textContent = '-';
        td.className = 'sem-dados';
      } else {
        td.textContent = `${valor}${dataset.unidade ? ` ${dataset.unidade}` : ''}`;
      }
      
      row.appendChild(td);
    });
    
    tbody.appendChild(row);
  });
  
  tabela.appendChild(tbody);
  container.appendChild(tabela);
  
  // Adiciona botão para exportar dados
  const btnExportar = document.createElement('button');
  btnExportar.className = 'btn-exportar';
  btnExportar.innerHTML = '<i class="fas fa-download"></i> Exportar dados (CSV)';
  btnExportar.addEventListener('click', () => {
    exportarDadosCSV(dados);
  });
  container.appendChild(btnExportar);
  
  return container;
}

/**
 * Calcula a matriz de correlação entre indicadores
 * @param {Array<Object>} indicadores - Lista de indicadores
 * @returns {Object} - Matriz de correlação
 * @private
 */
function calcularMatrizCorrelacaoIndicadores(indicadores) {
  const matriz = {};
  
  // Para cada par de indicadores, calcula o coeficiente de correlação
  for (let i = 0; i < indicadores.length; i++) {
    const indA = indicadores[i];
    const idA = `${indA.odsId}_${indA.indicadorId}`;
    
    matriz[idA] = {
      titulo: indA.titulo,
      odsId: indA.odsId,
      correlacoes: {}
    };
    
    for (let j = 0; j < indicadores.length; j++) {
      const indB = indicadores[j];
      const idB = `${indB.odsId}_${indB.indicadorId}`;
      
      // O mesmo indicador tem correlação 1
      if (i === j) {
        matriz[idA].correlacoes[idB] = 1;
        continue;
      }
      
      // Encontra os anos em comum entre os dois indicadores
      const anosA = indA.anos || [];
      const anosB = indB.anos || [];
      const anosComuns = anosA.filter(ano => anosB.includes(ano));
      
      // Se não há anos em comum, a correlação é 0
      if (anosComuns.length === 0) {
        matriz[idA].correlacoes[idB] = 0;
        continue;
      }
      
      // Extrai valores apenas para os anos em comum
      const valoresA = anosComuns.map(ano => {
        const idx = indA.anos.indexOf(ano);
        return idx >= 0 ? indA.dados[idx] : null;
      }).filter(valor => valor !== null);
      
      const valoresB = anosComuns.map(ano => {
        const idx = indB.anos.indexOf(ano);
        return idx >= 0 ? indB.dados[idx] : null;
      }).filter(valor => valor !== null);
      
      // Calcula a correlação de Pearson
      matriz[idA].correlacoes[idB] = calcularCorrelacaoPearson(valoresA, valoresB);
    }
  }
  
  return matriz;
}

/**
 * Calcula o coeficiente de correlação de Pearson entre dois conjuntos de dados
 * @param {Array<number>} x - Primeiro conjunto de valores
 * @param {Array<number>} y - Segundo conjunto de valores
 * @returns {number} - Coeficiente de correlação entre -1 e 1
 * @private
 */
function calcularCorrelacaoPearson(x, y) {
  // Verifica se os arrays têm o mesmo tamanho
  if (x.length !== y.length) {
    console.warn('Arrays com tamanhos diferentes para correlação');
    return 0;
  }
  
  // Se algum array estiver vazio, retorna 0
  if (x.length === 0 || y.length === 0) {
    return 0;
  }

  // Implementação do coeficiente de correlação de Pearson
  const n = x.length;
  const somaX = x.reduce((a, b) => a + b, 0);
  const somaY = y.reduce((a, b) => a + b, 0);
  const somaQuadradoX = x.reduce((a, b) => a + b ** 2, 0);
  const somaQuadradoY = y.reduce((a, b) => a + b ** 2, 0);
  const somaProduto = x.reduce((a, b, i) => a + b * y[i], 0);

  const numerador = (n * somaProduto) - (somaX * somaY);
  const denominador = Math.sqrt((n * somaQuadradoX - somaX ** 2) * (n * somaQuadradoY - somaY ** 2));

  // Evitar divisão por zero
  return denominador === 0 ? 0 : numerador / denominador;
}

/**
 * Cria uma tabela HTML com os coeficientes de correlação entre indicadores
 * @param {Object} matriz - Matriz de correlação entre indicadores
 * @param {Array<Object>} indicadores - Lista de indicadores
 * @returns {HTMLElement} - Elemento tabela com os coeficientes
 * @private
 */
function criarTabelaCorrelacao(matriz, indicadores) {
  const container = document.createElement('div');
  container.className = 'tabela-correlacao-container';
  
  // Cria a tabela
  const tabela = document.createElement('table');
  tabela.className = 'tabela-correlacao';
  tabela.setAttribute('aria-label', 'Tabela de correlação entre indicadores');
  
  // Cria cabeçalho
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Célula vazia no canto superior esquerdo
  const thVazio = document.createElement('th');
  headerRow.appendChild(thVazio);
  
  // Células para cada indicador
  indicadores.forEach(ind => {
    const th = document.createElement('th');
    th.textContent = `ODS ${ind.odsId.replace('ods', '')}`;
    th.setAttribute('scope', 'col');
    th.title = ind.titulo;
    th.style.borderBottomColor = ind.cor;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  tabela.appendChild(thead);
  
  // Cria corpo da tabela
  const tbody = document.createElement('tbody');
  
  // Para cada indicador, cria uma linha com os coeficientes de correlação
  indicadores.forEach(indA => {
    const row = document.createElement('tr');
    const idA = `${indA.odsId}_${indA.indicadorId}`;
    
    // Célula com o nome do indicador
    const tdNome = document.createElement('td');
    tdNome.textContent = `ODS ${indA.odsId.replace('ods', '')}`;
    tdNome.setAttribute('scope', 'row');
    tdNome.title = indA.titulo;
    tdNome.style.borderRightColor = indA.cor;
    row.appendChild(tdNome);
    
    // Células para cada coeficiente de correlação
    indicadores.forEach(indB => {
      const idB = `${indB.odsId}_${indB.indicadorId}`;
      const td = document.createElement('td');
      
      if (matriz[idA] && matriz[idA].correlacoes[idB] !== undefined) {
        const coeficiente = matriz[idA].correlacoes[idB];
        td.textContent = coeficiente.toFixed(2);
        
        // Adiciona classes de acordo com o valor do coeficiente
        if (Math.abs(coeficiente) > 0.7) {
          td.className = coeficiente > 0 ? 'correlacao-forte-positiva' : 'correlacao-forte-negativa';
        } else if (Math.abs(coeficiente) > 0.3) {
          td.className = coeficiente > 0 ? 'correlacao-media-positiva' : 'correlacao-media-negativa';
        } else {
          td.className = 'correlacao-fraca';
        }
      } else {
        td.textContent = '-';
        td.className = 'sem-dados';
      }
      
      row.appendChild(td);
    });
    
    tbody.appendChild(row);
  });
  
  tabela.appendChild(tbody);
  
  // Adiciona legenda de cores
  const legenda = document.createElement('div');
  legenda.className = 'legenda-correlacao';
  legenda.innerHTML = `
    <div class="legenda-item"><span class="cor correlacao-forte-positiva"></span> Forte correlação positiva (> 0.7)</div>
    <div class="legenda-item"><span class="cor correlacao-media-positiva"></span> Média correlação positiva (0.3 a 0.7)</div>
    <div class="legenda-item"><span class="cor correlacao-fraca"></span> Correlação fraca (-0.3 a 0.3)</div>
    <div class="legenda-item"><span class="cor correlacao-media-negativa"></span> Média correlação negativa (-0.7 a -0.3)</div>
    <div class="legenda-item"><span class="cor correlacao-forte-negativa"></span> Forte correlação negativa (< -0.7)</div>
  `;
  
  container.appendChild(tabela);
  container.appendChild(legenda);
  
  return container;
}

/**
 * Exporta os dados comparativos para um arquivo CSV
 * @param {Object} dados - Dados processados dos indicadores
 * @private
 */
function exportarDadosCSV(dados) {
  try {
    // Cabeçalho do CSV
    let csv = 'Ano,';
    csv += dados.datasets.map(ds => `"${ds.label}"`).join(',');
    csv += '\n';
    
    // Dados por ano
    dados.labels.forEach((ano, i) => {
      csv += ano + ',';
      csv += dados.datasets.map(ds => {
        const valor = ds.data[i];
        return valor === null || valor === undefined ? '' : valor;
      }).join(',');
      csv += '\n';
    });
    
    // Cria o arquivo para download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `comparativo_ods_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (erro) {
    console.error('Erro ao exportar dados para CSV:', erro);
    alert('Erro ao exportar dados. Por favor, tente novamente.');
  }
}

/**
 * Obtém a cor padrão associada a um ODS específico
 * @param {string} odsId - ID do ODS (ods1, ods2, etc.)
 * @returns {string} - Código de cor em formato CSS
 * @private
 */
function obterCorODS(odsId) {
  // Tabela de cores dos ODS da ONU
  const coresODS = {
    'ods1': '#e5243b', // Vermelho
    'ods2': '#DDA63A', // Amarelo
    'ods3': '#4C9F38', // Verde escuro
    'ods4': '#C5192D', // Vermelho escuro
    'ods5': '#FF3A21', // Laranja avermelhado
    'ods6': '#26BDE2', // Azul claro
    'ods7': '#FCC30B', // Amarelo dourado
    'ods8': '#A21942', // Bordô
    'ods9': '#FD6925', // Laranja
    'ods10': '#DD1367', // Magenta
    'ods11': '#FD9D24', // Laranja amarelado
    'ods12': '#BF8B2E', // Marrom dourado
    'ods13': '#3F7E44', // Verde escuro
    'ods14': '#0A97D9', // Azul
    'ods15': '#56C02B', // Verde claro
    'ods16': '#00689D', // Azul marinho
    'ods17': '#19486A', // Azul muito escuro
    'ods18': '#000000'  // Preto (ODS específico do LIMFS)
  };
  
  // Normaliza o ID (remove 'ods' se presente e adiciona novamente)
  const id = 'ods' + odsId.toString().replace('ods', '');
  
  // Retorna a cor ou um valor padrão se não encontrada
  return coresODS[id] || '#777777';
}

// Exporta funções públicas
export default {
  gerarDashboardComparativo,
  obterCorODS
};