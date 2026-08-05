// FallingLeaves — decorative coral + sage leaves drifting down the page.
// Pure presentational markup (no hooks), safe to use in server components.

const LEAVES = [
  { left: "4%", size: 22, duration: 14, delay: 0, color: "#a1c9ae" },
  { left: "12%", size: 16, duration: 18, delay: 4, color: "#f3c8b7" },
  { left: "20%", size: 26, duration: 16, delay: 8, color: "#e6775b" },
  { left: "30%", size: 14, duration: 20, delay: 2, color: "#7fae97" },
  { left: "38%", size: 20, duration: 15, delay: 11, color: "#f3c8b7" },
  { left: "48%", size: 17, duration: 19, delay: 6, color: "#a1c9ae" },
  { left: "56%", size: 24, duration: 14, delay: 13, color: "#e6775b" },
  { left: "66%", size: 15, duration: 18, delay: 1, color: "#7fae97" },
  { left: "74%", size: 21, duration: 17, delay: 9, color: "#f3c8b7" },
  { left: "84%", size: 18, duration: 15, delay: 5, color: "#a1c9ae" },
  { left: "92%", size: 23, duration: 19, delay: 12, color: "#e6775b" },
];

function Leaf({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path
        d="M12 1.5C15.8 7.2 18.5 11.4 18.5 15a6.5 6.5 0 0 1-13 0C5.5 11.4 8.2 7.2 12 1.5z"
        fill={color}
      />
      <path d="M12 2v19" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" />
    </svg>
  );
}

export default function FallingLeaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {LEAVES.map((leaf, i) => (
        <span
          key={i}
          className="animate-leaf absolute -top-10"
          style={{
            left: leaf.left,
            width: leaf.size,
            height: leaf.size * 1.15,
            animationDuration: `${leaf.duration}s`,
            // Negative delay = leaves are already mid-fall when the page loads
            animationDelay: `-${leaf.delay}s`,
            ["--leaf-opacity" as string]: "0.7",
          }}
        >
          <Leaf color={leaf.color} />
        </span>
      ))}
    </div>
  );
}
