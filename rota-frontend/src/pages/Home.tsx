import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import "../styles/Home.css";
import LogoRotaSemFundo from "../images/RotaSemFundo.png";
import FotoEducacaoOnline from "../images/imagemComp.png";
import LogoEnactus from "../images/logoEnactusRedonda.png";
import LogoRota from "../images/RotaLogoRedondo.png";
import ComputerLogo from "../images/ComputerLogo.png";
import MackenzieLogo from "../images/Mack.png";
import DreamsLogo from "../images/dreams.webp";
import SerLogo from "../images/ser.png";
import CiaTalentosLogo from "../images/cia.png";
import Projov from "../images/projov.png";
import EnactusGeralLogo from "../images/enactus.png";
import DiretoriaEnsinoLogo from "../images/diretoriaEnsino.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { http } from "../lib/http";

type Trilha = {
  id: string;
  name: string;
  pictureUrl: string;
  author?: string;
  rating?: number;          // 0..5
  botaoLabel?: string;      // opcional
};

export default function Home() {
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [loadingTrilhas, setLoadingTrilhas] = useState(true);
  const [erroTrilhas, setErroTrilhas] = useState<string | null>(null);

  async function getTrilhasShowcase() {
    // espera que o back responda { trails: Trilha[] }
    const response = await http.get("/trails/showcase");
    return response.data.trails as Trilha[];
  }

  useEffect(() => {
    (async () => {
      try {
        setLoadingTrilhas(true);
        const data = await getTrilhasShowcase();
        setTrilhas(data ?? []);
        setErroTrilhas(null);
      } catch (e: any) {
        setErroTrilhas(e?.message || "Erro ao buscar trilhas.");
      } finally {
        setLoadingTrilhas(false);
      }
    })();
  }, []);

  function handleMatricular(id: string) {
    // aqui você chama sua rota de matrícula (ex.: POST /matriculas { trilhaId })
    // http.post("/matriculas", { trilhaId: id });
    alert(`Matricular-se na trilha ${id} (implementar chamada)`);
  }


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
        <img src={MackenzieLogo} alt="Mackenzie" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={EnactusGeralLogo} alt="Enactus" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={LogoRota} alt="Mask Group" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={DreamsLogo} alt="Dreams" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={CiaTalentosLogo} alt="Cia de Talentos" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={Projov} alt="Portfólio" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={SerLogo} alt="Ser+" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={DiretoriaEnsinoLogo} alt="Portfólio" />
      </SwiperSlide>
    </Swiper>
  </div>
</section>

{/* ===== Nossas Trilhas ===== */}
      <section className="tracks-section" aria-labelledby="tracks-title">
        <div className="tracks-container">
          <h2 id="tracks-title" className="tracks-title">Nossas Trilhas</h2>

          {loadingTrilhas && (
            <div className="tracks-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="track-card skeleton" />
              ))}
            </div>
          )}

          {erroTrilhas && !loadingTrilhas && (
            <div className="tracks-error">{erroTrilhas}</div>
          )}

          {!loadingTrilhas && !erroTrilhas && (
            <div className="tracks-grid">
              {trilhas.map((t) => (
                <article key={t.id} className="track-card">
                  <div className="track-cover">
                    <img src={t.pictureUrl} alt={t.name} loading="lazy" />
                    {/* marcador/ícone opcional no canto */}
                    <button
                      className="track-pin"
                      aria-label="Salvar trilha"
                      title="Salvar trilha"
                      onClick={() => console.log("pin", t.id)}
                    >
                      🔖
                    </button>
                  </div>

                  <div className="track-body">
                    <div className="track-rating" aria-label={`Avaliação ${t.rating ?? 0} de 5`}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={idx < (t.rating ?? 0) ? "star filled" : "star"}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <h3 className="track-title">{t.name}</h3>

                    <div className="track-author">
                      <div className="avatar">PR</div>
                      <span>By {t.author ?? "Projeto Rota"}</span>
                    </div>
                  </div>

                  <div className="track-footer">
                    <button
                      className="track-btn"
                      onClick={() => handleMatricular(t.id)}
                    >
                      {t.botaoLabel ?? "Matricular-se no Curso"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
