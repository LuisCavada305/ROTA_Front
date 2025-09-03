import Layout from "../components/Layout";
import "../styles/Home.css";
import LogoRotaSemFundo from "../images/RotaSemFundo.png";
import FotoEducacaoOnline from "../images/imagemComp.png";
import LogoEnactus from "../images/logoEnactusRedonda.png";
import LogoRota from "../images/RotaLogoRedondo.png";
import ComputerLogo from "../images/ComputerLogo.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

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
                src={LogoEnactus}
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
                src={LogoRota}
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
                src={ComputerLogo}
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

    {/* ===== Nossas Parcerias ===== */}
<section className="partners-section" aria-labelledby="partners-title">
  {/* shape divider BOTTOM */}
  <div className="partners-shape-bottom" aria-hidden="true">
    <svg viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <path
        className="partners-shape-fill"
        d="M194,99c186.7,0.7,305-78.3,306-97.2c1,18.9,119.3,97.9,306,97.2c114.3-0.3,194,0.3,194,0.3s0-91.7,0-100c0,0,0,0,0-0 L0,0v99.3C0,99.3,79.7,98.7,194,99z"
      />
    </svg>
  </div>

  <div className="partners-container">
    <h2 id="partners-title" className="partners-title">Nossas Parcerias</h2>

    <Swiper
      className="partners-swiper"
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
      speed={500}
      loop
      centeredSlides
      slidesPerView={3}
      spaceBetween={30}
      breakpoints={{
        320: { slidesPerView: 1, centeredSlides: true },
        640: { slidesPerView: 2, centeredSlides: true },
        980: { slidesPerView: 3, centeredSlides: true },
      }}
    >
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2023/12/MCK_horizontal_vermelho-1-300x120.png" alt="Mackenzie" />
      </SwiperSlide>
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2024/04/enactus-logo-5067605AE8-seeklogo.com_.png" alt="Enactus" />
      </SwiperSlide>
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2024/04/Mask-group.png" alt="Mask Group" />
      </SwiperSlide>
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2024/06/dreams-300x136.webp" alt="Dreams" />
      </SwiperSlide>
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2024/06/Cia-de-talentos-1080-300x169.png" alt="Cia de Talentos" />
      </SwiperSlide>
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2025/05/ser-.png" alt="Ser+" />
      </SwiperSlide>
      <SwiperSlide>
        <img src="https://projetorota.com.br/wp-content/uploads/2025/05/Portfolio-removebg-preview-300x239.png" alt="Portfólio" />
      </SwiperSlide>
    </Swiper>
  </div>
</section>


    </Layout>
  );
}
