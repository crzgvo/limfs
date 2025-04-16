import { verificarCache, salvarCache, limparCacheExpirado } from '../../src/utils/cache.js';

describe('Módulo de Cache', () => {
  beforeEach(() => {
    // Limpar o localStorage antes de cada teste
    localStorage.clear();
    
    // Mock do Date para controlar o tempo nos testes
    const mockDate = new Date(1619011200000); // Data fixa: 21/04/2021
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    // Restaurar o mock após cada teste
    jest.restoreAllMocks();
  });

  test('deve salvar e recuperar dados do cache corretamente', () => {
    const dadosTeste = { valor: 42, ano: 2024 };
    salvarCache('teste', dadosTeste);
    
    const dadosRecuperados = verificarCache('teste');
    
    expect(dadosRecuperados).toEqual(dadosTeste);
  });

  test('deve retornar null para chave inexistente no cache', () => {
    const resultado = verificarCache('inexistente');
    expect(resultado).toBeNull();
  });

  test('deve limpar automaticamente caches expirados', () => {
    // Configurar dados no localStorage
    const dadosRecentes = { valor: 10, ano: 2024 };
    salvarCache('dados_recentes', dadosRecentes);
    
    // Simular dados antigos manipulando o timestamp diretamente
    const dadosAntigos = {
      timestamp: new Date().getTime() - (25 * 60 * 60 * 1000), // 25 horas atrás (expirado)
      dados: { valor: 5, ano: 2023 }
    };
    localStorage.setItem('ods_cache_dados_antigos', JSON.stringify(dadosAntigos));
    
    // Executar limpeza
    limparCacheExpirado();
    
    // Verificar resultados
    expect(verificarCache('dados_recentes')).toEqual(dadosRecentes);
    expect(verificarCache('dados_antigos')).toBeNull();
  });
});