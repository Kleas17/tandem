import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  CheckCircle,
  FileQuestion,
  HelpCircle,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { useCtaRipple } from "./useCtaRipple";
import { requestQuiz } from "../quizStore";

const MISTRAL_API_KEY = "AtKHEFJAavv5Unaj1wopV9GXpntVMtyr";
const MISTRAL_MODEL = "mistral-small-latest";

interface FollowUpQuestion {
  id: string;
  label: string;
  placeholder: string;
  reason: string;
}

interface ClarificationResponse {
  needsMoreInfo: boolean;
  intro: string;
  questions: FollowUpQuestion[];
}

const QUESTIONS = [
  {
    id: "objectif",
    code: "Q.01",
    label:
      "Quel sujet veux-tu travailler, et qu'aimerais-tu que tes eleves sachent faire a la fin ?",
    tooltip:
      "Mets a la fois la notion / le chapitre vise et la competence finale attendue. C'est le bloc central du cadrage.",
    color: "#1da82a",
    colorBg: "#edfaee",
    colorBorder: "rgba(29,168,42,0.25)",
  },
  {
    id: "seances",
    code: "Q.02",
    label: "De combien de seances disposes-tu ?",
    tooltip:
      "Permet d'adapter la profondeur, le rythme et le decoupage de la sequence.",
    color: "#ffc200",
    colorBg: "#fffce6",
    colorBorder: "rgba(255,212,29,0.3)",
  },
  {
    id: "acquis",
    code: "Q.03",
    label:
      "Qu'est-ce que tes eleves ont deja vu, compris ou pratique en lien avec ce sujet ?",
    tooltip:
      "Permet d'eviter une progression hors-sol et de repartir du niveau reel de la classe.",
    color: "#ff33ad",
    colorBg: "#fff0fa",
    colorBorder: "rgba(255,51,173,0.25)",
  },
];

function readMessageText(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  return "";
}

function normalizeFollowUpResponse(payload: unknown): ClarificationResponse {
  if (!payload || typeof payload !== "object") {
    return {
      needsMoreInfo: false,
      intro: "",
      questions: [],
    };
  }

  const data = payload as Record<string, unknown>;
  const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
  const questions = rawQuestions
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const question = item as Record<string, unknown>;
      const label =
        typeof question.label === "string" ? question.label.trim() : "";
      if (!label) return null;
      return {
        id:
          typeof question.id === "string" && question.id.trim()
            ? question.id.trim()
            : `follow_up_${index + 1}`,
        label,
        placeholder:
          typeof question.placeholder === "string" &&
          question.placeholder.trim()
            ? question.placeholder.trim()
            : "Precise ta reponse...",
        reason:
          typeof question.reason === "string" && question.reason.trim()
            ? question.reason.trim()
            : "Precision utile pour fiabiliser la proposition.",
      };
    })
    .filter(Boolean) as FollowUpQuestion[];

  return {
    needsMoreInfo:
      Boolean(data.needsMoreInfo) && questions.length > 0,
    intro:
      typeof data.intro === "string" && data.intro.trim()
        ? data.intro.trim()
        : "L'IA a besoin de quelques precisions avant de proposer une structure pertinente.",
    questions,
  };
}

async function requestClarifyingQuestions(form: Record<string, string>) {
  const prompt = `Tu aides un enseignant du second degre a mieux cadrer une demande pedagogique.

Reponses actuelles :
- Sujet + objectif final : ${form.objectif || "Non precise"}
- Nombre de seances : ${form.seances || "Non precise"}
- Acquis prealables : ${form.acquis || "Non precise"}

Decide s'il manque des informations importantes pour produire ensuite une sequence pedagogique utile.

Regles :
- Ne pose pas de question redondante avec ce qui est deja ecrit.
- Pose entre 0 et 3 questions maximum.
- Pose seulement des questions qui changeraient reellement la qualite de la sequence finale.
- Favorise les precisions sur : niveau de classe, discipline, contraintes fortes, type d'evaluation attendu, difficulte particuliere, heterogeneite, supports deja prevus.
- Si les reponses sont deja suffisantes, retourne zero question.
- Questions courtes, claires, directement repondables.

Retourne uniquement un JSON valide, sans markdown, avec exactement cette structure :
{
  "needsMoreInfo": true,
  "intro": "string",
  "questions": [
    {
      "id": "string",
      "label": "string",
      "placeholder": "string",
      "reason": "string"
    }
  ]
}`;

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu reponds uniquement avec du JSON valide. Aucun markdown. Aucun texte hors JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Mistral a retourne ${response.status}: ${errorText || "erreur inconnue"}`,
    );
  }

  const result = await response.json();
  const rawContent = readMessageText(result?.choices?.[0]?.message?.content);
  if (!rawContent) {
    return { needsMoreInfo: false, intro: "", questions: [] };
  }

  return normalizeFollowUpResponse(JSON.parse(rawContent));
}

export default function Screen2() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [activeQ, setActiveQ] = useState(0);
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [followUpIntro, setFollowUpIntro] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>(
    [],
  );
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>(
    {},
  );
  const [showFollowUpStep, setShowFollowUpStep] = useState(false);
  const { triggerRipple, RippleLayer } = useCtaRipple();

  const answered = (id: string) => (form[id] ?? "").trim().length > 0;
  const allAnswered = QUESTIONS.every((q) => answered(q.id));
  const allFollowUpsAnswered =
    followUpQuestions.length > 0 &&
    followUpQuestions.every(
      (question) => (followUpAnswers[question.id] ?? "").trim().length > 0,
    );

  const resetFollowUpStep = () => {
    setShowFollowUpStep(false);
    setFollowUpIntro("");
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
  };

  const handleAnswer = (id: string, val: string) => {
    setForm((prev) => ({ ...prev, [id]: val }));
    if (showFollowUpStep || followUpQuestions.length > 0) {
      resetFollowUpStep();
    }
  };

  const handleNext = (i: number) => {
    if (i < QUESTIONS.length - 1) setActiveQ(i + 1);
  };

  const saveSequenceAndContinue = () => {
    const sequencePayload = {
      ...form,
      aiClarifications: followUpQuestions.map((question) => ({
        question: question.label,
        answer: followUpAnswers[question.id] ?? "",
        reason: question.reason,
      })),
    };

    localStorage.setItem("tandem_sequence", JSON.stringify(sequencePayload));
    requestQuiz(2, () => navigate("/step/3"));
  };

  const handleContinue = async () => {
    if (!allAnswered || isAiChecking) return;

    if (showFollowUpStep) {
      if (!allFollowUpsAnswered) return;
      saveSequenceAndContinue();
      return;
    }

    setIsAiChecking(true);

    try {
      const clarification = await requestClarifyingQuestions(form);

      if (!clarification.needsMoreInfo || clarification.questions.length === 0) {
        saveSequenceAndContinue();
        return;
      }

      setFollowUpIntro(clarification.intro);
      setFollowUpQuestions(clarification.questions);
      setFollowUpAnswers({});
      setShowFollowUpStep(true);
    } catch {
      saveSequenceAndContinue();
    } finally {
      setIsAiChecking(false);
    }
  };

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
              border: "1px solid rgba(29,168,42,0.3)",
              background: "#edfaee",
              color: "#1da82a",
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: 2,
            }}
          >
            <FileQuestion size={10} /> QUESTIONNAIRE STRUCTURANT - 3 QUESTIONS
          </div>
          <h1
            style={{
              color: "#1A1208",
              fontSize: "clamp(20px,3.5vw,30px)",
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            Informations <span style={{ color: "#1da82a" }}>essentielles</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 13 }}>
            L'IA part de 3 reponses de base, puis ajoute des questions seulement
            si elle detecte un manque de precision utile.
          </p>

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
                  border: `1px solid ${
                    isActive
                      ? q.color + "55"
                      : isDone
                        ? q.colorBorder
                        : "rgba(0,0,0,0.08)"
                  }`,
                  background: isActive ? "#FFFFFF" : isDone ? q.colorBg : "#F9F4EE",
                  opacity: isLocked ? 0.5 : 1,
                  boxShadow: isActive
                    ? `0 4px 20px ${q.color}18`
                    : "0 2px 12px rgba(0,0,0,0.07)",
                  borderTop: isActive
                    ? `3px solid ${q.color}`
                    : isDone
                      ? `3px solid ${q.color}`
                      : "3px solid transparent",
                  transition: "all 0.35s ease",
                }}
              >
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
                      border: `1px solid ${
                        isDone ? q.color : isActive ? q.colorBorder : "rgba(0,0,0,0.08)"
                      }`,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    {isDone ? <CheckCircle size={15} /> : q.code}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          color: isActive || isDone ? "#1A1208" : "#9C8B76",
                          fontSize: 14,
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
                      >
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
                      <div
                        style={{
                          color: q.color,
                          fontSize: 12,
                          marginTop: 2,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
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
                          placeholder="Votre reponse..."
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
                              color:
                                q.color === "#ff33ad" || q.color === "#1da82a"
                                  ? "#FFFFFF"
                                  : "#1A1208",
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

        <AnimatePresence>
          {showFollowUpStep && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="rounded-2xl overflow-hidden mb-8"
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
                  borderBottom: "1px solid rgba(29,168,42,0.25)",
                  background: "#edfaee",
                }}
              >
                <Sparkles size={18} style={{ color: "#1da82a" }} />
                <div className="flex-1">
                  <div
                    style={{
                      color: "#1da82a",
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: 2,
                    }}
                  >
                    COUCHE IA DE CLARIFICATION
                  </div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 15 }}>
                    L'IA veut verrouiller quelques precisions avant de continuer
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p style={{ color: "#4A3D30", fontSize: 13.5, lineHeight: 1.7, marginBottom: 14 }}>
                  {followUpIntro}
                </p>

                <div className="space-y-4">
                  {followUpQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-xl p-4"
                      style={{
                        background: "#F9F4EE",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-1 rounded-full"
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(29,168,42,0.18)",
                            color: "#1da82a",
                            fontSize: 10,
                            fontFamily: "monospace",
                            fontWeight: 700,
                          }}
                        >
                          IA {index + 1}
                        </span>
                        <span style={{ color: "#1A1208", fontSize: 14, fontWeight: 600 }}>
                          {question.label}
                        </span>
                      </div>
                      <p style={{ color: "#9C8B76", fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
                        {question.reason}
                      </p>
                      <textarea
                        value={followUpAnswers[question.id] ?? ""}
                        onChange={(e) =>
                          setFollowUpAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder={question.placeholder}
                        rows={3}
                        className="w-full rounded-xl px-4 py-3 outline-none resize-none"
                        style={{
                          background: "#FFFFFF",
                          border: "1.5px solid rgba(29,168,42,0.22)",
                          color: "#1A1208",
                          fontSize: 14,
                          caretColor: "#1da82a",
                          lineHeight: 1.5,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center">
          <motion.button
            onClick={(e) => {
              triggerRipple(e);
              void handleContinue();
            }}
            whileHover={
              allAnswered && !isAiChecking
                ? { scale: 1.04 }
                : {}
            }
            whileTap={
              allAnswered && !isAiChecking
                ? { scale: 0.97 }
                : {}
            }
            className="px-10 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 relative overflow-hidden"
            style={{
              background:
                allAnswered && !isAiChecking
                  ? "linear-gradient(135deg,#ffd41d,#ffc200)"
                  : "#F9F4EE",
              color: allAnswered && !isAiChecking ? "#1A1208" : "#C4B8AE",
              fontWeight: 900,
              fontSize: 15,
              cursor: allAnswered && !isAiChecking ? "pointer" : "not-allowed",
              border:
                allAnswered && !isAiChecking
                  ? "none"
                  : "1px solid rgba(0,0,0,0.08)",
              boxShadow:
                allAnswered && !isAiChecking
                  ? "0 4px 20px rgba(255,212,29,0.3)"
                  : "none",
            }}
          >
            {allAnswered && !isAiChecking && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                  animation: "shimmer 2s linear infinite",
                }}
              />
            )}

            {isAiChecking ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                L'IA VERIFIE SI ELLE A BESOIN DE PRECISIONS
              </>
            ) : showFollowUpStep ? (
              <>
                <Sparkles size={18} />
                {allFollowUpsAnswered
                  ? "VALIDER CES PRECISIONS"
                  : `COMPLETER ${followUpQuestions.filter(
                      (question) =>
                        !(followUpAnswers[question.id] ?? "").trim(),
                    ).length} PRECISION${
                      followUpQuestions.filter(
                        (question) =>
                          !(followUpAnswers[question.id] ?? "").trim(),
                      ).length > 1
                        ? "S"
                        : ""
                    }`}
                <ChevronRight size={18} />
              </>
            ) : allAnswered ? (
              <>
                <CheckCircle size={18} /> LANCER LA COUCHE IA
                <ChevronRight size={18} />
              </>
            ) : (
              `COMPLETER ${QUESTIONS.filter((q) => !answered(q.id)).length} QUESTION${
                QUESTIONS.filter((q) => !answered(q.id)).length > 1 ? "S" : ""
              }`
            )}
            <RippleLayer />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
