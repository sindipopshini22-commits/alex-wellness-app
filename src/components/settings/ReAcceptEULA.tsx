"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import EULAModal from "../legal/EULAModal";

export default function ReAcceptEULA() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950"
      >
        Re-accept EULA
      </button>
      {open && (
        <EULAModal
          onAccepted={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
