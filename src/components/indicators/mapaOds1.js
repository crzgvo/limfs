/**
 * Componente para criação de mapas interativos para o painel ODS 1
 * Utiliza Leaflet.js para visualização de dados geoespaciais
 * 
 * @autor LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @versão 1.0.0 (14/04/2025)
 */

/**
 * Inicializa e carrega o mapa de Sergipe com dados de pobreza por município
 * @param {string} containerId - ID do elemento HTML onde o mapa será renderizado
 * @param {Object} dadosMunicipios - Objeto com dados de taxa de pobreza por município
 * @returns {Promise<Object>} - Promise com a instância do mapa
 */
export async function carregarMapaODS1(containerId, dadosMunicipios) {
  try {
    // Coordenadas centrais de Sergipe
    const sergipeCoordenadas = [-10.5741, -37.3857];
    const zoomInicial = 8;
    
    // Inicializa o mapa
    const mapa = L.map(containerId).setView(sergipeCoordenadas, zoomInicial);
    
    // Adiciona camada de tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapa);
    
    try {
      // Tenta buscar GeoJSON de Sergipe
      // Em produção, este arquivo seria hospedado localmente
      const geoJsonUrl = '/dados/sergipe-municipios.geojson';
      const resposta = await fetch(geoJsonUrl);
      
      if (!resposta.ok) {
        throw new Error(`Erro ao carregar GeoJSON: ${resposta.status}`);
      }
      
      const geoJson = await resposta.json();
      
      // Adiciona a camada GeoJSON com estilização baseada nos dados
      const camadaGeoJSON = L.geoJSON(geoJson, {
        style: feature => {
          const nomeMunicipio = feature.properties.name || feature.properties.nome;
          const valorPobreza = dadosMunicipios[nomeMunicipio] || 0;
          
          return {
            fillColor: obterCorPorValor(valorPobreza),
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
          };
        },
        onEachFeature: (feature, layer) => {
          const nomeMunicipio = feature.properties.name || feature.properties.nome;
          const valorPobreza = dadosMunicipios[nomeMunicipio] || 'Dados indisponíveis';
          
          // Adiciona interatividade - popup com informações do município
          layer.bindPopup(criarConteudoPopup(nomeMunicipio, valorPobreza));
          
          // Adiciona interatividade - hover
          layer.on({
            mouseover: destacarFeature,
            mouseout: resetarEstilo,
            click: ampliarMunicipio
          });
        }
      }).addTo(mapa);
      
      function destacarFeature(e) {
        const layer = e.target;
        
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.8
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
      }
      
      function resetarEstilo(e) {
        camadaGeoJSON.resetStyle(e.target);
      }
      
      function ampliarMunicipio(e) {
        mapa.fitBounds(e.target.getBounds());
      }
      
      // Adiciona controle para retornar à visão de todo o estado
      const botaoReiniciar = L.control({position: 'topleft'});
      botaoReiniciar.onAdd = function() {
        const div = L.DomUtil.create('div', 'info-mapa botao-reiniciar-mapa');
        div.innerHTML = '<button aria-label="Resetar visualização do mapa" title="Visualizar todo o estado"><i class="fas fa-home"></i></button>';
        div.onclick = function() {
          mapa.setView(sergipeCoordenadas, zoomInicial);
        };
        return div;
      };
      botaoReiniciar.addTo(mapa);
      
      // Estilização de acessibilidade para controles
      const estiloControles = document.createElement('style');
      estiloControles.textContent = `
        .botao-reiniciar-mapa button {
          background: white;
          width: 30px;
          height: 30px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }
        
        .botao-reiniciar-mapa button:hover,
        .botao-reiniciar-mapa button:focus {
          background-color: #f4f4f4;
          outline: 2px solid #E5243B;
        }
        
        .leaflet-popup-content {
          font-family: 'Public Sans', sans-serif;
        }
        
        .popup-titulo {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 5px;
          color: #333;
        }
        
        .popup-valor {
          font-size: 22px;
          font-weight: bold;
          color: #E5243B;
          margin: 10px 0;
        }
        
        .popup-descricao {
          font-size: 13px;
          color: #555;
          margin-top: 8px;
        }
      `;
      document.head.appendChild(estiloControles);
      
      return {
        mapa,
        camadaGeoJSON
      };
      
    } catch (erro) {
      console.error('Erro ao carregar GeoJSON:', erro);
      
      // Fallback para quando o GeoJSON não estiver disponível
      // Adiciona marcadores simples para os principais municípios
      const municipios = Object.keys(dadosMunicipios);
      
      // Coordenadas aproximadas de alguns municípios de Sergipe para fallback
      const coordenadasMunicipios = {
        'Aracaju': [-10.9472, -37.0731],
        'São Cristóvão': [-11.0175, -37.2047],
        'Nossa Senhora do Socorro': [-10.8468, -37.1259],
        'Lagarto': [-10.9136, -37.6689],
        'Estância': [-11.2683, -37.4383],
        'Itabaiana': [-10.6829, -37.4259],
        'Propriá': [-10.2155, -36.8399],
        'Tobias Barreto': [-11.1881, -37.9968]
      };
      
      municipios.forEach(municipio => {
        if (coordenadasMunicipios[municipio]) {
          const valor = dadosMunicipios[municipio];
          const cor = obterCorPorValor(valor);
          
          L.circleMarker(coordenadasMunicipios[municipio], {
            radius: 12,
            fillColor: cor,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).bindPopup(criarConteudoPopup(municipio, valor))
            .addTo(mapa);
        }
      });
      
      // Adiciona mensagem de erro no mapa
      const mensagemErro = L.control({position: 'bottomleft'});
      mensagemErro.onAdd = function() {
        const div = L.DomUtil.create('div', 'info-mapa erro-mapa');
        div.innerHTML = '<strong>Atenção:</strong> Usando visualização simplificada. Não foi possível carregar o mapa detalhado.';
        return div;
      };
      mensagemErro.addTo(mapa);
      
      return {
        mapa,
        erro: true
      };
    }
    
  } catch (erro) {
    console.error('Erro ao inicializar mapa:', erro);
    
    // Se houver falha na inicialização do mapa, exibe mensagem de erro
    document.getElementById(containerId).innerHTML = `
      <div class="erro-carregamento-mapa">
        <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
        <p>Não foi possível carregar o mapa.</p>
        <p class="erro-detalhe">${erro.message}</p>
      </div>
    `;
    
    return {
      erro: true,
      mensagem: erro.message
    };
  }
}

/**
 * Determina a cor de um município com base no valor da taxa de pobreza
 * @param {number} valor - Taxa de pobreza do município
 * @returns {string} - Código de cor no formato hexadecimal
 */
function obterCorPorValor(valor) {
  return valor > 40 ? '#800026' :
         valor > 30 ? '#BD0026' :
         valor > 20 ? '#E31A1C' :
         valor > 10 ? '#FC4E2A' :
         valor > 5  ? '#FD8D3C' :
                      '#FFEDA0';
}

/**
 * Cria o conteúdo HTML para o popup de um município
 * @param {string} nome - Nome do município
 * @param {number|string} valor - Taxa de pobreza do município
 * @returns {string} - HTML formatado para o popup
 */
function criarConteudoPopup(nome, valor) {
  let classificacao, descricao;
  
  if (typeof valor === 'number') {
    if (valor > 30) {
      classificacao = 'Crítico';
      descricao = 'Situação crítica que requer atenção imediata e intervenções prioritárias.';
    } else if (valor > 20) {
      classificacao = 'Alto';
      descricao = 'Índice elevado, necessitando de políticas públicas específicas.';
    } else if (valor > 10) {
      classificacao = 'Moderado';
      descricao = 'Situação intermediária, com necessidade de monitoramento constante.';
    } else {
      classificacao = 'Baixo';
      descricao = 'Situação mais favorável, porém ainda requer atenção para evitar aumento.';
    }
    
    return `
      <div class="popup-mapa">
        <div class="popup-titulo">${nome}</div>
        <div class="popup-valor">${valor}%</div>
        <div class="popup-classificacao">Nível: <strong>${classificacao}</strong></div>
        <div class="popup-descricao">${descricao}</div>
      </div>
    `;
  } else {
    return `
      <div class="popup-mapa">
        <div class="popup-titulo">${nome}</div>
        <div class="popup-indisponivel">Dados não disponíveis</div>
      </div>
    `;
  }
}