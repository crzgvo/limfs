/**
 * Ponto central de exportação de utilitários
 * Facilita importações em outros arquivos do projeto
 */

// Utilitários para gerenciamento de cache
export * from './cache';

// Utilitários de resiliência
export * from './circuit-breaker';
export * from './retry';

// Utilitários de ODS
export * from './coresODS';
export * from './correlacaoODS';

// Utilitários para manipulação de indicadores
export * from './indicadorUtils';

// Utilitários para tratamento de erros
export * from './tratamentoErros';

// Utilitários de carregamento
export * from './loaders/lazyLoader';