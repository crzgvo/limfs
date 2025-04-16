#!/bin/bash

# Script para migrar arquivos da estrutura antiga para a nova estrutura
# LIMFS - Laboratório de Inovação, Mosaicos e Futuros Sustentáveis

echo "=== Iniciando migração para nova estrutura de diretórios ==="
echo "Este script vai migrar arquivos da estrutura antiga para a nova estrutura organizada."

# Cria a estrutura de diretórios se não existir
mkdir -p src/{components/{charts,layout,indicators,accessibility,ui},services/{api,cache,monitoring,validation,alerts,updates,integration},utils/loaders,styles/{components,pages},data,assets/images,constants,pages/{home,ods-dashboard,ods-specific},tests/{unit,integration}}

# Migra arquivos JavaScript
echo "Migrando arquivos JavaScript..."

# Componentes
echo "- Migrando componentes..."
cp -n js/components/grafico*.js src/components/charts/ 2>/dev/null || true
cp -n js/menu.js src/components/layout/ 2>/dev/null || true
cp -n js/footer.js src/components/layout/ 2>/dev/null || true

# Módulos
echo "- Migrando módulos..."
cp -n js/modules/acessibilidade*.js src/components/accessibility/ 2>/dev/null || true
cp -n js/modules/grafico*.js src/components/charts/ 2>/dev/null || true
cp -n js/modules/chart-config.js src/components/charts/ 2>/dev/null || true
cp -n js/modules/renderizadorGraficos.js src/components/charts/ 2>/dev/null || true
cp -n js/modules/microInteracoes.js src/components/ 2>/dev/null || true
cp -n js/modules/indicadoresLoader.js src/components/indicators/ 2>/dev/null || true
cp -n js/modules/carregadorDados.js src/services/api/ 2>/dev/null || true
cp -n js/modules/dashboardTemplate.js src/services/ 2>/dev/null || true
cp -n js/modules/integradorODS.js src/services/integration/ 2>/dev/null || true
cp -n js/modules/cacheMultinivel.js src/services/cache/ 2>/dev/null || true
cp -n js/modules/segurancaDados.js src/services/ 2>/dev/null || true
cp -n js/modules/correlacaoODS.js src/utils/ 2>/dev/null || true
cp -n js/modules/tratamentoErros.js src/utils/ 2>/dev/null || true
cp -n js/modules/lazyLoader.js src/utils/loaders/ 2>/dev/null || true

# Serviços
echo "- Migrando serviços..."
cp -n js/services/api-service.js src/services/api/ 2>/dev/null || true
cp -n js/services/dados-service.js src/services/api/ 2>/dev/null || true
cp -n js/services/ods-service.js src/services/ 2>/dev/null || true
cp -n js/services/monitoramento.js src/services/monitoring/ 2>/dev/null || true
cp -n js/services/validacaoSchema.js src/services/validation/ 2>/dev/null || true
cp -n js/services/alertas.js src/services/alerts/ 2>/dev/null || true
cp -n js/services/analyticsService.js src/services/ 2>/dev/null || true
cp -n js/services/atualizar-dados.js src/services/updates/ 2>/dev/null || true

# Utilitários
echo "- Migrando utilitários..."
cp -n js/utils/cache.js src/utils/ 2>/dev/null || true
cp -n js/utils/circuit-breaker.js src/utils/ 2>/dev/null || true
cp -n js/utils/coresODS.js src/utils/ 2>/dev/null || true
cp -n js/utils/indicadorUtils.js src/utils/ 2>/dev/null || true
cp -n js/utils/retry.js src/utils/ 2>/dev/null || true

# Migra estilos
echo "Migrando arquivos de estilo..."
cp -n reset.css src/styles/reset.css 2>/dev/null || true
cp -n style.css src/styles/main.css 2>/dev/null || true

# Migra dados
echo "Migrando dados..."
cp -rn dados/*.json src/data/ 2>/dev/null || true

# Migra imagens
echo "Migrando imagens..."
cp -rn img/* src/assets/images/ 2>/dev/null || true

# Migra testes
echo "Migrando testes..."
cp -n __tests__/*.test.js src/tests/unit/ 2>/dev/null || true
cp -n tests/unit/*.test.js src/tests/unit/ 2>/dev/null || true

echo ""
echo "=== Migração concluída! ==="
echo "Verifique se todos os arquivos foram migrados corretamente."
echo "Alguns erros podem ocorrer se os arquivos já existirem no destino."
echo ""
echo "Próximos passos:"
echo "1. Atualizar importações nos arquivos migrados"
echo "2. Verificar se os testes continuam funcionando"
echo "3. Atualizar referências nos arquivos HTML"
echo ""
