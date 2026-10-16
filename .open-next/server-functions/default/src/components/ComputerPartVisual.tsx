export type ComputerPartVisualKind =
  | "cpu"
  | "gpu"
  | "ram"
  | "ssd"
  | "motherboard"
  | "power"
  | "case"
  | "cooler";

const accent: Record<ComputerPartVisualKind, string> = {
  cpu: "from-blue-500 to-indigo-700",
  gpu: "from-rose-500 to-orange-600",
  ram: "from-violet-500 to-fuchsia-700",
  ssd: "from-emerald-500 to-teal-700",
  motherboard: "from-cyan-500 to-blue-700",
  power: "from-amber-500 to-orange-700",
  case: "from-slate-500 to-slate-800",
  cooler: "from-sky-500 to-cyan-700",
};

function PartDrawing({ kind }: { kind: ComputerPartVisualKind }) {
  if (kind === "cpu") {
    return (
      <>
        <rect x="25" y="25" width="50" height="50" rx="8" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="4" />
        <rect x="36" y="36" width="28" height="28" rx="4" fill="currentColor" opacity=".8" />
        {[30, 42, 54, 66].map((value) => <path key={`cpu-h-${value}`} d={`M${value} 17v8M${value} 75v8`} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />)}
        {[30, 42, 54, 66].map((value) => <path key={`cpu-v-${value}`} d={`M17 ${value}h8M75 ${value}h8`} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />)}
      </>
    );
  }
  if (kind === "gpu") {
    return (
      <>
        <rect x="12" y="27" width="76" height="45" rx="7" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="4" />
        <circle cx="38" cy="49" r="14" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="68" cy="49" r="14" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="38" cy="49" r="4" fill="currentColor" /><circle cx="68" cy="49" r="4" fill="currentColor" />
        <path d="M19 78h55M88 36h6v27h-6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </>
    );
  }
  if (kind === "ram") {
    return (
      <>
        <rect x="9" y="34" width="82" height="33" rx="5" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="4" />
        {[18, 34, 50, 66].map((x) => <rect key={x} x={x} y="41" width="12" height="17" rx="2" fill="currentColor" opacity=".8" />)}
        {[16, 27, 38, 49, 60, 71, 82].map((x) => <path key={x} d={`M${x} 67v7`} stroke="currentColor" strokeWidth="3" />)}
      </>
    );
  }
  if (kind === "ssd") {
    return (
      <>
        <rect x="24" y="12" width="52" height="76" rx="9" fill="currentColor" opacity=".18" stroke="currentColor" strokeWidth="4" />
        <circle cx="34" cy="23" r="3" fill="currentColor" /><circle cx="66" cy="77" r="3" fill="currentColor" />
        <path d="M36 42h28M36 52h28M36 62h17" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </>
    );
  }
  if (kind === "motherboard") {
    return (
      <>
        <rect x="15" y="12" width="70" height="76" rx="7" fill="currentColor" opacity=".16" stroke="currentColor" strokeWidth="4" />
        <rect x="24" y="22" width="31" height="31" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
        <rect x="62" y="22" width="13" height="45" rx="3" fill="currentColor" opacity=".75" />
        <rect x="24" y="62" width="30" height="15" rx="3" fill="currentColor" opacity=".65" />
        <path d="M55 38h7M38 53v9M54 70h8" stroke="currentColor" strokeWidth="3" />
      </>
    );
  }
  if (kind === "power") {
    return (
      <>
        <rect x="16" y="20" width="68" height="64" rx="8" fill="currentColor" opacity=".17" stroke="currentColor" strokeWidth="4" />
        <circle cx="48" cy="52" r="22" fill="none" stroke="currentColor" strokeWidth="5" />
        <path d="M48 30c9 8 9 15 0 22M70 52c-8 9-15 9-22 0M48 74c-9-8-9-15 0-22M26 52c8-9 15-9 22 0" stroke="currentColor" strokeWidth="3" />
        <rect x="74" y="29" width="5" height="14" rx="2" fill="currentColor" />
      </>
    );
  }
  if (kind === "case") {
    return (
      <>
        <path d="M31 10h38a8 8 0 0 1 8 8v72H23V18a8 8 0 0 1 8-8Z" fill="currentColor" opacity=".17" stroke="currentColor" strokeWidth="4" />
        <circle cx="50" cy="48" r="17" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="50" cy="48" r="4" fill="currentColor" />
        <circle cx="63" cy="20" r="3" fill="currentColor" />
        <path d="M34 77h32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx="50" cy="50" r="38" fill="currentColor" opacity=".14" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="7" fill="currentColor" />
      <path d="M50 16c13 3 18 11 11 24-8 5-12 4-11-4ZM84 50c-3 13-11 18-24 11-5-8-4-12 4-11ZM50 84c-13-3-18-11-11-24 8-5 12-4 11 4ZM16 50c3-13 11-18 24-11 5 8 4 12-4 11Z" fill="currentColor" opacity=".8" />
    </>
  );
}

export default function ComputerPartVisual({
  kind,
  className = "h-20 w-20",
}: {
  kind: ComputerPartVisualKind;
  className?: string;
}) {
  return (
    <div className={`grid place-items-center rounded-2xl bg-gradient-to-br ${accent[kind]} p-[2px] shadow-sm ${className}`}>
      <div className="grid h-full w-full place-items-center rounded-[14px] bg-white/95">
        <svg viewBox="0 0 100 100" className="h-[82%] w-[82%] text-[#003b5c]" aria-hidden="true">
          <PartDrawing kind={kind} />
        </svg>
      </div>
    </div>
  );
}
