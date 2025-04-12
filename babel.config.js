export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current', // Compila para a versão atual do Node.js (útil para Jest/scripts)
        },
        // 'auto' permite que o Babel escolha entre CJS ou ESM baseado no contexto.
        // Importante para compatibilidade com Jest (CJS) e código fonte (ESM).
        modules: 'auto'
      },
    ],
  ],
  // 'unambiguous' tenta adivinhar se um arquivo é um módulo ES ou script CJS.
  sourceType: 'unambiguous'
};