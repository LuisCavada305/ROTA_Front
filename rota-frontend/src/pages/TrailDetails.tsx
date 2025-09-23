import Layout from "../components/Layout";
import "../styles/TrailDetails.css";
import { http } from "../lib/http";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

type SectionItem = {
  id: number;
  title: string;
  duration_seconds?: number | null;
};

type Section = {
  id: number;
  title: string;
  order_index?: number;
  items: SectionItem[];
};

type TrailCore = {
  id: number;
  name: string;                // no back está "name"; no front eu exponho como "title"
  thumbnail_url: string;
  description?: string | null;
  author?: string | null;
  category?: string | null;
};

type TextValRow = { text_val: string };

type Progress = {
  done: number;
  total: number;
  nextAction?: string;
  enrolledAt?: string; // ISO
  pct?: number;        // calculado/fallback
};

function secondsToMMSS(total?: number | null) {
  if (!total || total <= 0) return undefined;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TrailDetails() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // "View model" final que a UI consome
  const [vm, setVm] = useState<{
    id: number;
    title: string;
    category: string;
    thumbnail_url: string;
    description: string;
    learn: string[];         // você pode usar para “O que você aprenderá?” ou esconder se vier vazio
    sections: Section[];
    instructor: { name: string; initials: string };
    includes: string[];
    requirements: string[];
    audience: string[];
    progress: Progress;
    nextLessonDate?: string; // dd/mm/aaaa (apenas exibição)
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      if (!id) return;
      setLoading(true);
      setErr(null);

      try {
        // 1) núcleo da trilha
        const pCore = http.get<TrailCore>(`/trails/${id}`).then(r => r.data);

        // 2) sections + items (tente o “com itens”, se 404 cai para /sections e depois busca items por seção)
        const pSectionsWithItems = http
          .get<Section[]>(`/trails/${id}/sections-with-items`)
          .then(r => r.data)
          .catch(async () => {
            // fallback: busca só sections e, em seguida, items por seção
            const secs = await http.get<Omit<Section, "items">[]>(`/trails/${id}/sections`).then(r => r.data);
            const itemsBySec = await Promise.all(
              secs.map(sec =>
                http
                  .get<SectionItem[]>(`/trails/${id}/sections/${sec.id}/items`)
                  .then(r => ({ ...sec, items: r.data }))
                  .catch(() => ({ ...sec, items: [] }))
              )
            );
            return itemsBySec;
          });

        // 3) listas (podem existir ou não)
        const pIncluded = http
          .get<TextValRow[]>(`/trails/${id}/included-items`)
          .then(r => r.data.map(x => x.text_val))
          .catch(() => [] as string[]);

        const pReqs = http
          .get<TextValRow[]>(`/trails/${id}/requirements`)
          .then(r => r.data.map(x => x.text_val))
          .catch(() => [] as string[]);

        const pAudience = http
          .get<TextValRow[]>(`/trails/${id}/audience`)
          .then(r => r.data.map(x => x.text_val))
          .catch(() => [] as string[]);

        // 4) progresso do usuário nessa trilha
        const pProgress = http
          .get<Partial<Progress> & { computed_progress_percent?: number; started_at?: string }>(
            `/user-trails/${id}/progress`
          )
          .then(r => r.data as Partial<Progress> & { computed_progress_percent?: number; started_at?: string })
          .catch(() => ({} as Partial<Progress> & { computed_progress_percent?: number; started_at?: string }));

        // 5) pegar “aprendizados” (se existir; senão usamos vazio)
        const pLearn = http
          .get<TextValRow[]>(`/trails/${id}/learn`) // se você criar essa rota
          .then(r => r.data.map(x => x.text_val))
          .catch(() => [] as string[]);

        const [core, sections, includes, reqs, audience, progressRaw, learn] = await Promise.all([
          pCore,
          pSectionsWithItems,
          pIncluded,
          pReqs,
          pAudience,
          pProgress,
          pLearn,
        ]);

        // Normalizações e fallbacks
        const title = core.name ?? "Trilha";
        const category = core.category ?? "Curso";
        const description = core.description ?? "";
        const instructorName = core.author || "Projeto Rota";
        const initials =
          instructorName
            .split(" ")
            .map(s => s[0])
            .filter(Boolean)
            .join("")
            .slice(0, 2)
            .toUpperCase() || "PR";

        // Ordena sections e items
        const orderedSections = [...sections]
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(sec => ({
            ...sec,
            items: [...(sec.items || [])].sort((a, b) => (a.title || "").localeCompare(b.title || "")),
          }));

        // Progress fallback
        const done = typeof progressRaw?.done === "number" ? progressRaw.done : 0;
        // total pode vir do back; se não vier, calculamos com base no total de items
        const total =
          typeof progressRaw?.total === "number"
            ? progressRaw.total
            : orderedSections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
        const pctFromBack =
          typeof progressRaw?.computed_progress_percent === "number"
            ? Math.round(progressRaw.computed_progress_percent)
            : undefined;
        const pctCalc =
          total > 0 ? Math.round((done / total) * 100) : pctFromBack ?? 0;

        const progress: Progress = {
          done,
          total,
          nextAction: progressRaw?.nextAction || (done > 0 ? "Continue a Estudar" : "Começar"),
          enrolledAt: progressRaw?.enrolledAt || progressRaw?.started_at,
          pct: pctFromBack ?? pctCalc,
        };

        const nextLessonDate = progress.enrolledAt
          ? new Date(progress.enrolledAt).toLocaleDateString("pt-BR")
          : undefined;

        const vmBuilt = {
          id: core.id,
          title,
          category,
          thumbnail_url: core.thumbnail_url,
          description,
          learn,
          sections: orderedSections,
          instructor: { name: instructorName, initials },
          includes,
          requirements: reqs,
          audience,
          progress,
          nextLessonDate,
        };

        if (mounted) setVm(vmBuilt);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Erro ao carregar a trilha");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [id]);

  const pct = useMemo(() => vm?.progress?.pct ?? 0, [vm]);

  if (loading) {
    return (
      <Layout>
        <section className="trail"><div className="trail__container"><div className="skeleton">Carregando trilha…</div></div></section>
      </Layout>
    );
  }

  if (err || !vm) {
    return (
      <Layout>
        <section className="trail">
          <div className="trail__container">
            <div className="error">
              {err ?? "Não foi possível carregar a trilha."}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="trail">
        <div className="trail__container">
          <header className="trail-header">
            <div>
              <h1 className="trail-title">{vm.title}</h1>
              <div className="trail-meta">
                <span className="trail-meta__label">Categoria: </span>
                <span className="trail-meta__value">{vm.category}</span>
              </div>
            </div>
            <div className="trail-actions">
              <button className="btn btn-ghost">Compartilhar</button>
            </div>
          </header>

          <div className="trail-grid">
            <main className="trail-main">
              <div className="trail-cover">
                <img src={vm.thumbnail_url} alt={vm.title} />
              </div>

              {vm.description && (
                <section className="trail-about card">
                  <h2 className="section-title">Sobre o curso</h2>
                  <p className="section-text">{vm.description}</p>
                </section>
              )}

              {vm.learn?.length > 0 && (
                <section className="trail-learn card">
                  <h3 className="section-title">O que você aprenderá?</h3>
                  <ul className="bullets">
                    {vm.learn.map((li, i) => (
                      <li key={i}>{li}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="trail-content card">
                <h3 className="section-title">Conteúdo do curso</h3>
                <div className="accordion">
                  {vm.sections.map((sec, idx) => (
                    <details key={sec.id} className="accordion__item" open={idx === 0}>
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
                              <li key={it.id} className="content-list__item">
                                <span className="content-list__icon">●</span>
                                <span className="content-list__title">{it.title}</span>
                                {secondsToMMSS(it.duration_seconds) && (
                                  <span className="content-list__duration">{secondsToMMSS(it.duration_seconds)}</span>
                                )}
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
                    <img
                      src="https://preview.tutorlms.com/certificate-templates/default/preview.png"
                      alt="Modelo de certificado"
                    />
                  </div>
                </div>
              </section>
            </main>

            <aside className="trail-aside">
              <div className="card trail-progress">
                <div className="progress-row">
                  <div className="progress-text">
                    <div className="progress-count">
                      {vm.progress.done}/{vm.progress.total}
                    </div>
                    <div className="progress-label">{pct}% Completo</div>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <Link
                  to={`/trilha/${vm.id}/aula/${vm.sections[0]?.items[0]?.id ?? ""}`}
                  className="btn btn-primary btn-block"
                >
                  {vm.progress.nextAction ?? "Continuar"}
                </Link>
                <ul className="mini-list">
                  <li>Conclua todas as lições para marcar este curso como concluído</li>
                  {vm.nextLessonDate && (
                    <li>
                      Você se matriculou no curso em <strong>{vm.nextLessonDate}</strong>
                    </li>
                  )}
                </ul>
                <div className="divider" />
                <div className="mini-list__item">🏅 Certificado de conclusão</div>
              </div>

              <div className="card instructor">
                <h4 className="card-title">Um curso de</h4>
                <div className="instructor-row">
                  <div className="avatar">{vm.instructor.initials}</div>
                  <div className="instructor-name">{vm.instructor.name}</div>
                </div>
              </div>

              {vm.includes?.length > 0 && (
                <div className="card">
                  <h4 className="card-title">Materiais inclusos</h4>
                  <ul className="tick-list">
                    {vm.includes.map((s, i) => (
                      <li key={`${s}-${i}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {vm.requirements?.length > 0 && (
                <div className="card">
                  <h4 className="card-title">Requisitos</h4>
                  <ul className="dot-list">
                    {vm.requirements.map((s, i) => (
                      <li key={`${s}-${i}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {vm.audience?.length > 0 && (
                <div className="card">
                  <h4 className="card-title">Público</h4>
                  <ul className="dot-list">
                    {vm.audience.map((s, i) => (
                      <li key={`${s}-${i}`}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
