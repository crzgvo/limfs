/**
 * Ponto central de exportação de serviços
 * Facilita importações em outros arquivos do projeto
 */

// Serviços de API e dados
export * from './api/api-service';
export * from './api/dados-service';
export * from './api/carregadorDados';

// Serviços de ODS
export * from './ods-service';

// Serviços de Cache
export * from './cache/cacheMultinivel';

// Serviços de Validação
export * from './validation/validacao-schema';

// Serviços de Monitoramento
export * from './monitoring/monitoramento';

// Serviços de Integração
export * from './integration/integradorODS';

// Serviços de Alertas
export * from './alerts/alertas';

// Serviços de Atualização
export * from './updates/atualizar-dados';

// Outros serviços
export * from './analyticsService';
export * from './dashboardTemplate';
export * from './segurancaDados';