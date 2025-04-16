const { tentarMultiplosEndpoints } = require('../js/painel-ods');

global.fetch = jest.fn();

describe('Circuit Breaker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
    fetch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Deve tentar múltiplos endpoints até obter sucesso', async () => {
    fetch
      .mockRejectedValueOnce(new Error('Falha endpoint 1'))
      .mockRejectedValueOnce(new Error('Falha endpoint 2'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{}, { V: '8.1', D2N: '2022' }])
      });

    const promiseResultado = tentarMultiplosEndpoints('endpoint_teste', ['url1']);
    
    // Avança os timers para cada tentativa
    await jest.advanceTimersByTimeAsync(500);
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    
    const resultado = await promiseResultado;
    
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 15000);

  test('Deve ativar o Circuit Breaker após falhas consecutivas', async () => {
    fetch
      .mockRejectedValueOnce(new Error('Falha endpoint'))
      .mockRejectedValueOnce(new Error('Falha endpoint'))
      .mockRejectedValueOnce(new Error('Falha endpoint'));

    const promiseResultado = tentarMultiplosEndpoints('energia', ['url1']);
    
    // Avança os timers para cada tentativa
    await jest.advanceTimersByTimeAsync(500);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2000);
    await Promise.resolve();
    
    await promiseResultado;
    
    const circuitBreakerData = JSON.parse(sessionStorage.getItem('circuit_breaker_energia'));
    expect(circuitBreakerData).not.toBeNull();
    expect(circuitBreakerData.falhas).toBe(3);
    expect(circuitBreakerData.ativo).toBe(true);
  }, 15000);

  test('Deve retornar null se todos os endpoints falharem', async () => {
    fetch
      .mockRejectedValueOnce(new Error('Erro em todos os endpoints'))
      .mockRejectedValueOnce(new Error('Erro em todos os endpoints'))
      .mockRejectedValueOnce(new Error('Erro em todos os endpoints'));

    const promiseResultado = tentarMultiplosEndpoints('energia', ['url1']);
    
    // Avança os timers para cada tentativa
    await jest.advanceTimersByTimeAsync(500);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2000);
    await Promise.resolve();
    
    const resultado = await promiseResultado;
    expect(resultado).toBeNull();
  }, 15000);
});