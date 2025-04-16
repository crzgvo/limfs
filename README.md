# LIMFS - Sistema de Monitoramento de Indicadores ODS Sergipe

## Sobre o Projeto

O LIMFS é um sistema web para monitoramento e visualização dos indicadores dos Objetivos de Desenvolvimento Sustentável (ODS) em Sergipe. O sistema coleta, processa e exibe dados atualizados de diferentes fontes oficiais, fornecendo uma visão transparente do progresso regional na implementação da Agenda 2030.

### Funcionalidades Principais

- 📊 Visualização interativa de indicadores ODS
- 📈 Gráficos comparativos de evolução temporal
- 💾 Exportação de dados em formato CSV
- 🔄 Atualização automática via APIs oficiais
- 🛡️ Sistema robusto de resiliência e fallback
- 📱 Interface responsiva e acessível

## Arquitetura

O sistema foi desenvolvido com foco em:

### Resiliência
- Circuit Breaker para prevenção de sobrecarga
- Retry com backoff exponencial
- Cache multinível (localStorage, arquivos JSON, dados de fallback)
- Tratamento robusto de erros

### Monitoramento
- Sistema completo de logs (INFO, WARN, ERROR, CRITICAL)
- Rastreamento detalhado de falhas em APIs
- Notificações em tempo real
- Histórico persistente de erros

### Performance
- Carregamento assíncrono
- Otimização de requisições
- Cache local inteligente
- Compressão de dados

### Acessibilidade
- Suporte a leitores de tela
- Alto contraste
- Navegação por teclado
- Mensagens claras de feedback

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript moderno
- Chart.js para visualizações gráficas
- APIs REST (IBGE, ANEEL)
- Jest para testes automatizados
- GitHub Actions para CI/CD

## Estrutura do Projeto

\`\`\`
limfs/
├── js/                      # Lógica principal
│   ├── painel-ods.js       # Core do sistema
│   ├── services/           # Serviços
│   │   ├── monitoramento.js    # Sistema de monitoramento
│   │   └── atualizar-dados.js  # Atualização automática
│   └── components/         # Componentes reutilizáveis
├── styles/                 # Estilos CSS
├── dados/                  # Arquivos JSON de dados
├── __tests__/             # Testes automatizados
└── .github/workflows/     # Configurações CI/CD
\`\`\`

## APIs e Integrações

### IBGE
- PNAD Contínua
- Censo Demográfico
- SIDRA

### Outras Fontes
- ANEEL (dados de energia solar)
- DATASUS (dados de saúde)
- SNIS (dados de saneamento)

## Instalação e Execução

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-usuario/limfs.git
cd limfs
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Execute os testes:
\`\`\`bash
npm test
\`\`\`

4. Para desenvolvimento local:
\`\`\`bash
# Use um servidor local como Live Server do VS Code
# ou http-server do Node.js
\`\`\`

## Testes

O sistema possui uma suíte completa de testes cobrindo:

- Circuit Breaker e retry
- Cache e persistência
- Validação de APIs
- Logging de erros
- Testes de DOM

Execute os testes com:
\`\`\`bash
npm test                 # Executa todos os testes
npm run test:coverage    # Executa testes com relatório de cobertura
npm run test:watch      # Executa testes em modo watch
\`\`\`

## CI/CD

O projeto utiliza GitHub Actions para:

- Execução automática de testes
- Verificação de cobertura de código
- Validação de qualidade
- Deploy automatizado

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/nova-feature\`)
3. Commit suas mudanças (\`git commit -am 'Adiciona nova feature'\`)
4. Push para a branch (\`git push origin feature/nova-feature\`)
5. Crie um Pull Request

### Padrões de Código

- Use ESLint para padrões JavaScript
- Mantenha 100% de cobertura de testes
- Documente novas funcionalidades
- Siga o padrão de commits semânticos

## Monitoramento em Produção

O sistema inclui ferramentas robustas para monitoramento:

- Logs detalhados de erros
- Métricas de performance
- Alertas automáticos
- Status de APIs

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

LIMFS - Laboratório Inovação, Mosaicos e Futuros
- Email: contato@mosaicosfuturos.com
- Website: https://www.mosaicosfuturos.com