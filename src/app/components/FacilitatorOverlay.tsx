import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, Clock, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router";

interface Room {
  path: string;
  label: string;
  short: string;
  icon: string;
  desc: string;
  color: string;
  time: number;
}

interface FacilitatorOverlayProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  currentIndex: number;
}

const ROOM_TIPS = [
  "Point d'entrée émotionnel : les 40h. Laisser le terminal charger, ne pas zapper.",
  "Encourager à remplir les 4 questions honnêtement — les réponses personnalisent la suite.",
  "Lire les 2 histoires de Marie dans l'ordre. Elles posent le fil rouge du kit.",
  "L'accordéon doit être parcouru section par section — pas de scroll rapide.",
  "Le switch IA est le moment clé. Laisser les participants réfléchir avant d'activer.",
  "Les 4 principes doivent être débattus à voix haute avant validation.",
  "Moment de clôture : chaque participant copie au moins un prompt avant de quitter.",
];

export function FacilitatorOverlay({ open, onClose, rooms, currentIndex }: FacilitatorOverlayProps) {
  const navigate = useNavigate();
  const totalTime = rooms.reduce((acc, r) => acc + r.time, 0);
  const timeLeft = rooms.slice(currentIndex).reduce((acc, r) => acc + r.time, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800]"
            style={{ background: "rgba(26,18,8,0.6)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full z-[900] overflow-y-auto"
            style={{
              width: "min(420px, 92vw)",
              background: "#1A1208",
              boxShadow: "-8px 0 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ borderBottom: "1px solid rgba(255,212,29,0.15)", background: "#1A1208", zIndex: 10 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,212,29,0.15)", border: "1px solid rgba(255,212,29,0.3)" }}
                >
                  <span style={{ color: "#ffd41d", fontFamily: "monospace", fontSize: 9, letterSpacing: 2, fontWeight: 700 }}>
                    MODE FACILITATEUR
                  </span>
                </div>
                <Users size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <X size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Clock size={13} />, label: "Temps total", value: `${totalTime} min` },
                  { icon: <BookOpen size={13} />, label: "Salles restantes", value: `${rooms.length - currentIndex}/7` },
                  { icon: <ChevronRight size={13} />, label: "Temps restant", value: `~${timeLeft} min` },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div style={{ color: "#ffd41d", marginBottom: 4, display: "flex", justifyContent: "center" }}>{s.icon}</div>
                    <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>{s.value}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "monospace", marginTop: 2 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Hint actif */}
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,212,29,0.08)", border: "1px solid rgba(255,212,29,0.2)" }}
              >
                <div style={{ color: "#ffd41d", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>
                  💡 CONSEIL — SALLE ACTUELLE
                </div>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.65 }}>
                  {ROOM_TIPS[currentIndex]}
                </p>
              </div>

              {/* Room list */}
              <div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>
                  NAVIGATION RAPIDE
                </div>
                <div className="space-y-2">
                  {rooms.map((room, i) => {
                    const done = i < currentIndex;
                    const active = i === currentIndex;
                    const locked = i > currentIndex;
                    return (
                      <motion.button
                        key={room.path}
                        onClick={() => { navigate(room.path); onClose(); }}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                        style={{
                          background: active
                            ? `${room.color}18`
                            : "rgba(255,255,255,0.04)",
                          border: active
                            ? `1px solid ${room.color}40`
                            : "1px solid transparent",
                          opacity: locked ? 0.45 : 1,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{done ? "✅" : room.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: active ? room.color : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: active ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {room.label}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "monospace" }}>
                            {room.desc}
                          </div>
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 9, flexShrink: 0 }}>
                          {room.time > 0 ? `${room.time}min` : "—"}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Tip footer */}
              <div className="text-center pb-2">
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 9, fontFamily: "monospace" }}>
                  SHIFT+F POUR FERMER · VISIBLE ANIMATEUR SEULEMENT
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
