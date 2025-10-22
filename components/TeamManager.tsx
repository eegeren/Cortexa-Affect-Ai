"use client";

import { FormEvent, useEffect, useState } from "react";

type TeamMember = {
  id: string;
  email: string;
  created_at: string;
};

type Props = {
  isEnabled: boolean;
};

export default function TeamManager({ isEnabled }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!isEnabled) {
      setMembers([]);
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      if (!res.ok) throw new Error("Takım üyeleri yüklenemedi.");
      const data = (await res.json()) as { members: TeamMember[] };
      setMembers(data.members ?? []);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(err);
      }
      const message =
        err instanceof Error ? err.message : "Takım üyeleri yüklenirken bir hata oluştu.";
      if (message.includes("team_members")) {
        setFeedback("team_members tablosu bulunamadı. Supabase şemanı güncelle.");
      } else {
        setFeedback(message);
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [isEnabled]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Üye eklenemedi.");
      }
      setEmail("");
      await fetchMembers();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Üye ekleme sırasında hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Üye silinemedi.");
      }
      await fetchMembers();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Üye silme sırasında hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-600">
        Takım üyeleri özelliği için giriş yapman gerekli.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="uye@markan.com"
          className="flex-1 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:border-blue-300 disabled:bg-blue-300"
        >
          {loading ? "Ekleniyor..." : "Üye ekle"}
        </button>
      </form>

      {feedback && (
        <p className="rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs text-red-600">
          {feedback}
        </p>
      )}

      <div className="space-y-2">
        {fetching ? (
          <p className="text-xs text-slate-500">Üyeler yükleniyor...</p>
        ) : members.length === 0 ? (
          <p className="text-xs text-slate-500">
            Henüz eklenmiş üye yok. Mail adresi girerek davet et.
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-slate-600"
            >
              <span>{member.email}</span>
              <button
                onClick={() => handleRemove(member.id)}
                className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500 hover:text-blue-700"
              >
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
