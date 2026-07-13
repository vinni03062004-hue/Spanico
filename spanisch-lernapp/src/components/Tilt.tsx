"use client";
import { useRef } from "react";

// 3D-Interaktion: das Element neigt sich zur Maus (Desktop) bzw. bleibt flach
// auf Touch. Sorgt für das hochwertige, räumliche Feeling.
export function Tilt({ children, className = "", max = 12 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) scale(1.02)`;
  }
  function reset() {
    const el = ref.current; if (el) el.style.transform = "perspective(800px) rotateY(0) rotateX(0) scale(1)";
  }

  return (
    <div ref={ref} className={`tilt ${className}`} onMouseMove={onMove} onMouseLeave={reset}>
      <div className="tilt-inner">{children}</div>
    </div>
  );
}
