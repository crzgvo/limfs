# Painel ODS Sergipe - LIMFS

## 📖 Sobre o Projeto
O **Painel ODS Sergipe** é uma plataforma interativa desenvolvida pelo **Laboratório de Inovação, Mosaicos e Futuros Sustentáveis (LIMFS)** para monitorar os indicadores relacionados aos Objetivos de Desenvolvimento Sustentável (ODS) no estado de Sergipe. O projeto visa promover a transparência, acessibilidade e engajamento com os dados da Agenda 2030.

## 🌟 Funcionalidades Principais
- **Visualização de Indicadores:**
  - Indicadores como Taxa de Extrema Pobreza, Taxa de Alfabetização, Cobertura de Saneamento Básico, entre outros.
  - Gráficos interativos para análise de séries históricas.
  - Comparação entre indicadores.
- **Dashboards Específicos:**
  - Páginas dedicadas para cada ODS com informações detalhadas.
- **Exportação de Dados:**
  - Exportação de dados em formato CSV para análise offline.
- **Acessibilidade:**
  - Compatível com leitores de tela e navegação por teclado.
  - Contraste adequado e tooltips informativos.

## 🛠️ Tecnologias Utilizadas
- **Frontend:**
  - HTML5, CSS3, JavaScript (ES6+).
  - Bibliotecas: [Chart.js](https://www.chartjs.org/) para gráficos, [Tippy.js](https://atomiks.github.io/tippyjs/) para tooltips.
- **Bundler:**
  - [Vite](https://vitejs.dev/) para desenvolvimento rápido e build otimizado.
- **SEO e Dados Estruturados:**
  - Schema.org para melhorar a indexação e visibilidade nos motores de busca.

## 📂 Nova Estrutura do Projeto
```
/workspaces/limfs
├── src/                  # Código fonte principal do projeto
│   ├── components/       # Componentes reutilizáveis
│   │   ├── charts/       # Componentes de gráficos
│   │   ├── layout/       # Layout (menus, footers)
│   │   ├── indicators/   # Componentes de indicadores
│   │   ├── accessibility/# Componentes de acessibilidade
│   │   └── ui/           # Componentes de UI genéricos
│   ├── services/         # Serviços para lógica de negócio
│   │   ├── api/          # Serviços de API
│   │   ├── cache/        # Gerenciamento de cache
│   │   ├── monitoring/   # Monitoramento e telemetria
│   │   └── validation/   # Validação de dados
│   ├── utils/            # Utilitários e funções auxiliares
│   ├── styles/           # Estilos CSS organizados
│   │   ├── components/   # Estilos específicos de componentes
│   │   └── pages/        # Estilos específicos de páginas
│   ├── data/             # Dados JSON estáticos
│   ├── constants/        # Constantes e configurações
│   ├── assets/           # Recursos estáticos (imagens)
│   └── tests/            # Testes automatizados
│       ├── unit/         # Testes unitários 
│       └── integration/  # Testes de integração
├── public/               # Arquivos públicos
├── docs/                 # Documentação técnica
│   └── NOVA_ESTRUTURA.md # Detalhes sobre a nova estrutura
├── scripts/              # Scripts de automação
└── README.md             # Documentação do projeto
```

## 🚀 Como Executar o Projeto
1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd limfs
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Execute em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Para build de produção:
   ```bash
   npm run build
   ```

## 🧪 Testes
- Os testes foram reorganizados para a pasta `src/tests/` com separação entre unitários e de integração
- Para executar os testes:
  ```bash
  # Todos os testes
  npm test
  
  # Apenas testes unitários
  npm run test:unit
  
  # Apenas testes de integração
  npm run test:integration
  ```

## 📊 Indicadores Monitorados
- **ODS 1:** Taxa de Extrema Pobreza
- **ODS 4:** Taxa de Alfabetização
- **ODS 6:** Cobertura de Saneamento Básico
- **ODS 7:** Energia Solar Fotovoltaica
- **ODS 8:** Taxa de Desemprego
- **ODS 11:** Resíduos Sólidos Reciclados

## 📈 Dados e Fontes
Os dados utilizados no painel são provenientes de fontes confiáveis, como:
- **IBGE:** Pesquisa Nacional por Amostra de Domicílios Contínua (PNAD).
- **ANEEL:** Dados Abertos sobre Energia Solar.
- **SNIS:** Sistema Nacional de Informações sobre Saneamento.
- **DATASUS:** Informações de Saúde Pública.

## 🔒 Boas Práticas Implementadas
- **Arquitetura Organizada:**
  - Separação clara de responsabilidades
  - Módulos coesos com alta coesão e baixo acoplamento
- **Acessibilidade:**
  - Uso de atributos `aria-*` e navegação por teclado.
- **Desempenho:**
  - Cache local para reduzir chamadas de rede.
  - Estratégias de fallback para dados indisponíveis.
- **Segurança:**
  - Sanitização de dados antes de renderizar no DOM.

## 🔄 Migração para Nova Estrutura
O projeto passou por uma reorganização para melhorar a manutenibilidade e evolução do código:

1. Para migrar automaticamente os arquivos da estrutura antiga para a nova:
   ```bash
   npm run migrate
   ```

2. Para mais detalhes sobre a nova estrutura, consulte:
   ```
   docs/NOVA_ESTRUTURA.md
   ```

## 📌 Contribuição
Contribuições são bem-vindas! Siga as diretrizes no arquivo `CONTRIBUTING.md` para enviar sugestões ou corrigir problemas.

## 📄 Licença
Este projeto está licenciado sob a [Licença Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

**Desenvolvido por LIMFS - Laboratório de Inovação, Mosaicos e Futuros Sustentáveis**