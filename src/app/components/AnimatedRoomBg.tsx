import { useMemo } from "react";

// Deterministic pseudo-random so particles don't shift on re-render
function sr(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

interface AnimatedRoomBgProps {
  roomIndex: number;
}

export function AnimatedRoomBg({ roomIndex }: AnimatedRoomBgProps) {
  const bg = useMemo(() => ROOMS[roomIndex] ?? ROOMS[0], [roomIndex]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {bg}
    </div>
  );
}

/* ─── helpers ─── */

function Particle({ style, anim }: { style: React.CSSProperties; anim: string }) {
  return <div style={{ position: "absolute", ...style, animation: anim }} />;
}

function TextGhost({ children, style, anim }: { children: string; style: React.CSSProperties; anim: string }) {
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: "monospace",
        userSelect: "none",
        whiteSpace: "nowrap",
        animation: anim,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   ROOM 0 — Couloir : couloir en perspective
   ────────────────────────────────────────────── */
const Couloir = (
  <>
    {/* Warm ceiling glow */}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 40% at 50% -5%, rgba(255,212,29,0.07) 0%, transparent 70%)" }} />

    {/* Vanishing-point corridor lines */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.055 }} preserveAspectRatio="none">
      {[0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9].map((t, i) => (
        <line key={i} x1={`${t * 100}%`} y1="0" x2="50%" y2="50%" stroke="#1A1208" strokeWidth="0.8" />
      ))}
      {/* Floor lines */}
      {[0.55, 0.65, 0.75, 0.85, 0.95].map((t, i) => (
        <line key={`f${i}`} x1="0" y1={`${t * 100}%`} x2="100%" y2={`${t * 100}%`} stroke="#1A1208" strokeWidth="0.5" />
      ))}
      {/* Locker silhouettes left */}
      {[0, 1, 2].map((i) => (
        <rect key={`l${i}`} x={`${2 + i * 4}%`} y="5%" width="3%" height="45%" rx="2" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
      ))}
      {/* Locker silhouettes right */}
      {[0, 1, 2].map((i) => (
        <rect key={`r${i}`} x={`${82 - i * 4}%`} y="5%" width="3%" height="45%" rx="2" fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
      ))}
    </svg>

    {/* Drifting paper notes */}
    {Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${10 + sr(i) * 80}%`,
          top: `${sr(i + 5) * 60}%`,
          width: 28 + sr(i + 10) * 16,
          height: 20 + sr(i + 15) * 12,
          background: "#FFFFFF",
          borderRadius: 2,
          opacity: 0,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          animation: `paperSway ${4 + sr(i + 20) * 3}s ease-in-out infinite`,
          animationDelay: `${sr(i + 25) * 2}s`,
        }}
      />
    ))}
  </>
);

/* ──────────────────────────────────────────────
   ROOM 1 — Salle 101 : tableau, craie, formules
   ────────────────────────────────────────────── */
const CHALK_SYMBOLS = ["∑", "∫", "π", "√x", "f(x)", "dx", "α", "β", "∆y", "≈", "→", "x²"];
const Salle101 = (
  <>
    {/* Subtle green chalkboard tint */}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(30,60,45,0.04) 0%, transparent 50%)" }} />

    {/* Chalkboard silhouette top */}
    <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "18%", background: "rgba(30,60,45,0.05)", borderRadius: "0 0 8px 8px", border: "1px solid rgba(30,60,45,0.06)" }} />

    {/* Horizontal ruled lines */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1="0" y1={`${22 + i * 6}%`} x2="100%" y2={`${22 + i * 6}%`} stroke="#1A6040" strokeWidth="1" />
      ))}
    </svg>

    {/* Fading chalk symbols */}
    {CHALK_SYMBOLS.map((sym, i) => (
      <TextGhost
        key={i}
        style={{
          left: `${5 + sr(i) * 85}%`,
          top: `${5 + sr(i + 6) * 25}%`,
          fontSize: 12 + sr(i + 12) * 8,
          color: "rgba(30,60,45,0.12)",
          fontWeight: 700,
        }}
        anim={`twinkle ${5 + sr(i + 18) * 4}s ease-in-out infinite`}
      >
        {sym}
      </TextGhost>
    ))}

    {/* Chalk dust particles */}
    {Array.from({ length: 14 }, (_, i) => (
      <Particle
        key={i}
        style={{
          left: `${sr(i) * 90}%`,
          bottom: `${15 + sr(i + 7) * 30}%`,
          width: 2 + sr(i + 14) * 3,
          height: 2 + sr(i + 14) * 3,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
        }}
        anim={`floatUp ${3 + sr(i + 21) * 4}s ease-out infinite`}
      />
    ))}
  </>
);

/* ──────────────────────────────────────────────
   ROOM 2 — CDI : bibliothèque, poussière, lampe
   ────────────────────────────────────────────── */
const CDI = (
  <>
    {/* Warm reading lamp glow — left + right corners */}
    <div style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "50%", background: "radial-gradient(ellipse at 10% 0%, rgba(255,180,80,0.09) 0%, transparent 70%)" }} />
    <div style={{ position: "absolute", top: 0, right: 0, width: "35%", height: "50%", background: "radial-gradient(ellipse at 90% 0%, rgba(255,180,80,0.07) 0%, transparent 70%)" }} />

    {/* Bookshelf silhouettes — sides */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}>
      {/* Left shelf */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={`ls${i}`} x="0" y={`${10 + i * 16}%`} width={`${3 + sr(i) * 2}%`} height={`${12 + sr(i + 5) * 4}%`} rx="1" fill="#8B5E3C" />
      ))}
      {/* Right shelf */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={`rs${i}`} x={`${97 - sr(i) * 2}%`} y={`${8 + i * 16}%`} width={`${3 + sr(i + 8) * 2}%`} height={`${13 + sr(i + 13) * 3}%`} rx="1" fill="#8B5E3C" />
      ))}
      {/* Shelf boards */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={`sb${i}`} x="0" y={`${22 + i * 16}%`} width="5%" height="1%" fill="#6B4423" opacity="0.5" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={`sbr${i}`} x="95%" y={`${22 + i * 16}%`} width="5%" height="1%" fill="#6B4423" opacity="0.5" />
      ))}
    </svg>

    {/* Dust motes */}
    {Array.from({ length: 20 }, (_, i) => (
      <Particle
        key={i}
        style={{
          left: `${sr(i) * 90}%`,
          top: `${sr(i + 10) * 70}%`,
          width: 2,
          height: 2,
          borderRadius: "50%",
          background: "rgba(200,160,80,0.7)",
        }}
        anim={`${i % 2 === 0 ? "dustDrift" : "dustDriftLeft"} ${6 + sr(i + 20) * 6}s ease-in-out infinite`}
      />
    ))}
  </>
);

/* ──────────────────────────────────────────────
   ROOM 3 — Salle des profs : café, fenêtre, chaleur
   ────────────────────────────────────────────── */
const SalleProfs = (
  <>
    {/* Cozy warm tint */}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 75% 20%, rgba(255,160,50,0.07) 0%, transparent 70%)" }} />

    {/* Window light patch */}
    <div style={{ position: "absolute", top: "5%", right: "8%", width: "18%", height: "35%", background: "linear-gradient(135deg, rgba(255,220,100,0.08), transparent)", borderRadius: 4, animation: "windowLight 4s ease-in-out infinite" }} />

    {/* Coffee cup silhouette */}
    <svg style={{ position: "absolute", bottom: "12%", right: "7%", width: 40, height: 40, opacity: 0.07 }}>
      <ellipse cx="20" cy="30" rx="14" ry="5" fill="#8B5E3C" />
      <rect x="8" y="12" width="24" height="18" rx="3" fill="#8B5E3C" />
      <path d="M32 18 Q40 20 38 26 Q36 30 32 28" fill="none" stroke="#8B5E3C" strokeWidth="2.5" />
    </svg>

    {/* Steam particles */}
    {Array.from({ length: 6 }, (_, i) => (
      <Particle
        key={i}
        style={{
          right: `${8 + sr(i) * 5}%`,
          bottom: `${28 + sr(i + 5) * 8}%`,
          width: 5 + sr(i + 10) * 6,
          height: 5 + sr(i + 10) * 6,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.6)",
          filter: "blur(3px)",
        }}
        anim={`floatUp ${2.5 + sr(i + 15) * 2}s ease-out infinite`}
      />
    ))}

    {/* Stacked papers */}
    <svg style={{ position: "absolute", bottom: "10%", left: "6%", width: 60, height: 50, opacity: 0.06 }}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={i * 2} y={i * 4} width="55" height="42" rx="2" fill="#1A1208" stroke="#1A1208" strokeWidth="0.5" />
      ))}
    </svg>
  </>
);

/* ──────────────────────────────────────────────
   ROOM 4 — Salle info : matrix, écrans, curseurs
   ────────────────────────────────────────────── */
const CODE_CHARS = "01アイウエオカキ∑∫αβπ01";
const SalleInfo = (
  <>
    {/* Cool blue ambient */}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,150,220,0.05) 0%, transparent 70%)" }} />

    {/* Screen glow panels */}
    {[15, 40, 65].map((left, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: "8%",
          left: `${left}%`,
          width: "18%",
          height: "22%",
          background: "rgba(0,180,200,0.04)",
          borderRadius: 4,
          border: "1px solid rgba(0,200,220,0.06)",
          boxShadow: "0 0 20px rgba(0,180,200,0.04)",
        }}
      />
    ))}

    {/* Falling code columns */}
    {Array.from({ length: 10 }, (_, col) => (
      <div
        key={col}
        style={{
          position: "absolute",
          left: `${4 + col * 10}%`,
          top: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          animation: `matrixFall ${6 + sr(col) * 5}s linear infinite`,
          animationDelay: `${sr(col + 5) * 4}s`,
        }}
      >
        {Array.from({ length: 8 }, (_, row) => (
          <span
            key={row}
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "#1da82a",
              opacity: 0.08 + sr(col * 8 + row) * 0.06,
              lineHeight: 1,
            }}
          >
            {CODE_CHARS[Math.floor(sr(col * 10 + row) * CODE_CHARS.length)]}
          </span>
        ))}
      </div>
    ))}

    {/* Blinking cursor */}
    {[30, 55, 72].map((left, i) => (
      <Particle
        key={i}
        style={{
          left: `${left}%`,
          top: `${40 + i * 12}%`,
          width: 7,
          height: 13,
          background: "#1da82a",
          opacity: 0.12,
        }}
        anim={`blink ${0.9 + i * 0.2}s step-end infinite`}
      />
    ))}
  </>
);

/* ──────────────────────────────────────────────
   ROOM 5 — Bureau du Prov. : rayon de lumière, poussière officielle
   ────────────────────────────────────────────── */
const BureauProv = (
  <>
    {/* Dark formal tint */}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(60,30,10,0.05) 0%, transparent 60%)" }} />

    {/* Spotlight beam */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "40%",
        width: "20%",
        height: "100%",
        background: "linear-gradient(180deg, rgba(255,212,29,0.08) 0%, transparent 70%)",
        clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
        animation: "spotlightSway 7s ease-in-out infinite",
      }}
    />

    {/* Dust in spotlight */}
    {Array.from({ length: 12 }, (_, i) => (
      <Particle
        key={i}
        style={{
          left: `${42 + sr(i) * 16}%`,
          top: `${sr(i + 6) * 60}%`,
          width: 2,
          height: 2,
          borderRadius: "50%",
          background: "rgba(255,212,29,0.7)",
        }}
        anim={`${i % 2 === 0 ? "dustDrift" : "dustDriftLeft"} ${7 + sr(i + 12) * 5}s ease-in-out infinite`}
      />
    ))}

    {/* Diploma frames on wall */}
    <svg style={{ position: "absolute", top: "5%", left: "3%", width: 80, height: 60, opacity: 0.055 }}>
      <rect x="0" y="0" width="80" height="60" rx="3" fill="none" stroke="#8B5E3C" strokeWidth="3" />
      <rect x="6" y="6" width="68" height="48" rx="2" fill="none" stroke="#8B5E3C" strokeWidth="1" />
    </svg>
    <svg style={{ position: "absolute", top: "5%", right: "3%", width: 65, height: 50, opacity: 0.045 }}>
      <rect x="0" y="0" width="65" height="50" rx="3" fill="none" stroke="#8B5E3C" strokeWidth="2.5" />
      <rect x="5" y="5" width="55" height="40" rx="2" fill="none" stroke="#8B5E3C" strokeWidth="1" />
    </svg>
  </>
);

/* ──────────────────────────────────────────────
   ROOM 6 — Hall des trophées : confetti doré, spotlight
   ────────────────────────────────────────────── */
const HallTrophees = (
  <>
    {/* Golden ambient glow */}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,212,29,0.1) 0%, transparent 65%)" }} />

    {/* Spotlight cone */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "35%",
        width: "30%",
        height: "100%",
        background: "linear-gradient(180deg, rgba(255,212,29,0.1) 0%, transparent 60%)",
        clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
        animation: "spotlightSway 5s ease-in-out infinite",
      }}
    />

    {/* Trophy silhouettes */}
    <svg style={{ position: "absolute", bottom: "8%", left: "4%", width: 50, height: 70, opacity: 0.07 }}>
      <ellipse cx="25" cy="65" rx="18" ry="4" fill="#ffd41d" />
      <rect x="20" y="55" width="10" height="10" fill="#ffd41d" />
      <rect x="15" y="50" width="20" height="6" rx="2" fill="#ffd41d" />
      <path d="M8 10 Q8 42 25 42 Q42 42 42 10 Z" fill="#ffd41d" />
      <path d="M8 16 Q0 20 2 30 Q4 38 12 36" fill="none" stroke="#ffd41d" strokeWidth="3" />
      <path d="M42 16 Q50 20 48 30 Q46 38 38 36" fill="none" stroke="#ffd41d" strokeWidth="3" />
    </svg>
    <svg style={{ position: "absolute", bottom: "8%", right: "4%", width: 40, height: 56, opacity: 0.06 }}>
      <ellipse cx="20" cy="52" rx="14" ry="3" fill="#ffd41d" />
      <rect x="16" y="44" width="8" height="8" fill="#ffd41d" />
      <rect x="12" y="40" width="16" height="5" rx="2" fill="#ffd41d" />
      <path d="M6 8 Q6 34 20 34 Q34 34 34 8 Z" fill="#ffd41d" />
    </svg>

    {/* Gold confetti rain */}
    {Array.from({ length: 20 }, (_, i) => {
      const isCircle = sr(i) > 0.5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${sr(i) * 95}%`,
            top: 0,
            width: isCircle ? 5 : 7,
            height: isCircle ? 5 : 3,
            borderRadius: isCircle ? "50%" : 1,
            background: i % 3 === 0 ? "#ff33ad" : i % 3 === 1 ? "#ffd41d" : "#1da82a",
            opacity: 0,
            animation: `goldRain ${4 + sr(i + 10) * 4}s linear infinite`,
            animationDelay: `${sr(i + 20) * 4}s`,
          }}
        />
      );
    })}

    {/* Sparkling stars */}
    {Array.from({ length: 8 }, (_, i) => (
      <TextGhost
        key={i}
        style={{
          left: `${8 + sr(i) * 80}%`,
          top: `${10 + sr(i + 8) * 60}%`,
          fontSize: 14 + sr(i + 16) * 10,
          color: "#ffd41d",
          opacity: 0,
        }}
        anim={`twinkle ${2 + sr(i + 24) * 3}s ease-in-out infinite`}
      >
        ✦
      </TextGhost>
    ))}
  </>
);

const ROOMS = [Couloir, Salle101, CDI, SalleProfs, SalleInfo, BureauProv, HallTrophees];
