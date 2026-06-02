import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle } from "lucide-react";
import type { QuizQuestion } from "../quizStore";
import { recordAnswer } from "../quizStore";
import { addXp } from "../xpStore";
import { useCtaRipple } from "./useCtaRipple";

interface QuizModalProps {
  question: QuizQuestion | null;
  onPass: () => void;
  onClose: () => void;
}

export function QuizModal({ question, onPass, onClose }: QuizModalProps) {
  const [selected, setSelected] = useState<0 | 1 | null>(null);
  const [answered, setAnswered] = useState(false);
  const { triggerRipple, RippleLayer } = useCtaRipple();

  const isCorrect = selected === question?.correct;

  const handleSelect = (idx: 0 | 1) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question?.correct;
    if (correct && question) addXp(question.xp);
    if (question?.num !== undefined) recordAnswer(question.num, correct);
  };

  const handleContinue = () => {
    setSelected(null);
    setAnswered(false);
    onPass();
  };

  if (!question) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center px-4"
        style={{ background: "rgba(26,18,8,0.5)", backdropFilter: "blur(6px)" }}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="w-full max-w-md rounded-3xl overflow-hidden"
          style={{ background: "#FFFFFF", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}
        >
          {/* Header */}
          <div
            className="px-6 py-5"
            style={{ background: "linear-gradient(135deg,#ffd41d,#ffc200)", borderBottom: "none" }}
          >
            <div style={{ color: "rgba(26,18,8,0.55)", fontFamily: "monospace", fontSize: 9, letterSpacing: 3, marginBottom: 4 }}>
              ⚡ QUIZ RAPIDE · +{question.xp} XP
            </div>
            <p style={{ color: "#1A1208", fontWeight: 800, fontSize: 16, lineHeight: 1.4 }}>
              {question.q}
            </p>
          </div>

          <div className="p-5 space-y-3">
            {question.choices.map((choice, idx) => {
              const isThis = selected === idx;
              const correct = idx === question.correct;
              const showResult = answered;

              let bg = "#F9F4EE";
              let border = "rgba(0,0,0,0.08)";
              let textColor = "#4A3D30";

              if (showResult && isThis && correct) {
                bg = "#edfaee"; border = "#1da82a50"; textColor = "#1da82a";
              } else if (showResult && isThis && !correct) {
                bg = "#fff0fa"; border = "#ff33ad50"; textColor = "#ff33ad";
              } else if (showResult && correct) {
                bg = "#edfaee"; border = "#1da82a30"; textColor = "#4A3D30";
              }

              return (
                <motion.button
                  key={idx}
                  onClick={(e) => { triggerRipple(e); handleSelect(idx as 0 | 1); }}
                  disabled={answered}
                  whileHover={!answered ? { scale: 1.02 } : {}}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                  className="w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 relative overflow-hidden"
                  style={{
                    background: bg,
                    border: `1.5px solid ${border}`,
                    color: textColor,
                    cursor: answered ? "default" : "pointer",
                    transition: "all 0.3s ease",
                    fontWeight: isThis ? 700 : 500,
                    fontSize: 14,
                  }}
                >
                  <RippleLayer />
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: showResult && correct ? "#1da82a" : showResult && isThis ? "#ff33ad" : "rgba(0,0,0,0.08)",
                      fontSize: 11,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: showResult && (correct || isThis) ? "#fff" : "#9C8B76",
                    }}
                  >
                    {showResult
                      ? correct
                        ? <CheckCircle size={13} />
                        : isThis
                        ? <XCircle size={13} />
                        : ["A","B"][idx]
                      : ["A","B"][idx]}
                  </div>
                  {choice}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation + CTA */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="px-5 pb-5 space-y-3"
              >
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: isCorrect ? "#edfaee" : "#fff0fa",
                    border: `1px solid ${isCorrect ? "rgba(29,168,42,0.25)" : "rgba(255,51,173,0.25)"}`,
                  }}
                >
                  <div style={{ color: isCorrect ? "#1da82a" : "#ff33ad", fontSize: 11, fontFamily: "monospace", fontWeight: 700, marginBottom: 3 }}>
                    {isCorrect ? `✓ CORRECT · +${question.xp} XP` : "✗ PAS TOUT À FAIT"}
                  </div>
                  <p style={{ color: "#4A3D30", fontSize: 12, lineHeight: 1.6 }}>
                    {question.explanation}
                  </p>
                </div>

                <motion.button
                  onClick={handleContinue}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#ffc200,#ffd41d)",
                    color: "#1A1208",
                    fontWeight: 800,
                    fontSize: 14,
                    boxShadow: "0 4px 20px rgba(255,212,29,0.3)",
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.25) 50%,transparent 60%)", animation: "shimmer 2s linear infinite" }} />
                  CONTINUER → SALLE SUIVANTE
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
