"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type TabId = "chat" | "lectures" | "first-aid" | "journal" | "reviews";

interface TopNavProps {
  username?: string | null;
  focus?: string;
  role?: string;
}

const PATIENT_RUBRICS: { id: TabId; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "first-aid", label: "First Aid Kit", icon: "🩹" },
  { id: "journal", label: "Journal", icon: "📔" },
  { id: "lectures", label: "Lectures", icon: "📚" },
];

const CLINICIAN_EXTRA: { id: TabId; label: string; icon: string }[] = [
  { id: "reviews", label: "Reviews", icon: "🔬" },
];

export default function TopNav({ username, focus, role }: TopNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isReviewer = role === "CLINICIAN" || role === "ADMIN";

  const rubrics = useMemo(
    () => isReviewer ? [...PATIENT_RUBRICS, ...CLINICIAN_EXTRA] : PATIENT_RUBRICS,
    [isReviewer]
  );

  const activeTab: TabId =
    (searchParams.get("tab") as TabId) ??
    (pathname === "/dashboard" || pathname === "/" ? "chat" : "lectures");

  const setTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      // Keep ?new=1 if it was set, clear other noise
      router.push(`/dashboard?${params.toString()}`);
    },
    [router, searchParams]
  );

  const isSettings = pathname === "/settings";
  const isManage = pathname === "/settings/manage";

  return (
    <header className="flex flex-col border-b border-zinc-900 pb-0">
      {/* Top row: branding + account actions */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/settings/manage")}
            className="text-lg font-semibold tracking-tight transition-all hover:text-zinc-300"
          >
            Alex
          </button>
          {username && (
            <button
              onClick={() => router.push("/settings/manage")}
              className="rounded-full bg-zinc-800/60 px-3 py-0.5 text-[11px] text-zinc-400 transition-all hover:bg-zinc-700 hover:text-zinc-300"
            >
              {username}
            </button>
          )}
          {focus && focus !== "none" && (
            <span className="hidden text-[10px] text-zinc-600 sm:inline">
              · Focus: {focus}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1.5 text-xs">
          {/* Main rubrics as tabs */}
          {rubrics.map((r) => {
            const isActive =
              r.id === activeTab && !isSettings && !isManage;
            return (
              <button
                key={r.id}
                onClick={() => setTab(r.id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                <span className="sm:hidden">{r.icon}</span>
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <span className="mx-1 h-4 w-px bg-zinc-800" />

          {/* Settings */}
          <button
            onClick={() => router.push("/settings")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              isSettings
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            ⚙️ <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Manage Account */}
          <button
            onClick={() => router.push("/settings/manage")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              isManage
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            👤 <span className="hidden sm:inline">Account</span>
          </button>

          {/* Sign out */}
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="rounded-lg px-3 py-1.5 font-medium text-zinc-500 transition-all hover:text-amber-300 hover:bg-amber-950/30"
          >
            🚪 <span className="hidden sm:inline">Sign out</span>
          </button>

          {/* Delete Account */}
          <button
            onClick={async () => {
              if (!confirm("This will permanently delete your account and all data. Continue?"))
                return;
              const res = await fetch("/api/user/delete", { method: "DELETE" });
              if (res.ok) {
                router.push("/");
                router.refresh();
              } else {
                alert("Delete failed. Check console.");
              }
            }}
            className="rounded-lg px-3 py-1.5 font-medium text-zinc-500 transition-all hover:text-red-300 hover:bg-red-950/30"
          >
            🗑️ <span className="hidden sm:inline">Delete</span>
          </button>
        </nav>
      </div>

      {/* Tab content header - subtle hint when a tab is active */}
      {activeTab === "first-aid" && !isSettings && !isManage && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-zinc-500">
            Short interactive exercises for acute episodes. Do these in the moment.
          </p>
        </div>
      )}
      {activeTab === "journal" && !isSettings && !isManage && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-zinc-500">
            Document your thoughts and feelings. A private space to reflect.
          </p>
        </div>
      )}
      {activeTab === "lectures" && !isSettings && !isManage && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-zinc-500">
            Evidence-based articles to help you understand your mental health.
          </p>
        </div>
      )}
    </header>
  );
}
