import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, CheckCircle, FileQuestion, HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { useCtaRipple } from "./useCtaRipple";
import { requestQuiz } from "../quizStore";

const QUESTIONS = [
  {
    id: "objectif",
    code: "Q.01",
    label: "À la fin de cette séquence, qu'aimerais-tu que tes élèves sachent faire ?",
    tooltip: "Définit la compétence finale. Permet de construire une progression orientée objectif.",
    type: "text",
    color: "#1da82a",
    colorBg: "#edfaee",
    colorBorder: "rgba(29,168,42,0.25)",
  },
  {
    id: "chapitre",
    code: "Q.02",
    label: "Quel chapitre ou quelle notion souhaites-tu travailler ?",
    tooltip: "Détermine le contenu central de la séquence et son organisation.",
    type: "text",
    color: "#ff33ad",
    colorBg: "#fff0fa",
    colorBorder: "rgba(255,51,173,0.25)",
  },
  {
    id: "seances",
    code: "Q.03",
    label: "De combien de séances disposes-tu ?",
    tooltip: "Permet d'adapter la profondeur et le rythme de la séquence.",
    type: "text",
    color: "#ffc200",
    colorBg: "#fffce6",
    colorBorder: "rgba(255,212,29,0.3)",
  },
  {
    id: "acquis",
    code: "Q.04",
    label: "Sur quelles notions tes élèves ont-ils déjà travaillé en lien avec ce sujet ?",
    tooltip: "Permet d'adapter la progression au niveau réel des élèves.",
    type: "text",
    color: "#ff33ad",
    colorBg: "#fff0fa",
    colorBorder: "rgba(255,51,173,0.25)",
  },
];

export default function Screen2() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [activeQ, setActiveQ] = useState(0);
  const { triggerRipple, RippleLayer } = useCtaRipple();

  const answered = (id: string) => (form[id] ?? "").trim().length > 0;
  const allAnswered = QUESTIONS.every((q) => answered(q.id));

  const handleAnswer = (id: string, val: string) => {
    setForm((p) => ({ ...p, [id]: val }));
  };

  const handleNext = (i: number) => {
    if (i < QUESTIONS.length - 1) setActiveQ(i + 1);
  };

  const handleContinue = () => {
    if (allAnswered) {
      localStorage.setItem("tandem_sequence", JSON.stringify(form));
      requestQuiz(2, () => navigate("/step/3"));
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(29,168,42,0.3)", background: "#edfaee", color: "#1da82a", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}
          >
            <FileQuestion size={10} /> QUESTIONNAIRE STRUCTURANT — 4 QUESTIONS
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 900, letterSpacing: -0.5 }}>
            Informations{" "}
            <span style={{ color: "#1da82a" }}>essentielles</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 13 }}>
            Ces réponses permettent à l'IA de structurer une séquence adaptée.
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {QUESTIONS.map((q, i) => (
              <motion.button
                key={q.id}
                onClick={() => setActiveQ(i)}
                animate={answered(q.id) ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{
                  width: answered(q.id) ? 12 : i === activeQ ? 26 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: answered(q.id)
                    ? q.color
                    : i === activeQ
                    ? `linear-gradient(90deg,${q.color},#1da82a)`
                    : "rgba(0,0,0,0.1)",
                  boxShadow: i === activeQ ? `0 2px 8px ${q.color}60` : "none",
                  transition: "all 0.3s",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-3 mb-8">
          {QUESTIONS.map((q, i) => {
            const isActive = i === activeQ;
            const isDone = answered(q.id);
            const isLocked = !isDone && i > activeQ;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl overflow-hidden relative"
                style={{
                  border: `1px solid ${isActive ? q.color + "55" : isDone ? q.colorBorder : "rgba(0,0,0,0.08)"}`,
                  background: isActive
                    ? "#FFFFFF"
                    : isDone
                    ? q.colorBg
                    : "#F9F4EE",
                  opacity: isLocked ? 0.5 : 1,
                  boxShadow: isActive ? `0 4px 20px ${q.color}18` : "0 2px 12px rgba(0,0,0,0.07)",
                  borderTop: isActive ? `3px solid ${q.color}` : isDone ? `3px solid ${q.color}` : "3px solid transparent",
                  transition: "all 0.35s ease",
                }}
              >
                {/* Question header */}
                <button
                  className="w-full text-left p-4 flex items-center gap-3"
                  onClick={() => !isLocked && setActiveQ(i)}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isDone ? q.color : isActive ? q.colorBg : "rgba(0,0,0,0.05)",
                      color: isDone ? "#FFFFFF" : isActive ? q.color : "#9C8B76",
                      border: `1px solid ${isDone ? q.color : isActive ? q.colorBorder : "rgba(0,0,0,0.08)"}`,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    {isDone ? <CheckCircle size={15} /> : q.code}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div style={{ color: isActive || isDone ? "#1A1208" : "#9C8B76", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                        {q.label}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: q.colorBg,
                              border: `1px solid ${q.colorBorder}`,
                              color: q.color,
                            }}
                          >
                            <HelpCircle size={12} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={8}
                          className="max-w-xs"
                          style={{
                            background: "#1A1208",
                            color: "#FFFFFF",
                            fontSize: 12,
                            padding: "8px 12px",
                            lineHeight: 1.5,
                          }}
                        >
                          {q.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {isDone && !isActive && (
                      <div style={{ color: q.color, fontSize: 12, marginTop: 2, fontFamily: "monospace", fontWeight: 600 }}>
                        {form[q.id]}
                      </div>
                    )}
                  </div>

                  {isDone && !isActive && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: q.color }}
                    >
                      <CheckCircle size={14} style={{ color: "#FFFFFF" }} />
                    </div>
                  )}
                </button>

                {/* Answer area */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-4 pb-5">
                        <textarea
                          autoFocus
                          value={form[q.id] ?? ""}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          placeholder="Votre réponse..."
                          rows={3}
                          className="w-full rounded-xl px-4 py-3 outline-none resize-none"
                          style={{
                            background: "#F9F4EE",
                            border: `1.5px solid ${q.color}40`,
                            color: "#1A1208",
                            fontSize: 14,
                            caretColor: q.color,
                            lineHeight: 1.5,
                          }}
                        />

                        {answered(q.id) && i < QUESTIONS.length - 1 && (
                          <motion.button
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleNext(i)}
                            className="mt-4 px-5 py-2.5 rounded-lg flex items-center gap-2"
                            style={{
                              background: q.color,
                              color: q.color === "#ff33ad" || q.color === "#1da82a" ? "#FFFFFF" : "#1A1208",
                              fontWeight: 800,
                              fontSize: 13,
                              boxShadow: `0 4px 14px ${q.color}40`,
                            }}
                          >
                            Question suivante <ChevronRight size={14} />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Continue */}
        <div className="flex justify-center">
          <motion.button
            onClick={(e) => {
              triggerRipple(e);
              handleContinue();
            }}
            whileHover={allAnswered ? { scale: 1.04 } : {}}
            whileTap={allAnswered ? { scale: 0.97 } : {}}
            className="px-10 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 relative overflow-hidden"
            style={{
              background: allAnswered ? "linear-gradient(135deg,#ffd41d,#ffc200)" : "#F9F4EE",
              color: allAnswered ? "#1A1208" : "#C4B8AE",
              fontWeight: 900,
              fontSize: 15,
              cursor: allAnswered ? "pointer" : "not-allowed",
              border: allAnswered ? "none" : "1px solid rgba(0,0,0,0.08)",
              boxShadow: allAnswered ? "0 4px 20px rgba(255,212,29,0.3)" : "none",
            }}
          >
            {allAnswered && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                  animation: "shimmer 2s linear infinite",
                }}
              />
            )}
            {allAnswered
              ? <><CheckCircle size={18} /> GÉNÉRER LA STRUCTURE <ChevronRight size={18} /></>
              : `COMPLÉTER ${QUESTIONS.filter((q) => !answered(q.id)).length} QUESTION${QUESTIONS.filter((q) => !answered(q.id)).length > 1 ? "S" : ""}`
            }
            <RippleLayer />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
