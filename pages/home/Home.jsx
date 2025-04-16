import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SummaryChart from '../../components/charts/SummaryChart';
import ODSIndicators from '../../components/indicators/ODSIndicators';

const Home = () => {
  return (
    <div>
      <Header />
      <main>
        <section>
          <h1>Bem-vindo ao Painel ODS</h1>
          <p>Monitoramento e análise dos Objetivos de Desenvolvimento Sustentável.</p>
        </section>
        <section>
          <h2>Resumo dos Indicadores</h2>
          <SummaryChart />
        </section>
        <section>
          <h2>Indicadores por ODS</h2>
          <ODSIndicators />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
