import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useCtaRipple } from "./useCtaRipple";
import confetti from "canvas-confetti";
import tandemLogo from "../../../LOGO_TANDEM.png";

const ROOMS = [
  { step: 1, icon: "📚", label: "Structurer une séquence de cours", desc: "Introduction au cas d'usage",        color: "#1da82a" },
  { step: 2, icon: "📝", label: "Questionnaire structurant",        desc: "Informations essentielles",          color: "#ff33ad" },
  { step: 3, icon: "🔍", label: "L'IA dans ta pratique",            desc: "Ce qu'il faut savoir",               color: "#ffd41d" },
  { step: 4, icon: "🏆", label: "Mission accomplie",                desc: "Prompt + Fiche réflexe",             color: "#1da82a" },
];

const CARD_ROTATIONS = [-2, 1.5, -1.5, 2];

const STATS = [
  { icon: "⏱", value: "8 min",   label: "chrono",          color: "#ff33ad" },
  { icon: "🎒", value: "4",       label: "salles à explorer", color: "#1da82a" },
  { icon: "⚡", value: "3 quiz",  label: "entre les salles", color: "#ffd41d" },
  { icon: "📄", value: "1 fiche",label: "PDF à emporter",   color: "#ff33ad" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [bellRang, setBellRang] = useState(false);
  const { triggerRipple, RippleLayer } = useCtaRipple();

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true), 100);
    const t2 = setTimeout(() => setBellRang(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleLaunch = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (launched) return;
    triggerRipple(e);
    setLaunched(true);
    confetti({ particleCount: 120, spread: 85, origin: { y: 0.55 }, colors: ["#ffd41d", "#1da82a", "#ff33ad", "#ffc200"] });
    setTimeout(() => navigate("/step/1"), 650);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#FFF8F0" }}>
      {/* Warm grid — same as AppLayout */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Soft color blobs — coherent with the palette */}
      <motion.div
        animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute pointer-events-none"
        style={{ top: "-8%", right: "-6%", width: "38vw", height: "38vw", maxWidth: 420, maxHeight: 420, borderRadius: "50%", background: "#ff33ad", filter: "blur(90px)", opacity: 0.08 }}
      />
      <motion.div
        animate={{ x: [0, -14, 0], y: [0, 16, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute pointer-events-none"
        style={{ bottom: "10%", left: "-5%", width: "32vw", height: "32vw", maxWidth: 380, maxHeight: 380, borderRadius: "50%", background: "#1da82a", filter: "blur(80px)", opacity: 0.08 }}
      />
      <motion.div
        animate={{ x: [0, 10, 0], y: [0, -18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        className="absolute pointer-events-none"
        style={{ top: "30%", left: "40%", width: "28vw", height: "28vw", maxWidth: 340, maxHeight: 340, borderRadius: "50%", background: "#ffd41d", filter: "blur(100px)", opacity: 0.1 }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── HEADER — même style qu'AppLayout ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
        >
          {/* Logo */}
          <img
            src={tandemLogo}
            alt="TANDEM"
            style={{ height: 36, width: "auto", objectFit: "contain", mixBlendMode: "multiply" }}
          />

          {/* Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border: "1px solid rgba(255,212,29,0.35)", background: "#fffce6" }}>
            <motion.span
              animate={bellRang ? { rotate: [-12, 12, -8, 8, 0] } : {}}
              transition={{ duration: 0.7 }}
              style={{ fontSize: 12 }}
            >
              🔔
            </motion.span>
            <span style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 9, letterSpacing: 2 }}>Y-DAYS 2026 · GROUPE 11</span>
          </div>
        </motion.header>

        {/* ── HERO ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">

          {/* Logo large */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={ready ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.08 }}
            className="mb-5"
          >
            <img
              src={tandemLogo}
              alt="TANDEM"
              style={{ height: "clamp(72px, 15vw, 120px)", width: "auto", objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="mb-3"
          >
            <h1 style={{ color: "#1A1208", fontSize: "clamp(44px, 10vw, 96px)", lineHeight: 0.9, letterSpacing: "0.01em" }}>
              LA CHASSE{" "}
              <span style={{ WebkitTextStroke: "2px #ffd41d", color: "transparent" }}>AU TRÉSOR</span>
              <br />
              <span style={{ color: "#ffd41d" }}>DU CAMPUS</span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : {}}
            transition={{ delay: 0.28 }}
            style={{ color: "#9C8B76", fontSize: 13, lineHeight: 1.7, maxWidth: 400, marginBottom: 28 }}
          >
            Explore 4 salles, passe 3 quiz et repars avec ta fiche réflexe IA prête à l'emploi.
          </motion.p>

          {/* Stats — même style pill que les écrans intérieurs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.36 }}
            className="flex items-center gap-2 flex-wrap justify-center mb-8"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "#FFFFFF", border: `1px solid ${s.color}30`, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
              >
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <span style={{ color: s.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: 15 }}>{s.value}</span>
                <span style={{ color: "#9C8B76", fontSize: 11 }}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA — même style gradient que les screens */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={ready ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.44, type: "spring", stiffness: 260, damping: 20 }}
            className="mb-12"
          >
            <motion.button
              onClick={handleLaunch}
              disabled={launched}
              whileHover={!launched ? { scale: 1.04 } : {}}
              whileTap={!launched ? { scale: 0.97 } : {}}
              animate={!launched ? {
                boxShadow: ["0 4px 20px rgba(255,212,29,0.3)", "0 6px 36px rgba(255,212,29,0.55)", "0 4px 20px rgba(255,212,29,0.3)"],
              } : {}}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="relative px-10 py-4 rounded-xl overflow-hidden flex items-center gap-3"
              style={{
                background: launched ? "#F9F4EE" : "linear-gradient(135deg,#ffc200,#ffd41d)",
                color: launched ? "#C4B8AE" : "#1A1208",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                letterSpacing: "0.05em",
                cursor: launched ? "not-allowed" : "pointer",
                border: launched ? "1px solid rgba(0,0,0,0.08)" : "none",
              }}
            >
              {!launched && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.3) 50%,transparent 60%)", animation: "shimmer 2.2s linear infinite" }} />
              )}
              <RippleLayer />
              <span style={{ position: "relative", fontSize: 20 }}>🏫</span>
              <span style={{ position: "relative" }}>{launched ? "OUVERTURE EN COURS…" : "ENTRER DANS LE CAMPUS"}</span>
              {!launched && <ChevronRight size={18} style={{ position: "relative" }} />}
            </motion.button>
          </motion.div>

          {/* ── ROOM CARDS — cartes blanches style site ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="w-full max-w-3xl"
          >
            <div style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 8, letterSpacing: 3, textAlign: "center", marginBottom: 14 }}>
              ── 4 SALLES À EXPLORER ──
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3 justify-center" style={{ scrollbarWidth: "none" }}>
              {ROOMS.map((room, i) => (
                <motion.div
                  key={room.step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={ready ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.54 + i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
                  onMouseEnter={() => setHoveredRoom(room.step)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  className="flex-shrink-0 flex flex-col items-center text-center rounded-2xl px-4 py-5 relative"
                  style={{
                    width: 112,
                    background: "#FFFFFF",
                    borderLeft: `1.5px solid ${hoveredRoom === room.step ? room.color + "60" : "rgba(0,0,0,0.07)"}`,
                    borderRight: `1.5px solid ${hoveredRoom === room.step ? room.color + "60" : "rgba(0,0,0,0.07)"}`,
                    borderBottom: `1.5px solid ${hoveredRoom === room.step ? room.color + "60" : "rgba(0,0,0,0.07)"}`,
                    borderTop: `3px solid ${room.color}`,
                    boxShadow: hoveredRoom === room.step
                      ? `0 8px 24px ${room.color}25`
                      : "0 2px 10px rgba(0,0,0,0.06)",
                    transform: hoveredRoom === room.step ? "translateY(-6px) rotate(0deg)" : `rotate(${CARD_ROTATIONS[i]}deg)`,
                    transition: "all 0.22s ease",
                    cursor: "default",
                  }}
                >
                  {/* Step badge */}
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: hoveredRoom === room.step ? room.color : "rgba(0,0,0,0.06)" }}
                  >
                    <span style={{ color: hoveredRoom === room.step ? "#fff" : "#9C8B76", fontFamily: "monospace", fontSize: 7, fontWeight: 700 }}>{room.step}</span>
                  </div>

                  <span style={{ fontSize: 28, marginBottom: 8 }}>{room.icon}</span>
                  <span style={{
                    color: hoveredRoom === room.step ? room.color : "#1A1208",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 13,
                    lineHeight: 1.1,
                    marginBottom: 4,
                    letterSpacing: "0.02em",
                    transition: "color 0.2s",
                  }}>
                    {room.label}
                  </span>
                  <span style={{ color: "#9C8B76", fontSize: 9, lineHeight: 1.4 }}>
                    {room.desc}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── FOOTER — même style qu'AppLayout ── */}
        <footer
          className="flex items-center justify-between px-6 py-2.5"
          style={{ background: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.07)" }}
        >
          <span style={{ color: "#C4B8AE", fontSize: 9, fontFamily: "monospace" }}>🏫 CAMPUS TANDEM · Y-DAYS 2026 · GROUPE 11</span>
          <span style={{ color: "#C4B8AE", fontSize: 9, fontFamily: "monospace" }}>L'IA SERT D'APPUI, PAS DE REMPLACEMENT</span>
        </footer>
      </div>
    </div>
  );
}
