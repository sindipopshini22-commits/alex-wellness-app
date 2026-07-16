import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import ChatWindow from "@/components/dashboard/ChatWindow";
import VoiceView from "@/components/dashboard/VoiceView";
import TopNav from "@/components/dashboard/TopNav";
import ChatHistorySidebar from "@/components/dashboard/ChatHistorySidebar";
import type { SessionItem } from "@/components/dashboard/ChatHistorySidebar";
import JournalPage from "@/components/dashboard/JournalPage";
import ClinicalReviewDashboard from "@/components/dashboard/ClinicalReviewDashboard";
import LegalGate from "@/components/legal/LegalGate";
import DisclaimerGate from "@/components/auth/DisclaimerGate";
import Link from "next/link";
import { LECTURES, FIRST_AID_KIT } from "@/components/classroom/moduleData";

type SearchParams = Promise<{
  view?: "voice" | "text";
  tab?: string;
  initContext?: string;
  module?: string;
  new?: string;
  session?: string;
}>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const userId = await getVerifiedUserId();
  if (!userId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) redirect("/login");
  if (!user.hasCompletedOnboarding) redirect("/onboarding");

  // Determine active session
  // ?new=1 always creates a fresh session; ?session= loads a specific one
  let chatSession;
  if (sp.new === "1") {
    chatSession = await db.chatSession.create({ data: { userId } });
  } else if (sp.session) {
    chatSession = await db.chatSession.findUnique({
      where: { id: sp.session },
    });
    if (!chatSession || chatSession.userId !== userId) {
      chatSession = await db.chatSession.create({ data: { userId } });
    }
  } else {
    const existing = await db.chatSession.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    chatSession = existing ?? (await db.chatSession.create({ data: { userId } }));
  }

  // Fetch all sessions for the sidebar
  const allSessions = await db.chatSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        where: { sender: "USER" },
      },
      _count: { select: { messages: true } },
    },
  });

  const sessionsList: SessionItem[] = allSessions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    preview: s.messages[0]?.content?.slice(0, 80) ?? "Empty session",
    messageCount: s._count.messages,
  }));

  const focus = user.profile?.primaryFocus ?? "none";
  const view = sp.view === "voice" ? "voice" : "text";
  const activeTab = sp.tab ?? "chat";

  const progress = await db.courseProgress.findMany({ where: { userId } });
  const completed = new Set(progress.filter((p) => p.isCompleted).map((p) => p.moduleId));

  return (
    <main className="mx-auto flex h-screen max-w-5xl flex-col">
      <TopNav username={user.profile?.username} focus={focus} role={user.role} />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat tab gets the sidebar */}
        {activeTab === "chat" && (
          <>
            <ChatHistorySidebar
              sessions={sessionsList}
              activeSessionId={chatSession.id}
            />
            <div className="flex flex-1 flex-col">
              <div className="flex h-full flex-col">
                <DisclaimerGate>
                  <LegalGate>
                    {view === "voice" ? (
                      <VoiceView sessionId={chatSession.id} profile={user.profile} />
                    ) : (
                      <ChatWindow
                        sessionId={chatSession.id}
                        profile={user.profile}
                        initContext={{ initContext: sp.initContext, module: sp.module }}
                      />
                    )}
                  </LegalGate>
                </DisclaimerGate>
              </div>
            </div>
          </>
        )}

        {activeTab === "lectures" && (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <LectureRubric completed={completed} />
          </div>
        )}

        {activeTab === "first-aid" && (
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <FirstAidRubric />
          </div>
        )}

        {activeTab === "journal" && (
          <div className="flex-1 overflow-hidden">
            <JournalPage />
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="flex-1 overflow-hidden">
            <ClinicalReviewDashboard />
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Lecture Rubric ─── */
function LectureRubric({ completed }: { completed: Set<string> }) {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">📚</span>
        <h2 className="text-lg font-semibold text-zinc-100">Lecture Articles</h2>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Evidence-based articles from trusted sources. Tap to read, then debrief with Alex in chat.
      </p>
      {LECTURES.length === 0 ? (
        <p className="text-sm text-zinc-500">No lectures available yet.</p>
      ) : (
        <ul className="space-y-3">
          {LECTURES.map((article) => (
            <li key={article.title}>
              <Link
                href={`/classroom?module=${encodeURIComponent(article.title)}`}
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:bg-zinc-900 hover:border-zinc-700"
              >
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{article.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {article.sections.length} sections · Source: {article.source}
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {completed.has(article.title) ? "✓ Read" : "Read"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─── First Aid Kit Rubric ─── */
function FirstAidRubric() {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">🩹</span>
        <h2 className="text-lg font-semibold text-zinc-100">First Aid Kit</h2>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Short interactive exercises for acute episodes. Do these in the moment, then process with Alex in chat.
      </p>
      {FIRST_AID_KIT.length === 0 ? (
        <p className="text-sm text-zinc-500">No exercises available yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {FIRST_AID_KIT.map((exercise) => (
            <Link
              key={exercise.id}
              href={`/classroom?section=${exercise.id}`}
              className={`rounded-2xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02] hover:shadow-lg ${exercise.color}`}
            >
              <div className="text-sm font-semibold text-zinc-100">{exercise.title}</div>
              <div className="mt-1 text-xs text-zinc-400">{exercise.subtitle}</div>
              <div className="mt-3 text-[10px] text-zinc-500">
                {exercise.steps.length} steps · ~{Math.ceil(exercise.steps.reduce((a, s) => a + (s.duration ?? 10), 0) / 60)} min
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
