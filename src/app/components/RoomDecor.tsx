import { motion } from "motion/react";

interface DecorItem {
  emoji: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  rotate: number;
  opacity: number;
  delay: number;
  float?: boolean;
}

const ROOM_DECORS: DecorItem[][] = [
  // 0 — Couloir : bulletin board, punaises
  [
    { emoji: "📌", top: "8%", right: "6%",   size: 32, rotate: -15, opacity: 0.09, delay: 0,    float: false },
    { emoji: "📌", top: "22%", right: "12%", size: 22, rotate: 12,  opacity: 0.06, delay: 0.1,  float: false },
    { emoji: "📄", top: "18%", right: "7%",  size: 28, rotate: 4,   opacity: 0.07, delay: 0.15, float: false },
    { emoji: "📌", bottom: "28%", left: "5%", size: 20, rotate: 8,  opacity: 0.06, delay: 0.05, float: false },
    { emoji: "📄", bottom: "18%", left: "8%", size: 30, rotate: -6, opacity: 0.06, delay: 0.2,  float: false },
    { emoji: "🗒️", top: "55%", right: "4%",  size: 36, rotate: 3,   opacity: 0.05, delay: 0.25, float: true },
  ],
  // 1 — Salle 101 : crayon, règle, cahier
  [
    { emoji: "✏️", top: "10%", right: "5%",   size: 38, rotate: -30, opacity: 0.1,  delay: 0,    float: true },
    { emoji: "📐", bottom: "15%", right: "6%", size: 44, rotate: 18, opacity: 0.08, delay: 0.1,  float: false },
    { emoji: "📏", top: "40%", left: "3%",    size: 42, rotate: 90, opacity: 0.07, delay: 0.15, float: false },
    { emoji: "📓", bottom: "20%", left: "5%", size: 36, rotate: -5, opacity: 0.07, delay: 0.2,  float: true },
    { emoji: "🔢", top: "25%", left: "6%",   size: 24, rotate: 0,   opacity: 0.05, delay: 0.05, float: false },
  ],
  // 2 — CDI : livres, lampe lecture
  [
    { emoji: "📚", bottom: "10%", right: "4%", size: 48, rotate: 0,   opacity: 0.09, delay: 0,    float: true },
    { emoji: "📖", top: "12%", right: "5%",   size: 40, rotate: -8,  opacity: 0.08, delay: 0.1,  float: false },
    { emoji: "📗", top: "35%", left: "4%",    size: 34, rotate: 6,   opacity: 0.07, delay: 0.15, float: false },
    { emoji: "📕", bottom: "25%", left: "5%", size: 30, rotate: -4,  opacity: 0.06, delay: 0.2,  float: false },
    { emoji: "🕯️", top: "20%", left: "5%",   size: 32, rotate: 0,   opacity: 0.06, delay: 0.08, float: true },
  ],
  // 3 — Salle des profs : café, dossiers, stylos
  [
    { emoji: "☕", top: "10%", right: "5%",   size: 40, rotate: -5,  opacity: 0.1,  delay: 0,    float: true },
    { emoji: "📋", top: "30%", right: "5%",   size: 36, rotate: 8,   opacity: 0.08, delay: 0.1,  float: false },
    { emoji: "🖊️", bottom: "20%", right: "6%", size: 38, rotate: 45, opacity: 0.07, delay: 0.15, float: false },
    { emoji: "📁", bottom: "12%", left: "4%", size: 42, rotate: -3,  opacity: 0.07, delay: 0.2,  float: false },
    { emoji: "🗂️", top: "15%", left: "5%",   size: 36, rotate: 5,   opacity: 0.06, delay: 0.05, float: false },
  ],
  // 4 — Salle info : circuit, ordinateur, code
  [
    { emoji: "💻", top: "8%", right: "4%",    size: 46, rotate: -5,  opacity: 0.09, delay: 0,    float: true },
    { emoji: "⌨️", bottom: "15%", right: "4%", size: 44, rotate: 3,  opacity: 0.07, delay: 0.1,  float: false },
    { emoji: "🖱️", top: "45%", left: "4%",   size: 32, rotate: 0,   opacity: 0.07, delay: 0.15, float: false },
    { emoji: "💾", bottom: "22%", left: "5%", size: 34, rotate: -8,  opacity: 0.06, delay: 0.2,  float: false },
    { emoji: "🔌", top: "22%", left: "5%",   size: 30, rotate: 15,  opacity: 0.06, delay: 0.08, float: false },
  ],
  // 5 — Bureau du Prov. : clé, sceau, diplôme
  [
    { emoji: "🗝️", top: "10%", right: "5%",   size: 46, rotate: -20, opacity: 0.1,  delay: 0,    float: true },
    { emoji: "📜", top: "32%", right: "5%",   size: 40, rotate: 5,   opacity: 0.08, delay: 0.1,  float: false },
    { emoji: "🔏", bottom: "18%", right: "5%", size: 34, rotate: 0,  opacity: 0.07, delay: 0.15, float: false },
    { emoji: "🏛️", bottom: "12%", left: "4%", size: 44, rotate: -2,  opacity: 0.06, delay: 0.2,  float: false },
    { emoji: "⚖️", top: "18%", left: "5%",   size: 38, rotate: 3,   opacity: 0.07, delay: 0.05, float: true },
  ],
  // 6 — Hall des trophées : étoiles, lauriers, trophée
  [
    { emoji: "🏆", top: "8%", right: "4%",    size: 52, rotate: 0,   opacity: 0.1,  delay: 0,    float: true },
    { emoji: "⭐", top: "22%", right: "8%",   size: 28, rotate: 15,  opacity: 0.08, delay: 0.1,  float: true },
    { emoji: "⭐", bottom: "20%", right: "6%", size: 20, rotate: -10, opacity: 0.06, delay: 0.15, float: false },
    { emoji: "🎖️", bottom: "12%", left: "4%", size: 44, rotate: 8,  opacity: 0.08, delay: 0.2,  float: true },
    { emoji: "🌟", top: "15%", left: "6%",   size: 32, rotate: 0,   opacity: 0.07, delay: 0.08, float: true },
    { emoji: "🎗️", top: "45%", left: "4%",   size: 30, rotate: -5,  opacity: 0.06, delay: 0.25, float: false },
  ],
];

export function RoomDecor({ roomIndex }: { roomIndex: number }) {
  const decors = ROOM_DECORS[roomIndex] ?? [];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {decors.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: d.opacity, scale: 1 }}
          transition={{ duration: 0.6, delay: d.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: d.top,
            bottom: d.bottom,
            left: d.left,
            right: d.right,
            fontSize: d.size,
            transform: `rotate(${d.rotate}deg)`,
            userSelect: "none",
            animation: d.float ? "float 6s ease-in-out infinite" : undefined,
            animationDelay: `${d.delay * 2}s`,
          }}
        >
          {d.emoji}
        </motion.div>
      ))}
    </div>
  );
}
