# Guia de Contribuição

## Como Contribuir

Agradecemos seu interesse em contribuir com o LIMFS! Este guia ajudará você a entender nosso processo de desenvolvimento e padrões de código.

## Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
3. [Padrões de Código](#padrões-de-código)
4. [Processo de Desenvolvimento](#processo-de-desenvolvimento)
5. [Testes](#testes)
6. [Commits e Pull Requests](#commits-e-pull-requests)

## Primeiros Passos

1. Faça um fork do repositório
2. Clone seu fork localmente
3. Configure o remote upstream:
   ```bash
   git remote add upstream https://github.com/original/limfs.git
   ```

## Ambiente de Desenvolvimento

### Requisitos
- Node.js 18+
- npm 8+
- Git

### Configuração
1. Instale as dependências:
   ```bash
   npm install
   ```

2. Verifique a instalação:
   ```bash
   npm test
   ```

### Estrutura do Projeto
```
limfs/
├── js/              # Código fonte JavaScript
├── styles/          # Arquivos CSS
├── dados/           # Dados JSON
├── __tests__/       # Testes
└── docs/            # Documentação
```

## Padrões de Código

### JavaScript
- Use ES6+ sempre que possível
- Evite bibliotecas externas desnecessárias
- Documente funções com JSDoc
- Siga o estilo do Prettier/ESLint

### Exemplo de Documentação
```javascript
/**
 * Processa dados de um indicador ODS
 * @param {Object} dados - Dados brutos do indicador
 * @param {string} endpoint - Nome do endpoint
 * @returns {Object} Dados processados
 * @throws {Error} Se os dados forem inválidos
 */
function processarDados(dados, endpoint) {
  // ...
}
```

### CSS
- Use BEM para nomenclatura de classes
- Mantenha especificidade baixa
- Agrupe media queries
- Documente breakpoints

### Testes
- Mantenha 100% de cobertura
- Use descrições claras
- Teste casos de borda
- Mockup de APIs externas

## Processo de Desenvolvimento

### 1. Planejamento
- Verifique issues existentes
- Discuta mudanças grandes
- Crie testes primeiro (TDD)

### 2. Desenvolvimento
- Crie uma branch para sua feature
- Mantenha commits atômicos
- Atualize documentação
- Valide acessibilidade

### 3. Revisão
- Auto-revise o código
- Execute todos os testes
- Verifique performance
- Garanta compatibilidade

### 4. Pull Request
- Descreva mudanças claramente
- Referencie issues
- Inclua testes
- Responda feedback

## Padrões de Commit

Use commits semânticos:

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

Exemplo:
```bash
feat(indicadores): adiciona novo indicador de saúde

- Implementa coleta de dados
- Adiciona testes unitários
- Atualiza documentação
```

## Testes

### Unitários
```javascript
describe('processarDados', () => {
  test('deve processar dados válidos', () => {
    // ...
  });

  test('deve rejeitar dados inválidos', () => {
    // ...
  });
});
```

### Integração
- Teste fluxos completos
- Verifique fallbacks
- Simule falhas de API

### E2E
- Teste navegação
- Verifique renderização
- Valide interações

## Ciclo de Release

1. **Desenvolvimento**
   - Código
   - Testes
   - Documentação

2. **Review**
   - Code review
   - Testes passando
   - Lint limpo

3. **Staging**
   - Testes integrados
   - Validação manual
   - Performance

4. **Produção**
   - Deploy
   - Monitoramento
   - Feedback

## Checklist de Pull Request

- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Código limpo
- [ ] Performance verificada
- [ ] Acessibilidade validada
- [ ] Commits organizados

## Ajuda e Suporte

- Issues no GitHub
- Canal no Discord
- Email da equipe

## Links Úteis

- [Documentação da API](./API.md)
- [Guia de Arquitetura](./ARCHITECTURE.md)
- [Roadmap](./ROADMAP.md)

## Licença

Contribuições são licenciadas sob MIT.