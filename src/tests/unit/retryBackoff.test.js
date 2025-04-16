const { tentarMultiplosEndpoints } = require('../js/painel-ods');

global.fetch = jest.fn();

describe('Retry e Backoff Exponencial', () => {
  const endpoint = 'educacao';
  const endpointsMock = [
    'https://api1.example.com',
    'https://api2.example.com'
  ];

  beforeEach(() => {
    fetch.mockClear();
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Deve aplicar backoff exponencial entre tentativas', async () => {
    fetch.mockRejectedValue(new Error('Falha'));

    const tentativaPromise = tentarMultiplosEndpoints('endpoint_teste', ['url1'], 3, 500);

    // Primeiro atraso (500ms)
    await jest.advanceTimersByTimeAsync(500);
    await Promise.resolve(); // aguarda resolução de promises pendentes

    // Segunda tentativa (1000ms)
    await jest.advanceTimersByTimeAsync(1000);
    await Promise.resolve(); // aguarda resolução de promises pendentes

    // Terceira tentativa (2000ms)
    await jest.advanceTimersByTimeAsync(2000);
    await tentativaPromise; // aguarda término da função

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('Deve retornar valor correto após sucesso', async () => {
    fetch
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{}, { V: '86.9', D2N: '2022' }])
      });

    const tentativaPromise = tentarMultiplosEndpoints('endpoint_teste', ['url1', 'url2'], 3, 500);

    await jest.advanceTimersByTimeAsync(500); // espera primeiro delay
    await Promise.resolve();

    const resultado = await tentativaPromise;

    expect(resultado).toEqual({ valor: 86.9, ano: 2022 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});