import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Edit3, ImageOff, ImagePlus, Loader2, Trash2, UserCircle2 } from "lucide-react";
import { http } from "../lib/http";
import type { Member, MembersResponse } from "../types/member";
import "../styles/AdminMembers.css";

type FormState = {
  id: number | null;
  full_name: string;
  role: string;
  bio: string;
  order_index: string;
  photo_path: string | null;
  photo_url: string | null;
};

const EMPTY_FORM: FormState = {
  id: null,
  full_name: "",
  role: "",
  bio: "",
  order_index: "",
  photo_path: null,
  photo_url: null,
};

const DEFAULT_BADGE = "Membro Enactus Mackenzie";

function sortMembers(list: Member[]): Member[] {
  return [...list].sort((a, b) => {
    if (a.order_index === b.order_index) {
      return a.full_name.localeCompare(b.full_name);
    }
    return a.order_index - b.order_index;
  });
}

export default function AdminMembersSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await http.get<MembersResponse>("/admin/members");
        if (cancelled) return;
        setMembers(sortMembers(data.members ?? []));
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        const detail =
          err?.response?.data?.detail ??
          err?.message ??
          "Não foi possível carregar os membros.";
        setError(detail);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalMembers = members.length;

  const roleSummary = useMemo(() => {
    const counters = new Map<string, number>();
    members.forEach((member) => {
      const role = member.role?.trim() || DEFAULT_BADGE;
      counters.set(role, (counters.get(role) ?? 0) + 1);
    });
    return Array.from(counters.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [members]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSaveError(null);
  };

  const handleEdit = (member: Member) => {
    setForm({
      id: member.id,
      full_name: member.full_name,
      role: member.role ?? "",
      bio: member.bio ?? "",
      order_index: String(member.order_index ?? ""),
      photo_path: member.photo_path ?? null,
      photo_url: member.photo_url ?? null,
    });
    setSaveError(null);
  };

  const handleDelete = async (member: Member) => {
    const confirmed = window.confirm(
      `Deseja remover ${member.full_name} da lista de membros?`
    );
    if (!confirmed) return;
    setDeletingId(member.id);
    setSaveError(null);
    try {
      await http.delete(`/admin/members/${member.id}`);
      setMembers((prev) => prev.filter((item) => item.id !== member.id));
      if (form.id === member.id) {
        resetForm();
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.message ??
        "Falha ao remover o membro.";
      setSaveError(detail);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setSaveError(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await http.post<{ path: string; url: string }>(
        "/admin/uploads/members",
        data
      );
      setForm((prev) => ({
        ...prev,
        photo_path: response.data.path,
        photo_url: response.data.url ?? null,
      }));
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.message ??
        "Não foi possível enviar a imagem.";
      setSaveError(detail);
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo_path: null, photo_url: null }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.full_name.trim()) {
      setSaveError("Informe o nome do membro.");
      return;
    }
    const payload = {
      full_name: form.full_name.trim(),
      role: form.role.trim() || null,
      bio: form.bio.trim() || null,
      order_index: Number.parseInt(form.order_index.trim() || "0", 10),
      photo_path: form.photo_path ?? null,
    };

    setSaving(true);
    setSaveError(null);
    try {
      if (form.id) {
        const { data } = await http.put<{ member: Member }>(
          `/admin/members/${form.id}`,
          payload
        );
        const updated = data.member;
        if (updated) {
          setMembers((prev) =>
            sortMembers(prev.map((item) => (item.id === updated.id ? updated : item)))
          );
        }
      } else {
        const { data } = await http.post<{ member: Member }>("/admin/members", payload);
        const created = data.member;
        if (created) {
          setMembers((prev) => sortMembers([...prev, created]));
        }
      }
      resetForm();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.message ??
        "Não foi possível salvar o membro.";
      setSaveError(Array.isArray(detail) ? detail[0]?.msg ?? String(detail) : detail);
    } finally {
      setSaving(false);
    }
  };

  const photoPreview = form.photo_url ?? "";

  return (
    <div className="admin-members">
      <div className="admin-card">
        <header className="admin-card-header">
          <div>
            <h2>Membros cadastrados</h2>
            <p>Gerencie o catálogo de pessoas exibido na página pública.</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={resetForm}
          >
            Adicionar novo
          </button>
        </header>

        {error ? <div className="admin-alert is-error">{error}</div> : null}

        {loading ? (
          <div className="admin-feedback-card">Carregando…</div>
        ) : members.length === 0 ? (
          <div className="admin-feedback-card">
            Nenhum membro cadastrado ainda. Utilize o formulário ao lado para criar o primeiro.
          </div>
        ) : (
          <div className="members-table-wrapper">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Ordem</th>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Atualizado</th>
                  <th className="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.order_index}</td>
                    <td>{member.full_name}</td>
                    <td>{member.role ?? DEFAULT_BADGE}</td>
                    <td>
                      {member.updated_at
                        ? new Date(member.updated_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="align-right">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleEdit(member)}
                          title="Editar membro"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => handleDelete(member)}
                          disabled={deletingId === member.id}
                          title="Remover membro"
                        >
                          {deletingId === member.id ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="members-summary">
          <span>
            Total: <strong>{totalMembers}</strong>
          </span>
          <ul>
            {roleSummary.map(([role, count]) => (
              <li key={role}>
                {role} — <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form className="admin-card members-form" onSubmit={handleSubmit}>
        <header>
          <h2>{form.id ? "Editar membro" : "Novo membro"}</h2>
          <p>Defina a ordem, nome, cargo e imagem a ser exibida na página pública.</p>
        </header>

        {saveError ? <div className="admin-alert is-error">{saveError}</div> : null}

        <div className="members-form-grid">
          <label>
            Nome completo
            <input
              type="text"
              value={form.full_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Cargo / Função
            <input
              type="text"
              value={form.role}
              placeholder={DEFAULT_BADGE}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
            />
          </label>
          <label>
            Ordem de exibição
            <input
              type="number"
              min={0}
              value={form.order_index}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, order_index: event.target.value }))
              }
            />
          </label>
        </div>

        <label>
          Biografia / descrição
          <textarea
            value={form.bio}
            maxLength={4000}
            rows={4}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, bio: event.target.value }))
            }
          />
        </label>

        <div className="members-photo-field">
          <div className="members-photo-preview">
            {photoPreview ? (
              <img src={photoPreview} alt="Pré-visualização do membro" />
            ) : (
              <div className="members-photo-placeholder">
                <UserCircle2 size={48} />
                <span>Sem imagem</span>
              </div>
            )}
          </div>
          <div className="members-photo-actions">
            <label className="admin-btn admin-btn-secondary">
              {uploadingPhoto ? <Loader2 size={16} className="spin" /> : <ImagePlus size={16} />}
              <span>{uploadingPhoto ? "Enviando..." : "Selecionar foto"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                hidden
                disabled={uploadingPhoto || saving}
              />
            </label>
            {form.photo_path ? (
              <button
                type="button"
                className="admin-btn danger"
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto || saving}
              >
                <ImageOff size={16} />
                Remover
              </button>
            ) : null}
            <p className="members-photo-example">
              Arquivos até 512 KB. Formatos: JPG, PNG ou WEBP.
            </p>
          </div>
        </div>

        <footer className="members-form-actions">
          <button type="submit" className="admin-btn" disabled={saving || uploadingPhoto}>
            {saving ? <Loader2 size={18} className="spin" /> : null}
            {form.id ? "Salvar alterações" : "Cadastrar membro"}
          </button>
        </footer>
      </form>
    </div>
  );
}
