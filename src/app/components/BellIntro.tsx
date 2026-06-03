import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import tandemLogo from "../../../LOGO_TANDEM.png";
import { STORAGE_KEYS } from "../modules/shared/storageKeys";
import { hasStoredItem, writeStoredItem } from "../modules/shared/storage";

export function BellIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"bell" | "doors" | "done">("bell");
  const [count, setCount] = useState(3);

  useEffect(() => {
    // Countdown 3→2→1
    const intervals = [
      setTimeout(() => setCount(2), 900),
      setTimeout(() => setCount(1), 1800),
      setTimeout(() => setPhase("doors"), 2600),
      setTimeout(() => {
        setPhase("done");
        writeStoredItem(STORAGE_KEYS.introSeen, "1");
        onDone();
      }, 3200),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ background: "#FFF8F0" }}
        >
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

          {/* Door panels — slide out on "doors" phase */}
          <motion.div
            initial={{ x: 0 }}
            animate={phase === "doors" ? { x: "-101%" } : { x: 0 }}
            transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-0 left-0 h-full"
            style={{ width: "50%", background: "#FFF8F0", zIndex: 10, borderRight: "2px solid rgba(255,212,29,0.3)", boxShadow: "6px 0 28px rgba(0,0,0,0.07)" }}
          >
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full" style={{ background: "rgba(255,212,29,0.5)" }} />
          </motion.div>
          <motion.div
            initial={{ x: 0 }}
            animate={phase === "doors" ? { x: "101%" } : { x: 0 }}
            transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-0 right-0 h-full"
            style={{ width: "50%", background: "#FFF8F0", zIndex: 10, borderLeft: "2px solid rgba(255,212,29,0.3)", boxShadow: "-6px 0 28px rgba(0,0,0,0.07)" }}
          >
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full" style={{ background: "rgba(255,212,29,0.5)" }} />
          </motion.div>

          {/* Center content */}
          <div className="relative z-20 flex flex-col items-center text-center px-6">
            {/* Bell */}
            <motion.div
              animate={{ rotate: [-18, 18, -14, 14, -8, 8, -4, 4, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 }}
              style={{ fontSize: "clamp(64px,14vw,96px)", lineHeight: 1, marginBottom: 16 }}
            >
              🔔
            </motion.div>

            {/* Logo */}
            <img
              src={tandemLogo}
              alt="TANDEM"
              style={{ height: 72, width: "auto", objectFit: "contain", mixBlendMode: "multiply", marginBottom: 12 }}
            />
            <h1 style={{ color: "#1A1208", fontSize: "clamp(28px,6vw,48px)", fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>
              Bonne rentrée,{" "}
              <span style={{ color: "#ffd41d" }}>explorateur·rice !</span>
            </h1>
            <p style={{ color: "#9C8B76", fontSize: 14, marginBottom: 28 }}>
              Les portes du campus s'ouvrent dans…
            </p>

            {/* Countdown */}
            <AnimatePresence mode="wait">
              <motion.div
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#ffc200,#ffd41d)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#1A1208",
                  fontFamily: "'Bebas Neue', sans-serif",
                  boxShadow: "0 4px 20px rgba(255,212,29,0.35)",
                }}
              >
                {count}
              </motion.div>
            </AnimatePresence>

            {/* Skip */}
            <button
              onClick={() => {
                writeStoredItem(STORAGE_KEYS.introSeen, "1");
                onDone();
              }}
              style={{ marginTop: 24, color: "#C4B8AE", fontSize: 11, fontFamily: "monospace", background: "none", border: "none", cursor: "pointer" }}
            >
              PASSER →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function shouldShowIntro(): boolean {
  return !hasStoredItem(STORAGE_KEYS.introSeen);
}
