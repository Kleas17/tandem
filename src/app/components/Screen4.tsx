import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
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
import { jsPDF } from "jspdf";
import { useCtaRipple } from "./useCtaRipple";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getQuizAnswers, getScore } from "../quizStore";
import {
  buildPrompt,
  FALLBACK_GENERATION,
  generateSelfCheck,
  generateSequence,
  refineSequence,
  type GeneratedSequence,
  type SequenceInput,
} from "../lib/sequenceAi";

const GENERATED_SEQUENCE_KEY = "tandem_generated_sequence_v2";

type RefineMode = "concrete" | "progressive" | "differentiated" | "shorter";

function getReflexSheet() {
  return {
    title: "Fiche reflexe - Structurer une sequence avec l'IA",
    points: [
      {
        icon: "Prompt",
        label: "Ce que vous mettez dans le prompt",
        text: "Precisez le sujet, l'objectif final, la discipline, le niveau, le temps disponible et toute contrainte forte utile.",
      },
      {
        icon: "Controle",
        label: "Ce que vous verifiez toujours",
        text: "Verifiez que la progression proposee correspond a ce que votre classe a reellement travaille, pas seulement aux attendus officiels.",
      },
      {
        icon: "Maitrise",
        label: "Ce que vous ne deleguez pas",
        text: "La logique de progression reste de votre ressort. L'IA propose un squelette, vous apportez la coherence pedagogique et la connaissance de vos eleves.",
      },
    ],
  };
}

function getScoreBadge(correct: number) {
  if (correct === 3) {
    return {
      label: "Reflexes integres",
      color: "#1da82a",
      bg: "#edfaee",
      border: "rgba(29,168,42,0.25)",
    };
  }

  if (correct >= 2) {
    return {
      label: "En bonne voie",
      color: "#ffc200",
      bg: "#fffce6",
      border: "rgba(255,212,29,0.3)",
    };
  }

  return {
    label: "A consolider",
    color: "#ff33ad",
    bg: "#fff0fa",
    border: "rgba(255,51,173,0.25)",
  };
}

function mergeUnique(base: string[], extra: string[]) {
  const seen = new Set<string>();
  return [...base, ...extra].filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enrichSequence(
  generated: GeneratedSequence,
  selfCheck: { fragilePoints: string[]; vigilancePoints: string[] },
): GeneratedSequence {
  return {
    ...generated,
    fragilePoints: mergeUnique(generated.fragilePoints, selfCheck.fragilePoints),
    vigilancePoints: mergeUnique(
      generated.vigilancePoints,
      selfCheck.vigilancePoints,
    ),
  };
}

function formatClarifications(sequence: SequenceInput | null) {
  if (!sequence?.aiClarifications || sequence.aiClarifications.length === 0) {
    return [];
  }

  return sequence.aiClarifications.map(
    (item) => `${item.question}: ${item.answer || "Non precise"}`,
  );
}

function buildPdf(sequence: SequenceInput | null, generated: GeneratedSequence, prompt: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 44;
  const topMargin = 44;
  const bottomMargin = 44;
  const contentWidth = pageWidth - marginX * 2;
  let y = topMargin;
  const colors = {
    ink: [26, 18, 8] as [number, number, number],
    body: [74, 61, 48] as [number, number, number],
    muted: [156, 139, 118] as [number, number, number],
    yellow: [255, 194, 0] as [number, number, number],
    yellowSoft: [255, 252, 230] as [number, number, number],
    green: [29, 168, 42] as [number, number, number],
    greenSoft: [237, 250, 238] as [number, number, number],
    pink: [255, 51, 173] as [number, number, number],
    pinkSoft: [255, 240, 250] as [number, number, number],
    line: [228, 220, 210] as [number, number, number],
    page: [255, 248, 240] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  const ensureSpace = (needed = 24) => {
    if (y + needed > pageHeight - bottomMargin) {
      doc.addPage();
      doc.setFillColor(...colors.page);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      y = topMargin;
    }
  };

  const writeSectionTitle = (text: string) => {
    ensureSpace(28);
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(1);
    doc.line(marginX, y - 8, pageWidth - marginX, y - 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.ink);
    doc.text(text, marginX, y);
    y += 18;
  };

  const drawPanel = (
    title: string,
    body: string | string[],
    accent: [number, number, number],
    fill: [number, number, number],
  ) => {
    const items = Array.isArray(body) ? body : [body];
    const blockHeight =
      34 +
      items.flatMap((item) => doc.splitTextToSize(item, contentWidth - 30)).length *
        15 +
      16;
    ensureSpace(blockHeight + 10);
    doc.setFillColor(...fill);
    doc.roundedRect(marginX, y, contentWidth, blockHeight, 12, 12, "F");
    doc.setFillColor(...accent);
    doc.roundedRect(marginX, y + 12, 4, blockHeight - 24, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text(title.toUpperCase(), marginX + 18, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.body);
    let cursorY = y + 40;
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, contentWidth - 30);
      doc.text(lines, marginX + 18, cursorY);
      cursorY += lines.length * 15 + 6;
    });
    y += blockHeight + 12;
  };

  doc.setFillColor(...colors.page);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...colors.white);
  doc.roundedRect(marginX, y, contentWidth, 118, 18, 18, "F");
  doc.setFillColor(...colors.yellow);
  doc.roundedRect(marginX, y + 16, 6, 86, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.green);
  doc.text("TANDEM · LIVRABLE IA", marginX + 24, y + 24);
  doc.setFontSize(22);
  doc.setTextColor(...colors.ink);
  doc.text("Structurer une sequence pedagogique", marginX + 24, y + 50);
  doc.setFontSize(14);
  doc.setTextColor(...colors.yellow);
  doc.text(generated.title, marginX + 24, y + 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...colors.body);
  doc.text(doc.splitTextToSize(generated.overview, contentWidth - 48), marginX + 24, y + 96);
  y += 138;

  drawPanel(
    "Contexte enseignant",
    [
      `Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}`,
      `Discipline : ${sequence?.discipline || "Non precise"}`,
      `Niveau / classe : ${sequence?.niveau || "Non precise"}`,
      `Nombre de seances : ${sequence?.seances || "Non precise"}`,
      `Acquis prealables : ${sequence?.acquis || "Non precise"}`,
      ...formatClarifications(sequence),
    ],
    colors.green,
    colors.greenSoft,
  );
  drawPanel("Pourquoi cette structure", generated.whyThisStructure, colors.yellow, colors.yellowSoft);
  drawPanel("Accroche premiere seance", generated.firstSessionHook, colors.green, colors.greenSoft);

  writeSectionTitle("Proposition de sequence");
  generated.sessions.forEach((session, index) => {
    drawPanel(
      `Seance ${index + 1} - ${session.title}`,
      [
        `Objectif : ${session.objective}`,
        `Focus : ${session.focus}`,
        `Activite : ${session.activity}`,
      ],
      colors.yellow,
      colors.white,
    );
  });

  drawPanel("Checkpoints", generated.checkpoints, colors.green, colors.greenSoft);
  drawPanel("Points de vigilance", generated.vigilancePoints, colors.pink, colors.pinkSoft);
  drawPanel("Points encore fragiles", generated.fragilePoints, colors.yellow, colors.yellowSoft);
  drawPanel("Ajustements enseignant", generated.teacherAdjustments, colors.yellow, colors.yellowSoft);
  drawPanel("Evaluation finale", generated.finalAssessment, colors.green, colors.greenSoft);
  drawPanel("Prompt complet", prompt, colors.ink, colors.white);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...colors.line);
    doc.line(marginX, pageHeight - 30, pageWidth - marginX, pageHeight - 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(`TANDEM · Y-Days 2026 · Page ${page}/${pageCount}`, marginX, pageHeight - 16);
  }

  return doc;
}

export default function Screen4() {
  const navigate = useNavigate();
  const [generated, setGenerated] = useState<GeneratedSequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refiningMode, setRefiningMode] = useState<RefineMode | null>(null);
  const { triggerRipple, RippleLayer } = useCtaRipple();
  const progressIntervalRef = useRef<number | null>(null);

  const raw = localStorage.getItem("tandem_sequence");
  const sequence = raw ? (JSON.parse(raw) as SequenceInput) : null;
  const answers = getQuizAnswers();
  const score = getScore();
  const badge = getScoreBadge(score.correct);
  const reflex = getReflexSheet();
  const fullPrompt = useMemo(() => buildPrompt(sequence), [sequence]);

  const runGeneration = async (force = false) => {
    setError(null);
    setLoading(true);
    setLoadingProgress(8);
    const cacheKey = JSON.stringify(sequence || {});

    if (!force) {
      const cachedRaw = localStorage.getItem(GENERATED_SEQUENCE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as {
            cacheKey: string;
            data: GeneratedSequence;
          };
          if (cached.cacheKey === cacheKey) {
            setGenerated(cached.data);
            setLoadingProgress(100);
            window.setTimeout(() => setLoading(false), 200);
            return;
          }
        } catch {
          localStorage.removeItem(GENERATED_SEQUENCE_KEY);
        }
      }
    }

    try {
      const initial = await generateSequence(sequence);
      const selfCheck = await generateSelfCheck(sequence, initial);
      const enriched = enrichSequence(initial, selfCheck);
      localStorage.setItem(
        GENERATED_SEQUENCE_KEY,
        JSON.stringify({ cacheKey, data: enriched }),
      );
      setGenerated(enriched);
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
      setGenerated(FALLBACK_GENERATION);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success("Prompt copie");
    });
  };

  const handleDownload = () => {
    if (!generated) return;
    buildPdf(sequence, generated, fullPrompt).save("tandem-livrable-sequence.pdf");
    toast.success("Livrable PDF telecharge");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "TANDEM - Kit d'onboarding IA pour enseignants",
        text: "Decouvrez TANDEM, le kit d'onboarding IA pour structurer vos sequences de cours.",
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Lien copie");
    }
  };

  const handleRefine = async (mode: RefineMode) => {
    if (!generated || refiningMode) return;
    setRefiningMode(mode);
    try {
      const refined = await refineSequence(sequence, generated, mode);
      const selfCheck = await generateSelfCheck(sequence, refined);
      const enriched = enrichSequence(refined, selfCheck);
      setGenerated(enriched);
      localStorage.setItem(
        GENERATED_SEQUENCE_KEY,
        JSON.stringify({ cacheKey: JSON.stringify(sequence || {}), data: enriched }),
      );
      toast.success("Proposition affinee");
    } catch {
      toast.error("Impossible d'affiner la proposition");
    } finally {
      setRefiningMode(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(255,212,29,0.3)", background: "#fffce6", color: "#ffd41d", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}
          >
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
                <div style={{ color: "#ffc200", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>GENERATION IA EN COURS</div>
                <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>Construction + auto-verification de la proposition</div>
              </div>
              <span style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{loadingProgress}%</span>
            </div>
            <div className="p-5">
              <div className="w-full rounded-full overflow-hidden mb-4" style={{ background: "#F5EFE8", height: 14 }}>
                <motion.div animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ height: "100%", background: "linear-gradient(90deg,#ffd41d 0%,#ffc200 55%,#1da82a 100%)" }} />
              </div>
              <p style={{ color: "#9C8B76", fontSize: 12, lineHeight: 1.65 }}>
                La barre reste sous 100% tant que la reponse complete n'est pas revenue, y compris la passe d'auto-verification.
              </p>
            </div>
          </div>
        )}

        {!loading && generated && (
          <>
            {error && (
              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#fff0fa", borderTop: "3px solid #ff33ad", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div className="px-5 py-4" style={{ color: "#4A3D30", fontSize: 13 }}>{error}</div>
              </div>
            )}

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #1da82a", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(29,168,42,0.25)", background: "#edfaee" }}>
                <Sparkles size={18} style={{ color: "#1da82a" }} />
                <div className="flex-1">
                  <div style={{ color: "#1da82a", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>SEQUENCE GENEREE PAR L'IA</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{generated.title}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[`${generated.sessions.length} seances`, "Livrable IA", "Auto-verifie"].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: "#edfaee", border: "1px solid rgba(29,168,42,0.25)", color: "#1da82a", fontSize: 9 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <p style={{ color: "#4A3D30", fontSize: 13.5, lineHeight: 1.75, marginBottom: 16 }}>{generated.overview}</p>

                <div className="grid lg:grid-cols-[1fr,1fr] gap-4 mb-4">
                  <div className="rounded-xl p-4" style={{ background: "#edfaee", border: "1px solid rgba(29,168,42,0.25)" }}>
                    <div style={{ color: "#1da82a", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>
                      POURQUOI CETTE STRUCTURE
                    </div>
                    <p style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.65 }}>{generated.whyThisStructure}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#fffce6", border: "1px solid rgba(255,212,29,0.3)" }}>
                    <div style={{ color: "#ffc200", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>
                      ACCROCHE PREMIERE SEANCE
                    </div>
                    <p style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.65 }}>{generated.firstSessionHook}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {generated.sessions.map((session, index) => (
                    <div key={`${session.title}-${index}`} className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full" style={{ background: "#edfaee", border: "1px solid rgba(29,168,42,0.25)", color: "#1da82a", fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>
                          SEANCE {index + 1}
                        </span>
                        <span style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{session.title}</span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        {[
                          ["OBJECTIF", session.objective],
                          ["FOCUS", session.focus],
                          ["ACTIVITE", session.activity],
                        ].map(([label, text]) => (
                          <div key={label} className="rounded-lg p-3" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                            <div style={{ color: "#9C8B76", fontSize: 10, fontFamily: "monospace", marginBottom: 6 }}>{label}</div>
                            <p style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>{text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl p-4" style={{ background: "#fff0fa", border: "1px solid rgba(255,51,173,0.25)" }}>
                    <div style={{ color: "#ff33ad", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>
                      POINTS ENCORE FRAGILES
                    </div>
                    <div className="space-y-2">
                      {generated.fragilePoints.map((item) => (
                        <div key={item} className="flex items-start gap-2" style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>
                          <span style={{ color: "#ff33ad", marginTop: 2 }}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#fffce6", border: "1px solid rgba(255,212,29,0.3)" }}>
                    <div style={{ color: "#ffc200", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>
                      EVALUATION FINALE
                    </div>
                    <p style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.65 }}>{generated.finalAssessment}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { title: "Checkpoints", color: "#1da82a", bg: "#edfaee", border: "rgba(29,168,42,0.25)", items: generated.checkpoints },
                    { title: "Points de vigilance", color: "#ff33ad", bg: "#fff0fa", border: "rgba(255,51,173,0.25)", items: generated.vigilancePoints },
                    { title: "Ajustements enseignant", color: "#ffc200", bg: "#fffce6", border: "rgba(255,212,29,0.3)", items: generated.teacherAdjustments },
                  ].map((block) => (
                    <div key={block.title} className="rounded-xl p-4" style={{ background: block.bg, border: `1px solid ${block.border}` }}>
                      <div style={{ color: block.color, fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>
                        {block.title.toUpperCase()}
                      </div>
                      <div className="space-y-2">
                        {block.items.map((item) => (
                          <div key={item} className="flex items-start gap-2" style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}>
                            <span style={{ color: block.color, marginTop: 2 }}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #ffd41d", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,212,29,0.3)", background: "#fffce6" }}>
                <WandSparkles size={18} style={{ color: "#ffc200" }} />
                <div className="flex-1">
                  <div style={{ color: "#ffc200", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>AFFINER LA PROPOSITION</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                    Demande une variante plus ciblee sans refaire tout le parcours
                  </div>
                </div>
              </div>
              <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ["concrete", "Plus concret"],
                  ["progressive", "Plus progressif"],
                  ["differentiated", "Plus differencie"],
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

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #1da82a", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(29,168,42,0.25)", background: "#edfaee" }}>
                <div style={{ color: "#1da82a", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>PROMPT PERSONNALISE - PRET A L'EMPLOI</div>
              </div>
              <div className="p-5">
                <textarea readOnly value={fullPrompt} className="rounded-xl p-4 mb-4 w-full resize-none overflow-auto" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.12)", minHeight: 240, fontFamily: "monospace", fontSize: 11, color: "#4A3D30", lineHeight: 1.6, outline: "none" }} rows={11} />
                <motion.button onClick={handleCopy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2" style={{ background: "#1da82a", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                  {copied ? <><CheckCircle size={15} /> COPIE</> : <><Copy size={15} /> COPIER LE PROMPT COMPLET</>}
                </motion.button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#FFFFFF", borderTop: "3px solid #ffd41d", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,212,29,0.3)", background: "#fffce6" }}>
                <div style={{ color: "#ffc200", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>FICHE REFLEXE</div>
                <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 13 }}>{reflex.title}</div>
              </div>
              <div className="p-5 space-y-3">
                {reflex.points.map((point) => (
                  <div key={point.label} className="flex gap-3 items-start p-3 rounded-xl" style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="px-2.5 py-1 rounded-full" style={{ background: "#fffce6", border: "1px solid rgba(255,212,29,0.3)", color: "#ffc200", fontSize: 10, fontFamily: "monospace", flexShrink: 0 }}>{point.icon}</span>
                    <div>
                      <div style={{ color: "#ffc200", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700, marginBottom: 3 }}>{point.label.toUpperCase()}</div>
                      <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.65 }}>{point.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleDownload} className="py-4 rounded-xl flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg,#ffd41d,#ffc200)", color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                <Download size={18} />
                Telecharger le livrable genere
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleShare} className="py-4 rounded-xl flex items-center justify-center gap-3" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: "#4A3D30", fontWeight: 700, fontSize: 14 }}>
                <Share2 size={18} />
                Partager ce kit avec un(e) collegue
              </motion.button>
            </div>

            <div className="flex justify-center">
              <motion.button onClick={() => void runGeneration(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-5 py-3 rounded-xl flex items-center gap-2" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: "#4A3D30", fontWeight: 700, fontSize: 13 }}>
                <RefreshCw size={15} />
                Regenerer depuis l'IA
              </motion.button>
            </div>
          </>
        )}
      </div>
      <RippleLayer />
    </div>
  );
}
