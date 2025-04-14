function testGraficoComparativo() {
  console.log('Iniciando teste do gráfico comparativo com ODS selecionados...');
  try {
    // Teste com a nova função que permite seleção dinâmica
    if (typeof gerarGraficoComparativo === 'function') {
      console.log('Chamando gerarGraficoComparativo com ODS 1, 4 e 5');
      gerarGraficoComparativo(['ods1', 'ods4', 'ods5']);
      return true;
    } else {
      console.error('Função gerarGraficoComparativo não está definida');
      return false;
    }
  } catch (error) {
    console.error('Erro ao testar gráfico comparativo:', error);
    return false;
  }
}
