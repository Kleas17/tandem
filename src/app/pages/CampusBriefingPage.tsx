import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Compass, Map, Target, Trophy } from "lucide-react";
import tandemLogo from "../../../LOGO_TANDEM.png";
import { CampusMap } from "../components/CampusMap";
import { ROOMS } from "../modules/campus/rooms";

const OBJECTIVES = [
  {
    icon: Target,
    title: "Cadrer une séquence",
    text: "Formuler le sujet, le niveau, les acquis et le nombre de séances pour guider l'IA correctement.",
    color: "#1da82a",
  },
  {
    icon: Compass,
    title: "Garder le recul enseignant",
    text: "Identifier ce que l'IA peut proposer, ce qu'elle ignore et ce que tu dois valider.",
    color: "#ff33ad",
  },
  {
    icon: Trophy,
    title: "Repartir avec un livrable",
    text: "Obtenir une structure, un prompt exploitable et une fiche réflexe PDF.",
    color: "#ffc200",
  },
];

export default function CampusBriefingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#FFF8F0" }}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <img src={tandemLogo} alt="TANDEM" style={{ height: 42, width: "auto", objectFit: "contain", mixBlendMode: "multiply" }} />
          <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "#fffce6", border: "1px solid rgba(255,212,29,0.35)" }}>
            <Map size={13} style={{ color: "#ffc200" }} />
            <span style={{ color: "#ffc200", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, fontWeight: 800 }}>BRIEFING CAMPUS</span>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-7 py-8 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 10, letterSpacing: 3, fontWeight: 800, marginBottom: 12 }}>
              PARCOURS IA · 4 SALLES · 3 QUIZ
            </div>
            <h1
              style={{
                color: "#1A1208",
                fontSize: "clamp(36px,7vw,76px)",
                lineHeight: 0.9,
                fontWeight: 900,
                maxWidth: 720,
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "clamp(24px,4.1vw,44px)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  letterSpacing: -1.2,
                }}
              >
                Utiliser l'IA
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(56px,10vw,110px)",
                  letterSpacing: 1.5,
                  color: "#1da82a",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                pour preparer
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "clamp(16px,2.2vw,24px)",
                  lineHeight: 1.35,
                  letterSpacing: 0.8,
                  color: "#6E5A45",
                  marginTop: 10,
                }}
              >
                son cours : bonnes pratiques et limites
              </span>
            </h1>
            <p style={{ color: "#6E5A45", fontSize: 15, lineHeight: 1.75, maxWidth: 560, marginTop: 18 }}>
              Tu vas traverser le campus TANDEM comme un parcours guidé: chaque salle débloque une étape de réflexion, un quiz valide les bons réflexes, puis tu repars avec un kit IA utilisable.
            </p>

            <div className="mt-6 grid gap-3">
              {OBJECTIVES.map((objective, index) => {
                const Icon = objective.icon;
                return (
                  <motion.div
                    key={objective.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + index * 0.08 }}
                    className="flex items-start gap-3 rounded-2xl p-4"
                    style={{ background: "#FFFFFF", border: `1px solid ${objective.color}30`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${objective.color}14`, color: objective.color }}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ color: "#1A1208", fontWeight: 800, fontSize: 14 }}>{objective.title}</div>
                      <div style={{ color: "#6E5A45", fontSize: 12.5, lineHeight: 1.55, marginTop: 3 }}>{objective.text}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96, rotate: -1 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
            <div className="rounded-3xl p-4" style={{ background: "#FDF6E3", border: "2px solid rgba(255,212,29,0.35)", boxShadow: "0 24px 70px rgba(90,60,20,0.16)" }}>
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <div style={{ color: "#9C8B76", fontFamily: "monospace", fontSize: 9, letterSpacing: 2 }}>PLAN DU CAMPUS</div>
                  <div style={{ color: "#1A1208", fontWeight: 900, fontSize: 18 }}>Salle 01: départ</div>
                </div>
                <span style={{ fontSize: 24 }}>🧭</span>
              </div>
              <CampusMap rooms={ROOMS} currentIndex={0} />
            </div>
          </motion.div>
        </section>

        <footer className="flex justify-center pb-6">
          <motion.button
            onClick={() => navigate("/step/1")}
            whileHover={{ scale: 1.035 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex items-center gap-3 overflow-hidden rounded-xl px-10 py-4"
            style={{ background: "linear-gradient(135deg,#ffc200,#ffd41d)", color: "#1A1208", fontWeight: 900, fontSize: 16, boxShadow: "0 10px 34px rgba(255,194,0,0.34)" }}
          >
            <span>Commencer l'exploration</span>
            <ChevronRight size={18} />
          </motion.button>
        </footer>
      </main>
    </div>
  );
}
