import { verificarCache, salvarCache } from '../../src/utils/cache.js';

describe('Cache Multinível', () => {
  const endpoint = 'pobreza';
  const mockData = { valor: 8.1, ano: 2024 };

  beforeEach(() => {
    localStorage.clear();
  });

  test('Deve armazenar dados no cache local', () => {
    salvarCache(endpoint, mockData);
    const cachedData = verificarCache(endpoint);
    expect(cachedData).toEqual(mockData);
  });

  test('Deve recuperar dados do cache local', () => {
    salvarCache(endpoint, mockData);
    const cachedData = verificarCache(endpoint);
    expect(cachedData).toEqual(mockData);
  });

  test('Deve retornar null se o cache estiver vazio', () => {
    const cachedData = verificarCache('endpoint_inexistente');
    expect(cachedData).toBeNull();
  });
});