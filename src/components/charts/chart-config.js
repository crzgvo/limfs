/**
 * Módulo chart-config.js
 * 
 * Configuração de temas e cores para gráficos do Painel ODS.
 * Define cores para cada ODS e opções de estilo para os gráficos.
 * 
 * @version 1.0.0
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 */

// Cores oficiais para cada ODS
export const ODSColors = {
    ods1: '#e5243b', // Erradicação da Pobreza
    ods2: '#dda63a', // Fome Zero
    ods3: '#4c9f38', // Boa Saúde e Bem-Estar
    ods4: '#c5192d', // Educação de Qualidade
    ods5: '#ff3a21', // Igualdade de Gênero
    ods6: '#26bde2', // Água Potável e Saneamento
    ods7: '#fcc30b', // Energia Limpa e Acessível
    ods8: '#a21942', // Trabalho Decente e Crescimento Econômico
    ods9: '#fd6925', // Indústria, Inovação e Infraestrutura
    ods10: '#dd1367', // Redução das Desigualdades
    ods11: '#fd9d24', // Cidades e Comunidades Sustentáveis
    ods12: '#bf8b2e', // Consumo e Produção Responsáveis
    ods13: '#3f7e44', // Ação Contra a Mudança Global do Clima
    ods14: '#0a97d9', // Vida na Água
    ods15: '#56c02b', // Vida Terrestre
    ods16: '#00689d', // Paz, Justiça e Instituições Eficazes
    ods17: '#19486a', // Parcerias e Meios de Implementação
    ods18: '#0075c9'  // Estado de Sergipe (cor adicional)
};

// Versões com transparência (alpha) para backgrounds, fills, etc.
export const ODSAlphaColors = {
    ods1: 'rgba(229, 36, 59, 0.7)',    // Erradicação da Pobreza
    ods2: 'rgba(221, 166, 58, 0.7)',   // Fome Zero
    ods3: 'rgba(76, 159, 56, 0.7)',    // Boa Saúde e Bem-Estar
    ods4: 'rgba(197, 25, 45, 0.7)',    // Educação de Qualidade
    ods5: 'rgba(255, 58, 33, 0.7)',    // Igualdade de Gênero
    ods6: 'rgba(38, 189, 226, 0.7)',   // Água Potável e Saneamento
    ods7: 'rgba(252, 195, 11, 0.7)',   // Energia Limpa e Acessível
    ods8: 'rgba(162, 25, 66, 0.7)',    // Trabalho Decente e Crescimento Econômico
    ods9: 'rgba(253, 105, 37, 0.7)',   // Indústria, Inovação e Infraestrutura
    ods10: 'rgba(221, 19, 103, 0.7)',  // Redução das Desigualdades
    ods11: 'rgba(253, 157, 36, 0.7)',  // Cidades e Comunidades Sustentáveis
    ods12: 'rgba(191, 139, 46, 0.7)',  // Consumo e Produção Responsáveis
    ods13: 'rgba(63, 126, 68, 0.7)',   // Ação Contra a Mudança Global do Clima
    ods14: 'rgba(10, 151, 217, 0.7)',  // Vida na Água
    ods15: 'rgba(86, 192, 43, 0.7)',   // Vida Terrestre
    ods16: 'rgba(0, 104, 157, 0.7)',   // Paz, Justiça e Instituições Eficazes
    ods17: 'rgba(25, 72, 106, 0.7)',   // Parcerias e Meios de Implementação
    ods18: 'rgba(0, 117, 201, 0.7)'    // Estado de Sergipe (cor adicional)
};

// Configurações padrão para gráficos
export const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index'
    },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        },
        tooltip: {
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 3,
            padding: 10,
            cornerRadius: 4,
            displayColors: true
        }
    }
};

// Configurações de tema claro
export const lightTheme = {
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    color: '#333333',
    gridLines: 'rgba(0, 0, 0, 0.1)'
};

// Configurações de tema escuro
export const darkTheme = {
    backgroundColor: '#333333',
    borderColor: '#555555',
    color: '#ffffff',
    gridLines: 'rgba(255, 255, 255, 0.1)'
};

/**
 * Aplica o tema (claro ou escuro) a um gráfico
 * 
 * @param {Chart} chart - O objeto Chart.js para aplicar o tema
 * @param {string} theme - 'light' ou 'dark'
 */
export function applyTheme(chart, theme = 'light') {
    const themeSettings = theme === 'dark' ? darkTheme : lightTheme;
    
    // Atualizar configurações do gráfico
    if (chart.options.scales) {
        // Para gráficos cartesianos (linha, barra)
        Object.values(chart.options.scales).forEach(scale => {
            if (scale.grid) {
                scale.grid.color = themeSettings.gridLines;
            }
            if (scale.ticks) {
                scale.ticks.color = themeSettings.color;
            }
            if (scale.title) {
                scale.title.color = themeSettings.color;
            }
        });
    }
    
    // Atualizar plugins
    if (chart.options.plugins) {
        // Legenda
        if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels = chart.options.plugins.legend.labels || {};
            chart.options.plugins.legend.labels.color = themeSettings.color;
        }
        
        // Título
        if (chart.options.plugins.title) {
            chart.options.plugins.title.color = themeSettings.color;
        }
        
        // Tooltip
        if (chart.options.plugins.tooltip) {
            chart.options.plugins.tooltip.backgroundColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            chart.options.plugins.tooltip.titleColor = theme === 'dark' ? '#ffffff' : '#000000';
            chart.options.plugins.tooltip.bodyColor = theme === 'dark' ? '#cccccc' : '#333333';
            chart.options.plugins.tooltip.borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        }
    }
    
    // Atualizar a visualização do gráfico
    chart.update();
}

/**
 * Gera uma paleta de cores baseada em uma cor base
 * 
 * @param {string} baseColor - Cor base no formato HEX (#RRGGBB)
 * @param {number} numColors - Número de cores a gerar
 * @param {number} lightFactor - Fator de luminosidade (0-1)
 * @returns {Array} Array de cores no formato HEX
 */
export function generateColorPalette(baseColor, numColors = 5, lightFactor = 0.15) {
    // Converte HEX para RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    const palette = [];
    
    // Gera cores mais claras
    for (let i = 0; i < numColors; i++) {
        // Fator de claridade vai aumentando
        const factor = lightFactor * (i + 1);
        
        // Calcula nova cor (mais clara)
        const rNew = Math.min(255, Math.round(r + (255 - r) * factor));
        const gNew = Math.min(255, Math.round(g + (255 - g) * factor));
        const bNew = Math.min(255, Math.round(b + (255 - b) * factor));
        
        // Converte de volta para HEX
        const hexColor = '#' + 
            ((1 << 24) + (rNew << 16) + (gNew << 8) + bNew)
            .toString(16).slice(1);
        
        palette.push(hexColor);
    }
    
    // Retorna a cor base seguida das cores derivadas
    return [baseColor, ...palette];
}

export default {
    ODSColors,
    ODSAlphaColors,
    defaultChartOptions,
    lightTheme,
    darkTheme,
    applyTheme,
    generateColorPalette
};