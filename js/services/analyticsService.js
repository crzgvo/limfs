/**
 * Serviço de Analytics para o LIMFS
 * 
 * Este arquivo demonstra como implementar um serviço de analytics no servidor
 * para receber e processar os dados enviados pelo cliente através do método sendBeacon.
 * 
 * @module analyticsService
 * @author LIMFS - Laboratório de Indicadores para Monitoramento das Famílias Sergipanas
 * @version 1.0.0
 */

// Exemplo de implementação para Express.js
/*
const express = require('express');
const router = express.Router();

// Middleware para processar dados JSON
router.use(express.json());

/**
 * Rota para receber dados de analytics via POST
 * Aceita requisições sendBeacon do cliente
 */
/*
router.post('/analytics', (req, res) => {
  try {
    const analyticsData = req.body;
    console.log('Dados de analytics recebidos:', analyticsData);
    
    // Aqui você pode implementar a lógica para:
    // 1. Validar os dados recebidos
    // 2. Armazenar em banco de dados
    // 3. Processar estatísticas
    
    // Exemplo de validação simples
    if (!analyticsData.evento || !analyticsData.pagina) {
      console.warn('Dados de analytics incompletos:', analyticsData);
    }
    
    // Exemplo de armazenamento (substituir por lógica real de banco de dados)
    storeAnalyticsData(analyticsData);
    
    // Resposta de sucesso (mesmo para sendBeacon é boa prática retornar status correto)
    res.status(200).json({ 
      success: true,
      message: 'Dados de analytics recebidos com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar dados de analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao processar dados de analytics'
    });
  }
});

/**
 * Função para armazenar dados de analytics
 * Esta é apenas uma implementação de exemplo
 * @param {Object} data - Dados de analytics para armazenar
 */
/*
function storeAnalyticsData(data) {
  // Implementação real usaria um banco de dados como MongoDB, PostgreSQL, etc.
  console.log('Armazenando dados de analytics:', data);
  
  // Exemplo com MongoDB (requer configuração adicional)
  // db.collection('analytics').insertOne({
  //   ...data,
  //   timestamp: new Date()
  // });
}

module.exports = router;
*/

/**
 * Implementação client-side do serviço de analytics
 * Para uso temporário até que o servidor esteja configurado
 */
class ClientAnalytics {
  /**
   * Inicializa o serviço de analytics
   */
  constructor() {
    this.analyticsData = [];
    this.storageKey = 'limfs_analytics';
    this.maxStoredEntries = 100;
    
    // Carrega dados existentes do armazenamento local
    this.loadFromStorage();
    
    // Configura eventos de ciclo de vida da página
    this.setupPageLifecycleEvents();
  }
  
  /**
   * Registra um evento de analytics
   * @param {string} evento - Nome do evento
   * @param {Object} dados - Dados adicionais do evento
   */
  registrarEvento(evento, dados = {}) {
    const entradaAnalytics = {
      evento,
      ...dados,
      pagina: document.body.getAttribute('data-pagina') || window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      idioma: navigator.language
    };
    
    // Adiciona à memória temporária
    this.analyticsData.push(entradaAnalytics);
    
    // Armazena localmente (até que o servidor esteja disponível)
    this.saveToStorage();
    
    // Log para depuração (remover em produção)
    console.log('Evento registrado:', entradaAnalytics);
    
    return entradaAnalytics;
  }
  
  /**
   * Configura eventos de ciclo de vida da página
   */
  setupPageLifecycleEvents() {
    // Registra visualização ao carregar a página
    window.addEventListener('DOMContentLoaded', () => {
      this.registrarEvento('visualizacao_pagina');
    });
    
    // Registra saída ao fechar/navegar para fora da página
    window.addEventListener('beforeunload', () => {
      const tempoNaPagina = Math.floor((Date.now() - performance.timing.navigationStart) / 1000);
      this.registrarEvento('saida_pagina', { tempo_segundos: tempoNaPagina });
      
      // Tenta enviar dados para o servidor quando disponível
      this.enviarDadosPendentes();
    });
  }
  
  /**
   * Salva dados de analytics no armazenamento local
   */
  saveToStorage() {
    try {
      // Mantém apenas os últimos N registros para não sobrecarregar o armazenamento
      const dadosParaSalvar = this.analyticsData.slice(-this.maxStoredEntries);
      
      localStorage.setItem(this.storageKey, JSON.stringify(dadosParaSalvar));
    } catch (erro) {
      console.warn('Erro ao salvar dados de analytics no armazenamento local:', erro);
    }
  }
  
  /**
   * Carrega dados de analytics do armazenamento local
   */
  loadFromStorage() {
    try {
      const dadosSalvos = localStorage.getItem(this.storageKey);
      if (dadosSalvos) {
        this.analyticsData = JSON.parse(dadosSalvos);
      }
    } catch (erro) {
      console.warn('Erro ao carregar dados de analytics do armazenamento local:', erro);
      // Em caso de erro, limpa o armazenamento para evitar problemas futuros
      localStorage.removeItem(this.storageKey);
      this.analyticsData = [];
    }
  }
  
  /**
   * Tenta enviar dados pendentes para o servidor
   * quando o endpoint estiver disponível
   */
  enviarDadosPendentes() {
    if (!this.analyticsData.length) return;
    
    try {
      // Tenta usar sendBeacon para enviar dados em segundo plano
      if ('sendBeacon' in navigator) {
        const enviado = navigator.sendBeacon('/analytics', JSON.stringify({
          eventos: this.analyticsData,
          lote: true
        }));
        
        // Se enviado com sucesso, limpa os dados locais
        if (enviado) {
          this.analyticsData = [];
          localStorage.removeItem(this.storageKey);
          console.log('Dados de analytics enviados com sucesso');
        }
      }
    } catch (erro) {
      console.warn('Não foi possível enviar dados de analytics:', erro);
    }
  }
}

// Exporta a classe para uso em outros módulos
export default ClientAnalytics;