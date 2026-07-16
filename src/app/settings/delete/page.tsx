// /settings/delete — public landing page for the in-app delete-account flow.
// Required for Apple Guideline 5.1.1(v) — the user must be able to initiate
// deletion from outside the app as well as inside it.

import Link from "next/link";

export const metadata = {
  title: "Alex — Delete Account"
};

export default function DeleteAccountLanding() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-zinc-100">
      <h1 className="text-2xl font-semibold">Delete your Alex account</h1>
      <p className="mt-4 text-zinc-400">
        To delete your account and all associated data, please sign in to the Alex app and
        navigate to <strong className="text-zinc-200">Settings → Delete account</strong>.
      </p>
      <p className="mt-4 text-zinc-400">
        If you no longer have access to the app, contact us at{" "}
        <a href="mailto:support@alex.app" className="text-zinc-200 underline">support@alex.app</a>{" "}
        and we will process the deletion manually within 30 days.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950"
        >
          Open Alex
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-300"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
