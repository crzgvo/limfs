/**
 * Testes para integração com DOM
 */

import { buscarDadosIndicador } from '../../src/services/api/api-service.js';
import { verificarCache, salvarCache } from '../../src/utils/cache.js';
import { comRetry } from '../../src/utils/retry.js';
import { comCircuitBreaker } from '../../src/utils/circuit-breaker.js';

describe('Testes de Ambiente', () => {
    test('DOM está disponível', () => {
        expect(document).toBeDefined();
        expect(window).toBeDefined();
    });

    test('LocalStorage está disponível', () => {
        expect(localStorage).toBeDefined();
        expect(localStorage.setItem).toBeDefined();
        expect(localStorage.getItem).toBeDefined();
    });
});

describe('Testes de Sanidade', () => {
    test('Funções de cache funcionam', () => {
        const dados = { valor: 10, ano: 2024 };
        salvarCache('teste', dados);
        expect(verificarCache('teste')).toEqual(dados);
    });

    test('Retry funciona com sucesso', async () => {
        const funcaoTeste = jest.fn().mockResolvedValue('ok');
        const resultado = await comRetry(funcaoTeste);
        expect(resultado).toBe('ok');
        expect(funcaoTeste).toHaveBeenCalledTimes(1);
    });

    test('Circuit Breaker funciona com sucesso', async () => {
        const funcaoTeste = jest.fn().mockResolvedValue('ok');
        const resultado = await comCircuitBreaker('teste', funcaoTeste);
        expect(resultado).toBe('ok');
        expect(funcaoTeste).toHaveBeenCalledTimes(1);
    });

    test('API Service retorna erro para indicador inválido', async () => {
        await expect(buscarDadosIndicador('inexistente')).rejects.toThrow();
    });
});

test('Ambiente jsdom funcionando corretamente', () => {
  document.body.innerHTML = '<div id="app">Hello, Jest!</div>';
  const appDiv = document.getElementById('app');
  expect(appDiv).not.toBeNull();
  expect(appDiv.textContent).toBe('Hello, Jest!');
});