import { useEffect, useMemo, useState } from 'react';
import '../styles/Home.css';
import type { Trilha } from "../types/Trilha";
import { http } from "../lib/http";
import Layout from '../components/Layout';
import { Link } from 'lucide-react';

const PAGE_SIZE = 8;

export default function Trails() {
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [loadingTrilhas, setLoadingTrilhas] = useState(true);
  const [erroTrilhas, setErroTrilhas] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function getTrilhas() {
    // espera que o back responda { trails: Trilha[] }
    const response = await http.get("/trails/");
    return response.data.trails as Trilha[];
  }

  function handleMatricular(id: string) {
    // http.post("/matriculas", { trilhaId: id });
    alert(`Matricular-se na trilha ${id} (implementar chamada)`);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoadingTrilhas(true);
        const data = await getTrilhas();
        setTrilhas(data ?? []);
        setErroTrilhas(null);
        setPage(1); // volta para a primeira página ao carregar/atualizar
      } catch (e: any) {
        setErroTrilhas(e?.detail || "Erro ao buscar trilhas.");
      } finally {
        setLoadingTrilhas(false);
      }
    })();
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(trilhas.length / PAGE_SIZE)),
    [trilhas.length]
  );

  // Garante que a página atual sempre seja válida se a lista mudar
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return trilhas.slice(start, start + PAGE_SIZE);
  }, [trilhas, page]);

  function goToPage(p: number) {
    const bounded = Math.min(Math.max(1, p), totalPages);
    setPage(bounded);
    // opcional: rolar a lista para o topo
    // document.querySelector('.tracks-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // helper para montar lista de páginas (com elipses simples)
  function getPageList() {
    const pages: (number | '…')[] = [];
    const maxNumbers = 5; // quantos números mostrar no meio

    if (totalPages <= maxNumbers + 2) {
      // pequeno: mostra todas
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const left = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);

    pages.push(1);
    if (left > 2) pages.push('…');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('…');
    pages.push(totalPages);

    return pages;
  }

  return (
    <Layout>
    <div>
      {loadingTrilhas && <p className="tracks-loading">Carregando trilhas…</p>}

      {erroTrilhas && !loadingTrilhas && (
        <div className="tracks-error" role="alert">
          {erroTrilhas}
        </div>
      )}

      {!loadingTrilhas && !erroTrilhas && trilhas.length === 0 && (
        <p className="tracks-empty">Nenhuma trilha disponível.</p>
      )}

      {!loadingTrilhas && !erroTrilhas && trilhas.length > 0 && (
        <>
          <div className="tracks-grid" style={{ paddingTop: 50 }}>
            {pageItems.map((t) => (
              <article key={t.id} className="track-card">
              <div className="track-cover">
                <a href={`/trail-details/${t.id}`}>
                  <img src={t.thumbnail_url} alt={t.name} loading="lazy" />
                </a>
              </div>
                <div className="track-body">
                  <div className="track-rating" aria-label={`Avaliação ${t.review ?? 0} de 5`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={idx < (t.review ?? 0) ? "star filled" : "star"}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <h3 className="track-title">{t.name}</h3>
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

          {/* Controles de paginação */}
          {totalPages > 1 && (
            <nav className="tracks-pagination" role="navigation" aria-label="Paginação de trilhas">
              <button
                className="page-btn"
                onClick={() => goToPage(1)}
                disabled={page === 1}
                aria-label="Primeira página"
              >
                «
              </button>
              <button
                className="page-btn"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Página anterior"
              >
                ‹
              </button>

              <ul className="page-list">
                {getPageList().map((p, idx) =>
                  p === '…' ? (
                    <li key={`ellipsis-${idx}`} className="page-ellipsis" aria-hidden>
                      …
                    </li>
                  ) : (
                    <li key={p}>
                      <button
                        className={`page-number ${p === page ? 'is-current' : ''}`}
                        onClick={() => goToPage(p)}
                        aria-current={p === page ? 'page' : undefined}
                        aria-label={`Ir para página ${p}`}
                      >
                        {p}
                      </button>
                    </li>
                  )
                )}
              </ul>

              <button
                className="page-btn"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Próxima página"
              >
                ›
              </button>
              <button
                className="page-btn"
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
                aria-label="Última página"
              >
                »
              </button>

              <span className="page-status" aria-live="polite">
                Página {page} de {totalPages}
              </span>
            </nav>
          )}
        </>
      )}
    </div>
    </Layout>
  );
}
