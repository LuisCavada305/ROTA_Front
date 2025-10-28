import { useEffect, useMemo, useState } from "react";
import { UserCircle2 } from "lucide-react";
import Layout from "../components/Layout";
import { http } from "../lib/http";
import type { Member, MembersResponse } from "../types/member";
import "../styles/Members.css";

const DEFAULT_BADGE = "Membro Enactus Mackenzie";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await http.get<MembersResponse>("/members");
        if (cancelled) return;
        setMembers(data.members ?? []);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        const detail =
          err?.response?.data?.detail ??
          err?.message ??
          "Não foi possível carregar a lista de membros.";
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

  const normalizedSearch = normalize(search.trim());
  const { availableRoles, hasFallbackRole } = useMemo(() => {
    const unique = new Set<string>();
    let fallback = false;
    members.forEach((member) => {
      if (member.role) {
        unique.add(member.role);
      } else {
        fallback = true;
      }
    });
    return {
      availableRoles: Array.from(unique).sort((a, b) => a.localeCompare(b)),
      hasFallbackRole: fallback,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const matchesSearch = (member: Member) => {
      if (!normalizedSearch) return true;
      const haystack = normalize(
        [member.full_name, member.role ?? "", member.bio ?? ""].join(" ")
      );
      return haystack.includes(normalizedSearch);
    };
    const matchesRole =
      roleFilter === "all"
        ? () => true
        : (member: Member) => (member.role ?? DEFAULT_BADGE) === roleFilter;

    return members.filter((member) => matchesSearch(member) && matchesRole(member));
  }, [members, normalizedSearch, roleFilter]);

  return (
    <Layout>
      <section className="members-page">
        <header className="members-header">
          <h1>Membros Enactus</h1>
          <p>
            Conheça as pessoas que fazem o projeto acontecer. Atualmente{" "}
            <strong>{members.length}</strong>{" "}
            {members.length === 1 ? "membro" : "membros"} estão cadastrados.
          </p>
        </header>

        <div className="members-filters">
          <div className="filters-left">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">
                Todos os tipos ({members.length})
              </option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
              {hasFallbackRole ? (
                <option value={DEFAULT_BADGE}>{DEFAULT_BADGE}</option>
              ) : null}
            </select>
          </div>
          <input
            type="search"
            placeholder="Pesquisar membros..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Pesquisar membros"
          />
        </div>

        {error ? <div className="members-error">{error}</div> : null}

        {loading ? (
          <div className="members-empty">Carregando membros…</div>
        ) : filteredMembers.length === 0 ? (
          <div className="members-empty">
            Nenhum membro encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="members-grid" aria-live="polite">
            {filteredMembers.map((member) => {
              const badge = member.role?.trim() || DEFAULT_BADGE;
              return (
                <article key={member.id} className="member-card">
                  <div className="member-photo" aria-hidden="true">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={`Foto de ${member.full_name}`} />
                    ) : (
                      <div className="member-photo-placeholder">
                        <UserCircle2 size={48} />
                      </div>
                    )}
                  </div>
                  <span className="member-badge">{badge}</span>
                  <h2 className="member-name">{member.full_name}</h2>
                  {member.bio ? (
                    <p className="member-bio">{member.bio}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
