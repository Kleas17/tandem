import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ClipboardCheck, Zap } from "lucide-react";
import { useXpFloat } from "../../components/XpFloater";
import { useCtaRipple } from "../../components/useCtaRipple";

const PAIRS = [
  {
    id: "repetition",
    friction: {
      title: "Sujets multiples à construire",
      body: "Construire plusieurs sujets différenciés : tâche répétitive et épuisante mentalement.",
    },
    solution: {
      title: "Déclinaison en 3 niveaux",
      body: "À partir d'un sujet de base, l'IA décline l'évaluation en socle, intermédiaire et avancé.",
    },
  },
  {
    id: "consignes",
    friction: {
      title: "Adapter les consignes à chaque classe",
      body: "Maintenir la cohérence entre les niveaux de difficulté sans perdre du temps.",
    },
    solution: {
      title: "Reformulation guidée par l'IA",
      body: "L'IA aide à formuler et simplifier les consignes selon le niveau cible.",
    },
  },
  {
    id: "qualite",
    friction: {
      title: "La répétition fatigue",
      body: "La répétition réduit la qualité et l'engagement de l'enseignant dans la tâche.",
    },
    solution: {
      title: "L'enseignant valide, l'IA itère",
      body: "L'enseignant valide chaque version et reste maître des critères. L'IA propose — l'enseignant tranche.",
    },
  },
  {
    id: "limites",
    friction: {
      title: "Risque de nivellement par le bas",
      body: "Sans contrôle, l'IA peut proposer des questions trop simples ou inadaptées au programme.",
    },
    solution: {
      title: "Relecture critique obligatoire",
      body: "Ne jamais utiliser un sujet IA sans relecture complète. L'enseignant reste maître et surveille les rendus.",
    },
  },
];

export default function EvaluationUseCasePage() {
  const navigate = useNavigate();
  const [activated, setActivated] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const { spawn, XpLayer } = useXpFloat();
  const { triggerRipple, RippleLayer } = useCtaRipple();

  const handleActivate = (e: React.MouseEvent) => {
    if (!activated) {
      setActivated(true);
      if (!xpAwarded) {
        setXpAwarded(true);
        spawn("+200 XP", e.clientX - 20, e.clientY - 30);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <XpLayer />
      <div className="w-full max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(255,51,173,0.25)", background: "#fff0fa", color: "#ff33ad", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}
          >
            <ClipboardCheck size={11} /> CAS D'USAGE N°2 — PHASE 05
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 800 }}>
            Créer et différencier ses{" "}
            <span style={{ color: "#ff33ad" }}>évaluations</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 13 }}>
            Activez l'IA pour voir comment chaque friction se transforme.
          </p>
        </motion.div>

        {/* Toggle switch */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <span style={{ color: activated ? "#C4B8AE" : "#4A3D30", fontSize: 13, fontWeight: 700, transition: "color 0.3s" }}>
            Sans IA
          </span>

          <button
            onClick={handleActivate}
            className="relative w-16 h-8 rounded-full flex items-center transition-all duration-400"
            style={{
              background: activated
                ? "linear-gradient(135deg,#ff33ad,#1da82a)"
                : "rgba(0,0,0,0.08)",
              border: activated ? "none" : "1px solid rgba(0,0,0,0.12)",
              boxShadow: activated ? "0 2px 12px rgba(255,51,173,0.2)" : "none",
              cursor: activated ? "default" : "pointer",
            }}
          >
            <motion.div
              animate={{ x: activated ? 34 : 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="absolute w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
            >
              {activated && <Zap size={12} style={{ color: "#ff33ad" }} />}
            </motion.div>
          </button>

          <span style={{ color: activated ? "#1A1208" : "#C4B8AE", fontSize: 13, fontWeight: 700, transition: "color 0.3s" }}>
            Avec l'IA
          </span>
        </motion.div>

        {/* Split grid */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          {PAIRS.map((pair, i) => (
            <motion.div
              key={pair.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="grid grid-cols-2 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(0,0,0,0.08)", minHeight: 90, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
            >
              {/* LEFT: Friction */}
              <div
                className="p-4 relative"
                style={{
                  background: activated ? "rgba(255,69,96,0.03)" : "#fff0fa",
                  borderRight: "1px solid rgba(0,0,0,0.06)",
                  transition: "background 0.5s ease, opacity 0.4s ease",
                  opacity: activated ? 0.6 : 1,
                }}
              >
                <div style={{ color: "#FF4560", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>
                  ✗ FRICTION
                </div>
                <div style={{ color: activated ? "#9C8B76" : "#1A1208", fontSize: 13, fontWeight: 600, marginBottom: 4, transition: "color 0.4s" }}>
                  {pair.friction.title}
                </div>
                <div style={{ color: activated ? "#C4B8AE" : "#4A3D30", fontSize: 12, lineHeight: 1.55, transition: "color 0.4s" }}>
                  {pair.friction.body}
                </div>
              </div>

              {/* RIGHT: IA solution */}
              <div
                className="p-4 relative overflow-hidden"
                style={{
                  background: activated ? "#edfaee" : "#F9F4EE",
                  transition: "background 0.5s ease",
                }}
              >
                <AnimatePresence>
                  {activated && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.07 }}
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(135deg,rgba(29,168,42,0.06),rgba(29,168,42,0.02))" }}
                    />
                  )}
                </AnimatePresence>

                <div style={{ color: activated ? "#1da82a" : "#C4B8AE", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4, transition: "color 0.4s" }}>
                  ✓ SOLUTION IA
                </div>
                <div style={{ color: activated ? "#1A1208" : "#9C8B76", fontSize: 13, fontWeight: 600, marginBottom: 4, transition: "color 0.4s", position: "relative" }}>
                  {pair.solution.title}
                </div>
                <div style={{ color: activated ? "#4A3D30" : "#C4B8AE", fontSize: 12, lineHeight: 1.55, transition: "color 0.4s", position: "relative" }}>
                  {pair.solution.body}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fiche badge */}
        <AnimatePresence>
          {activated && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center gap-3 px-5 py-3 rounded-xl mb-8 mx-auto max-w-md"
              style={{
                background: "#fff0fa",
                border: "1px solid rgba(255,51,173,0.25)",
                boxShadow: "0 2px 12px rgba(255,51,173,0.1)",
              }}
            >
              <span style={{ fontSize: 22 }}>📊</span>
              <div>
                <div style={{ color: "#ff33ad", fontWeight: 700, fontSize: 13 }}>Fiche réflexe #2 — préparée</div>
                <div style={{ color: "#9C8B76", fontSize: 11, fontFamily: "monospace" }}>
                  "Différencier une évaluation avec l'IA" · débloquée à l'étape 7
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue */}
        <div className="flex justify-center">
          <motion.button
            onClick={(e) => {
              if (activated) {
                triggerRipple(e);
                navigate("/step/6");
              }
            }}
            animate={activated ? { boxShadow: ["0 2px 16px rgba(255,212,29,0.3)", "0 4px 32px rgba(255,212,29,0.5)", "0 2px 16px rgba(255,212,29,0.3)"] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            whileHover={activated ? { scale: 1.04 } : {}}
            whileTap={activated ? { scale: 0.97 } : {}}
            className="px-10 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 relative"
            style={{
              background: activated ? "linear-gradient(135deg,#ffd41d,#ffc200)" : "#F9F4EE",
              color: activated ? "#1A1208" : "#C4B8AE",
              fontWeight: 800,
              fontSize: 15,
              cursor: activated ? "pointer" : "not-allowed",
              border: activated ? "none" : "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <RippleLayer />
            {activated
              ? <><span>✓</span> LES PRINCIPES DU KIT <ChevronRight size={18} /></>
              : "ACTIVEZ L'IA CI-DESSUS POUR CONTINUER"
            }
          </motion.button>
        </div>
      </div>
    </div>
  );
}
