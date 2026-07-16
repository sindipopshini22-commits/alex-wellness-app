"use client";
import { useEffect, useRef, useState } from "react";

export default function DefusionCanvas({ thought }: { thought: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.clientWidth, h = canvas.clientHeight;
    const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    for (let i = 0; i < 90; i++) particles.push({ x: w / 2, y: h / 2, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 1 });

    const draw = () => {
      ctx.fillStyle = "rgba(9,9,11,0.25)";
      ctx.fillRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.life -= 0.005;
        ctx.fillStyle = `rgba(244,244,245,${Math.max(p.life, 0)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
        if (p.life <= 0) { p.x = w / 2; p.y = h / 2; p.vx = (Math.random() - 0.5) * 2; p.vy = (Math.random() - 0.5) * 2; p.life = 1; }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
      <div className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Watch the thought melt</h3>
        <p className="mt-1 text-xs text-zinc-500">You are not your thoughts. Let this one pass through.</p>
        <p className="mt-3 text-sm italic text-zinc-300">"{thought}"</p>
      </div>
      <canvas ref={canvasRef} className="h-48 w-full" />
      <div className="flex items-center justify-between p-4 text-xs">
        <button onClick={() => setRunning(r => !r)} className="rounded-xl border border-zinc-800 px-3 py-1.5 text-zinc-300">
          {running ? "Pause" : "Resume"}
        </button>
        <span className="text-zinc-500">Breathe. You don't have to act on this.</span>
      </div>
    </div>
  );
}
