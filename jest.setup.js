// --- Configuração Global do Ambiente de Teste Jest ---

// Mock do localStorage e sessionStorage para simular o ambiente do navegador
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    // Adiciona length para conformidade, se necessário
    // get length() { return Object.keys(store).length; },
    // key: (index) => Object.keys(store)[index] || null,
  };
})();

// Define os mocks no objeto 'window' global do JSDOM
Object.defineProperty(window, 'localStorage', { value: storageMock });
Object.defineProperty(window, 'sessionStorage', { value: storageMock });

// Mock global da função fetch para controlar requisições de API nos testes
global.fetch = jest.fn();

// Hook beforeEach: Executa antes de CADA teste no suite
beforeEach(() => {
  // Limpa todos os mocks (fetch, timers, etc.) para isolar os testes
  jest.clearAllMocks();
  // Limpa os mocks de storage para garantir um estado inicial limpo
  localStorage.clear();
  sessionStorage.clear();
});

// Configura Jest para usar timers falsos (permite controlar setTimeout, setInterval)
jest.useFakeTimers();

// Opcional: Hook afterEach para limpeza adicional, se necessário
// afterEach(() => {
//   // Ex: jest.runOnlyPendingTimers(); // Executa timers pendentes
// });