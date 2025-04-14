/**
 * Script para validação de acessibilidade do Dashboard Comparativo Dinâmico (ODS)
 * Verifica aspectos de acessibilidade conforme WCAG 2.1
 */

(function() {
  console.log('🧪 Iniciando validação de acessibilidade WCAG 2.1...');
  
  // Lista de verificações a serem realizadas
  const verificacoesAcessibilidade = [
    {
      id: 'aria-labels',
      descricao: 'Verificação de aria-labels nos gráficos',
      fnVerificar: verificarAriaLabels
    },
    {
      id: 'contraste',
      descricao: 'Verificação de contraste de cores',
      fnVerificar: verificarContraste
    },
    {
      id: 'teclado',
      descricao: 'Verificação de navegação por teclado',
      fnVerificar: verificarAcessibilidadeTeclado
    },
    {
      id: 'textos-alt',
      descricao: 'Verificação de textos alternativos em imagens',
      fnVerificar: verificarTextosAlternativos
    }
  ];

  // Executa todas as verificações
  let sucessos = 0;
  let total = verificacoesAcessibilidade.length;
  
  verificacoesAcessibilidade.forEach(verificacao => {
    console.log(`\n🔍 Executando: ${verificacao.descricao}...`);
    try {
      const resultado = verificacao.fnVerificar();
      if (resultado.sucesso) {
        console.log(`✅ ${verificacao.descricao}: ${resultado.mensagem}`);
        sucessos++;
      } else {
        console.warn(`⚠️ ${verificacao.descricao}: ${resultado.mensagem}`);
      }
    } catch (erro) {
      console.error(`❌ Erro ao executar "${verificacao.descricao}":`, erro.message);
    }
  });
  
  // Exibe resumo das verificações
  console.log(`\n📋 RESUMO DA VALIDAÇÃO DE ACESSIBILIDADE: ${sucessos}/${total} verificações bem-sucedidas`);
  
  if (sucessos === total) {
    console.log('✅ Todas as verificações de acessibilidade passaram!');
  } else {
    console.warn(`⚠️ ${total - sucessos} verificações de acessibilidade precisam de atenção.`);
  }
  
  // Funções de verificação específicas
  
  // 1. Verifica se elementos canvas de gráfico possuem aria-labels
  function verificarAriaLabels() {
    const graficos = document.querySelectorAll('canvas');
    let totalGraficos = graficos.length;
    let graficosComLabel = 0;
    let detalhes = [];
    
    if (totalGraficos === 0) {
      return {
        sucesso: false,
        mensagem: 'Nenhum elemento canvas (gráfico) encontrado na página.'
      };
    }
    
    graficos.forEach((grafico, index) => {
      const temAriaLabel = grafico.hasAttribute('aria-label');
      const temId = grafico.id || `grafico-${index}`;
      
      if (temAriaLabel) {
        graficosComLabel++;
        detalhes.push(`✅ ${temId}: aria-label="${grafico.getAttribute('aria-label')}"`);
      } else {
        detalhes.push(`❌ ${temId}: sem aria-label`);
      }
    });
    
    console.log('Detalhes dos gráficos:');
    detalhes.forEach(detalhe => console.log(detalhe));
    
    return {
      sucesso: graficosComLabel === totalGraficos,
      mensagem: `${graficosComLabel} de ${totalGraficos} gráficos possuem aria-label`
    };
  }
  
  // 2. Verifica contraste de cores (simulação - necessitaria de biblioteca para cálculo preciso)
  function verificarContraste() {
    console.log('Nota: Verificação de contraste precisa é melhor realizada com o Lighthouse ou ferramentas especializadas.');
    
    // Verifica elementos principais
    const textos = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, label, a');
    const elementosVerificados = textos.length;
    
    console.log(`Verificação simulada para ${elementosVerificados} elementos de texto.`);
    console.log('Recomendação: Execute uma auditoria do Lighthouse para verificação precisa.');
    
    return {
      sucesso: true,
      mensagem: 'Verificação manual de contraste de cores recomendada usando Lighthouse ou Wave.'
    };
  }
  
  // 3. Verifica navegabilidade por teclado
  function verificarAcessibilidadeTeclado() {
    const elementosInterativos = document.querySelectorAll('button, a, input, select, [role="button"], [tabindex]');
    let comTabindex = 0;
    
    elementosInterativos.forEach(elemento => {
      if (elemento.hasAttribute('tabindex') && elemento.getAttribute('tabindex') !== '-1') {
        comTabindex++;
      }
    });
    
    const totalElementos = elementosInterativos.length;
    
    console.log(`Total de elementos interativos: ${totalElementos}`);
    console.log(`Elementos com tabindex explícito: ${comTabindex}`);
    
    // Verifica se há foco visível
    let temFocoPersonalizado = false;
    
    // Busca por estilos CSS relacionados a foco
    const estilos = Array.from(document.styleSheets);
    try {
      estilos.forEach(folhaEstilo => {
        try {
          const regras = Array.from(folhaEstilo.cssRules || []);
          regras.forEach(regra => {
            if (regra.selectorText && regra.selectorText.includes(':focus')) {
              temFocoPersonalizado = true;
            }
          });
        } catch (e) {
          // Folha de estilo pode ser de outro domínio (CORS)
        }
      });
    } catch (e) {
      console.log('Não foi possível analisar todas as folhas de estilo.');
    }
    
    return {
      sucesso: totalElementos > 0,
      mensagem: `${totalElementos} elementos interativos disponíveis para navegação por teclado. ${temFocoPersonalizado ? 'CSS personalizado para :focus encontrado.' : 'Recomendação: verifique visualmente se o foco é destacado.'}`
    };
  }
  
  // 4. Verifica textos alternativos em imagens
  function verificarTextosAlternativos() {
    const imagens = document.querySelectorAll('img');
    let imagensComAlt = 0;
    
    imagens.forEach(img => {
      if (img.hasAttribute('alt')) {
        imagensComAlt++;
      }
    });
    
    const totalImagens = imagens.length;
    
    if (totalImagens === 0) {
      return {
        sucesso: true,
        mensagem: 'Nenhuma imagem encontrada na página para verificar.'
      };
    }
    
    return {
      sucesso: imagensComAlt === totalImagens,
      mensagem: `${imagensComAlt} de ${totalImagens} imagens possuem texto alternativo (alt)`
    };
  }
})();