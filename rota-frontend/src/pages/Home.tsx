import Layout from "../components/Layout";
import "../styles/Home.css";
import LogoRotaSemFundo from "../images/RotaSemFundo.png";
import FotoEducacaoOnline from "../images/imagemComp.png";

export default function Home() {
  return (
    <Layout>
      <main className="home-hero">
        {/* tabela central */}
        <div className="hero-table" role="table" aria-label="Apresentação do Projeto Rota">
          <div className="hero-row" role="row">
            <div className="hero-cell hero-left" role="cell">
              <h2 className="hero-subtitle">Projeto</h2>
              <img
                src={LogoRotaSemFundo}
                alt="Logo Projeto Rota"
                className="hero-logo"
                decoding="async"
              />
              <p className="hero-tagline">Capacitando jovens para o futuro!</p>
            </div>
            <div className="hero-cell hero-right" role="cell">
              <img
                src={FotoEducacaoOnline}
                alt="Ilustração de educação on-line"
                className="hero-illustration"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
