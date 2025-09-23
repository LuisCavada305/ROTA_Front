import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { http } from "../lib/http";
import "../styles/Trail.css";
import Layout from "../components/Layout";

/** ===== Tipos vindos do seu back ===== */
type Item = {
  id: number;
  title: string;
  duration_seconds?: number | null;
  order_index?: number | null;
  type?: string | null; // "VIDEO" | "QUIZ" | "PDF" etc.
};

type Section = {
  id: number;
  title: string;
  order_index?: number | null;
  items: Item[];
};

type ProgressTotal = {
  done: number;
  total: number;
  computed_progress_percent?: number | null;
  nextAction?: string | null;
  enrolledAt?: string | null;
};

/** ===== Detalhe de item (novo GET no back) ===== */
type ItemDetail = {
  id: number;
  trail_id: number;
  section_id: number;
  title: string;
  youtubeId: string;           // só o ID (ex.: "T7BCv5BKrls")
  duration_seconds: number;    // 572 no exemplo
  required_percentage: number; // default 70
  description_html: string;    // "Sobre a Aula..." em HTML
  prev_item_id?: number | null;
  next_item_id?: number | null;
};

function YouTubePlayer({
  videoId,
  startAt = 0,
  onProgress,
  onReady,
}: {
  videoId: string;
  startAt?: number;
  onProgress?: (t: { current: number; duration: number }) => void;
  onReady?: (t: { current: number; duration: number }) => void;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hover, setHover] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);

  // velocidade / taxas válidas
  const [speed, setSpeed] = useState(1);
  const [rates, setRates] = useState<number[]>([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);

  // fullscreen
  const [isFs, setIsFs] = useState(false);

  const onProgressRef = useRef(onProgress);
  const onReadyRef = useRef(onReady);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // carrega API uma vez
  useEffect(() => {
    const w = window as any;
    if (!w.__ytApiPromise) {
      w.__ytApiPromise = new Promise<void>((resolve) => {
        if (!document.getElementById("yt-iframe-api")) {
          const s = document.createElement("script");
          s.id = "yt-iframe-api";
          s.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(s);
        }
        const prev = w.onYouTubeIframeAPIReady;
        w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
        const tick = () => (w.YT?.Player ? resolve() : setTimeout(tick, 50));
        tick();
      });
    }
  }, []);

  // cria/atualiza player
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const w = (window as any);
      await w.__ytApiPromise;
      if (cancelled || !containerRef.current) return;

      const poll = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          try {
            const d = playerRef.current?.getDuration?.() ?? 0;
            const c = playerRef.current?.getCurrentTime?.() ?? 0;
            setDuration(d); setCurrent(c);
            if (d > 0) onProgressRef.current?.({ current: c, duration: d });
          } catch {}
        }, 500);
      };

      const start = Math.floor(startAt || 0);

      if (playerRef.current) {
        try {
          playerRef.current.loadVideoById({ videoId, startSeconds: start });
          playerRef.current.pauseVideo();
          setIsPlaying(false);
          poll();
        } catch {}
        return;
      }

      playerRef.current = new w.YT.Player(containerRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
            // **visual**
            controls: 0,           // sem barra/controles do YT
            modestbranding: 1,     // reduz marca do YT
            rel: 0,                // relacionados só do mesmo canal
            iv_load_policy: 3,     // sem cards/annotations
            fs: 0,                 // sem botão de fullscreen do YT
            disablekb: 1,          // desativa atalhos do YT
            // **comportamento**
            playsinline: 1,        // evita full no iOS
            // **API/segurança**
            enablejsapi: 1,
            origin: window.location.origin, // importante pra API
            // OBS: showinfo é legacy/ignorado --> remova
            showinfo: 0,          // sem título do vídeo no início
        },
        events: {
          onReady: () => {
            const p = playerRef.current;
            const d = p?.getDuration?.() ?? 0;
            const c = p?.getCurrentTime?.() ?? 0;
            setDuration(d); setCurrent(c);
            setVolume(p?.getVolume?.() ?? 100);
            setMuted(p?.isMuted?.() ?? false);

            // taxas disponíveis
            try {
              const avail = p?.getAvailablePlaybackRates?.() ?? [];
              if (avail.length) {
                setRates(avail as number[]);
                // garante que a velocidade inicial é válida
                const initial = avail.includes(speed) ? speed : 1;
                p.setPlaybackRate?.(initial);
                setSpeed(initial);
              } else {
                p.setPlaybackRate?.(1);
                setSpeed(1);
              }
            } catch {}

            onReadyRef.current?.({ current: c, duration: d });
            poll();
          },
          onStateChange: (e: any) => {
            if (e?.data === 0) {
              // terminou: evita relateds
              try { playerRef.current.seekTo(0, true); playerRef.current.pauseVideo(); } catch {}
                setIsPlaying(false);
                playerRef.current.seekTo(Math.max(0, duration - 0.25), true);
                playerRef.current.pauseVideo();
                playerRef.current.seekTo(0, true);
            } else {
              setIsPlaying(e?.data === 1);
            }
          },
        },
      });
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [videoId, startAt]);

  // ======== Controles ========
  const togglePlay = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleSeek = (value: number) => {
    if (!playerRef.current) return;
    const t = Math.max(0, Math.min(value, duration || 0));
    playerRef.current.seekTo(t, true);
    setCurrent(t);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) { playerRef.current.unMute(); setMuted(false); }
    else { playerRef.current.mute(); setMuted(true); }
  };

  const changeVolume = (v: number) => {
    if (!playerRef.current) return;
    const vv = Math.max(0, Math.min(100, v));
    playerRef.current.setVolume(vv);
    setVolume(vv);
    if (vv === 0 && !muted) setMuted(true);
    if (vv > 0 && muted) setMuted(false);
  };

  const changeSpeed = (val: number) => {
    if (!playerRef.current) return;
    // pega taxa suportada mais próxima
    const sorted = [...rates].sort((a,b)=>Math.abs(a-val)-Math.abs(b-val));
    const target = sorted[0] ?? 1;
    try {
      playerRef.current.setPlaybackRate(target);
      // confirma (alguns vídeos demoram 1 tick pra aplicar)
      setTimeout(() => {
        const applied = playerRef.current?.getPlaybackRate?.();
        if (applied !== target) playerRef.current?.setPlaybackRate?.(target);
      }, 50);
      setSpeed(target);
    } catch {
      setSpeed(1);
      try { playerRef.current.setPlaybackRate(1); } catch {}
    }
  };

  // fullscreen: toggle no wrapper
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    const el: any = surfaceRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      req?.call(el);
    } else {
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
      exit?.call(document);
    }
  };

  // ======== Helpers ========
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const fmt = (sec: number) => {
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };
  const pct = duration ? (current / duration) * 100 : 0;
  const showOverlay = !isPlaying || hover;

  return (
    <div
      className="custom-player"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={() => setHover(true)}
    >
      <div
        ref={surfaceRef}
        className="ratio-16x9 player-surface"
        onClick={togglePlay}
      >
        <div ref={containerRef} className="ratio-fill iframe-layer" />

        {/* Play central */}
        <button
          className={`cp-center-play ${!isPlaying ? "show" : ""}`}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          aria-label="Reproduzir/Pausar"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Barra inferior */}
        <div className={`cp-bottom ${showOverlay ? "show" : ""}`} onClick={(e) => e.stopPropagation()}>
          {/* play/pause */}
          <button className="cp-btn" onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* seek */}
          <input
            className="cp-seek"
            type="range"
            min={0}
            max={Math.max(0, Math.floor(duration || 0))}
            value={Math.floor(current || 0)}
            onChange={(e) => handleSeek(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.95) ${pct}%, rgba(255,255,255,0.25) ${pct}%)`
            }}
            aria-label="Progresso"
          />

          {/* tempo restante */}
          <div className="cp-time">-{fmt(Math.max(0, (duration || 0) - (current || 0)))}</div>

          {/* volume */}
          <button className="cp-icon" onClick={toggleMute} aria-label={muted ? "Desmutar" : "Mutar"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="currentColor" opacity={muted ? 0.4 : 1}/>
              {!muted && <path d="M16 8c1.5 1 1.5 7 0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}
            </svg>
          </button>
          <input
            className="cp-volume"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label="Volume"
          />

          {/* velocidade */}
          <select
            className="cp-speed"
            value={speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            aria-label="Velocidade"
          >
            {rates.map(v => <option key={v} value={v}>{v}×</option>)}
          </select>

          {/* fullscreen na direita */}
          <button className="cp-btn cp-full" onClick={toggleFullscreen} aria-label={isFs ? "Sair de tela cheia" : "Tela cheia"}>
            {isFs ? "🡽" : "⛶"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Trail() {
  const { trailId, itemId } = useParams<{ trailId: string; itemId: string }>();
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState<ProgressTotal | null>(null);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [watch, setWatch] = useState({ current: 0, duration: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
// quais sections estão abertas (expandidas)
const [openSections, setOpenSections] = useState<Set<number>>(new Set());

// abre a seção da aula atual ao carregar/trocar de item
useEffect(() => {
  const secWithCurrent = sections.find((s) =>
    s.items.some((i) => String(i.id) === itemId)
  )?.id;
  if (secWithCurrent) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(secWithCurrent);
      return next;
    });
  }
}, [sections, itemId]);

function toggleSection(id: number) {
  setOpenSections((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

  // % assistido (local; o back guarda progress_value)
  const pct = useMemo(
    () => (watch.duration ? Math.min(100, (watch.current / watch.duration) * 100) : 0),
    [watch]
  );
  const canComplete = useMemo(
    () => !!detail && pct >= (detail.required_percentage ?? 70),
    [detail, pct]
  );

  // carrega sidebar + progresso + detalhe atual
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [secsRes, progRes, detRes] = await Promise.all([
          http.get<Section[]>(`/trails/${trailId}/sections-with-items`),
          http.get<ProgressTotal>(`/user-trails/${trailId}/progress`),
          http.get<ItemDetail>(`/trails/${trailId}/items/${itemId}`),
        ]);

        if (!mounted) return;

        setSections(secsRes.data);
        setProgress(progRes.data);
        setDetail(detRes.data);

        setWatch({
          current: 0,
          duration: detRes.data.duration_seconds || 0,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [trailId, itemId]);

  // salva progresso a cada 5s (PUT)
  useEffect(() => {
    if (!detail) return;
    const id = window.setTimeout(async () => {
      try {
        setSaving(true);
        await http.put(`/trails/${trailId}/items/${detail.id}/progress`, {
          status: canComplete ? "COMPLETED" : "IN_PROGRESS",
          progress_value: Math.floor(watch.current), // segundos
        });
      } catch {} finally {
        setSaving(false);
      }
    }, 5000);
    return () => clearTimeout(id);
  }, [watch.current, canComplete, trailId, detail]);

  if (loading || !detail || !progress) {
    return <div className="lesson-page loading">Carregando…</div>;
  }

  return (
    <Layout>
    <div className="lesson-page">
      {/* Sidebar */}
      <aside className="lesson-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">Conteúdo do curso</span>
        </div>

{sections.map((s) => {
  const isActive = s.items.some((i) => String(i.id) === itemId);
  const isOpen = openSections.has(s.id);

  return (
    <div key={s.id} className={`topic ${isActive ? "is-active" : ""}`}>
      <button
        type="button"
        className="topic-header"
        onClick={() => toggleSection(s.id)}
        aria-expanded={isOpen}
        aria-controls={`topic-body-${s.id}`}
      >
        <div className="topic-title">
          {s.title}
        </div>
        <div className="topic-summary">
          {s.items.filter(i => i.type === "VIDEO").length
            ? `${s.items.filter(i => i.type === "VIDEO").length} vídeos`
            : `${s.items.length} itens`}
        </div>
        <span className={`topic-caret ${isOpen ? "open" : ""}`} aria-hidden="true">▾</span>
      </button>

      <div
        id={`topic-body-${s.id}`}
        className={`topic-body ${isOpen ? "open" : ""}`}
      >
        {s.items.map((i) => (
          <Link
            key={i.id}
            to={`/trilha/${trailId}/aula/${i.id}`}
            className={`topic-item ${String(i.id) === itemId ? "is-active" : ""}`}
          >
            <div className="left">
              <span className={`item-icon ${i.type === "QUIZ" ? "tutor-icon-quiz-o" : i.type === "PDF" ? "tutor-icon-document-text" : "tutor-icon-brand-youtube-bold"}`} />
              <span className="item-title">{i.title}</span>
            </div>
            <div className="right">
              {typeof i.duration_seconds === "number" && i.type !== "QUIZ" && (
                <span className="item-duration">{fmtDuration(i.duration_seconds)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
})}

      </aside>

      {/* Main */}
      <main className="lesson-main">
        <div className="topbar">
          <div className="crumb-title">Trilha de Sustentabilidade</div>

          <div className="progress-wrap">
            <span className="muted">Seu Progresso:</span>
            <span className="strong">{progress.done}</span>
            <span className="muted">de</span>
            <span className="strong">{progress.total}</span>
            <span className="muted">
              ({Math.round(progress.computed_progress_percent || 0)}%)
            </span>
          </div>

          <button
            className="btn btn-primary mark-complete"
            disabled={!canComplete || saving}
            onClick={async () => {
              try {
                setSaving(true);
                await http.put(`/trails/${trailId}/items/${detail.id}/progress`, {
                  status: "COMPLETED",
                  progress_value: Math.floor(watch.current),
                });
                const p = await http.get<ProgressTotal>(`/user-trails/${trailId}/progress`);
                setProgress(p.data);
              } finally {
                setSaving(false);
              }
            }}
            title={canComplete ? "Marcar como concluído" : `Assista pelo menos ${detail.required_percentage}%`}
          >
            {saving ? "Salvando…" : "Marcar como concluído"}
          </button>

          <button className="btn btn-icon close" onClick={() => navigate(`/trilhas/${trailId}`)}>
            ✕
          </button>
        </div>

        <div className="video-wrapper">

          <YouTubePlayer
            videoId={detail.youtubeId}
            startAt={0}
            onReady={({ current, duration }) => setWatch({ current, duration })}
            onProgress={({ current, duration }) => setWatch({ current, duration })}
          />
        </div>

        <section className="lesson-about">
          <h3>Sobre a Aula</h3>
          <div className="about-html" dangerouslySetInnerHTML={{ __html: detail.description_html }} />
        </section>

        <footer className="lesson-footer">
          <div className="footer-left">
            {detail.prev_item_id ? (
              <Link className="btn btn-secondary btn-sm" to={`/trilha/${trailId}/aula/${detail.prev_item_id}`}>
                <span className="icon-previous" />
                <span>Anterior</span>
              </Link>
            ) : (
              <span />
            )}
          </div>
          <div className="footer-right">
            {detail.next_item_id ? (
              <Link className="btn btn-secondary btn-sm" to={`/trilha/${trailId}/aula/${detail.next_item_id}`}>
                <span>Próximo</span>
                <span className="icon-next" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </footer>
      </main>
    </div>
    </Layout>
  );
}

/** helpers */
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmtDuration(sec: number) {
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
