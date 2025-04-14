/**
 * Script para validação da estrutura do arquivo JSON centralizado de configuração dos ODS
 * Verifica se todos os ODS e indicadores possuem endpoints válidos configurados
 * 
 * Parte da validação técnica do Dashboard Comparativo Dinâmico (ODS)
 */

(async () => {
  try {
    console.log('🧪 Iniciando validação da estrutura do arquivo centralizado ods-config.json...');
    
    // Tenta obter o arquivo de configuração
    let resposta;
    try {
      resposta = await fetch('/dados/ods-config.json');
      if (!resposta.ok) {
        throw new Error(`Erro ao buscar arquivo: ${resposta.status} ${resposta.statusText}`);
      }
    } catch (erroFetch) {
      console.error('❌ Erro ao buscar o arquivo ods-config.json:', erroFetch.message);
      
      // Tenta um caminho alternativo
      try {
        console.log('🔄 Tentando caminho alternativo...');
        resposta = await fetch('../dados/ods-config.json');
        if (!resposta.ok) {
          throw new Error(`Erro ao buscar arquivo: ${resposta.status} ${resposta.statusText}`);
        }
      } catch (erroFetchAlt) {
        console.error('❌ Erro ao buscar o arquivo ods-config.json (caminho alternativo):', erroFetchAlt.message);
        return;
      }
    }

    console.log('✅ Arquivo ods-config.json carregado com sucesso!');
    
    // Parse do JSON
    let config;
    try {
      config = await resposta.json();
    } catch (erroJSON) {
      console.error('❌ Erro ao processar JSON:', erroJSON.message);
      return;
    }
    
    if (!config.objetivos_desenvolvimento_sustentavel || !Array.isArray(config.objetivos_desenvolvimento_sustentavel)) {
      console.error('❌ Estrutura inválida: campo "objetivos_desenvolvimento_sustentavel" não encontrado ou não é um array');
      return;
    }
    
    console.log(`📊 Total de ODS encontrados: ${config.objetivos_desenvolvimento_sustentavel.length}`);
    
    // Contadores de validação
    let totalIndicadores = 0;
    let indicadoresValidos = 0;
    let indicadoresInvalidos = 0;
    
    // Validação de cada ODS e seus indicadores
    for (const ods of config.objetivos_desenvolvimento_sustentavel) {
      if (!ods.codigo || !ods.titulo) {
        console.error(`❌ ODS ID ${ods.id} não possui código ou título definido`);
        continue;
      }
      
      console.log(`\n🔍 Validando ODS ${ods.codigo} - ${ods.titulo}`);
      
      // Verificando campos obrigatórios do ODS
      const odsValido = ods.id && ods.descricao && ods.cor_primaria && ods.cor_secundaria;
      if (!odsValido) {
        console.warn(`⚠️ ODS ${ods.codigo} está faltando campos obrigatórios`);
      }
      
      // Verificando indicadores
      if (!ods.indicadores || !Array.isArray(ods.indicadores) || ods.indicadores.length === 0) {
        console.error(`❌ ODS ${ods.codigo} não possui indicadores definidos`);
        continue;
      }
      
      console.log(`📈 Total de indicadores para ODS ${ods.codigo}: ${ods.indicadores.length}`);
      
      // Validando cada indicador
      ods.indicadores.forEach(indicador => {
        totalIndicadores++;
        
        if (!indicador.id || !indicador.nome) {
          console.error(`❌ ODS ${ods.codigo} possui indicador sem ID ou nome definido`);
          indicadoresInvalidos++;
          return;
        }
        
        // Verifica se tem pelo menos um endpoint definido
        if (!indicador.endpoint_json && !indicador.endpoint_api) {
          console.error(`❌ Indicador ${indicador.nome} (ODS ${ods.codigo}) não possui endpoint válido.`);
          indicadoresInvalidos++;
        } else {
          console.log(`✅ Indicador ${indicador.nome} (ODS ${ods.codigo}) com endpoints válidos.`);
          indicadoresValidos++;
          
          // Verificação adicional: tenta acessar o endpoint JSON para validar existência
          if (indicador.endpoint_json) {
            fetch(indicador.endpoint_json.startsWith('/') ? indicador.endpoint_json : `/dados/${indicador.endpoint_json}`)
              .then(res => {
                if (!res.ok) {
                  console.warn(`⚠️ Endpoint JSON do indicador ${indicador.nome} (ODS ${ods.codigo}) retornou status ${res.status}`);
                } else {
                  console.log(`✅ Endpoint JSON do indicador ${indicador.nome} (ODS ${ods.codigo}) acessível`);
                }
              })
              .catch(err => {
                console.warn(`⚠️ Não foi possível acessar o endpoint JSON do indicador ${indicador.nome} (ODS ${ods.codigo}): ${err.message}`);
              });
          }
        }
      });
    }
    
    // Resumo da validação
    console.log('\n📋 RESUMO DA VALIDAÇÃO:');
    console.log(`Total de ODS: ${config.objetivos_desenvolvimento_sustentavel.length}`);
    console.log(`Total de indicadores: ${totalIndicadores}`);
    console.log(`Indicadores válidos: ${indicadoresValidos}`);
    console.log(`Indicadores inválidos: ${indicadoresInvalidos}`);
    
    if (indicadoresInvalidos === 0) {
      console.log('✅ Validação concluída com sucesso! Todos os indicadores possuem endpoints válidos.');
    } else {
      console.warn(`⚠️ Validação concluída com ${indicadoresInvalidos} indicadores inválidos.`);
    }
    
  } catch (erro) {
    console.error('❌ Erro durante a validação:', erro);
    console.error('📝 Detalhes do erro:', erro.stack);
  }
})();
