/**
 * @file comparativo-ods.js
 * @description Implementa a funcionalidade de comparação entre indicadores de diferentes ODS
 * @version 1.0.0
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 */

import { gerarDashboardComparativo, obterCorODS } from './modules/visualizacaoIntegrada.js';
import { carregarDadosODS } from './modules/carregadorDados.js';
import { gerarRecomendacoesIntegradas } from './modules/integradorODS.js';

// Armazena o estado atual da seleção
const estado = {
  odsSelecionados: [],
  indicadoresSelecionados: {},
  limite: 4, // Máximo de ODS permitidos para comparação
  dadosODS: {}
};

// Elementos DOM
const elementos = {
  seletorODS: document.getElementById('seletor-ods'),
  areaIndicadores: document.getElementById('area-indicadores'),
  listaIndicadores: document.getElementById('lista-indicadores'),
  btnComparar: document.getElementById('btn-comparar'),
  btnLimpar: document.getElementById('btn-limpar'),
  areaDashboard: document.getElementById('area-dashboard'),
  dashboardComparativo: document.getElementById('dashboard-comparativo'),
  areaRecomendacoes: document.getElementById('area-recomendacoes'),
  listaRecomendacoes: document.getElementById('lista-recomendacoes')
};

/**
 * Inicializa a página de comparação de ODS
 */
async function inicializar() {
  try {
    // Carrega a lista de ODS disponíveis
    await carregarODSDisponiveis();
    
    // Adiciona eventos
    elementos.btnComparar.addEventListener('click', gerarComparativo);
    elementos.btnLimpar.addEventListener('click', limparSelecao);
    
    console.log('Comparativo ODS inicializado');
  } catch (erro) {
    console.error('Erro ao inicializar comparativo ODS:', erro);
    exibirErro('Não foi possível carregar os ODS disponíveis para comparação. Por favor, tente novamente mais tarde.');
  }
}

/**
 * Carrega a lista de ODS disponíveis e gera a grade de seleção
 */
async function carregarODSDisponiveis() {
  try {
    // Carrega arquivo de configuração dos ODS
    const responseODS = await fetch('/dados/ods-config.json');
    if (!responseODS.ok) throw new Error(`Erro HTTP: ${responseODS.status}`);
    
    const configODS = await responseODS.json();
    
    // Gera a grade de seleção
    gerarSeletorODS(configODS.lista_ods);
  } catch (erro) {
    console.error('Erro ao carregar ODS disponíveis:', erro);
    throw erro;
  }
}

/**
 * Gera a grade de seleção de ODS
 * @param {Array} listaODS - Lista de ODS disponíveis
 */
function gerarSeletorODS(listaODS) {
  if (!elementos.seletorODS) return;
  
  elementos.seletorODS.innerHTML = '';
  
  listaODS.forEach(ods => {
    const itemODS = document.createElement('div');
    itemODS.className = 'ods-item';
    itemODS.dataset.ods = ods.id;
    
    // Utiliza as cores oficiais de cada ODS
    const corODS = obterCorODS(ods.id);
    
    itemODS.innerHTML = `
      <div class="ods-badge" style="background-color: ${corODS}">
        <span>${ods.id.replace('ods', '')}</span>
      </div>
      <div class="ods-info">
        <h3>${ods.titulo_curto || ods.titulo}</h3>
      </div>
      <div class="ods-check">
        <input type="checkbox" id="check-${ods.id}" data-ods="${ods.id}" 
               aria-label="Selecionar ${ods.titulo_curto || ods.titulo}">
      </div>
    `;
    
    // Adiciona evento para seleção/deseleção do ODS
    const checkbox = itemODS.querySelector(`#check-${ods.id}`);
    checkbox.addEventListener('change', () => alternarSelecaoODS(ods.id, checkbox.checked));
    
    elementos.seletorODS.appendChild(itemODS);
  });
}

/**
 * Alterna a seleção de um ODS
 * @param {string} odsId - ID do ODS (ods1, ods2, etc.)
 * @param {boolean} selecionado - Se o ODS está selecionado
 */
async function alternarSelecaoODS(odsId, selecionado) {
  try {
    if (selecionado) {
      // Verifica se já atingiu o limite
      if (estado.odsSelecionados.length >= estado.limite) {
        // Remove a seleção do checkbox
        document.getElementById(`check-${odsId}`).checked = false;
        alert(`Você pode selecionar no máximo ${estado.limite} ODS para comparação.`);
        return;
      }
      
      // Adiciona o ODS à lista de selecionados
      estado.odsSelecionados.push(odsId);
      
      // Carrega os dados do ODS
      const dadosODS = await carregarDadosODS(odsId, { semIndicadoresUI: true });
      estado.dadosODS[odsId] = dadosODS;
      
      // Inicializa a lista de indicadores selecionados
      estado.indicadoresSelecionados[odsId] = [];
      
      // Destaca o item na grade
      const itemODS = document.querySelector(`.ods-item[data-ods="${odsId}"]`);
      if (itemODS) itemODS.classList.add('selecionado');
    } else {
      // Remove o ODS da lista de selecionados
      estado.odsSelecionados = estado.odsSelecionados.filter(id => id !== odsId);
      
      // Remove os indicadores selecionados
      delete estado.indicadoresSelecionados[odsId];
      delete estado.dadosODS[odsId];
      
      // Remove destaque do item na grade
      const itemODS = document.querySelector(`.ods-item[data-ods="${odsId}"]`);
      if (itemODS) itemODS.classList.remove('selecionado');
    }
    
    // Atualiza a lista de indicadores
    atualizarListaIndicadores();
    
    // Atualiza o botão de comparar
    atualizarBotaoComparar();
    
  } catch (erro) {
    console.error(`Erro ao alternar seleção do ODS ${odsId}:`, erro);
    exibirErro(`Não foi possível carregar os dados do ODS ${odsId}. Por favor, tente novamente.`);
  }
}

/**
 * Atualiza a lista de indicadores com base nos ODS selecionados
 */
function atualizarListaIndicadores() {
  if (!elementos.listaIndicadores) return;
  
  elementos.listaIndicadores.innerHTML = '';
  
  // Se não há ODS selecionados, oculta a área de indicadores
  if (estado.odsSelecionados.length === 0) {
    elementos.areaIndicadores.style.display = 'none';
    return;
  }
  
  // Mostra a área de indicadores
  elementos.areaIndicadores.style.display = 'block';
  
  // Para cada ODS selecionado, mostra seus indicadores
  estado.odsSelecionados.forEach(odsId => {
    const dadosODS = estado.dadosODS[odsId];
    
    if (!dadosODS || !dadosODS.indicadores) {
      console.warn(`Dados inválidos para o ODS ${odsId}`);
      return;
    }
    
    // Cria o container para este ODS
    const containerODS = document.createElement('div');
    containerODS.className = 'container-indicador';
    containerODS.style.borderColor = obterCorODS(odsId);
    
    // Adiciona cabeçalho do ODS
    containerODS.innerHTML = `
      <div class="indicador-cabecalho" style="background-color: ${obterCorODS(odsId)}">
        <h3>ODS ${odsId.replace('ods', '')}: ${dadosODS.titulo_curto || dadosODS.titulo || 'Objetivo de Desenvolvimento Sustentável'}</h3>
      </div>
      <div class="indicador-lista"></div>
    `;
    
    // Adiciona a lista de indicadores
    const listaIndicadores = containerODS.querySelector('.indicador-lista');
    
    Object.keys(dadosODS.indicadores).forEach(indicadorId => {
      const indicador = dadosODS.indicadores[indicadorId];
      
      // Cria o item de indicador
      const itemIndicador = document.createElement('div');
      itemIndicador.className = 'indicador-item';
      
      // Verifica se o indicador está selecionado
      const selecionado = estado.indicadoresSelecionados[odsId]?.includes(indicadorId);
      
      // Adiciona checkbox e informações
      itemIndicador.innerHTML = `
        <input type="checkbox" id="check-${odsId}-${indicadorId}" 
               data-ods="${odsId}" data-indicador="${indicadorId}"
               ${selecionado ? 'checked' : ''}>
        <label for="check-${odsId}-${indicadorId}">
          ${indicador.titulo || `Indicador ${indicadorId}`}
          <span class="indicador-unidade">${indicador.unidade ? `(${indicador.unidade})` : ''}</span>
        </label>
      `;
      
      // Adiciona evento para seleção/deseleção do indicador
      const checkbox = itemIndicador.querySelector(`#check-${odsId}-${indicadorId}`);
      checkbox.addEventListener('change', () => {
        alternarSelecaoIndicador(odsId, indicadorId, checkbox.checked);
      });
      
      listaIndicadores.appendChild(itemIndicador);
    });
    
    elementos.listaIndicadores.appendChild(containerODS);
  });
}

/**
 * Alterna a seleção de um indicador específico
 * @param {string} odsId - ID do ODS 
 * @param {string} indicadorId - ID do indicador
 * @param {boolean} selecionado - Se o indicador está selecionado
 */
function alternarSelecaoIndicador(odsId, indicadorId, selecionado) {
  if (!estado.indicadoresSelecionados[odsId]) {
    estado.indicadoresSelecionados[odsId] = [];
  }
  
  if (selecionado) {
    // Adiciona o indicador à lista de selecionados
    if (!estado.indicadoresSelecionados[odsId].includes(indicadorId)) {
      estado.indicadoresSelecionados[odsId].push(indicadorId);
    }
  } else {
    // Remove o indicador da lista de selecionados
    estado.indicadoresSelecionados[odsId] = estado.indicadoresSelecionados[odsId].filter(id => id !== indicadorId);
  }
  
  // Atualiza o botão de comparar
  atualizarBotaoComparar();
}

/**
 * Atualiza o estado do botão de comparar com base nos indicadores selecionados
 */
function atualizarBotaoComparar() {
  if (!elementos.btnComparar) return;
  
  // Conta quantos indicadores estão selecionados no total
  const totalIndicadoresSelecionados = Object.values(estado.indicadoresSelecionados)
    .reduce((total, indicadores) => total + indicadores.length, 0);
  
  // Habilita o botão se houver pelo menos 2 indicadores selecionados
  elementos.btnComparar.disabled = totalIndicadoresSelecionados < 2;
}

/**
 * Gera o comparativo com base nos indicadores selecionados
 */
async function gerarComparativo() {
  try {
    // Prepara arrays de ODS e indicadores com base na seleção
    const odsComIndicadores = Object.entries(estado.indicadoresSelecionados)
      .filter(([_, indicadores]) => indicadores.length > 0);
    
    // Se não há pelo menos 2 ODS com indicadores, não continua
    if (odsComIndicadores.length < 1) {
      alert('Selecione pelo menos 2 indicadores para comparação.');
      return;
    }
    
    // Lista de ODS e indicadores a comparar
    const odsParaComparar = odsComIndicadores.map(([odsId, _]) => odsId);
    
    // Achatados todos os indicadores selecionados
    const todosIndicadores = odsComIndicadores.flatMap(([odsId, indicadores]) => 
      indicadores.map(indId => ({ odsId, indicadorId: indId }))
    );
    
    // Se não há pelo menos 2 indicadores no total, não continua
    if (todosIndicadores.length < 2) {
      alert('Selecione pelo menos 2 indicadores para comparação.');
      return;
    }
    
    // Mostra área do dashboard
    elementos.areaDashboard.style.display = 'block';
    elementos.dashboardComparativo.innerHTML = '<div class="loading-comparativo">Gerando análise comparativa...</div>';
    
    // Rolar para a área do dashboard
    elementos.areaDashboard.scrollIntoView({ behavior: 'smooth' });
    
    // Gera o dashboard comparativo
    const resultado = await gerarDashboardComparativo(
      odsParaComparar,
      null, // Passa null para que o módulo use os indicadores específicos de cada ODS
      'dashboard-comparativo',
      {
        mostrarCorrelacao: true,
        mostrarLegenda: true,
        tipoGrafico: 'linha',
        periodoInicial: 2015,
        periodoFinal: new Date().getFullYear()
      }
    );
    
    if (resultado.sucesso) {
      // Gera recomendações com base nas correlações
      if (resultado.matrizCorrelacao) {
        gerarRecomendacoes(resultado.matrizCorrelacao, resultado.dadosIndicadores);
      }
    } else {
      // Se houve erro, exibe mensagem
      exibirErro(resultado.erro || 'Não foi possível gerar o dashboard comparativo.');
    }
    
  } catch (erro) {
    console.error('Erro ao gerar comparativo:', erro);
    exibirErro('Ocorreu um erro ao gerar o comparativo. Por favor, tente novamente.');
  }
}

/**
 * Gera recomendações com base nas correlações entre indicadores
 * @param {Object} matrizCorrelacao - Matriz de correlação entre indicadores
 * @param {Array} dadosIndicadores - Dados dos indicadores comparados
 */
function gerarRecomendacoes(matrizCorrelacao, dadosIndicadores) {
  if (!elementos.listaRecomendacoes || !elementos.areaRecomendacoes) return;
  
  try {
    // Extrai as correlações significativas (acima de um limiar)
    const correlacoes = [];
    const limiar = 0.5; // Considera apenas correlações acima deste valor (positivas ou negativas)
    
    Object.keys(matrizCorrelacao).forEach(idA => {
      const infoA = matrizCorrelacao[idA];
      
      Object.keys(infoA.correlacoes).forEach(idB => {
        // Evita auto-correlações e duplicações
        if (idA === idB) return;
        
        const coeficiente = infoA.correlacoes[idB];
        
        // Considera apenas correlações significativas
        if (Math.abs(coeficiente) >= limiar) {
          // Garante que não adiciona a mesma correlação duas vezes (A->B e B->A)
          const chaveUnica = [idA, idB].sort().join('_');
          
          // Verifica se esta correlação já foi adicionada
          if (!correlacoes.some(c => c.chave === chaveUnica)) {
            correlacoes.push({
              chave: chaveUnica,
              odsA: infoA.odsId,
              odsB: idB.split('_')[0], // Extrai o ODS do ID completo (formato: odsX_indicadorY)
              coeficiente,
              tipoRelacao: coeficiente > 0 ? 'positiva' : 'negativa'
            });
          }
        }
      });
    });
    
    // Se não há correlações significativas, oculta a área de recomendações
    if (correlacoes.length === 0) {
      elementos.areaRecomendacoes.style.display = 'none';
      return;
    }
    
    // Ordena por magnitude da correlação (do maior para o menor valor absoluto)
    correlacoes.sort((a, b) => Math.abs(b.coeficiente) - Math.abs(a.coeficiente));
    
    // Gera as recomendações com base nas correlações identificadas
    const recomendacoes = correlacoes.map(correlacao => {
      const indicadoresRelacionados = dadosIndicadores.filter(ind => 
        ind.odsId === correlacao.odsA || ind.odsId === correlacao.odsB
      );
      
      return {
        id: correlacao.chave,
        odsRelacionados: [
          { id: correlacao.odsA, tipoRelacao: correlacao.tipoRelacao },
          { id: correlacao.odsB, tipoRelacao: correlacao.tipoRelacao }
        ],
        coeficiente: correlacao.coeficiente,
        indicadoresRelacionados
      };
    });
    
    // Usa o módulo integradorODS para gerar recomendações políticas
    const recomendacoesTexto = recomendacoes.flatMap(rec => 
      gerarRecomendacoesIntegradas(rec.odsRelacionados)
    );
    
    // Remove duplicatas nas recomendações
    const recomendacoesUnicas = [...new Set(recomendacoesTexto)];
    
    // Mostra a área de recomendações
    elementos.areaRecomendacoes.style.display = 'block';
    
    // Limpa e preenche a lista de recomendações
    elementos.listaRecomendacoes.innerHTML = '';
    
    if (recomendacoesUnicas.length === 0) {
      elementos.listaRecomendacoes.innerHTML = `
        <div class="sem-recomendacoes">
          <i class="fas fa-info-circle"></i>
          <p>Não foi possível gerar recomendações específicas para os indicadores selecionados.</p>
        </div>
      `;
    } else {
      recomendacoesUnicas.forEach(recomendacao => {
        const itemRecomendacao = document.createElement('div');
        itemRecomendacao.className = 'recomendacao-item';
        
        itemRecomendacao.innerHTML = `
          <i class="fas fa-lightbulb"></i>
          <p>${recomendacao}</p>
        `;
        
        elementos.listaRecomendacoes.appendChild(itemRecomendacao);
      });
    }
    
  } catch (erro) {
    console.error('Erro ao gerar recomendações:', erro);
    elementos.areaRecomendacoes.style.display = 'none';
  }
}

/**
 * Limpa toda a seleção atual de ODS e indicadores
 */
function limparSelecao() {
  // Desmarca todos os checkboxes de ODS
  document.querySelectorAll('.ods-check input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Remove classes de seleção
  document.querySelectorAll('.ods-item.selecionado').forEach(item => {
    item.classList.remove('selecionado');
  });
  
  // Reseta o estado
  estado.odsSelecionados = [];
  estado.indicadoresSelecionados = {};
  estado.dadosODS = {};
  
  // Oculta áreas que dependem da seleção
  elementos.areaIndicadores.style.display = 'none';
  elementos.areaDashboard.style.display = 'none';
  elementos.areaRecomendacoes.style.display = 'none';
  
  // Atualiza botões
  atualizarBotaoComparar();
}

/**
 * Exibe mensagem de erro na interface
 * @param {string} mensagem - Mensagem de erro
 */
function exibirErro(mensagem) {
  if (elementos.dashboardComparativo) {
    elementos.dashboardComparativo.innerHTML = `
      <div class="erro-comparativo">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${mensagem}</p>
      </div>
    `;
  } else {
    alert(mensagem);
  }
}

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializar);