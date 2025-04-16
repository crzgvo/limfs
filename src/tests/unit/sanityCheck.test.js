// Teste básico para verificar se o ambiente Jest está configurado corretamente.
describe('Sanity Check', () => {
  // Limpa localStorage antes de cada teste neste describe
  beforeEach(() => {
    localStorage.clear();
  });

  // Verifica a matemática básica
  test('Ambiente de teste está funcionando', () => {
    expect(1 + 1).toBe(2);
  });

  // Verifica se o mock do localStorage definido em jest.setup.js está operacional
  test('localStorage mock está funcionando', () => {
    localStorage.setItem('teste', 'valor');
    expect(localStorage.getItem('teste')).toBe('valor');
    localStorage.removeItem('teste');
    expect(localStorage.getItem('teste')).toBeNull();
  });

  // Opcional: Testar fetch mock
  test('fetch mock está funcionando', () => {
     // Simula uma resposta de sucesso do fetch
     global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'success' }),
     });

     return fetch('/api/test').then(response => response.json()).then(data => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/test');
        expect(data.message).toBe('success');
     });
  });

   // Opcional: Testar timers falsos
   test('timers falsos estão funcionando', () => {
     jest.useFakeTimers();
     const callback = jest.fn();

     setTimeout(callback, 1000);

     // Callback não deve ter sido chamado ainda
     expect(callback).not.toHaveBeenCalled();

     // Avança o tempo em 1 segundo
     jest.advanceTimersByTime(1000);

     // Agora o callback deve ter sido chamado
     expect(callback).toHaveBeenCalledTimes(1);
   });
});