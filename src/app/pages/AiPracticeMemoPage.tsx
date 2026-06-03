import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, BookMarked, LoaderCircle, Sparkles } from "lucide-react";
import { useCtaRipple } from "../components/useCtaRipple";
import { requestQuiz } from "../quizStore";
import {
  type RiskAnalysis,
  type SequenceInput,
  generateRiskAnalysis,
} from "../modules/ai/sequenceAi";
import { FALLBACK_RISK_ANALYSIS, SECTIONS } from "../modules/ai-practice/sections";
import { STORAGE_KEYS } from "../modules/shared/storageKeys";
import { readJson } from "../modules/shared/storage";

export default function AiPracticeMemoPage() {
  const navigate = useNavigate();
  const { triggerRipple, RippleLayer } = useCtaRipple();
  const [read, setRead] = useState<string[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(true);

  const markRead = (id: string) =>
    setRead((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const allRead = read.length === SECTIONS.length;

  useEffect(() => {
    const sequence = readJson<SequenceInput | null>(STORAGE_KEYS.sequence, null);

    void generateRiskAnalysis(sequence)
      .then((result) => setRiskAnalysis(result))
      .catch(() => setRiskAnalysis(FALLBACK_RISK_ANALYSIS))
      .finally(() => setIsLoadingRisk(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{
              border: "1px solid rgba(255,51,173,0.25)",
              background: "#fff0fa",
              color: "#1A1208",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: 2,
            }}
          >
            <BookMarked size={11} /> FICHE MEMO - SALLE 03/04
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 800 }}>
            L'IA dans ta pratique : <span style={{ color: "#1A1208" }}>ce qu'il faut savoir</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 13 }}>
            On combine rappel methodologique et lecture IA personnalisee de ton
            cas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-6"
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
            style={{
              borderBottom: "1px solid rgba(29,168,42,0.15)",
              background: "#edfaee",
            }}
          >
            {isLoadingRisk ? (
              <LoaderCircle size={18} style={{ color: "#1da82a" }} className="animate-spin" />
            ) : (
              <Sparkles size={18} style={{ color: "#1da82a" }} />
            )}
            <div className="flex-1">
              <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, fontWeight: 700 }}>
                ANALYSE IA PERSONNALISEE
              </div>
              <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 15 }}>
                {riskAnalysis?.title || "Analyse en cours"}
              </div>
            </div>
          </div>

          <div className="p-5">
            {isLoadingRisk ? (
              <p style={{ color: "#4A3D30", fontSize: 13.5, lineHeight: 1.7 }}>
                L'IA relit tes reponses pour identifier les fragilites
                pedagogiques probables avant la generation finale.
              </p>
            ) : (
              <div className="space-y-3">
                {(riskAnalysis ?? FALLBACK_RISK_ANALYSIS).risks.map((risk, index) => (
                  <div
                    key={`${risk.title}-${index}`}
                    className="rounded-xl p-4"
                    style={{
                      background: "#F9F4EE",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        color: "#1da82a",
                        fontSize: 10,
                        fontFamily: "monospace",
                        letterSpacing: 1.5,
                        marginBottom: 6,
                      }}
                    >
                      RISQUE {index + 1}
                    </div>
                    <div style={{ color: "#1A1208", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                      {risk.title}
                    </div>
                    <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.65 }}>
                      {risk.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="space-y-4 mb-8">
          {SECTIONS.map((s, i) => {
            const isDone = read.includes(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: isDone ? s.colorBg : "#FFFFFF",
                  borderLeft: `1px solid ${isDone ? s.colorBorder : "rgba(0,0,0,0.08)"}`,
                  borderRight: `1px solid ${isDone ? s.colorBorder : "rgba(0,0,0,0.08)"}`,
                  borderBottom: `1px solid ${isDone ? s.colorBorder : "rgba(0,0,0,0.08)"}`,
                  borderTop: `3px solid ${s.color}`,
                  boxShadow: isDone ? `0 4px 20px ${s.color}15` : "0 2px 12px rgba(0,0,0,0.07)",
                  transition: "all 0.35s ease",
                }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: `1px solid ${s.colorBorder}`, background: s.colorBg }}
                >
                  <span style={{ fontSize: 20 }}>{s.emoji}</span>
                  <div className="flex-1">
                    <div style={{ color: s.color, fontSize: 9, fontFamily: "monospace", letterSpacing: 2, fontWeight: 700 }}>
                      SECTION {s.num}
                    </div>
                    <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                  </div>
                  {isDone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: s.color }}
                    >
                      <span style={{ color: "#fff", fontSize: 11 }}>✓</span>
                    </motion.div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {s.body.map((para, j) => (
                    <motion.p
                      key={j}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 + j * 0.06 }}
                      style={{ color: j === 0 ? "#1A1208" : "#4A3D30", fontSize: 13.5, lineHeight: 1.75 }}
                    >
                      {para}
                    </motion.p>
                  ))}

                  <div
                    className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl"
                    style={{ background: "#FFFFFF", border: `1px solid ${s.colorBorder}` }}
                  >
                    <span style={{ color: s.color, fontSize: 12 }}>›</span>
                    <span style={{ color: s.color, fontSize: 12, fontWeight: 600, fontStyle: "italic" }}>{s.highlight}</span>
                  </div>

                  <AnimatePresence>
                    {!isDone && (
                      <motion.button
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => markRead(s.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 mt-3"
                        style={{
                          background: s.colorBg,
                          border: `1px solid ${s.colorBorder}`,
                          color: s.color,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Pris en compte - section suivante
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <motion.button
            onClick={(e) => {
              if (allRead) {
                triggerRipple(e);
                requestQuiz(3, () => navigate("/step/4"));
              }
            }}
            animate={allRead ? {
              boxShadow: ["0 2px 16px rgba(255,212,29,0.3)", "0 4px 32px rgba(255,212,29,0.5)", "0 2px 16px rgba(255,212,29,0.3)"],
            } : {}}
            transition={{ duration: 1.6, repeat: Infinity }}
            whileHover={allRead ? { scale: 1.04 } : {}}
            whileTap={allRead ? { scale: 0.97 } : {}}
            className="px-10 py-4 rounded-xl flex items-center gap-3 relative overflow-hidden transition-all duration-300"
            style={{
              background: allRead ? "linear-gradient(135deg,#ffd41d,#ffc200)" : "#F9F4EE",
              color: allRead ? "#1A1208" : "#C4B8AE",
              fontWeight: 900,
              fontSize: 15,
              cursor: allRead ? "pointer" : "not-allowed",
              border: allRead ? "none" : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {allRead && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.25) 50%,transparent 60%)", animation: "shimmer 2s linear infinite" }} />
            )}
            <RippleLayer />
            {allRead ? <>Voir le livrable IA <ChevronRight size={18} /></> : `Lire encore ${SECTIONS.length - read.length} section${SECTIONS.length - read.length > 1 ? "s" : ""}`}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
