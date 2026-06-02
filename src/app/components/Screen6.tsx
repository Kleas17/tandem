import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, CheckCircle, Shield } from "lucide-react";
import { useCtaRipple } from "./useCtaRipple";

const PRINCIPLES = [
  {
    id: "frictions",
    code: "PRINCIPE A",
    label: "Identifier les frictions",
    detail: "Le kit part des difficultés réelles : combien de temps perdu, sur quelles tâches, pourquoi c'est difficile. Le chiffre de 40h/semaine pour un junior est le point d'entrée émotionnel. La friction est nommée d'entrée.",
    color: "#FF4560",
    colorBg: "rgba(255,69,96,0.07)",
    colorBorder: "rgba(255,69,96,0.2)",
    emoji: "🔍",
  },
  {
    id: "usage",
    code: "PRINCIPE B",
    label: "Expliciter l'usage",
    detail: "On montre ce que l'IA fait dans chaque cas d'usage : elle pose des questions de structuration, elle propose des leviers de différenciation. On ne dit jamais « l'IA génère votre cours » — on dit « l'IA vous aide à structurer votre réflexion ».",
    color: "#1da82a",
    colorBg: "#edfaee",
    colorBorder: "rgba(29,168,42,0.25)",
    emoji: "💡",
  },
  {
    id: "limites",
    code: "PRINCIPE C",
    label: "Définir les limites",
    detail: "Chaque cas d'usage explicite ce que l'IA ne fait pas et ne peut pas faire. C'est un gage de crédibilité auprès des profs réfractaires. La transparence sur les limites construit la confiance.",
    color: "#ffd41d",
    colorBg: "#fffce6",
    colorBorder: "rgba(255,212,29,0.3)",
    emoji: "🛡",
  },
  {
    id: "outiller",
    code: "PRINCIPE D",
    label: "Outiller — repartir les mains pleines",
    detail: "Le kit se conclut par des fiches réflexes et des prompts de départ. Le participant ne repart pas les mains vides, il repart avec quelque chose de prêt à l'emploi. 2 fiches PDF + 2 prompts téléchargeables.",
    color: "#ff33ad",
    colorBg: "#fff0fa",
    colorBorder: "rgba(255,51,173,0.25)",
    emoji: "🎁",
  },
];

export default function Screen6() {
  const navigate = useNavigate();
  const [toggled, setToggled] = useState<string[]>([]);

  const toggle = (id: string) => {
    setToggled((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const gaugePercent = Math.round((toggled.length / PRINCIPLES.length) * 100);
  const isReady = toggled.length === PRINCIPLES.length;

  const gaugeColor =
    gaugePercent < 40 ? "#ff33ad" : gaugePercent < 80 ? "#ffd41d" : "#1da82a";
  const { triggerRipple, RippleLayer } = useCtaRipple();

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(29,168,42,0.25)", background: "#edfaee", color: "#1da82a", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}
          >
            <Shield size={11} /> PRINCIPES ÉDITORIAUX — PHASE 06
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 800 }}>
            Les 4 principes{" "}
            <span style={{ color: "#1da82a" }}>du kit</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 13 }}>
            Activez chaque principe pour valider votre compréhension — la jauge de lancement se remplit.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-[1fr,260px] gap-6">
          {/* Left: toggles */}
          <div className="space-y-3">
            {PRINCIPLES.map((p, i) => {
              const isOn = toggled.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => toggle(p.id)}
                  style={{
                    background: isOn ? p.colorBg : "#FFFFFF",
                    borderTop: `1px solid ${isOn ? p.colorBorder : "rgba(0,0,0,0.08)"}`,
                    borderRight: `1px solid ${isOn ? p.colorBorder : "rgba(0,0,0,0.08)"}`,
                    borderBottom: `1px solid ${isOn ? p.colorBorder : "rgba(0,0,0,0.08)"}`,
                    borderLeft: isOn ? `3px solid ${p.color}` : `3px solid transparent`,
                    boxShadow: isOn ? `0 2px 12px ${p.color}15` : "0 2px 12px rgba(0,0,0,0.07)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Toggle */}
                    <div className="relative flex-shrink-0 mt-1" style={{ width: 44, height: 24 }}>
                      <div
                        className="w-full h-full rounded-full transition-all duration-300"
                        style={{
                          background: isOn ? p.color : "rgba(0,0,0,0.1)",
                          boxShadow: isOn ? `0 2px 8px ${p.color}40` : "none",
                        }}
                      />
                      <motion.div
                        className="absolute top-1 rounded-full"
                        style={{ width: 16, height: 16, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                        animate={{ x: isOn ? 24 : 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 14 }}>{p.emoji}</span>
                        <span style={{ color: p.color, fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>{p.code}</span>
                        <span style={{ color: isOn ? "#1A1208" : "#4A3D30", fontWeight: 700, fontSize: 14, transition: "color 0.3s" }}>
                          {p.label}
                        </span>
                        {isOn && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                            <CheckCircle size={14} style={{ color: p.color }} />
                          </motion.div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isOn && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ color: "#4A3D30", fontSize: 12, lineHeight: 1.65 }}
                          >
                            {p.detail}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {!isOn && (
                        <p style={{ color: "#9C8B76", fontSize: 11 }}>
                          Activez le switch pour révéler ce principe.
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: isOn ? p.color : "#C4B8AE",
                        flexShrink: 0,
                        letterSpacing: 1,
                        fontWeight: 700,
                      }}
                    >
                      {isOn ? "ON" : "OFF"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: gauge */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#edfaee" }}
            >
              <Rocket size={14} style={{ color: "#1da82a" }} />
              <span style={{ color: "#1da82a", fontFamily: "monospace", fontSize: 10, letterSpacing: 2 }}>JAUGE DE LANCEMENT</span>
            </div>

            <div className="flex-1 p-5 flex flex-col items-center justify-center">
              {/* Circle */}
              <div className="relative mb-5" style={{ width: 130, height: 130 }}>
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                  <motion.circle
                    cx="65" cy="65" r="50"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - gaugePercent / 100) }}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    transform="rotate(-90 65 65)"
                    style={{ filter: `drop-shadow(0 0 4px ${gaugeColor}60)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    animate={{ color: gaugeColor }}
                    style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Bebas Neue', sans-serif", color: gaugeColor }}
                  >
                    {gaugePercent}%
                  </motion.span>
                  <span style={{ color: "#9C8B76", fontSize: 9, fontFamily: "monospace" }}>PRÊT</span>
                </div>
              </div>

              <AnimatePresence>
                {isReady ? (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center rounded-xl p-3 w-full"
                    style={{ background: "#edfaee", border: "1px solid rgba(29,168,42,0.25)", boxShadow: "0 2px 12px rgba(29,168,42,0.12)" }}
                  >
                    <Rocket size={20} style={{ color: "#1da82a", margin: "0 auto 6px" }} />
                    <div style={{ color: "#1da82a", fontWeight: 700, fontSize: 13 }}>PRÊT AU LANCEMENT</div>
                    <div style={{ color: "#9C8B76", fontSize: 10, fontFamily: "monospace" }}>TOUS SYSTÈMES ✓</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    className="text-center"
                    style={{ color: "#9C8B76", fontSize: 11 }}
                  >
                    {PRINCIPLES.length - toggled.length} principe{PRINCIPLES.length - toggled.length > 1 ? "s" : ""} restant{PRINCIPLES.length - toggled.length > 1 ? "s" : ""}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 mt-4">
                {PRINCIPLES.map((p) => (
                  <motion.div
                    key={p.id}
                    className="w-5 h-1.5 rounded-full"
                    animate={{ background: toggled.includes(p.id) ? p.color : "rgba(0,0,0,0.1)" }}
                  />
                ))}
              </div>

              {/* Key message */}
              <div
                className="mt-5 rounded-xl p-3 text-center"
                style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <p style={{ color: "#9C8B76", fontSize: 11, lineHeight: 1.5, fontStyle: "italic" }}>
                  « L'IA sert d'appui,<br />pas de remplacement. »
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Continue */}
        <div className="flex justify-center mt-8">
          <motion.button
            onClick={(e) => {
              if (isReady) {
                triggerRipple(e);
                navigate("/step/7");
              }
            }}
            animate={isReady ? { boxShadow: ["0 2px 16px rgba(29,168,42,0.3)", "0 4px 32px rgba(29,168,42,0.5)", "0 2px 16px rgba(29,168,42,0.3)"] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            whileHover={isReady ? { scale: 1.04 } : {}}
            whileTap={isReady ? { scale: 0.97 } : {}}
            className="px-10 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 relative"
            style={{
              background: isReady ? "linear-gradient(135deg,#1da82a,#009955)" : "#F9F4EE",
              color: isReady ? "#fff" : "#C4B8AE",
              fontWeight: 800,
              fontSize: 15,
              cursor: isReady ? "pointer" : "not-allowed",
              border: isReady ? "none" : "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <RippleLayer />
            <Rocket size={18} />
            {isReady ? "OUVRIR MES LIVRABLES →" : `ACTIVER ENCORE ${PRINCIPLES.length - toggled.length} PRINCIPE${PRINCIPLES.length - toggled.length > 1 ? "S" : ""}`}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
