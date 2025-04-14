/**
 * Script para validação da Content Security Policy (CSP) do Dashboard Comparativo Dinâmico (ODS)
 * Verifica se a CSP está implementada e se há violações
 */

(function() {
  console.log('🧪 Iniciando validação de Content Security Policy (CSP)...');
  
  // Função para obter as políticas de CSP da página
  function obterPoliticasCSP() {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const headersCSP = {};
    
    // Tenta obter CSP dos cabeçalhos HTTP (simulado)
    // Em um ambiente real, isso seria obtido através de uma requisição de rede
    try {
      // Esta parte é apenas uma simulação, pois não temos acesso direto aos cabeçalhos HTTP no cliente
      console.log('Nota: Verificação de cabeçalhos HTTP requer acesso ao servidor.');
    } catch (erro) {
      console.warn('⚠️ Não foi possível verificar cabeçalhos HTTP:', erro.message);
    }
    
    return {
      meta: metaCSP ? metaCSP.getAttribute('content') : null,
      headers: headersCSP
    };
  }
  
  // Função para analisar e validar as políticas de CSP
  function analisarPoliticasCSP(politicas) {
    const resultado = {
      implementada: false,
      diretivas: {},
      violacoes: [],
      recomendacoes: []
    };
    
    // Verifica se existe CSP implementada
    if (!politicas.meta && Object.keys(politicas.headers).length === 0) {
      resultado.implementada = false;
      resultado.violacoes.push('CSP não implementada na página');
      resultado.recomendacoes.push('Implemente uma política de CSP usando a meta tag ou cabeçalhos HTTP');
      return resultado;
    }
    
    resultado.implementada = true;
    
    // Analisa a política da meta tag se disponível
    if (politicas.meta) {
      console.log('✅ CSP implementada via meta tag');
      console.log('📋 Política CSP:', politicas.meta);
      
      // Parseia as diretivas da política
      const diretivasRaw = politicas.meta.split(';').map(d => d.trim());
      diretivasRaw.forEach(diretiva => {
        if (diretiva) {
          const [nome, ...valores] = diretiva.split(' ');
          resultado.diretivas[nome] = valores.join(' ');
        }
      });
    }
    
    // Verifica diretivas críticas
    const diretivasRecomendadas = [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'connect-src'
    ];
    
    diretivasRecomendadas.forEach(diretiva => {
      if (!resultado.diretivas[diretiva]) {
        resultado.recomendacoes.push(`Adicione a diretiva '${diretiva}' à sua política CSP`);
      }
    });
    
    // Verifica o uso de 'unsafe-inline' e 'unsafe-eval'
    const diretivasCriticas = ['script-src', 'style-src'];
    diretivasCriticas.forEach(diretiva => {
      if (resultado.diretivas[diretiva]) {
        if (resultado.diretivas[diretiva].includes('unsafe-inline')) {
          resultado.violacoes.push(`A diretiva '${diretiva}' permite 'unsafe-inline', o que pode representar um risco de segurança`);
        }
        if (resultado.diretivas[diretiva].includes('unsafe-eval')) {
          resultado.violacoes.push(`A diretiva '${diretiva}' permite 'unsafe-eval', o que pode representar um risco de segurança`);
        }
      }
    });
    
    return resultado;
  }
  
  // Verifica se há violações de CSP reportadas no console
  function verificarViolacoesConsole() {
    console.log('⚠️ Verificação de violações CSP no console deve ser feita manualmente.');
    console.log('📝 Instrução: Após carregar a página, verifique no console do navegador se há mensagens de erro relacionadas à CSP.');
    
    return {
      mensagem: 'Verificação manual de violações CSP no console é necessária'
    };
  }
  
  // Verifica se há suporte ao monitoramento de violações de CSP
  function verificarMonitoramentoCSP() {
    let temReportTo = false;
    let temReportURI = false;
    
    const politicasCSP = obterPoliticasCSP();
    
    if (politicasCSP.meta) {
      temReportTo = politicasCSP.meta.includes('report-to');
      temReportURI = politicasCSP.meta.includes('report-uri');
    }
    
    if (temReportTo || temReportURI) {
      console.log('✅ Monitoramento de violações CSP implementado');
    } else {
      console.log('⚠️ Monitoramento de violações CSP não implementado');
      console.log('📝 Recomendação: Adicione "report-to" ou "report-uri" à sua política CSP para monitorar violações');
    }
    
    return {
      implementado: temReportTo || temReportURI,
      mensagem: temReportTo || temReportURI ? 
        'Monitoramento de violações CSP implementado' : 
        'Monitoramento de violações CSP não implementado'
    };
  }
  
  // Executa as verificações
  const politicas = obterPoliticasCSP();
  const analiseCSP = analisarPoliticasCSP(politicas);
  const violacoesConsole = verificarViolacoesConsole();
  const monitoramentoCSP = verificarMonitoramentoCSP();
  
  // Exibe resumo das verificações
  console.log('\n📋 RESUMO DA VALIDAÇÃO DE CSP:');
  console.log(`CSP implementada: ${analiseCSP.implementada ? '✅ Sim' : '❌ Não'}`);
  
  if (analiseCSP.implementada) {
    console.log('\nDiretivas encontradas:');
    Object.keys(analiseCSP.diretivas).forEach(diretiva => {
      console.log(`- ${diretiva}: ${analiseCSP.diretivas[diretiva]}`);
    });
  }
  
  if (analiseCSP.violacoes.length > 0) {
    console.log('\n⚠️ VIOLAÇÕES ENCONTRADAS:');
    analiseCSP.violacoes.forEach(violacao => {
      console.log(`- ${violacao}`);
    });
  } else if (analiseCSP.implementada) {
    console.log('\n✅ Nenhuma violação crítica de CSP encontrada!');
  }
  
  if (analiseCSP.recomendacoes.length > 0) {
    console.log('\n📝 RECOMENDAÇÕES:');
    analiseCSP.recomendacoes.forEach(recomendacao => {
      console.log(`- ${recomendacao}`);
    });
  }
  
  console.log('\n✅ Validação de CSP concluída!');
})();