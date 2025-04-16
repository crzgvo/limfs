/**
 * Testes para o módulo de dashboards específicos de ODS
 */
import { carregarDadosODS } from '../js/components/ods-especifico.js';

// Mock para o fetch global
global.fetch = jest.fn();

describe('Testes para carregamento de dados ODS específicos', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  test('Carrega dados válidos para ODS 4', async () => {
    const mockDadosODS4 = {
      meta: {
        titulo: "ODS 4 - Educação de Qualidade",
        descricao: "Garantir educação inclusiva e de qualidade para todos",
        ultima_atualizacao: "2025-04-10"
      },
      dados: {
        valor: 87.5,
        unidade: "%",
        descricao: "Taxa de alfabetização"
      },
      historico: [
        {"ano": 2020, "valor": 84.2},
        {"ano": 2025, "valor": 87.5}
      ],
      indicadores_detalhados: [
        {
          "nome": "Taxa de matrícula no ensino fundamental",
          "valor": 97.3,
          "unidade": "%",
          "tendencia": "estável"
        }
      ]
    };
    
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockDadosODS4)
    }));
    
    const dados = await carregarDadosODS('ods4');
    
    expect(fetch).toHaveBeenCalledWith('/dados/indicadores/ods4_educacao.json', expect.any(Object));
    expect(dados).toHaveProperty('dados.valor', 87.5);
    expect(dados).toHaveProperty('historico');
    expect(Array.isArray(dados.historico)).toBe(true);
  });
  
  test('Carrega dados válidos para ODS 5', async () => {
    const mockDadosODS5 = {
      meta: {
        titulo: "ODS 5 - Igualdade de Gênero",
        descricao: "Alcançar a igualdade de gênero e empoderar todas as mulheres e meninas",
        ultima_atualizacao: "2025-04-08"
      },
      dados: {
        valor: 35.2,
        unidade: "%",
        descricao: "Representação feminina em cargos de liderança"
      },
      historico: [
        {"ano": 2020, "valor": 28.5},
        {"ano": 2025, "valor": 35.2}
      ],
      indicadores_detalhados: [
        {
          "nome": "Diferença salarial entre gêneros",
          "valor": 17.8,
          "unidade": "%",
          "tendencia": "decrescente"
        }
      ]
    };
    
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockDadosODS5)
    }));
    
    const dados = await carregarDadosODS('ods5');
    
    expect(fetch).toHaveBeenCalledWith('/dados/indicadores/ods5_genero.json', expect.any(Object));
    expect(dados).toHaveProperty('dados.valor', 35.2);
    expect(dados).toHaveProperty('indicadores_detalhados');
    expect(dados.indicadores_detalhados.length).toBeGreaterThan(0);
  });
  
  test('Trata erro ao carregar dados inválidos', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 404
    }));
    
    await expect(carregarDadosODS('ods4')).rejects.toThrow('Erro ao carregar dados: 404');
  });
  
  test('Trata código ODS inválido', async () => {
    await expect(carregarDadosODS('ods999')).rejects.toThrow('ODS não suportado: ods999');
  });
});