"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarOptions, CHOICES, avatarUrl, defaultAvatar, randomAvatar } from "@/lib/avatar";

interface Profile { id: string; name: string; avatar: AvatarOptions | null; band: string | null }

export default function Profiles() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<null | { id?: string; name: string; avatar: AvatarOptions }>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles");
      if (!res.ok) throw new Error("db");
      const d = await res.json();
      setProfiles(d.profiles || []);
    } catch {
      // Meist: Datenbank noch nicht verbunden / Tabellen fehlen.
      setError("Die Datenbank ist noch nicht verbunden. Verbinde in Vercel unter Storage eine Neon-Datenbank und deploye neu — dann erscheinen hier deine Profile.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function select(id: string) {
    const d = await fetch("/api/profiles/select", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }).then((r) => r.json());
    router.push(d.needsOnboarding ? "/onboarding" : "/dashboard");
  }
  async function remove(id: string) {
    if (!confirm("Dieses Profil und seinen Speicherstand wirklich löschen?")) return;
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10">
      <div className="text-center mb-8">
        <div className="text-primary text-3xl mb-1">●</div>
        <h1 className="h-title">Wer lernt heute?</h1>
        <p className="label mt-1">Wähle dein Profil — jeder Speicherstand ist getrennt.</p>
      </div>

      {loading ? (
        <p className="label">Lädt…</p>
      ) : error ? (
        <div className="card p-6 max-w-md text-center space-y-3">
          <p className="text-warn text-2xl">⚠</p>
          <p className="text-sm">{error}</p>
          <button className="btn btn-primary" onClick={load}>Erneut versuchen</button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
          {profiles.map((p) => (
            <div key={p.id} className="group flex flex-col items-center gap-2 w-32">
              <button onClick={() => select(p.id)} className="relative rounded-2xl overflow-hidden border-2 border-line hover:border-primary hover:shadow-glow transition w-28 h-28 bg-surface2">
                <img src={avatarUrl(p.avatar)} alt={p.name} className="w-full h-full object-cover" />
              </button>
              <div className="text-center">
                <p className="font-medium truncate w-28">{p.name}</p>
                {p.band && <p className="text-[11px] text-muted truncate w-28">{p.band}</p>}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition text-xs">
                <button className="text-muted hover:text-primary" onClick={() => setEditor({ id: p.id, name: p.name, avatar: { ...defaultAvatar(), ...(p.avatar || {}) } })}>Bearbeiten</button>
                <button className="text-muted hover:text-bad" onClick={() => remove(p.id)}>Löschen</button>
              </div>
            </div>
          ))}

          {/* Neues Profil */}
          <div className="flex flex-col items-center gap-2 w-32">
            <button onClick={() => setEditor({ name: "", avatar: randomAvatar() })} className="w-28 h-28 rounded-2xl border-2 border-dashed border-line hover:border-primary text-4xl text-muted hover:text-primary transition">+</button>
            <p className="font-medium">Neu</p>
          </div>
        </div>
      )}

      {editor && <AvatarEditor initial={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load(); }} onSelected={select} />}
    </div>
  );
}

function AvatarEditor({ initial, onClose, onSaved, onSelected }: {
  initial: { id?: string; name: string; avatar: AvatarOptions };
  onClose: () => void; onSaved: () => void; onSelected: (id: string) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [av, setAv] = useState<AvatarOptions>(initial.avatar);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof AvatarOptions, v: string) => setAv((a) => ({ ...a, [k]: v }));

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    if (initial.id) {
      await fetch(`/api/profiles/${initial.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, avatar: av }) });
      onSaved();
    } else {
      const d = await fetch("/api/profiles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, avatar: av }) }).then((r) => r.json());
      if (d.id) onSelected(d.id); // neues Profil direkt aktivieren -> Onboarding
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="h-title mb-4">{initial.id ? "Profil bearbeiten" : "Neues Profil"}</h2>
        <div className="flex gap-4 items-center mb-4">
          <img src={avatarUrl(av)} alt="Vorschau" className="w-24 h-24 rounded-2xl border border-line bg-surface2" />
          <div className="flex-1">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Vinni" maxLength={30} autoFocus />
            <button className="btn btn-ghost mt-2 text-sm" onClick={() => setAv(randomAvatar())}>🎲 Zufällig</button>
          </div>
        </div>

        <div className="space-y-3">
          <Swatches label="Hautton" k="skinColor" values={CHOICES.skinColor} av={av} set={set} color />
          <Swatches label="Haarfarbe" k="hairColor" values={CHOICES.hairColor} av={av} set={set} color />
          <Picker label="Frisur / Kopf" k="top" values={CHOICES.top} av={av} set={set} />
          <Picker label="Augen" k="eyes" values={CHOICES.eyes} av={av} set={set} />
          <Picker label="Mund" k="mouth" values={CHOICES.mouth} av={av} set={set} />
          <Picker label="Brille" k="accessories" values={CHOICES.accessories} av={av} set={set} />
          <Picker label="Kleidung" k="clothing" values={CHOICES.clothing} av={av} set={set} />
          <Swatches label="Kleidungsfarbe" k="clothesColor" values={CHOICES.clothesColor} av={av} set={set} color />
          <Swatches label="Hintergrund" k="backgroundColor" values={CHOICES.backgroundColor} av={av} set={set} color />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={!name.trim() || saving}>{saving ? "…" : initial.id ? "Speichern" : "Erstellen & starten"}</button>
        </div>
      </div>
    </div>
  );
}

function Swatches({ label, k, values, av, set, color }: { label: string; k: keyof AvatarOptions; values: readonly string[]; av: AvatarOptions; set: (k: keyof AvatarOptions, v: string) => void; color?: boolean }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button key={v} onClick={() => set(k, v)} title={v}
            className={`w-7 h-7 rounded-full border-2 ${av[k] === v ? "border-primary scale-110" : "border-line"} transition`}
            style={{ background: v === "transparent" ? "repeating-conic-gradient(#334 0% 25%, #223 0% 50%) 50% / 10px 10px" : `#${v}` }} />
        ))}
      </div>
    </div>
  );
}

function Picker({ label, k, values, av, set }: { label: string; k: keyof AvatarOptions; values: readonly string[]; av: AvatarOptions; set: (k: keyof AvatarOptions, v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="label">{label}</p>
      <select className="input max-w-[220px] py-2" value={av[k]} onChange={(e) => set(k, e.target.value)}>
        {values.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}
