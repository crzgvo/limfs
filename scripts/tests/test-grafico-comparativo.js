/**
 * Script para validação técnica do gráfico comparativo dinâmico do Painel ODS
 * Testa a geração de um gráfico comparativo com ODS 1, 4 e 5 selecionados
 * 
 * Parte da validação técnica do Dashboard Comparativo Dinâmico (ODS)
 */

(async () => {
  try {
    console.log('🧪 Iniciando validação do gráfico comparativo dinâmico...');
    console.log('📊 ODS a serem comparados: ODS 1, ODS 4 e ODS 5');
    
    // Se a função global não estiver disponível, tenta importar do módulo
    if (typeof gerarGraficoComparativo !== 'function') {
      console.log('🔄 Importando módulo painel-ods.js...');
      try {
        // Corrigindo o caminho para importação relativa correta
        const painelODS = await import('../../js/painel-ods.js');
        console.log('✅ Módulo importado com sucesso!');
        
        // Executa o teste com os ODS solicitados
        await painelODS.gerarGraficoComparativo(['ods1', 'ods4', 'ods5']);
        console.log('✅ Gráfico comparativo gerado com sucesso para ODS 1, 4 e 5.');
      } catch (erroImport) {
        console.error('❌ Erro ao importar módulo:', erroImport);
        console.error('📝 Detalhes:', erroImport.message);
        return;
      }
    } else {
      // Caso a função já esteja disponível globalmente
      try {
        await gerarGraficoComparativo(['ods1', 'ods4', 'ods5']);
        console.log('✅ Gráfico comparativo gerado com sucesso para ODS 1, 4 e 5.');
      } catch (erroExecucao) {
        console.error('❌ Erro ao executar gerarGraficoComparativo:', erroExecucao);
        console.error('📝 Detalhes:', erroExecucao.message);
        return;
      }
    }
    
    // Verificação do elemento canvas
    const canvas = document.getElementById('grafico-comparativo');
    if (canvas) {
      console.log('✅ Canvas do gráfico encontrado no DOM');
      
      // Verifica se o Chart.js criou uma instância para este canvas
      if (typeof Chart !== 'undefined' && Chart.getChart(canvas)) {
        console.log('✅ Instância do Chart.js criada com sucesso');
        
        // Verifica se o gráfico tem os datasets esperados
        const chart = Chart.getChart(canvas);
        const datasets = chart.data.datasets;
        
        if (datasets.length === 3) {
          console.log('✅ Número correto de datasets (3) no gráfico');
          
          // Verifica os labels dos datasets
          const labels = datasets.map(ds => ds.label);
          console.log('📊 Labels dos datasets:', labels.join(', '));
          
          // Verifica se há dados em cada dataset
          const datasetsComDados = datasets.every(ds => ds.data && ds.data.length > 0);
          if (datasetsComDados) {
            console.log('✅ Todos os datasets contêm dados válidos');
          } else {
            console.warn('⚠️ Um ou mais datasets não contêm dados válidos');
          }
          
          // Verifica se cada dataset tem cores configuradas
          const datasetsComCores = datasets.every(ds => ds.borderColor && ds.backgroundColor);
          if (datasetsComCores) {
            console.log('✅ Todos os datasets têm cores configuradas corretamente');
          } else {
            console.warn('⚠️ Um ou mais datasets não têm cores configuradas corretamente');
          }
        } else {
          console.warn(`⚠️ Número incorreto de datasets: ${datasets.length} (esperado: 3)`);
        }
      } else {
        console.warn('⚠️ Não foi encontrada uma instância do Chart.js para o canvas');
      }
    } else {
      console.error('❌ Canvas #grafico-comparativo não encontrado no DOM');
    }
    
    // Verificações de acessibilidade para o gráfico
    if (canvas) {
      // Verifica se o canvas tem atributo aria-label
      if (canvas.hasAttribute('aria-label')) {
        console.log(`✅ Canvas tem atributo aria-label: "${canvas.getAttribute('aria-label')}"`);
      } else {
        console.warn('⚠️ Canvas não tem atributo aria-label para acessibilidade');
      }
      
      // Verifica se há uma descrição textual próxima ao gráfico
      const descricaoGrafico = document.querySelector('#grafico-comparativo-descricao');
      if (descricaoGrafico) {
        console.log('✅ Descrição textual do gráfico encontrada');
      } else {
        console.warn('⚠️ Não foi encontrada descrição textual para o gráfico (recomendado para acessibilidade)');
      }
    }
    
    console.log('✅ Validação do gráfico comparativo concluída!');
    
  } catch (erro) {
    console.error('❌ Erro ao validar gráfico comparativo:', erro);
    console.error('📝 Detalhes do erro:', erro.stack);
  }
})();