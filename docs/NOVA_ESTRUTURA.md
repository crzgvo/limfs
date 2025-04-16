# Nova Estrutura do LIMFS - Painel ODS Sergipe

Este documento descreve a nova estrutura de organização do projeto LIMFS - Painel ODS Sergipe, implementada para melhorar a manutenibilidade e facilitar a evolução do sistema.

## Visão Geral

A nova estrutura segue princípios modernos de organização de código, separando claramente as responsabilidades em diretórios específicos e facilitando a localização e manutenção dos arquivos.

```
src/
├── components/       # Componentes reutilizáveis
│   ├── charts/       # Componentes de gráficos
│   ├── layout/       # Componentes de layout (menu, footer)
│   ├── indicators/   # Componentes de indicadores
│   ├── accessibility/# Componentes de acessibilidade
│   └── ui/           # Componentes de UI genéricos
│
├── services/         # Serviços para comunicação externa e lógica de negócio
│   ├── api/          # Serviços de API e dados
│   ├── cache/        # Gerenciamento de cache
│   ├── monitoring/   # Serviços de monitoramento
│   ├── validation/   # Validação de dados e schemas
│   ├── alerts/       # Serviços de alertas
│   ├── updates/      # Serviços de atualizações
│   └── integration/  # Integrações com sistemas externos
│
├── utils/            # Utilitários e funções auxiliares
│   └── loaders/      # Carregadores (lazy loading)
│
├── styles/           # Estilos CSS
│   ├── components/   # Estilos específicos de componentes
│   └── pages/        # Estilos específicos de páginas
│
├── data/             # Dados estáticos
├── assets/           # Recursos (imagens, ícones)
├── constants/        # Constantes usadas em todo o projeto
├── tests/            # Testes automatizados
│   ├── unit/         # Testes unitários
│   └── integration/  # Testes de integração
│
└── pages/            # Estrutura de páginas do aplicativo
    ├── home/         # Página inicial
    ├── ods-dashboard/# Dashboard principal
    └── ods-specific/ # Páginas de ODS específicos
```

## Diretrizes de Implementação

### 1. Importações e Exportações

Use os arquivos índice (`index.js`) para centralizar as exportações:

```javascript
// Importando de componentes
import { Menu, Footer } from '@components';

// Importando de serviços
import { carregarDados, validarDados } from '@services';

// Importando utilitários
import { formatarData, converterUnidades } from '@utils';
```

### 2. Módulos e Componentes

- **Componentes** devem ser focados na apresentação e interação com o usuário
- **Serviços** devem conter a lógica de negócio e comunicação externa
- **Utilitários** devem ser funções auxiliares reutilizáveis

### 3. Nomenclatura

Seguimos um padrão consistente de nomenclatura:

- **Arquivos**: Use kebab-case para nomes de arquivos (`api-service.js`)
- **Componentes**: Use PascalCase para nomes de componentes (`GraficoIndicador.js`)
- **Funções e variáveis**: Use camelCase para funções e variáveis (`carregarDados`)
- **Constantes**: Use UPPER_SNAKE_CASE para constantes (`API_URL`)

### 4. Estilos

Os estilos foram reorganizados em uma estrutura modular:

- **reset.css**: Reset básico de estilos
- **main.css**: Estilos globais principais
- **components/**: Estilos específicos de componentes
- **pages/**: Estilos específicos de páginas
- **utils.css**: Classes utilitárias
- **themes.css**: Definições de temas
- **accessibility.css**: Estilos de acessibilidade

## Migração

Para migrar da estrutura antiga para a nova, foi criado um script auxiliar:

```bash
./scripts/migrar-para-nova-estrutura.sh
```

Este script copia os arquivos da estrutura antiga para a nova estrutura, mantendo a compatibilidade.

## Fluxo de Desenvolvimento

1. Identifique em qual diretório o arquivo deve estar baseado em sua função
2. Mantenha a mesma estrutura de exportações para garantir compatibilidade
3. Atualize importações para usar os novos caminhos e aliases
4. Execute os testes para garantir que tudo continua funcionando

## Benefícios da Nova Estrutura

- **Melhor organização**: Arquivos agrupados por função e responsabilidade
- **Maior escalabilidade**: Facilita a adição de novos recursos
- **Manutenção simplificada**: Localização mais fácil dos arquivos
- **Reuso de código**: Estrutura modular facilita o reuso
- **Melhor testabilidade**: Separação clara de responsabilidades

## Próximos Passos

1. Concluir a migração de todos os arquivos para a nova estrutura
2. Atualizar as importações em todos os arquivos
3. Validar o funcionamento com testes automatizados
4. Documentar quaisquer peculiaridades encontradas durante a migração