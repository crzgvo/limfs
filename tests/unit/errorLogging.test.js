import { registrarErroPersistente } from '../../src/utils/error-logging.js';

describe('Registro de Erros Persistentes', () => {
  const endpoint = 'energia_solar';
  const mockError = { mensagem: 'Erro ao acessar API', timestamp: Date.now() };

  beforeEach(() => {
    localStorage.clear();
  });

  test('Deve registrar erro corretamente no localStorage', () => {
    const endpoint = 'energia_solar';
    const mockError = new Error('Erro ao acessar API');

    registrarErroPersistente(endpoint, mockError);

    const errosRegistrados = JSON.parse(localStorage.getItem('ods_sergipe_erros'));
    expect(errosRegistrados[0]).toMatchObject({
      endpoint: 'energia_solar',
      mensagem: 'Erro ao acessar API',
      timestamp: expect.any(Number)
    });
  });

  test('Deve acumular múltiplos erros no localStorage', () => {
    const endpoint = 'energia_solar';
    const mockError = new Error('Erro ao acessar API');
    const outroErro = new Error('Erro de timeout');

    registrarErroPersistente(endpoint, mockError);
    registrarErroPersistente(endpoint, outroErro);

    const errosRegistrados = JSON.parse(localStorage.getItem('ods_sergipe_erros'));

    expect(errosRegistrados).toHaveLength(2);
    expect(errosRegistrados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ endpoint, mensagem: 'Erro ao acessar API' }),
        expect.objectContaining({ endpoint, mensagem: 'Erro de timeout' })
      ])
    );
  });
});