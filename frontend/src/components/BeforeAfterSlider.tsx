import { useRef, useState } from "react";

interface Props {
  before: string;
  after: string;
  label?: string;
}

export default function BeforeAfterSlider({ before, after, label }: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  return (
    <div>
      {label && <p className="text-sm text-charcoal-700/70 mb-3">{label}</p>}
      <div
        ref={containerRef}
        className="relative h-[420px] w-full overflow-hidden select-none cursor-ew-resize"
        onMouseDown={(e) => {
          dragging.current = true;
          updateFromClientX(e.clientX);
        }}
        onMouseMove={(e) => dragging.current && updateFromClientX(e.clientX)}
        onMouseUp={() => (dragging.current = false)}
        onMouseLeave={() => (dragging.current = false)}
        onTouchStart={(e) => updateFromClientX(e.touches[0].clientX)}
        onTouchMove={(e) => updateFromClientX(e.touches[0].clientX)}
      >
        <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <img
            src={before}
            alt="Before"
            className="h-full object-cover"
            style={{ width: containerRef.current?.offsetWidth ?? "100%", maxWidth: "none" }}
          />
        </div>

        <div className="absolute top-0 bottom-0 w-0.5 bg-sand-50" style={{ left: `${position}%` }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-sand-50 flex items-center justify-center text-charcoal-900 text-xs shadow-lg">
            ↔
          </div>
        </div>

        <span className="absolute top-4 left-4 bg-charcoal-950/70 text-sand-50 text-[10px] uppercase tracking-widest2 px-3 py-1.5">
          Before
        </span>
        <span className="absolute top-4 right-4 bg-charcoal-950/70 text-sand-50 text-[10px] uppercase tracking-widest2 px-3 py-1.5">
          After
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="sr-only"
        aria-label="Before and after comparison"
      />
    </div>
  );
}
