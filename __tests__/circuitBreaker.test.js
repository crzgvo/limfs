const { tentarMultiplosEndpoints } = require('../js/painel-ods');

global.fetch = jest.fn();

describe('Circuit Breaker', () => {
  const endpoint = 'pobreza';
  const endpointsMock = [
    'https://api1.example.com',
    'https://api2.example.com',
    'https://api3.example.com'
  ];

  beforeEach(() => {
    sessionStorage.clear();
    fetch.mockClear();
  });

  test('Deve tentar múltiplos endpoints até obter sucesso', async () => {
    fetch
      .mockRejectedValueOnce(new Error('Falha endpoint 1'))
      .mockRejectedValueOnce(new Error('Falha endpoint 2'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{}, { V: '8.1', D2N: '2022' }])
      });

    const resultado = await tentarMultiplosEndpoints('energia', ['url1', 'url2', 'url3']);
    expect(resultado).toEqual({ valor: 8.1, ano: 2022 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('Deve ativar o Circuit Breaker após falhas consecutivas', async () => {
    fetch.mockRejectedValue(new Error('Falha endpoint'));

    await tentarMultiplosEndpoints('energia', ['url1', 'url2', 'url3']);

    const circuitBreakerData = JSON.parse(sessionStorage.getItem('circuit_breaker_energia'));
    expect(circuitBreakerData).not.toBeNull();
    expect(circuitBreakerData.falhas).toBe(3);
  });

  test('Deve retornar null se todos os endpoints falharem', async () => {
    fetch.mockRejectedValue(new Error('Erro em todos os endpoints'));

    const resultado = await tentarMultiplosEndpoints(endpoint, endpointsMock);
    expect(resultado).toBeNull();
  });
});