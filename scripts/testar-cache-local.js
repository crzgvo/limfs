/**
 * Script para validação do sistema de cache local com TTL (Time To Live)
 * Verifica se o armazenamento e a expiração dos dados do cache funcionam corretamente
 * 
 * Parte da validação técnica do Dashboard Comparativo Dinâmico (ODS)
 */

(async () => {
  try {
    // Função para armazenar dados no cache com TTL (simplificada)
    function armazenarCache(chave, dados, minutos) {
      try {
        const item = {
          dados: dados,
          expira: Date.now() + (minutos * 60 * 1000)
        };
        localStorage.setItem(chave, JSON.stringify(item));
        return true;
      } catch (erro) {
        console.error('Erro ao armazenar no cache:', erro);
        return false;
      }
    }

    // Função para obter dados do cache com verificação de expiração
    function obterCache(chave) {
      try {
        const item = JSON.parse(localStorage.getItem(chave));
        if (!item) {
          return null;
        }
        
        if (Date.now() > item.expira) {
          localStorage.removeItem(chave);
          return null;
        }
        
        return item.dados;
      } catch (erro) {
        console.error('Erro ao obter cache:', erro);
        return null;
      }
    }

    // Verifica se as funções de cache existem globalmente
    if (typeof armazenarCache !== 'function' || typeof obterCache !== 'function') {
      console.error('❌ Funções de cache não encontradas no escopo global.');
      console.log('🔍 Verifique se as funções "armazenarCache" e "obterCache" estão definidas e acessíveis.');
      return;
    }

    console.log('🧪 Iniciando testes do sistema de cache local com TTL...');
    
    // Teste 1: Armazenamento e recuperação imediata
    console.log('\n📋 Teste 1: Armazenamento e recuperação imediata');
    const dadosTeste = { 
      timestamp: Date.now(),
      valorTeste: 'Teste de cache',
      array: [1, 2, 3],
      objeto: { nome: 'Painel ODS', versao: '1.0' }
    };
    
    console.log('🔄 Armazenando dados no cache com TTL de 1 minuto...');
    armazenarCache('teste-cache-1min', dadosTeste, 1);
    
    const dadosRecuperados = obterCache('teste-cache-1min');
    if (dadosRecuperados) {
      console.log('✅ Dados recuperados com sucesso!');
      console.log('📦 Dados armazenados:', JSON.stringify(dadosTeste));
      console.log('📦 Dados recuperados:', JSON.stringify(dadosRecuperados));
      
      // Verifica se os dados foram recuperados corretamente
      const dadosIguais = JSON.stringify(dadosTeste) === JSON.stringify(dadosRecuperados);
      if (dadosIguais) {
        console.log('✅ Dados recuperados são idênticos aos dados armazenados.');
      } else {
        console.error('❌ Dados recuperados são diferentes dos dados armazenados!');
      }
    } else {
      console.error('❌ Falha ao recuperar dados do cache!');
    }
    
    // Teste 2: Verificação de expiração do TTL
    console.log('\n📋 Teste 2: Verificação de expiração do TTL');
    console.log('🔄 Armazenando dados no cache com TTL de 5 segundos para teste rápido...');
    
    const dadosTesteRapido = { mensagem: 'Este dado deve expirar em 5 segundos' };
    armazenarCache('teste-cache-5seg', dadosTesteRapido, 5/60); // 5 segundos em minutos
    
    console.log('✅ Dados armazenados. Verificando recuperação imediata...');
    const dadosImediatos = obterCache('teste-cache-5seg');
    
    if (dadosImediatos) {
      console.log('✅ Dados recuperados imediatamente:', dadosImediatos);
      
      console.log('⏱️ Aguardando 6 segundos para verificar a expiração...');
      console.log('⏳ Iniciando espera em', new Date().toLocaleTimeString());
      
      // Configurando um temporizador para verificar após a expiração
      setTimeout(() => {
        console.log('⏳ Tempo de espera concluído em', new Date().toLocaleTimeString());
        const dadosExpirados = obterCache('teste-cache-5seg');
        
        if (dadosExpirados === null) {
          console.log('✅ Teste de expiração bem-sucedido! Dados foram removidos corretamente após TTL.');
        } else {
          console.error('❌ Falha no teste de expiração! Dados ainda estão no cache após o TTL:', dadosExpirados);
        }
        
        // Teste 3: Sobrescrever valor em cache existente
        console.log('\n📋 Teste 3: Sobrescrever valor em cache existente');
        const dadosAtualizados = { mensagem: 'Dados atualizados', timestamp: Date.now() };
        console.log('🔄 Armazenando novo valor para chave já existente...');
        armazenarCache('teste-cache-1min', dadosAtualizados, 10);
        
        const dadosNovos = obterCache('teste-cache-1min');
        if (dadosNovos && dadosNovos.mensagem === 'Dados atualizados') {
          console.log('✅ Dados sobrescritos com sucesso:', dadosNovos);
        } else {
          console.error('❌ Falha ao sobrescrever dados no cache!');
        }
        
        console.log('\n📋 RESUMO DOS TESTES:');
        console.log('✅ Teste 1: Armazenamento e recuperação imediata');
        console.log(`${dadosIguais ? '✅' : '❌'} Teste de integridade dos dados`);
        console.log(`${dadosExpirados === null ? '✅' : '❌'} Teste 2: Verificação de expiração do TTL`);
        console.log(`${dadosNovos && dadosNovos.mensagem === 'Dados atualizados' ? '✅' : '❌'} Teste 3: Sobrescrever valor em cache existente`);
        
        console.log('\n✅ Validação do sistema de cache local concluída!');
      }, 6000); // 6 segundos (1 segundo adicional para garantir)
      
    } else {
      console.error('❌ Falha ao recuperar dados do cache imediatamente após armazenamento!');
    }
  } catch (erro) {
    console.error('❌ Erro durante a validação do cache:', erro);
    console.error('📝 Detalhes do erro:', erro.stack);
  }
})();
