import Layout from "../components/Layout";
import "../styles/TrailDetails.css";
import { http } from "../lib/http";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function trailDetails() {
  const { id } = useParams<{ id: string }>();

  const trail = {
    id: 580,
    title: "Trilha de Sustentabilidade",
    category: "Projeto Rota",
    thumbnail_url: "data:image/jpeg;base64,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",
    description:
      "Este curso introdutório oferece uma formação abrangente em ESG (Environmental, Social e Governança – Ambiental, Social e Governança), proporcionando conhecimentos essenciais e habilidades práticas valorizadas no mercado de trabalho contemporâneo.",
    learn: [
      "Compreender os fundamentos de ESG e sua relevância no contexto atual de negócios",
      "Analisar questões sociais no ambiente corporativo e comunitário",
      "Aplicar conceitos de ESG em situações reais do mercado de trabalho",
      "Identificar desafios ambientais e desenvolver soluções práticas e viáveis",
      "Reconhecer princípios de boa governança e ética profissional",
    ],
    sections: [
      { title: "Acadêmico", items: [{ title: "Introdução ao ESG", duration: "06:30" }] },
      { title: "Empresas", items: [] },
      { title: "Profissional", items: [] },
      { title: "Exercícios", items: [] },
      { title: "Materiais", items: [] },
      { title: "Mapa Mental", items: [] },
    ],
    instructor: { name: "Projeto Rota", initials: "PR" },
    includes: ["Aulas gravadas", "Questionários", "PDF's"],
    requirements: ["Ensino Médio"],
    audience: ["Estudantes de Ensino Médio", "Pessoas interessadas em se inserir no mercado de trabalho"],
    progress: { done: 3, total: 8, nextAction: "Continue a Estudar" },
    nextLessonDate: "06/09/2025",
  };

  const pct = Math.round((trail.progress.done / trail.progress.total) * 100);

  const [trailDetails, setTrailDetails] = useState<any>(null);

  async function getTrailDetails() {
    const response = await http.get(`/trails/${id}`);
    return response.data;
  }

  useEffect(() => {
    getTrailDetails().then((data) => {
      console.log(data);
      setTrailDetails(data);
    });
  }, []);

  return (
    <Layout>
      <section className="trail">
        <div className="trail__container">
          <header className="trail-header">
            <div>
              <h1 className="trail-title">{trail.title}</h1>
              <div className="trail-meta">
                <span className="trail-meta__label">Categoria: </span>
                <span className="trail-meta__value">{trail.category}</span>
              </div>
            </div>
            <div className="trail-actions">
              <button className="btn btn-ghost">Compartilhar</button>
            </div>
          </header>

          <div className="trail-grid">
            <main className="trail-main">
              <div className="trail-cover">
                <img src={trail.thumbnail_url} alt={trail.title} />
              </div>

              <section className="trail-about card">
                <h2 className="section-title">Sobre o curso</h2>
                <p className="section-text">{trail.description}</p>
              </section>

              <section className="trail-learn card">
                <h3 className="section-title">O que você aprenderá?</h3>
                <ul className="bullets">
                  {trail.learn.map((li, i) => (
                    <li key={i}>{li}</li>
                  ))}
                </ul>
              </section>

              <section className="trail-content card">
                <h3 className="section-title">Conteúdo do curso</h3>
                <div className="accordion">
                  {trail.sections.map((sec, idx) => (
                    <details key={sec.title} className="accordion__item" open={idx === 0}>
                      <summary className="accordion__summary">
                        <span>{sec.title}</span>
                        <span className="accordion__chev">▾</span>
                      </summary>
                      <div className="accordion__panel">
                        {sec.items.length === 0 ? (
                          <div className="empty">Sem aulas adicionadas ainda.</div>
                        ) : (
                          <ul className="content-list">
                            {sec.items.map((it) => (
                              <li key={it.title} className="content-list__item">
                                <span className="content-list__icon">●</span>
                                <span className="content-list__title">{it.title}</span>
                                {it.duration && <span className="content-list__duration">{it.duration}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              <section className="trail-cert card">
                <div className="cert-grid">
                  <div>
                    <h3 className="section-title">Receba um certificado</h3>
                    <p>Adicione este certificado ao seu currículo para demonstrar suas habilidades!</p>
                  </div>
                  <div className="cert-img">
                    <img src="https://preview.tutorlms.com/certificate-templates/default/preview.png" alt="Modelo de certificado" />
                  </div>
                </div>
              </section>
            </main>

            <aside className="trail-aside">
              <div className="card trail-progress">
                <div className="progress-row">
                  <div className="progress-text">
                    <div className="progress-count">{trail.progress.done}/{trail.progress.total}</div>
                    <div className="progress-label">{pct}% Completo</div>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button className="btn btn-primary btn-block">{trail.progress.nextAction}</button>
                <ul className="mini-list">
                  <li>Conclua todas as lições para marcar este curso como concluído</li>
                  <li>Você se matriculou no curso em <strong>{trail.nextLessonDate}</strong></li>
                </ul>
                <div className="divider" />
                <div className="mini-list__item">🏅 Certificado de conclusão</div>
              </div>

              <div className="card instructor">
                <h4 className="card-title">Um curso de</h4>
                <div className="instructor-row">
                  <div className="avatar">{trail.instructor.initials}</div>
                  <div className="instructor-name">{trail.instructor.name}</div>
                </div>
              </div>

              <div className="card">
                <h4 className="card-title">Materiais inclusos</h4>
                <ul className="tick-list">
                  {trail.includes.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h4 className="card-title">Requisitos</h4>
                <ul className="dot-list">
                  {trail.requirements.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h4 className="card-title">Público</h4>
                <ul className="dot-list">
                  {trail.audience.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}