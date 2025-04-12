const { verificarCacheLocal, armazenarCacheLocal } = require('../js/painel-ods');

describe('Cache Multinível', () => {
  const endpoint = 'pobreza';
  const mockData = { valor: 8.1, ano: 2024 };

  beforeEach(() => {
    localStorage.clear();
  });

  test('Deve armazenar dados no cache local', () => {
    armazenarCacheLocal(endpoint, mockData);
    const cachedData = JSON.parse(localStorage.getItem(endpoint));
    expect(cachedData).toEqual(mockData);
  });

  test('Deve recuperar dados do cache local', () => {
    localStorage.setItem(endpoint, JSON.stringify(mockData));
    const cachedData = verificarCacheLocal(endpoint);
    expect(cachedData).toEqual(mockData);
  });

  test('Deve retornar null se o cache estiver vazio', () => {
    const cachedData = verificarCacheLocal(endpoint);
    expect(cachedData).toBeNull();
  });
});