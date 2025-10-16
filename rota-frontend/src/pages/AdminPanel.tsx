import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { http } from "../lib/http";
import "../styles/AdminPanel.css";

type DashboardSummary = {
  total_users: number;
  total_trails: number;
  total_enrollments: number;
  total_certificates: number;
};

type DashboardData = {
  summary: DashboardSummary;
  enrollment_by_status: Record<string, number>;
  recent_trails: Array<{
    id: number;
    name: string;
    created_date: string | null;
    sections: number;
    items: number;
  }>;
  recent_certificates: Array<{
    id: number;
    issued_at: string;
    user: string;
    trail: string;
  }>;
  top_trails: Array<{
    id: number;
    name: string;
    enrollments: number;
    completed: number;
  }>;
};

type ItemTypeOption = { code: string; label: string };

type DraftItem = {
  id: string;
  title: string;
  type: string;
  content: string;
  duration: string;
  requiresCompletion: boolean;
};

type DraftSection = {
  id: string;
  title: string;
  items: DraftItem[];
};

const DEFAULT_ITEM_TYPES: ItemTypeOption[] = [
  { code: "VIDEO", label: "Vídeo" },
  { code: "DOC", label: "Documento" },
  { code: "FORM", label: "Formulário" },
];

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function normalizeError(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const maybeAxios = err as { response?: { data?: any } };
    const detail = maybeAxios.response?.data?.detail;
    if (Array.isArray(detail) && detail.length && detail[0]?.msg) {
      return String(detail[0].msg);
    }
    if (typeof detail === "string") {
      return detail;
    }
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  return "Não foi possível completar a operação.";
}

function createEmptySection(): DraftSection {
  return {
    id: randomId(),
    title: "",
    items: [],
  };
}

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "builder">("dashboard");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [itemTypes, setItemTypes] = useState<ItemTypeOption[]>([]);

  const [name, setName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<DraftSection[]>([createEmptySection()]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const isAdmin = user?.role === "Admin";
  const availableItemTypes = useMemo(
    () => (itemTypes.length ? itemTypes : DEFAULT_ITEM_TYPES),
    [itemTypes]
  );

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    let cancelled = false;
    const loadItemTypes = async () => {
      try {
        const { data } = await http.get<{ item_types: ItemTypeOption[] }>("/admin/trails/item-types");
        if (!cancelled) {
          setItemTypes(data.item_types ?? []);
        }
      } catch {
        if (!cancelled) {
          setItemTypes([]);
        }
      }
    };
    void loadItemTypes();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    if (activeTab !== "dashboard") return;
    if (dashboardLoading || dashboardLoaded) return;
    let cancelled = false;
    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const { data } = await http.get<DashboardData>("/admin/dashboard");
        if (!cancelled) {
          setDashboard(data);
          setDashboardLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboardError(normalizeError(err));
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };
    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [activeTab, authLoading, dashboardLoaded, dashboardLoading, isAdmin]);

  const resetBuilder = () => {
    setName("");
    setThumbnailUrl("");
    setAuthor("");
    setDescription("");
    setSections([createEmptySection()]);
  };

  const addSection = () => {
    setSections((prev) => [...prev, createEmptySection()]);
  };

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setSections((prev) => {
      const index = prev.findIndex((section) => section.id === sectionId);
      if (index < 0) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [current] = next.splice(index, 1);
      next.splice(targetIndex, 0, current);
      return next;
    });
  };

  const updateSectionTitle = (sectionId: string, value: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, title: value } : section
      )
    );
  };

  const addItem = (sectionId: string) => {
    const defaultType = availableItemTypes[0]?.code ?? "VIDEO";
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: randomId(),
                  title: "",
                  type: defaultType,
                  content: "",
                  duration: "",
                  requiresCompletion: false,
                },
              ],
            }
          : section
      )
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    );
  };

  const moveItem = (sectionId: string, itemId: string, direction: -1 | 1) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.items.findIndex((item) => item.id === itemId);
        if (index < 0) return section;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= section.items.length) return section;
        const nextItems = [...section.items];
        const [current] = nextItems.splice(index, 1);
        nextItems.splice(targetIndex, 0, current);
        return { ...section, items: nextItems };
      })
    );
  };

  const updateItem = (
    sectionId: string,
    itemId: string,
    patch: Partial<Omit<DraftItem, "id">>
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const nextItems = section.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        );
        return { ...section, items: nextItems };
      })
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const trimmedName = name.trim();
    const trimmedThumbnail = thumbnailUrl.trim();

    if (!trimmedName) {
      setSaveError("Informe o nome da rota.");
      return;
    }
    if (!trimmedThumbnail) {
      setSaveError("Informe a URL da capa da rota.");
      return;
    }
    if (!sections.length) {
      setSaveError("Adicione pelo menos uma seção.");
      return;
    }

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const section = sections[sectionIndex];
      const sectionTitle = section.title.trim();
      if (!sectionTitle) {
        setSaveError(`Informe um título para a seção ${sectionIndex + 1}.`);
        return;
      }
      if (!section.items.length) {
        setSaveError(`Adicione pelo menos um item na seção ${sectionIndex + 1}.`);
        return;
      }
      for (let itemIndex = 0; itemIndex < section.items.length; itemIndex += 1) {
        const item = section.items[itemIndex];
        const itemTitle = item.title.trim();
        if (!itemTitle) {
          setSaveError(`Informe o título do item ${itemIndex + 1} na seção ${sectionIndex + 1}.`);
          return;
        }
        const itemContent = item.content.trim();
        if (!itemContent) {
          setSaveError(`Informe o conteúdo/URL do item ${itemIndex + 1} na seção ${sectionIndex + 1}.`);
          return;
        }
        if (item.duration) {
          const parsedDuration = Number(item.duration);
          if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
            setSaveError(`Informe uma duração válida para o item ${itemIndex + 1} na seção ${sectionIndex + 1}.`);
            return;
          }
        }
      }
    }

    const payload = {
      name: trimmedName,
      thumbnail_url: trimmedThumbnail,
      author: author.trim() || null,
      description: description.trim() || null,
      sections: sections.map((section, sectionIndex) => ({
        title: section.title.trim(),
        order_index: sectionIndex,
        items: section.items.map((item, itemIndex) => ({
          title: item.title.trim(),
          type: item.type,
          url: item.content.trim(),
          duration_seconds: item.duration ? Number(item.duration) : null,
          requires_completion: item.requiresCompletion,
          order_index: itemIndex,
        })),
      })),
    };

    setSaving(true);
    try {
      await http.post("/admin/trails", payload);
      setSaveSuccess("Rota criada com sucesso!");
      resetBuilder();
      setDashboardLoaded(false);
    } catch (err) {
      setSaveError(normalizeError(err));
    } finally {
      setSaving(false);
    }
  };

  const refreshDashboard = () => {
    setDashboardLoaded(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <section className="admin-panel">
          <div className="admin-feedback-card">Carregando…</div>
        </section>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <section className="admin-panel">
          <div className="admin-feedback-card is-error">
            <h2>Acesso restrito</h2>
            <p>Somente administradores podem acessar este painel.</p>
          </div>
        </section>
      </Layout>
    );
  }

  const statusEntries = Object.entries(dashboard?.enrollment_by_status ?? {});

  return (
    <Layout>
      <section className="admin-panel">
        <header className="admin-header">
          <h1>Painel Administrativo</h1>
          <p>Gerencie as rotas e acompanhe indicadores da plataforma.</p>
        </header>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${activeTab === "dashboard" ? "is-active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === "builder" ? "is-active" : ""}`}
            onClick={() => setActiveTab("builder")}
          >
            Criar rota
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <div className="admin-dashboard">
            <div className="admin-dashboard-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={refreshDashboard}
                disabled={dashboardLoading}
              >
                {dashboardLoading ? <Loader2 size={16} className="spin" /> : null}
                Atualizar
              </button>
            </div>
            {dashboardError ? (
              <div className="admin-alert is-error">{dashboardError}</div>
            ) : null}
            <div className="admin-summary-grid">
              <div className="admin-summary-card">
                <span>Total de usuários</span>
                <strong>{dashboard?.summary.total_users ?? 0}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Rotas publicadas</span>
                <strong>{dashboard?.summary.total_trails ?? 0}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Matrículas</span>
                <strong>{dashboard?.summary.total_enrollments ?? 0}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Certificados emitidos</span>
                <strong>{dashboard?.summary.total_certificates ?? 0}</strong>
              </div>
            </div>

            <div className="admin-grid">
              <section className="admin-card">
                <header>
                  <h2>Matrículas por status</h2>
                </header>
                {statusEntries.length ? (
                  <ul className="admin-status-list">
                    {statusEntries.map(([code, count]) => (
                      <li key={code}>
                        <span>{code}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-empty">Nenhuma matrícula registrada.</p>
                )}
              </section>

              <section className="admin-card">
                <header>
                  <h2>Top rotas por matrículas</h2>
                </header>
                {dashboard?.top_trails.length ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rota</th>
                        <th>Matrículas</th>
                        <th>Concluídas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.top_trails.map((trail) => (
                        <tr key={trail.id}>
                          <td>{trail.name}</td>
                          <td>{trail.enrollments}</td>
                          <td>{trail.completed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="admin-empty">Ainda não há dados suficientes.</p>
                )}
              </section>
            </div>

            <div className="admin-grid">
              <section className="admin-card">
                <header>
                  <h2>Rotas recentes</h2>
                </header>
                {dashboard?.recent_trails.length ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rota</th>
                        <th>Seções</th>
                        <th>Itens</th>
                        <th>Criada em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent_trails.map((trail) => (
                        <tr key={trail.id}>
                          <td>{trail.name}</td>
                          <td>{trail.sections}</td>
                          <td>{trail.items}</td>
                          <td>{trail.created_date ? new Date(trail.created_date).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="admin-empty">Nenhuma rota cadastrada ainda.</p>
                )}
              </section>

              <section className="admin-card">
                <header>
                  <h2>Últimos certificados</h2>
                </header>
                {dashboard?.recent_certificates.length ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Rota</th>
                        <th>Emitido em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent_certificates.map((cert) => (
                        <tr key={cert.id}>
                          <td>{cert.user}</td>
                          <td>{cert.trail}</td>
                          <td>{new Date(cert.issued_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="admin-empty">Nenhum certificado emitido.</p>
                )}
              </section>
            </div>
          </div>
        ) : (
          <form className="admin-builder" onSubmit={handleSubmit}>
            <section className="admin-card">
              <header>
                <h2>Informações básicas</h2>
                <p>Defina os principais dados da nova rota.</p>
              </header>
              <div className="admin-form-grid">
                <label>
                  <span>Nome da rota *</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: Trilha de Empreendedorismo"
                  />
                </label>
                <label>
                  <span>Autor</span>
                  <input
                    type="text"
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Nome do autor"
                  />
                </label>
                <label className="full">
                  <span>URL da imagem de capa *</span>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(event) => setThumbnailUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label className="full">
                  <span>Descrição</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Explique rapidamente o objetivo da rota."
                  ></textarea>
                </label>
              </div>
            </section>

            <section className="admin-card">
              <header className="admin-card-header">
                <div>
                  <h2>Seções e itens</h2>
                  <p>Monte o conteúdo da rota e organize a ordem desejada.</p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={addSection}
                >
                  <Plus size={16} />
                  Nova seção
                </button>
              </header>

              <div className="admin-section-list">
                {sections.map((section, index) => (
                  <div className="admin-section-card" key={section.id}>
                    <div className="admin-section-header">
                      <label>
                        <span>Nome da seção</span>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                          placeholder={`Seção ${index + 1}`}
                        />
                      </label>
                      <div className="admin-section-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => moveSection(section.id, -1)}
                          disabled={index === 0}
                          aria-label="Mover seção para cima"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => moveSection(section.id, 1)}
                          disabled={index === sections.length - 1}
                          aria-label="Mover seção para baixo"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => removeSection(section.id)}
                          aria-label="Remover seção"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="admin-item-list">
                      {section.items.map((item, itemIndex) => (
                        <div className="admin-item-card" key={item.id}>
                          <div className="admin-item-grid">
                            <label className="full">
                              <span>Título do item</span>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(event) =>
                                  updateItem(section.id, item.id, { title: event.target.value })
                                }
                                placeholder={`Item ${itemIndex + 1}`}
                              />
                            </label>
                            <label>
                              <span>Tipo</span>
                              <select
                                value={item.type}
                                onChange={(event) =>
                                  updateItem(section.id, item.id, { type: event.target.value })
                                }
                              >
                                {availableItemTypes.map((option) => (
                                  <option key={option.code} value={option.code}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>Duração (segundos)</span>
                              <input
                                type="number"
                                min={0}
                                value={item.duration}
                                onChange={(event) =>
                                  updateItem(section.id, item.id, { duration: event.target.value })
                                }
                              />
                            </label>
                            <label className="full">
                              <span>Conteúdo / URL</span>
                              <input
                                type="text"
                                value={item.content}
                                onChange={(event) =>
                                  updateItem(section.id, item.id, { content: event.target.value })
                                }
                                placeholder="Link ou identificador do conteúdo"
                              />
                            </label>

                            <label className="checkbox">
                              <input
                                type="checkbox"
                                checked={item.requiresCompletion}
                                onChange={(event) =>
                                  updateItem(section.id, item.id, {
                                    requiresCompletion: event.target.checked,
                                  })
                                }
                              />
                              <span>Item obrigatório</span>
                            </label>
                          </div>
                          <div className="admin-item-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => moveItem(section.id, item.id, -1)}
                              disabled={itemIndex === 0}
                              aria-label="Mover item para cima"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => moveItem(section.id, item.id, 1)}
                              disabled={itemIndex === section.items.length - 1}
                              aria-label="Mover item para baixo"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => removeItem(section.id, item.id)}
                              aria-label="Remover item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => addItem(section.id)}
                    >
                      <Plus size={16} />
                      Adicionar item
                    </button>
                  </div>
                ))}

                {!sections.length ? (
                  <div className="admin-empty">Nenhuma seção cadastrada ainda.</div>
                ) : null}
              </div>
            </section>

            {saveError ? <div className="admin-alert is-error">{saveError}</div> : null}
            {saveSuccess ? <div className="admin-alert is-success">{saveSuccess}</div> : null}

            <div className="admin-builder-actions">
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={resetBuilder}
                disabled={saving}
              >
                Limpar
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : null}
                Salvar rota
              </button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  );
}
