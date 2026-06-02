import { useState, useCallback } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function playClick() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

export function useCtaRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const triggerRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    playClick();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = Date.now() + Math.random();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  }, []);

  const RippleLayer = () => (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.45)",
            pointerEvents: "none",
            transform: "translate(-50%, -50%) scale(0)",
            animation: "rippleExpand 0.6s ease-out forwards",
          }}
        />
      ))}
    </>
  );

  return { triggerRipple, RippleLayer };
}
