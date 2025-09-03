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

      {/* ===== Sobre Nós ===== */}
      <section className="about-section" aria-labelledby="about-title">
        <div className="about-container">
          <h2 id="about-title" className="about-title">Sobre Nós</h2>

          <div className="about-grid">
            <article className="about-card">
              <img
                src="https://projetorota.com.br/wp-content/uploads/2024/04/logo-enactus-esquerda-redonda.png"
                alt="Liga Enactus Mackenzie"
                className="about-icon"
              />
              <h3 className="about-card-title">Equipe</h3>
              <p className="about-card-desc">
                Alunos da Universidade Presbiteriana Mackenzie, integrantes da Liga Enactus
                Mackenzie, com interesse em criar um mundo melhor e mais sustentável.
              </p>
            </article>

            <article className="about-card">
              <img
                src="https://projetorota.com.br/wp-content/uploads/2024/04/Mask-group.png"
                alt="Objetivo do Projeto Rota"
                className="about-icon"
              />
              <h3 className="about-card-title">Objetivo</h3>
              <p className="about-card-desc">
                Capacitar jovens em situação de vulnerabilidade e auxiliá-los a conquistar
                oportunidades em empresas qualificadas, promovendo inclusão produtiva e
                desenvolvimento profissional.
              </p>
            </article>

            <article className="about-card">
              <img
                src="https://projetorota.com.br/wp-content/uploads/2024/04/003-computer.png"
                alt="Conteúdo das trilhas"
                className="about-icon"
              />
              <h3 className="about-card-title">Conteúdo</h3>
              <p className="about-card-desc">
                5 trilhas de aprendizagem com vídeoaulas, e-books, questionários e, ao final,
                emissão do certificado Rota.
              </p>
            </article>
          </div>
        </div>
      </section>
    </Layout>
  );
}
