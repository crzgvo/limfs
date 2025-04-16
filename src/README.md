# Painel ODS Sergipe - LIMFS (Nova Estrutura)

Este diretório contém a nova estrutura do Painel ODS Sergipe, reorganizado para melhor manutenção e escalabilidade.

## Estrutura de diretórios

```
/src
├── assets/            # Recursos estáticos
│   ├── images/        # Imagens gerais do projeto
│   ├── icons/         # Ícones e logos
│   └── fonts/         # Fontes personalizadas
├── components/        # Componentes reutilizáveis da interface
│   ├── charts/        # Componentes de gráficos
│   ├── layout/        # Componentes de layout (Header, Footer, Sidebar)
│   ├── ui/            # Componentes de UI genéricos (Button, Card, etc.)
│   └── indicators/    # Componentes específicos de indicadores
├── constants/         # Constantes e configurações
│   ├── api.js         # Endpoints e configurações de API
│   ├── ods.js         # Configurações específicas de ODS
│   └── theme.js       # Constantes para temas e cores
├── data/              # Dados JSON estáticos
├── hooks/             # Hooks personalizados para lógicas reutilizáveis
├── pages/             # Páginas principais do site
│   ├── home/          # Página inicial
│   ├── ods-dashboard/ # Dashboard ODS geral
│   ├── ods-specific/  # Páginas específicas de cada ODS (1 a 17)
│   ├── comparative/   # Página comparativa entre ODSs
│   └── about/, etc.   # Outras páginas do site
├── services/          # Serviços para acesso e manipulação de dados
│   ├── api/           # Cliente de API para buscar dados
│   ├── cache/         # Gerenciamento de cache
│   ├── analytics/     # Serviços de analytics
│   └── monitoring/    # Monitoramento e telemetria
├── styles/            # Estilos CSS
│   ├── global/        # Estilos globais
│   ├── components/    # Estilos de componentes
│   └── pages/         # Estilos específicos de páginas
├── utils/             # Utilitários e funções auxiliares
├── index.html         # Arquivo HTML principal
├── main.js            # Ponto de entrada principal
└── vite.config.js     # Configuração do Vite
```

## Como usar esta estrutura

1. **Componentes**: Todos os componentes reutilizáveis devem ser colocados na pasta `components/`, organizados por tipo.
2. **Serviços**: Código para acesso a APIs, gerenciamento de cache e outros serviços devem ir em `services/`.
3. **Páginas**: Cada página principal do site tem sua própria pasta em `pages/`.
4. **Constantes**: Valores constantes devem ser definidos nos arquivos em `constants/`.
5. **Estilos**: Arquivos CSS organizados por contexto em `styles/`.

## Scripts disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Constrói o projeto para produção
- `npm run test`: Executa os testes
- `npm run lint`: Executa o ESLint para verificar o código

## Padrões de importação

Use os aliases definidos para importações mais limpas:

```js
// Ao invés de:
import { Component } from '../../components/ui/Component';

// Use:
import { Component } from '@components/ui/Component';
```

## Contato

Para questões relacionadas a esta estrutura, entre em contato com a equipe LIMFS.
