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
- **Backend:**
  - Dados estáticos em formato JSON.
- **SEO e Dados Estruturados:**
  - Schema.org para melhorar a indexação e visibilidade nos motores de busca.

## 📂 Estrutura do Projeto
```
/workspaces/limfs
├── dados/                # Dados JSON para os indicadores
├── docs/                 # Documentação técnica
├── img/                  # Imagens e ícones
├── js/                   # Scripts JavaScript
│   ├── components/       # Componentes reutilizáveis
│   ├── services/         # Serviços para manipulação de dados
│   ├── utils/            # Utilitários (cache, retry, etc.)
├── styles/               # Arquivos CSS
│   ├── components/       # Estilos de componentes
│   ├── pages/            # Estilos específicos de páginas
├── painel-ods/           # Páginas HTML do painel
├── __tests__/            # Testes unitários
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
3. Abra o arquivo `index.html` no navegador para visualizar o painel.

## 🧪 Testes
- Os testes unitários estão localizados na pasta `__tests__/` e cobrem funcionalidades como validação de APIs, manipulação de cache e lógica de gráficos.
- Para executar os testes, utilize o framework [Jest](https://jestjs.io/):
  ```bash
  npm test
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
- **Acessibilidade:**
  - Uso de atributos `aria-*` e navegação por teclado.
- **Desempenho:**
  - Cache local para reduzir chamadas de rede.
  - Estratégias de fallback para dados indisponíveis.
- **Segurança:**
  - Sanitização de dados antes de renderizar no DOM.

## 📌 Contribuição
Contribuições são bem-vindas! Siga as diretrizes no arquivo `CONTRIBUTING.md` para enviar sugestões ou corrigir problemas.

## 📄 Licença
Este projeto está licenciado sob a [Licença Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

**Desenvolvido por LIMFS - Laboratório de Inovação, Mosaicos e Futuros Sustentáveis**