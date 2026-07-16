"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const FOCUS_OPTIONS = [
  { id: "anxiety", label: "Anxiety", emoji: "😰" },
  { id: "depression", label: "Depression", emoji: "🌧️" },
  { id: "ptsd", label: "PTSD", emoji: "💭" },
  { id: "adhd", label: "ADHD", emoji: "🌀" },
  { id: "ocd", label: "OCD", emoji: "🔁" },
];

interface ProfileData {
  username: string;
  age: number;
  sex: string;
  primaryFocus: string;
  hasProfessionalHelp: boolean;
  hasFeltThisWayBefore: boolean;
}

export default function EditProfile({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>({ ...profile });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMessage(null);
  }

  async function save() {
    if (!form.username.trim() || form.username.trim().length < 2) {
      setMessage({ type: "error", text: "Username must be at least 2 characters." });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage({ type: "success", text: "Profile updated!" });
      setDirty(false);
      router.refresh();
    } else {
      try {
        const err = await res.json();
        setMessage({ type: "error", text: err.error ?? "Something went wrong." });
      } catch {
        setMessage({
          type: "error",
          text: `Server error (${res.status}). Please try again.`,
        });
      }
    }
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      {/* Username */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300">Username</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          How Alex greets you.
        </p>
        <input
          type="text"
          value={form.username}
          onChange={(e) => update("username", e.target.value)}
          placeholder="Your name"
          maxLength={30}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-zinc-500"
        />
      </section>

      {/* Age */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300">Age</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Used to calibrate tone and context.
        </p>
        <input
          type="number"
          min={13}
          max={120}
          value={form.age}
          onChange={(e) => update("age", Number(e.target.value))}
          className="mt-2 w-32 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-zinc-500"
        />
      </section>

      {/* Sex */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300">Sex assigned at birth</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Helps Alex adapt language. You can leave this unset.
        </p>
        <div className="mt-2 flex gap-3">
          {["Male", "Female"].map((s) => {
            const val = s.toLowerCase();
            return (
              <button
                key={s}
                onClick={() => update("sex", form.sex === val ? "" : val)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                  form.sex === val
                    ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </section>

      {/* Primary Focus */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300">Primary focus</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          What feels most present for you right now.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FOCUS_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => update("primaryFocus", form.primaryFocus === f.id ? "" : f.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.primaryFocus === f.id
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
              }`}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Professional Help */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300">Working with a professional</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Lets Alex know how to best support you.
        </p>
        <div className="mt-2 flex gap-3">
          {[
            { v: true, l: "Yes, I am", emoji: "🤝" },
            { v: false, l: "Not yet", emoji: "💪" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => update("hasProfessionalHelp", o.v)}
              className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                form.hasProfessionalHelp === o.v
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
              }`}
            >
              <span>{o.emoji}</span>
              <span>{o.l}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Has felt this way before */}
      <section>
        <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 cursor-pointer transition-all hover:border-zinc-700">
          <input
            type="checkbox"
            checked={form.hasFeltThisWayBefore}
            onChange={(e) => update("hasFeltThisWayBefore", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-500"
          />
          <span className="text-sm text-zinc-300 leading-relaxed">
            I&apos;ve felt this way before — this isn&apos;t my first time reaching out for help.
          </span>
        </label>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="rounded-xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-40"
        >
          {busy ? "Saving..." : "Save changes"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
