/**
 * Testes para validar a estrutura do projeto após reorganização
 * 
 * Este script verifica se todos os arquivos essenciais estão presentes
 * nas novas localizações e se as importações funcionam corretamente.
 */

// Importação de utilitários
import { verificarCache } from '../../utils/cache';
import { circuit } from '../../utils/circuit-breaker';
import { retryWithBackoff } from '../../utils/retry';

// Importação de serviços
import { carregarDados } from '../../services/api/carregadorDados';
import { monitorarSistema } from '../../services/monitoring/monitoramento';

// Importação de componentes
import { inicializarAcessibilidade } from '../../components/accessibility/acessibilidade';

describe('Validação da Nova Estrutura', () => {
  
  describe('Utilitários', () => {
    test('Utils de Cache devem estar disponíveis', () => {
      expect(typeof verificarCache).toBe('function');
    });
    
    test('Utils de Circuit Breaker devem estar disponíveis', () => {
      expect(typeof circuit).toBe('object');
      expect(typeof circuit.breaker).toBe('function');
    });
    
    test('Utils de Retry devem estar disponíveis', () => {
      expect(typeof retryWithBackoff).toBe('function');
    });
  });
  
  describe('Serviços', () => {
    test('Serviço de Carregamento de Dados deve estar disponível', () => {
      expect(typeof carregarDados).toBe('function');
    });
    
    test('Serviço de Monitoramento deve estar disponível', () => {
      expect(typeof monitorarSistema).toBe('function');
    });
  });
  
  describe('Componentes', () => {
    test('Componente de Acessibilidade deve estar disponível', () => {
      expect(typeof inicializarAcessibilidade).toBe('function');
    });
  });
  
  describe('Estrutura de diretórios', () => {
    test('Principais diretórios devem existir', async () => {
      // Verificados através da existência de módulos importados
      // Se as importações acima funcionaram, os diretórios existem
      expect(true).toBe(true);
    });
  });
});