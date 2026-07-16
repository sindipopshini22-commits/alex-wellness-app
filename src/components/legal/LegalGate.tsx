// Legal-gate client wrapper.
// Hides the rest of the app until the current EULA is accepted.

"use client";
import { useEffect, useState } from "react";
import EULAModal from "./EULAModal";

export default function LegalGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "accepted" | "needs-accept">("loading");

  useEffect(() => {
    fetch("/api/legal/accept")
      .then(r => r.json())
      .then(data => {
        setStatus(data.hasAcceptedCurrent ? "accepted" : "needs-accept");
      })
      .catch(() => setStatus("needs-accept"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 text-sm">
        Loading...
      </div>
    );
  }

  if (status === "needs-accept") {
    return <EULAModal onAccepted={() => setStatus("accepted")} />;
  }

  return <>{children}</>;
}
