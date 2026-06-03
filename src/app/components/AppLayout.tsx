import { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Map } from "lucide-react";
import tandemLogo from "../../../LOGO_TANDEM.png";

import { PassportModal } from "./PassportModal";
import { FacilitatorOverlay } from "./FacilitatorOverlay";
import { XpPanel } from "./XpPanel";
import { QuizModal } from "./QuizModal";
import { TreasureMap } from "./TreasureMap";
import { setQuizListener } from "../quizStore";
import { addXp } from "../xpStore";
import type { QuizQuestion } from "../quizStore";

const ROOMS = [
  { path: "/step/1", label: "Structurer une séquence de cours", short: "Intro",    icon: "📚", desc: "Introduction au cas d'usage",          color: "#1da82a", time: 2 },
  { path: "/step/2", label: "Questionnaire structurant",        short: "Infos",    icon: "📝", desc: "Informations essentielles",            color: "#ff33ad", time: 2 },
  { path: "/step/3", label: "L'IA dans ta pratique",            short: "Recul",    icon: "🔍", desc: "Ce qu'il faut savoir",               color: "#ffd41d", time: 2 },
  { path: "/step/4", label: "Mission accomplie",                short: "Trophée",  icon: "🏆", desc: "Prompt + Fiche réflexe",             color: "#1da82a", time: 2 },
];

// Track which rooms granted XP this session to avoid double-awarding
const XP_ROOMS_KEY = "tandem_xp_rooms";
function getRoomsWithXp(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(XP_ROOMS_KEY) || "[]")); } catch { return new Set(); }
}
function markRoomXp(path: string) {
  const s = getRoomsWithXp();
  s.add(path);
  localStorage.setItem(XP_ROOMS_KEY, JSON.stringify([...s]));
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [passportOpen, setPassportOpen] = useState(false);
  const [facilitatorOpen, setFacilitatorOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [quizOnPass, setQuizOnPass] = useState<(() => void) | null>(null);

  const currentIndex = Math.max(0, ROOMS.findIndex((r) => r.path === location.pathname));
  const currentRoom = ROOMS[currentIndex];
  const timeLeft = ROOMS.slice(currentIndex).reduce((acc, r) => acc + r.time, 0);
  const progress = ((currentIndex + 1) / ROOMS.length) * 100;

  // Register quiz listener
  useEffect(() => {
    setQuizListener((q, onPass) => {
      setQuizQuestion(q);
      setQuizOnPass(() => onPass);
    });
  }, []);

  // Award +50 XP for each new room visited
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/step/")) {
      const visited = getRoomsWithXp();
      if (!visited.has(path)) {
        markRoomXp(path);
        addXp(50);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);


  // Shift+F → facilitator mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "F") {
        setFacilitatorOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleQuizPass = useCallback(() => {
    setQuizQuestion(null);
    if (quizOnPass) {
      quizOnPass();
      setQuizOnPass(null);
    }
  }, [quizOnPass]);

  const handleQuizClose = useCallback(() => {
    setQuizQuestion(null);
    setQuizOnPass(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "#FFF8F0" }}>

      {/* Subtle warm grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── DOOR TRANSITION ── */}
      <motion.div
        key={`dl_${location.pathname}`}
        initial={{ x: 0 }}
        animate={{ x: "-101%" }}
        transition={{ duration: 0.44, ease: [0.65, 0, 0.35, 1], delay: 0.05 }}
        className="fixed top-0 left-0 h-full pointer-events-none"
        style={{ width: "50vw", background: "#FFF8F0", zIndex: 400, borderRight: "2px solid rgba(255,212,29,0.28)", boxShadow: "6px 0 28px rgba(0,0,0,0.07)" }}
      >
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-full" style={{ background: "rgba(255,212,29,0.45)" }} />
      </motion.div>
      <motion.div
        key={`dr_${location.pathname}`}
        initial={{ x: 0 }}
        animate={{ x: "101%" }}
        transition={{ duration: 0.44, ease: [0.65, 0, 0.35, 1], delay: 0.05 }}
        className="fixed top-0 right-0 h-full pointer-events-none"
        style={{ width: "50vw", background: "#FFF8F0", zIndex: 400, borderLeft: "2px solid rgba(255,212,29,0.28)", boxShadow: "-6px 0 28px rgba(0,0,0,0.07)" }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-full" style={{ background: "rgba(255,212,29,0.45)" }} />
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(calc(-50% - 25vw), -50%)", width: "100vw", textAlign: "center", pointerEvents: "none" }}
        >
          <span style={{ fontSize: 32 }}>{currentRoom.icon}</span>
          <div style={{ color: currentRoom.color, fontFamily: "monospace", fontSize: 10, letterSpacing: 3, fontWeight: 700, marginTop: 6 }}>
            {currentRoom.label.toUpperCase()}
          </div>
        </motion.div>
      </motion.div>

      {/* ── OVERLAYS ── */}
      <PassportModal
        open={passportOpen}
        onClose={() => setPassportOpen(false)}
        rooms={ROOMS}
        currentIndex={currentIndex}
      />
      <FacilitatorOverlay
        open={facilitatorOpen}
        onClose={() => setFacilitatorOpen(false)}
        rooms={ROOMS}
        currentIndex={currentIndex}
      />
      <TreasureMap
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        rooms={ROOMS}
        currentIndex={currentIndex}
      />
      <QuizModal
        question={quizQuestion}
        onPass={handleQuizPass}
        onClose={handleQuizClose}
      />
      <XpPanel />

      {/* ── HEADER ── */}
      <header
        className="relative z-30 sticky top-0"
        style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center justify-self-start flex-shrink-0">
            <img
              src={tandemLogo}
              alt="TANDEM"
              style={{ height: 40, width: "auto", objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </button>

          {/* Room mini-map */}
          <div className="hidden md:flex items-center justify-center gap-0.5">
            {ROOMS.map((room, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const locked = i > currentIndex;
              return (
                <motion.button
                  key={room.path}
                  onClick={() => navigate(room.path)}
                  title={room.label}
                  whileHover={{ scale: 1.08 }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300"
                  style={{ background: active ? `${room.color}15` : done ? "rgba(0,0,0,0.03)" : "transparent", border: active ? `1px solid ${room.color}40` : "1px solid transparent", opacity: locked ? 0.35 : 1 }}
                >
                  <span style={{ fontSize: 15 }}>{done ? "✅" : room.icon}</span>
                  <span style={{ color: active ? room.color : done ? "#9C8B76" : "#C4B8AE", fontSize: 8, fontFamily: "monospace", fontWeight: active ? 700 : 400 }}>
                    {room.short}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Right: map button + timer + backpack */}
          <div className="flex items-center justify-self-end gap-2 flex-shrink-0">
            {/* Treasure map button */}
            <motion.button
              onClick={() => setMapOpen(true)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ border: "1px solid rgba(255,212,29,0.4)", background: "#fffce6", cursor: "pointer" }}
              title="Carte du campus"
            >
              <Map size={13} style={{ color: "#ffc200" }} />
              <span style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 9, fontWeight: 700 }}>CARTE</span>
            </motion.button>

            {timeLeft > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#F9F4EE" }}>
                <span style={{ fontSize: 10 }}>🔔</span>
                <span style={{ color: "#4A3D30", fontFamily: "monospace", fontSize: 10 }}>~{timeLeft} min</span>
              </div>
            )}

            {/* Progress indicator */}
            <motion.button
              onClick={() => setPassportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ border: "1px solid rgba(255,212,29,0.35)", background: "#fffce6", cursor: "pointer" }}
              whileHover={{ scale: 1.04 }}
              title="Voir la progression"
            >
              <span style={{ fontSize: 14 }}>📊</span>
              <span style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 10, fontWeight: 800 }}>
                {currentIndex + 1}<span style={{ color: "#C4B8AE" }}>/{ROOMS.length}</span>
              </span>
            </motion.button>
          </div>
        </div>

        {/* Door plate */}
        <motion.div
          key={currentRoom.path}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3 px-5 py-2"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)", background: `${currentRoom.color}08` }}
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: `${currentRoom.color}18`, border: `1px solid ${currentRoom.color}35` }}>
            <span style={{ fontSize: 13 }}>{currentRoom.icon}</span>
            <span style={{ color: currentRoom.color, fontFamily: "monospace", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>
              {currentRoom.label.toUpperCase()}
            </span>
          </div>
          <span style={{ color: "#C4B8AE", fontSize: 10 }}>·</span>
          <span style={{ color: "#9C8B76", fontSize: 11 }}>{currentRoom.desc}</span>
          <span style={{ color: "#C4B8AE", fontSize: 9, fontFamily: "monospace", marginLeft: "auto" }}>
            SALLE {String(currentIndex + 1).padStart(2, "0")}/{ROOMS.length}
          </span>
        </motion.div>
      </header>

      {/* ── PROGRESS BAR WITH WALKING TEACHER ── */}
      <div className="relative z-20 w-full" style={{ height: 28, background: "#F5EFE8" }}>
        <motion.div
          className="absolute top-0 left-0 h-full"
          style={{ background: "linear-gradient(90deg, #ff33ad 0%, #ffd41d 50%, #1da82a 100%)", opacity: 0.25 }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <div className="absolute inset-0 flex items-center px-2 gap-0" style={{ pointerEvents: "none" }}>
          {ROOMS.map((_, i) => (
            <div key={i} className="flex-1 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: i < currentIndex ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.08)" }} />
            </div>
          ))}
        </div>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ left: `calc(${progress}% - 10px)` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ fontSize: 16, lineHeight: 1 }}
        >
          🧑‍🏫
        </motion.div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 8 }}>
          {String(currentIndex + 1).padStart(2, "0")}/{ROOMS.length}
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="relative flex-1 flex flex-col"
            style={{ zIndex: 1 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="relative z-20 flex items-center justify-between px-6 py-2.5"
        style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#FFFFFF" }}
      >
        <span style={{ color: "#C4B8AE", fontSize: 9, fontFamily: "monospace" }}>🏫 CAMPUS TANDEM · Y-DAYS 2026 · GROUPE 11</span>
        <button
          onClick={() => setFacilitatorOpen(true)}
          title="Mode facilitateur (Shift+F)"
          style={{ color: "rgba(0,0,0,0.1)", fontSize: 9, fontFamily: "monospace", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#9C8B76")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,0,0,0.1)")}
        >
          L'IA SERT D'APPUI, PAS DE REMPLACEMENT
        </button>
      </footer>
    </div>
  );
}
