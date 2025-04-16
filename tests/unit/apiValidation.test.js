import { analisarResposta } from '../../src/services/api/api-service.js';

describe('Validação de Respostas das APIs', () => {
  const endpoint = 'saneamento';

  test('Deve validar corretamente uma resposta válida', () => {
    const mockData = [{}, { V: '54.2', D2N: '2022' }];
    const resultado = analisarResposta(mockData, endpoint, 0);
    expect(resultado).toEqual({ valor: 54.2, ano: 2022 });
  });

  test('Deve retornar null para resposta inválida', () => {
    const mockData = [{}, { V: null }];
    const resultado = analisarResposta(mockData, endpoint, 0);
    expect(resultado).toBeNull();
  });

  test('Deve retornar null para estrutura inesperada', () => {
    const mockData = { valorInesperado: 54.2 };
    const resultado = analisarResposta(mockData, endpoint, 0);
    expect(resultado).toBeNull();
  });
});