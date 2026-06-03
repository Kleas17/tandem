import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Bot,
  Copy,
  Download,
  LoaderCircle,
  RefreshCw,
  Share2,
  Trophy,
  CheckCircle,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useCtaRipple } from "../components/useCtaRipple";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getQuizAnswers, getScore } from "../quizStore";
import {
  analyzeChatRefinement,
  buildEvaluationPrompt,
  buildFallbackGeneration,
  buildPrompt,
  FALLBACK_EVALUATION_KIT,
  FALLBACK_EVALUATION_PROMPT_DETAILS,
  FALLBACK_SEQUENCE_PROMPT_DETAILS,
  FALLBACK_RECOMMENDATION,
  generateEvaluationPromptDetails,
  generateEvaluationKit,
  generateRecommendationSummary,
  generateSelfCheck,
  generateSequence,
  generateSequencePromptDetails,
  refineSequence,
  refineSequenceWithInstruction,
  type ChatRefinementResult,
  type SequenceInput,
} from "../modules/ai/sequenceAi";
import { STORAGE_KEYS } from "../modules/shared/storageKeys";
import { readJson, removeStoredItem, writeJson } from "../modules/shared/storage";
import {
  type FinalKitState,
  type PromptModalCache,
  type PromptModalState,
  type RefineMode,
} from "../modules/final-kit/types";
import {
  getReflexSheetEvaluation,
  getReflexSheetSequence,
  getScoreBadge,
} from "../modules/final-kit/reflexSheets";
import { enrichSequence } from "../modules/final-kit/sequenceTransforms";
import { buildEvaluationPdf, buildSequencePdf } from "../modules/final-kit/pdf";
export default function FinalKitPage() {
  const navigate = useNavigate();
  const [kit, setKit] = useState<FinalKitState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [copiedModalPrompt, setCopiedModalPrompt] = useState(false);
  const [refiningMode, setRefiningMode] = useState<RefineMode | null>(null);
  const [promptModal, setPromptModal] = useState<PromptModalState>(null);
  const [promptModalCache, setPromptModalCache] = useState<PromptModalCache>({
    sequence: null,
    evaluation: null,
  });
  const [promptModalLoading, setPromptModalLoading] = useState(false);
  const [promptModalError, setPromptModalError] = useState<string | null>(null);
  const [showPendingInstructionHint, setShowPendingInstructionHint] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Donne-moi une consigne de modification. Je peux soit valider la demande, soit te poser une question avant régénération.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingInstructionDraft, setPendingInstructionDraft] = useState("");
  const { triggerRipple, RippleLayer } = useCtaRipple();
  const progressIntervalRef = useRef<number | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const sequence = readJson<SequenceInput | null>(STORAGE_KEYS.sequence, null);
  const answers = getQuizAnswers();
  const score = getScore();
  const badge = getScoreBadge(score.correct);
  const sequenceReflex = getReflexSheetSequence();
  const evaluationReflex = getReflexSheetEvaluation();
  const sequencePrompt = useMemo(() => buildPrompt(sequence), [sequence]);
  const evaluationPrompt = useMemo(() => buildEvaluationPrompt(sequence), [sequence]);
  const activePromptDetails =
    promptModal?.kind === "sequence"
      ? promptModalCache.sequence
      : promptModal?.kind === "evaluation"
        ? promptModalCache.evaluation
        : null;
  const modalPromptText =
    promptModal?.source === "generic"
      ? promptModal?.kind === "sequence"
        ? sequencePrompt
        : evaluationPrompt
      : activePromptDetails?.prompt ?? "";
  const modalPromptWhy =
    promptModal?.source === "generic" ? "" : activePromptDetails?.whyGood ?? "";
  const modalPromptAdditions =
    promptModal?.source === "generic" ? [] : activePromptDetails?.additions ?? [];
  const modalPromptLabel =
    promptModal?.kind === "sequence"
      ? "Cas 1 - Structurer une séquence"
      : "Cas 2 - Différencier une évaluation";
  const genericPromptWhy =
    promptModal?.kind === "sequence"
      ? "Ce prompt générique donne une base stable pour démarrer, même sans personnalisation forte."
      : "Ce prompt générique donne une base stable pour explorer la différenciation d'une évaluation.";
  const genericPromptAdditions =
    promptModal?.kind === "sequence"
      ? [
          "Préciser le niveau réel de la classe et ses écarts de maîtrise.",
          "Ajouter une contrainte de temps, de support ou de modalité de travail.",
        ]
      : [
          "Préciser la compétence exacte à évaluer.",
          "Ajouter les formes d'hétérogénéité observées dans la classe.",
        ];

  const runGeneration = async (force = false) => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setError(null);
    setLoading(true);
    setLoadingProgress(8);
    const cacheKey = JSON.stringify(sequence || {});

    if (!force) {
      const cached = readJson<{ cacheKey: string; data: FinalKitState } | null>(
        STORAGE_KEYS.generatedKit,
        null,
      );
      if (cached?.cacheKey === cacheKey) {
        setKit(cached.data);
        setLoadingProgress(100);
        window.setTimeout(() => setLoading(false), 200);
        return;
      }
      if (cached) {
        removeStoredItem(STORAGE_KEYS.generatedKit);
      }
    }

    try {
      const [recommendation, generatedSequence, evaluationKit] = await Promise.all([
        generateRecommendationSummary(sequence),
        generateSequence(sequence),
        generateEvaluationKit(sequence),
      ]);
      const selfCheck = await generateSelfCheck(sequence, generatedSequence);
      const enrichedSequence = enrichSequence(generatedSequence, selfCheck);
      const nextKit = {
        recommendation,
        sequence: enrichedSequence,
        evaluationKit,
      };
      writeJson(STORAGE_KEYS.generatedKit, { cacheKey, data: nextKit });
      setKit(nextKit);
      setLoadingProgress(100);
      window.setTimeout(() => {
        setLoading(false);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
          colors: ["#ffd41d", "#1da82a", "#ff33ad", "#ffc200"],
        });
      }, 220);
    } catch (generationError) {
      setKit({
        recommendation: FALLBACK_RECOMMENDATION,
        sequence: buildFallbackGeneration(sequence),
        evaluationKit: FALLBACK_EVALUATION_KIT,
      });
      setError(
        generationError instanceof Error
          ? generationError.message
          : "La generation IA a echoue.",
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    void runGeneration();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      return;
    }
    progressIntervalRef.current = window.setInterval(() => {
      setLoadingProgress((current) => {
        if (current >= 90) return 90;
        const increment = current < 30 ? 7 : current < 60 ? 4 : 2;
        return Math.min(90, current + increment);
      });
    }, 280);
    return () => {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    };
  }, [loading]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (!promptModal || promptModal.source !== "ai" || !kit) return;

    const cacheHit =
      promptModal.kind === "sequence"
        ? promptModalCache.sequence
        : promptModalCache.evaluation;
    if (cacheHit) return;

    let cancelled = false;
    setPromptModalLoading(true);
    setPromptModalError(null);

    const loadPrompt = async () => {
      try {
        const details =
          promptModal.kind === "sequence"
            ? await generateSequencePromptDetails(sequence, kit.sequence)
            : await generateEvaluationPromptDetails(sequence, kit.evaluationKit);
        if (cancelled) return;
        setPromptModalCache((current) => ({
          ...current,
          [promptModal.kind]: details,
        }));
      } catch {
        if (cancelled) return;
        const fallback =
          promptModal.kind === "sequence"
            ? FALLBACK_SEQUENCE_PROMPT_DETAILS
            : FALLBACK_EVALUATION_PROMPT_DETAILS;
        setPromptModalCache((current) => ({
          ...current,
          [promptModal.kind]: fallback,
        }));
        setPromptModalError("Impossible de générer le prompt IA pour le moment.");
      } finally {
        if (!cancelled) {
          setPromptModalLoading(false);
        }
      }
    };

    void loadPrompt();

    return () => {
      cancelled = true;
    };
  }, [kit, promptModal, promptModalCache.evaluation, promptModalCache.sequence, sequence]);

  const copyModalPrompt = () => {
    if (!modalPromptText) return;
    navigator.clipboard.writeText(modalPromptText).then(() => {
      setCopiedModalPrompt(true);
      setTimeout(() => setCopiedModalPrompt(false), 2000);
      toast.success("Prompt copié");
    });
  };

  const downloadSequencePdf = () => {
    if (!kit) return;
    buildSequencePdf(
      sequence,
      kit.sequence,
      promptModalCache.sequence?.prompt || sequencePrompt,
    ).save(
      "tandem-fiche-sequence.pdf",
    );
    toast.success("Fiche séquence téléchargée");
  };

  const downloadEvaluationPdf = () => {
    if (!kit) return;
    buildEvaluationPdf(
      sequence,
      kit.evaluationKit,
      promptModalCache.evaluation?.prompt || evaluationPrompt,
    ).save(
      "tandem-fiche-evaluation.pdf",
    );
    toast.success("Fiche évaluation téléchargée");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "TANDEM - Kit d'onboarding IA pour enseignants",
        text: "Decouvrez TANDEM, le kit d'onboarding IA pour structurer ses sequences et differencier ses evaluations.",
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Lien copié");
    }
  };

  const handleRefine = async (mode: RefineMode) => {
    if (!kit || refiningMode) return;
    setRefiningMode(mode);
    try {
      const refined = await refineSequence(sequence, kit.sequence, mode);
      const selfCheck = await generateSelfCheck(sequence, refined);
      const nextKit = {
        ...kit,
        sequence: enrichSequence(refined, selfCheck),
      };
      setKit(nextKit);
      writeJson(STORAGE_KEYS.generatedKit, {
        cacheKey: JSON.stringify(sequence || {}),
        data: nextKit,
      });
      toast.success("Proposition de séquence affinée");
    } catch {
      toast.error("Impossible d'affiner la proposition");
    } finally {
      setRefiningMode(null);
    }
  };

  const handleChatSend = async () => {
    if (!kit || !chatInput.trim() || chatLoading) return;
    const nextUserMessage = { role: "user" as const, content: chatInput.trim() };
    const nextConversation = [...chatMessages, nextUserMessage];
    setChatMessages(nextConversation);
    setChatInput("");
    setChatLoading(true);
    try {
      const result: ChatRefinementResult = await analyzeChatRefinement(
        sequence,
        kit.sequence,
        nextConversation,
      );
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.assistantMessage },
      ]);
      setPendingInstructionDraft(
        result.status === "ready" ? result.instructionDraft : "",
      );
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je n'ai pas pu analyser la demande. Reformule en une phrase simple.",
        },
      ]);
      setPendingInstructionDraft("");
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatRegenerate = async () => {
    if (!kit || !pendingInstructionDraft || chatLoading) return;
    setChatLoading(true);
    try {
      const refined = await refineSequenceWithInstruction(
        sequence,
        kit.sequence,
        pendingInstructionDraft,
      );
      const selfCheck = await generateSelfCheck(sequence, refined);
      const nextKit = {
        ...kit,
        sequence: enrichSequence(refined, selfCheck),
      };
      setKit(nextKit);
      writeJson(STORAGE_KEYS.generatedKit, {
        cacheKey: JSON.stringify(sequence || {}),
        data: nextKit,
      });
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "OK, la séquence a été régénérée avec cette consigne.",
        },
      ]);
      setPendingInstructionDraft("");
      toast.success("Séquence régénérée depuis le chat");
    } catch {
      toast.error("Impossible de régénérer depuis la consigne libre");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div ref={topRef} className="w-full max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ border: "1px solid rgba(255,212,29,0.3)", background: "#fffce6", color: "#1A1208", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>
            <Trophy size={11} /> TROPHEE - SALLE 04/04
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(22px,4vw,36px)", fontWeight: 800 }}>
            Mission <span style={{ background: "linear-gradient(90deg,#ffd41d,#1da82a,#ff33ad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>accomplie</span>
          </h1>
          {Object.keys(answers).length > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full" style={{ background: badge.bg, border: `1px solid ${badge.border}` }}>
              <span style={{ color: badge.color, fontSize: 11, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700 }}>
                {score.correct}/3 REFLEXES - {badge.label.toUpperCase()}
              </span>
            </div>
          )}
        </motion.div>

        {loading && (
          <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #ffd41d", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,212,29,0.3)", background: "#fffce6" }}>
              <LoaderCircle size={18} style={{ color: "#ffc200" }} className="animate-spin" />
              <div className="flex-1">
                <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>GENERATION IA EN COURS</div>
                <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>Synthèse profil + cas séquence + cas évaluation</div>
              </div>
              <span style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{loadingProgress}%</span>
            </div>
            <div className="p-5">
              <div className="w-full rounded-full overflow-hidden mb-4" style={{ background: "#F5EFE8", height: 14 }}>
                <motion.div animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ height: "100%", background: "linear-gradient(90deg,#ffd41d 0%,#ffc200 55%,#1da82a 100%)" }} />
              </div>
            </div>
          </div>
        )}

        {!loading && kit && (
          <>
            {promptModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
                style={{ background: "rgba(26,18,8,0.45)" }}
                onClick={() => setPromptModal(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="w-full max-w-3xl rounded-3xl overflow-hidden"
                  style={{ background: "#FFFFFF", boxShadow: "0 28px 80px rgba(0,0,0,0.24)" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between gap-4 px-5 py-4"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F9F4EE" }}
                  >
                    <div>
                      <div style={{ color: "#9C8B76", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>
                        PROMPT
                      </div>
                      <div style={{ color: "#1A1208", fontWeight: 800, fontSize: 16 }}>
                        {modalPromptLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromptModal(null)}
                      className="px-3 py-2 rounded-xl"
                      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", color: "#4A3D30", fontSize: 13, fontWeight: 700 }}
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="p-5 space-y-5 max-h-[82vh] overflow-auto">
                    <div className="inline-flex items-center rounded-2xl p-1" style={{ background: "#F4ECE2" }}>
                      {(["ai", "generic"] as const).map((source) => {
                        const active = promptModal.source === source;
                        return (
                          <button
                            key={source}
                            type="button"
                            onClick={() => {
                              setCopiedModalPrompt(false);
                              setPromptModalError(null);
                              setPromptModal((current) =>
                                current ? { ...current, source } : current,
                              );
                            }}
                            className="relative px-4 py-2 rounded-xl"
                            style={{
                              background: active
                                ? "linear-gradient(135deg,#ff33ad,#ff5fbe)"
                                : "transparent",
                              color: active ? "#FFFFFF" : "#6E5A45",
                              fontSize: 13,
                              fontWeight: 700,
                              transition: "all 180ms ease",
                            }}
                          >
                            {source === "ai" ? "Prompt IA" : "Prompt générique"}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: promptModal.source === "ai" ? "#fff0fa" : "#fffce6",
                        border:
                          promptModal.source === "ai"
                            ? "1px solid rgba(255,51,173,0.18)"
                            : "1px solid rgba(255,212,29,0.28)",
                      }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(0,0,0,0.06)",
                          color: promptModal.source === "ai" ? "#ff33ad" : "#ffc200",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        <Bot size={14} />
                        {promptModal.source === "ai"
                          ? "Prompt généré par l'IA selon le profil utilisateur"
                          : "Prompt générique de départ"}
                      </div>

                      {promptModal.source === "ai" && promptModalLoading ? (
                        <div
                          className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3"
                          style={{ background: "#1A1208", color: "#FFF8F0", minHeight: 220 }}
                        >
                          <LoaderCircle size={24} className="animate-spin" />
                          <div style={{ fontSize: 14, fontWeight: 700 }}>
                            Génération du prompt IA
                          </div>
                          <div style={{ fontSize: 12.5, color: "rgba(255,248,240,0.78)" }}>
                            Le prompt se prépare à partir du profil et du cas d'usage.
                          </div>
                        </div>
                      ) : (
                        <pre
                          className="rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap"
                          style={{
                            background: "#1A1208",
                            color: "#FFF8F0",
                            fontSize: 13,
                            lineHeight: 1.7,
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                          }}
                        >
                          <code>{modalPromptText}</code>
                        </pre>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-2xl p-4" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ color: "#1A1208", fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                          Pourquoi ce prompt est utile
                        </div>
                        <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.7 }}>
                          {promptModal.source === "ai"
                            ? promptModalLoading
                              ? "L'IA prépare aussi l'explication du prompt."
                              : modalPromptWhy
                            : genericPromptWhy}
                        </p>
                      </div>
                      <div className="rounded-2xl p-4" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ color: "#1A1208", fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                          Ce que tu peux encore ajouter
                        </div>
                        <div className="space-y-2">
                          {(promptModal.source === "ai" && promptModalLoading
                            ? ["Chargement des pistes d'amélioration..."]
                            : promptModal.source === "ai"
                              ? modalPromptAdditions
                              : genericPromptAdditions).map((item) => (
                            <div key={item} className="flex items-start gap-2" style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.6 }}>
                              <span style={{ color: "#1A1208", marginTop: 1 }}>•</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {promptModalError && (
                      <div
                        className="rounded-2xl px-4 py-3"
                        style={{ background: "#fff0fa", border: "1px solid rgba(255,51,173,0.18)", color: "#7B345A", fontSize: 12.5 }}
                      >
                        {promptModalError}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        type="button"
                        onClick={copyModalPrompt}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-3 rounded-xl flex items-center gap-2"
                        style={{
                          background: "linear-gradient(135deg,#ffd41d,#ffc200)",
                          color: "#1A1208",
                          fontWeight: 700,
                          fontSize: 13,
                          opacity: promptModal.source === "ai" && promptModalLoading ? 0.55 : 1,
                        }}
                        disabled={promptModal.source === "ai" && promptModalLoading}
                      >
                        <Copy size={16} />
                        {copiedModalPrompt ? "Prompt copié" : "Copier le prompt"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #ff33ad", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,51,173,0.25)", background: "#fff0fa" }}>
                <Bot size={18} style={{ color: "#ff33ad" }} />
                <div className="flex-1">
                  <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>CHAT DE MODIFICATION</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                    Donne une consigne libre, puis régénère si la demande est assez claire
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div ref={chatScrollRef} className="space-y-3 mb-4 max-h-72 overflow-auto pr-1">
                  {chatMessages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className="flex items-end gap-2">
                      {message.role === "assistant" && (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "#fff0fa",
                            border: "1px solid rgba(255,51,173,0.2)",
                            color: "#ff33ad",
                          }}
                        >
                          <Bot size={16} />
                        </div>
                      )}
                      <div
                        className="rounded-xl px-4 py-3"
                        style={{
                          background: message.role === "assistant" ? "#F9F4EE" : "#fff0fa",
                          border:
                            message.role === "assistant"
                              ? "1px solid rgba(0,0,0,0.06)"
                              : "1px solid rgba(255,51,173,0.2)",
                          marginLeft: message.role === "assistant" ? 0 : 40,
                          marginRight: message.role === "assistant" ? 40 : 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            color: message.role === "assistant" ? "#9C8B76" : "#ff33ad",
                            fontSize: 10,
                            fontFamily: "monospace",
                            marginBottom: 6,
                          }}
                        >
                          {message.role === "assistant" ? "ASSISTANT" : "VOUS"}
                        </div>
                        <div style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.6 }}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-end gap-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "#fff0fa",
                          border: "1px solid rgba(255,51,173,0.2)",
                          color: "#ff33ad",
                        }}
                      >
                        <Bot size={16} />
                      </div>
                      <div className="rounded-xl px-4 py-3 flex-1" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)", marginRight: 40 }}>
                        <div style={{ color: "#9C8B76", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>ASSISTANT</div>
                        <div className="flex items-center gap-2" style={{ color: "#1A1208", fontSize: 13 }}>
                          <LoaderCircle size={14} className="animate-spin" />
                          <span>En train d'écrire</span>
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map((dot) => (
                              <motion.span
                                key={dot}
                                animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                                transition={{
                                  duration: 0.9,
                                  repeat: Infinity,
                                  delay: dot * 0.15,
                                }}
                                style={{ display: "inline-block", lineHeight: 1 }}
                              >
                                .
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-3 mb-3" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Exemple : rends la séquence plus orientée travail de groupe et ajoute une évaluation formative intermédiaire."
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 outline-none resize-none"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.08)",
                      color: "#1A1208",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <motion.button
                    onClick={() => void handleChatSend()}
                    whileHover={!chatLoading ? { scale: 1.02 } : {}}
                    whileTap={!chatLoading ? { scale: 0.98 } : {}}
                    className="px-4 py-3 rounded-xl flex items-center gap-2"
                    style={{
                      background: "linear-gradient(135deg,#ff33ad,#ff5fbe)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      opacity: chatLoading || !chatInput.trim() ? 0.6 : 1,
                    }}
                  >
                    {chatLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    Envoyer au chat
                  </motion.button>

                  <div
                    className="relative"
                    onMouseEnter={() => {
                      if (!pendingInstructionDraft && !chatLoading) {
                        setShowPendingInstructionHint(true);
                      }
                    }}
                    onMouseLeave={() => setShowPendingInstructionHint(false)}
                  >
                    {showPendingInstructionHint && !pendingInstructionDraft && !chatLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] w-64 rounded-2xl px-4 py-3"
                        style={{
                          background: "#1A1208",
                          color: "#FFF8F0",
                          boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          zIndex: 10,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                          L’IA a encore besoin d’informations
                        </div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,248,240,0.82)" }}>
                          Réponds d’abord à sa question ou précise mieux ta demande pour débloquer la régénération.
                        </div>
                      </motion.div>
                    )}

                    <motion.button
                      onClick={() => void handleChatRegenerate()}
                      whileHover={!chatLoading && pendingInstructionDraft ? { scale: 1.02 } : {}}
                      whileTap={!chatLoading && pendingInstructionDraft ? { scale: 0.98 } : {}}
                      className="px-4 py-3 rounded-xl flex items-center gap-2"
                      style={{
                        background: pendingInstructionDraft
                          ? "linear-gradient(135deg,#ffd41d,#ffc200)"
                          : "#F9F4EE",
                        color: pendingInstructionDraft ? "#1A1208" : "#C4B8AE",
                        fontWeight: 700,
                        fontSize: 13,
                        border: pendingInstructionDraft ? "none" : "1px solid rgba(0,0,0,0.08)",
                        cursor: pendingInstructionDraft ? "pointer" : "not-allowed",
                      }}
                    >
                      <RefreshCw size={15} />
                      Régénérer avec ces infos
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#fff0fa", borderTop: "3px solid #ff33ad", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div className="px-5 py-4" style={{ color: "#4A3D30", fontSize: 13 }}>{error}</div>
              </div>
            )}

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #1da82a", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(29,168,42,0.25)", background: "#edfaee" }}>
                <Sparkles size={18} style={{ color: "#1da82a" }} />
                <div className="flex-1">
                  <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>RECOMMANDATION PERSONNALISEE</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{kit.recommendation.profileLabel}</div>
                </div>
              </div>
              <div className="p-5">
                <p style={{ color: "#4A3D30", fontSize: 13.5, lineHeight: 1.75, marginBottom: 16 }}>{kit.recommendation.summary}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Cas 1 - Structurer une séquence",
                      friction: kit.recommendation.case1Friction,
                      usage: kit.recommendation.case1Usage,
                      limit: kit.recommendation.case1Limit,
                      bg: "#edfaee",
                      border: "rgba(29,168,42,0.25)",
                      color: "#1da82a",
                    },
                    {
                      title: "Cas 2 - Différencier une évaluation",
                      friction: kit.recommendation.case2Friction,
                      usage: kit.recommendation.case2Usage,
                      limit: kit.recommendation.case2Limit,
                      bg: "#fffce6",
                      border: "rgba(255,212,29,0.3)",
                      color: "#ffc200",
                    },
                  ].map((card) => (
                    <div key={card.title} className="rounded-xl p-4" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                      <div style={{ color: "#1A1208", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>{card.title.toUpperCase()}</div>
                      <p style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6, marginBottom: 8 }}><strong>Friction :</strong> {card.friction}</p>
                      <p style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6, marginBottom: 8 }}><strong>Usage :</strong> {card.usage}</p>
                      <p style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}><strong>Limite :</strong> {card.limit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-5 mb-5">
              <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", borderTop: "3px solid #1da82a", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(29,168,42,0.25)", background: "#edfaee" }}>
                  <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>CAS 1 - STRUCTURER UNE SEQUENCE</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{kit.sequence.title}</div>
                </div>
                <div className="p-5 space-y-4">
                  <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.65 }}>{kit.sequence.overview}</p>
                  <div className="rounded-xl p-4" style={{ background: "#edfaee", border: "1px solid rgba(29,168,42,0.25)" }}>
                    <div style={{ color: "#1A1208", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>POURQUOI CETTE STRUCTURE</div>
                    <p style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>{kit.sequence.whyThisStructure}</p>
                  </div>
                  <div className="space-y-3">
                    {kit.sequence.sessions.map((session, index) => (
                      <div key={`${session.title}-${index}`} className="rounded-xl p-4" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ color: "#1A1208", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>SEANCE {index + 1}</div>
                        <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{session.title}</div>
                        <p style={{ color: "#4A3D30", fontSize: 12.5, lineHeight: 1.6 }}>{session.objective}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#fff0fa", border: "1px solid rgba(255,51,173,0.25)" }}>
                    <div style={{ color: "#1A1208", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>POINTS ENCORE FRAGILES</div>
                    <div className="space-y-2">
                      {kit.sequence.fragilePoints.map((item) => (
                        <div key={item} className="flex items-start gap-2" style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>
                          <span style={{ color: "#1A1208", marginTop: 2 }}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadSequencePdf} className="px-4 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#ffd41d,#ffc200)", color: "#1A1208", fontWeight: 700, fontSize: 13 }}>
                      <Download size={16} />
                      PDF Cas 1
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPromptModal({ kind: "sequence", source: "ai" })} className="px-4 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: "#4A3D30", fontWeight: 700, fontSize: 13 }}>
                      <Copy size={16} />
                      Voir le prompt
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", borderTop: "3px solid #ffc200", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,212,29,0.3)", background: "#fffce6" }}>
                  <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>CAS 2 - DIFFERENCIER UNE EVALUATION</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{kit.evaluationKit.title}</div>
                </div>
                <div className="p-5 space-y-4">
                  <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.65 }}>{kit.evaluationKit.overview}</p>
                  <div className="rounded-xl p-4" style={{ background: "#fffce6", border: "1px solid rgba(255,212,29,0.3)" }}>
                    <div style={{ color: "#1A1208", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>POURQUOI CE CAS D'USAGE</div>
                    <p style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>{kit.evaluationKit.whyUseful}</p>
                  </div>
                  {[
                    ["Leviers de différenciation", kit.evaluationKit.differentiationLevers],
                    ["Ce que l'enseignant garde en main", kit.evaluationKit.whatTeacherKeeps],
                    ["Points de vigilance", kit.evaluationKit.vigilancePoints],
                    ["Exemples de variantes", kit.evaluationKit.exampleVariants],
                  ].map(([title, items]) => (
                    <div key={title} className="rounded-xl p-4" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ color: "#1A1208", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>{title.toUpperCase()}</div>
                      <div className="space-y-2">
                        {(items as string[]).map((item) => (
                          <div key={item} className="flex items-start gap-2" style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>
                            <span style={{ color: "#1A1208", marginTop: 2 }}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadEvaluationPdf} className="px-4 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#ffd41d,#ffc200)", color: "#1A1208", fontWeight: 700, fontSize: 13 }}>
                      <Download size={16} />
                      PDF Cas 2
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPromptModal({ kind: "evaluation", source: "ai" })} className="px-4 py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: "#4A3D30", fontWeight: 700, fontSize: 13 }}>
                      <Copy size={16} />
                      Voir le prompt
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #ffd41d", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,212,29,0.3)", background: "#fffce6" }}>
                <WandSparkles size={18} style={{ color: "#ffc200" }} />
                <div className="flex-1">
                  <div style={{ color: "#1A1208", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>AFFINER LES PROPOSITIONS DES CAS 1 ET 2</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>Demande une variante plus ciblée de la séquence et de l'évaluation</div>
                </div>
              </div>
              <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ["concrete", "Plus concret"],
                  ["progressive", "Plus progressif"],
                  ["differentiated", "Plus différencié"],
                  ["shorter", "Plus court"],
                ].map(([mode, label]) => (
                  <motion.button
                    key={mode}
                    onClick={() => void handleRefine(mode as RefineMode)}
                    whileHover={!refiningMode ? { scale: 1.02 } : {}}
                    whileTap={!refiningMode ? { scale: 0.98 } : {}}
                    className="px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                    style={{
                      background: refiningMode === mode ? "#F9F4EE" : "#FFFFFF",
                      border: "1px solid rgba(255,212,29,0.3)",
                      color: "#4A3D30",
                      fontWeight: 700,
                      fontSize: 13,
                      opacity: refiningMode && refiningMode !== mode ? 0.55 : 1,
                    }}
                  >
                    {refiningMode === mode ? <LoaderCircle size={15} className="animate-spin" /> : <WandSparkles size={15} />}
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {[sequenceReflex, evaluationReflex].map((sheet, index) => (
                <div key={sheet.title} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", borderTop: `3px solid ${index === 0 ? "#1da82a" : "#ffc200"}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: index === 0 ? "#edfaee" : "#fffce6" }}>
                    <div style={{ color: index === 0 ? "#1da82a" : "#ffc200", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>FICHE REFLEXE</div>
                    <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 13 }}>{sheet.title}</div>
                  </div>
                  <div className="p-5 space-y-3">
                    {sheet.points.map((point) => (
                      <div key={point} className="rounded-xl p-4" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)", color: "#4A3D30", fontSize: 12.5, lineHeight: 1.6 }}>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleShare} className="py-4 rounded-xl flex items-center justify-center gap-3" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: "#4A3D30", fontWeight: 700, fontSize: 14 }}>
                <Share2 size={18} />
                Partager ce kit avec un(e) collègue
              </motion.button>
              <motion.button onClick={() => void runGeneration(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="py-4 rounded-xl flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg,#ffd41d,#ffc200)", color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                <RefreshCw size={18} />
                Régénérer les 2 cas avec l'IA
              </motion.button>
            </div>

            <div className="flex justify-center">
              <motion.button onClick={() => navigate("/")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-7 py-2.5 rounded-xl inline-flex items-center gap-2" style={{ background: "#FFFFFF", border: "1px solid rgba(255,212,29,0.3)", color: "#ffd41d", fontWeight: 600, fontSize: 13 }}>
                Retour à l'accueil
              </motion.button>
            </div>
          </>
        )}
      </div>
      <RippleLayer />
    </div>
  );
}
