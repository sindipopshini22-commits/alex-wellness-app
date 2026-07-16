import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getVerifiedUserId } from "@/lib/session";
import Link from "next/link";
import CourseLayout from "@/components/classroom/CourseLayout";
import FirstAidKit from "@/components/classroom/FirstAidKit";
import { LECTURES, FIRST_AID_KIT } from "@/components/classroom/moduleData";

export default async function ClassroomDetailPage({
  searchParams
}: {
  searchParams: Promise<{ module?: string; section?: string }>;
}) {
  const sp = await searchParams;
  const userId = await getVerifiedUserId();
  if (!userId) redirect("/login");

  // Show a specific lecture article
  if (sp.module) {
    const article = LECTURES.find((a) => a.title === sp.module);
    if (!article) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-zinc-400">Article not found.</p>
          <Link href="/dashboard?tab=lectures" className="mt-4 inline-block text-xs text-zinc-500">
            ← Back to Lectures
          </Link>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <CourseLayout article={article} />
      </main>
    );
  }

  // Show a First Aid Kit exercise
  if (sp.section) {
    const exercise = FIRST_AID_KIT.find((e) => e.id === sp.section);
    if (!exercise) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-zinc-400">Exercise not found.</p>
          <Link href="/dashboard?tab=first-aid" className="mt-4 inline-block text-xs text-zinc-500">
            ← Back to First Aid Kit
          </Link>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10">
        <FirstAidKit exercise={exercise} />
      </main>
    );
  }

  // No specific module or section — redirect to dashboard lectures tab
  redirect("/dashboard?tab=lectures");
}
