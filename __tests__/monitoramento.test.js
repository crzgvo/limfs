import { logger, monitorPerformance, configurarNivelLog } from '../js/services/monitoramento.js';

describe('Módulo de Monitoramento', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    
    // Espionar console para verificar chamadas
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('logger deve registrar mensagens com níveis apropriados', () => {
    // Garantir que o nível DEBUG não seja registrado no nível INFO
    configurarNivelLog('INFO');
    logger.debug('Esta mensagem não deve aparecer');
    expect(console.debug).not.toHaveBeenCalled();
    
    // Testar registro de mensagens INFO
    logger.info('Mensagem informativa');
    expect(console.info).toHaveBeenCalled();
    
    // Testar registro de mensagens ERROR
    logger.error('Mensagem de erro');
    expect(console.error).toHaveBeenCalled();
  });

  test('logs devem ser armazenados no localStorage', () => {
    logger.error('Erro crítico de teste');
    
    const logs = JSON.parse(localStorage.getItem('ods_sergipe_logs') || '[]');
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].nivel).toBe('ERROR');
    expect(logs[0].mensagem).toContain('Erro crítico de teste');
  });

  test('monitorPerformance deve registrar estatísticas corretamente', () => {
    // Mock para performance.now()
    const mockPerformanceNow = jest.spyOn(global.performance, 'now')
      .mockImplementationOnce(() => 1000)
      .mockImplementationOnce(() => 1100); // Simula 100ms de execução

    const medicao = monitorPerformance.iniciarMedicao('operacao_teste');
    const duracao = monitorPerformance.finalizarMedicao(medicao);
    
    // Verificar se a duração foi calculada corretamente com os valores mockados
    expect(duracao).toBe(100); // Deve ser 1100 - 1000 = 100
    
    // Verificar se as estatísticas foram atualizadas
    const estatisticas = monitorPerformance.obterEstatisticas();
    expect(estatisticas).toHaveProperty('operacao_teste');
    expect(estatisticas.operacao_teste.contagem).toBe(1);
    expect(estatisticas.operacao_teste.media).toBe(100);
    
    mockPerformanceNow.mockRestore();
  });

  test('exportarLogs deve gerar conteúdo CSV válido', () => {
    // Registrar algumas mensagens para teste
    logger.info('Mensagem de teste 1');
    logger.warn('Mensagem de teste 2');
    logger.error('Mensagem com "aspas" para testar escape');
    
    const csv = logger.exportarLogs();
    
    // Verificar se o cabeçalho está presente
    expect(csv).toContain('TIMESTAMP,NIVEL,MENSAGEM');
    
    // Verificar se os dados estão presentes (usando match parcial)
    expect(csv).toContain(',"INFO","Mensagem de teste 1"');
    expect(csv).toContain(',"WARN","Mensagem de teste 2"');
    
    // Verificar escape de aspas (usando match parcial)
    expect(csv).toContain(',"ERROR","Mensagem com ""aspas"" para testar escape"');
  });
});