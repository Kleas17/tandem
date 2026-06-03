import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, BookOpen, Lightbulb } from "lucide-react";
import { useCtaRipple } from "../components/useCtaRipple";
import { requestQuiz } from "../quizStore";

export default function CourseSequenceIntroPage() {
  const navigate = useNavigate();
  const { triggerRipple, RippleLayer } = useCtaRipple();
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCtaReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(29,168,42,0.25)", background: "#edfaee", color: "#1A1208", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}
          >
            <BookOpen size={10} /> CDI — SALLE 01/04
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, letterSpacing: -0.5 }}>
            Structurer une{" "}
            <span style={{ color: "#1A1208" }}>séquence de cours</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 14 }}>
            Comprendre le cas d'usage avant de passer à la pratique
          </p>
        </motion.div>

        {/* Bloc 1 - Explication du cas d'usage */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            background: "#FFFFFF",
            borderLeft: "1px solid rgba(29,168,42,0.25)",
            borderRight: "1px solid rgba(29,168,42,0.25)",
            borderBottom: "1px solid rgba(29,168,42,0.25)",
            borderTop: "3px solid #1da82a",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(29,168,42,0.15)", background: "#edfaee" }}
          >
            <BookOpen size={18} style={{ color: "#1da82a" }} />
            <div className="flex-1">
              <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, fontWeight: 700 }}>
                BLOC 01
              </div>
              <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 15 }}>
                Explication du cas d'usage
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <p style={{ color: "#1A1208", fontSize: 14, lineHeight: 1.75 }}>
              Construire une séquence de cours, c'est organiser un ensemble de décisions dans le bon ordre : quoi enseigner, dans quel ordre, en combien de séances, pour quel objectif final, avec quels acquis de départ.
            </p>
            <p style={{ color: "#4A3D30", fontSize: 14, lineHeight: 1.75 }}>
              Cette phase de structuration est souvent la plus complexe, non pas par manque de connaissances, mais parce qu'il faut coordonner plusieurs variables en même temps.
            </p>
          </div>
        </motion.div>

        {/* Bloc 2 - Rôle de l'IA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: "#FFFFFF",
            borderLeft: "1px solid rgba(255,212,29,0.3)",
            borderRight: "1px solid rgba(255,212,29,0.3)",
            borderBottom: "1px solid rgba(255,212,29,0.3)",
            borderTop: "3px solid #ffd41d",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,212,29,0.2)", background: "#fffce6" }}
          >
            <Lightbulb size={18} style={{ color: "#ffc200" }} />
            <div className="flex-1">
              <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, fontWeight: 700 }}>
                BLOC 02
              </div>
              <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 15 }}>
                Rôle de l'IA
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <p style={{ color: "#1A1208", fontSize: 14, lineHeight: 1.75 }}>
              Sur ce type de travail, l'IA peut t'aider à :
            </p>
            <ul className="space-y-2.5 ml-2">
              {[
                "Décomposer un sujet en étapes pédagogiques cohérentes",
                "Identifier les jalons d'une progression",
                "Formuler les bonnes questions avant de construire une séquence",
                "Proposer une première structure exploitable"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5" style={{ color: "#4A3D30", fontSize: 13.5, lineHeight: 1.7 }}>
                  <span style={{ color: "#ffc200", flexShrink: 0, marginTop: 4 }}>›</span>
                  {item}
                </li>
              ))}
            </ul>
            <div
              className="rounded-xl px-4 py-3 mt-4"
              style={{ background: "#fff0fa", border: "1px solid rgba(255,51,173,0.25)" }}
            >
              <p style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.7, fontWeight: 600 }}>
                Mais elle ne construit pas la séquence à ta place. C'est toi qui gardes la maîtrise pédagogique.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="flex justify-center">
          <AnimatePresence>
            {ctaReady && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => {
                  triggerRipple(e);
                  requestQuiz(1, () => navigate("/step/2"));
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-3 py-4 px-10 rounded-xl relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#ffd41d,#ffc200)",
                  color: "#1A1208",
                  fontWeight: 900,
                  fontSize: 15,
                  boxShadow: "0 4px 20px rgba(255,212,29,0.3)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.28) 50%,transparent 60%)", animation: "shimmer 2s linear infinite" }}
                />
                <span style={{ position: "relative" }}>COMMENCER</span>
                <ChevronRight size={17} style={{ position: "relative" }} />
                <RippleLayer />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
