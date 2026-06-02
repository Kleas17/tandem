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
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useCtaRipple } from "./useCtaRipple";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getQuizAnswers, getScore } from "../quizStore";

const MISTRAL_API_KEY = "AtKHEFJAavv5Unaj1wopV9GXpntVMtyr";
const MISTRAL_MODEL = "mistral-small-latest";
const GENERATED_SEQUENCE_KEY = "tandem_generated_sequence";

interface SequenceInput {
  objectif?: string;
  chapitre?: string;
  seances?: string;
  acquis?: string;
}

interface GeneratedSession {
  title: string;
  objective: string;
  focus: string;
  activity: string;
}

interface GeneratedSequence {
  title: string;
  overview: string;
  sessions: GeneratedSession[];
  firstSessionHook: string;
  checkpoints: string[];
  vigilancePoints: string[];
  teacherAdjustments: string[];
  finalAssessment: string;
}

const FALLBACK_GENERATION: GeneratedSequence = {
  title: "Proposition de sequence a retravailler",
  overview:
    "L'IA a prepare une premiere base. Verifie la progression, le niveau reel de la classe et les contraintes de temps avant utilisation.",
  sessions: [
    {
      title: "Seance 1 - Lancement",
      objective: "Clarifier le sujet et identifier les representations initiales des eleves.",
      focus: "Diagnostic des acquis et mise en route de la progression.",
      activity: "Activite d'accroche courte a partir d'un support simple a commenter.",
    },
  ],
  firstSessionHook:
    "Demander aux eleves de reagir a un document, une situation ou une consigne breve pour faire emerger les representations initiales.",
  checkpoints: [
    "Verifier rapidement les prerequis au debut de la sequence.",
    "Prevoir un point d'etape avant l'evaluation finale.",
  ],
  vigilancePoints: [
    "Verifier la coherence avec le programme reellement avance.",
    "Ajuster la difficulte au niveau de la classe.",
  ],
  teacherAdjustments: [
    "Adapter le rythme de chaque seance a la dynamique du groupe.",
    "Ajouter ou retirer des supports selon les besoins reels.",
  ],
  finalAssessment:
    "Construire une evaluation finale directement alignee sur l'objectif defini au depart.",
};

function buildPrompt(sequence: SequenceInput | null) {
  if (!sequence) {
    return `Tu es un assistant pedagogique expert en ingenierie de formation pour le second degre.

Je veux structurer une sequence pedagogique.

Aide-moi a :
1. Decomposer ce sujet en etapes pedagogiques coherentes
2. Identifier les jalons d'une progression
3. Proposer un titre et un objectif clair pour chaque seance
4. Suggérer une activite d'accroche engageante pour la 1ere seance
5. Identifier 2-3 points de vigilance

Tu ne connais pas mes eleves ni le detail exact de mon programme. Tes suggestions sont un point de depart que je vais adapter et valider.

Format souhaite : liste structuree avec titres, sous-titres et puces. Concis et actionnable.`;
  }

  return `Tu es un assistant pedagogique expert en ingenierie de formation pour le second degre.

Je veux structurer une sequence pedagogique avec les elements suivants :

Objectif final de la sequence :
${sequence.objectif || "[A completer]"}

Chapitre / Notion a travailler :
${sequence.chapitre || "[A completer]"}

Nombre de seances disponibles :
${sequence.seances || "[A completer]"}

Acquis prealables des eleves sur ce sujet :
${sequence.acquis || "[A completer]"}

Aide-moi a :
1. Decomposer ce sujet en etapes pedagogiques coherentes adaptees au nombre de seances
2. Identifier les jalons d'une progression logique en tenant compte des acquis prealables
3. Proposer un titre et un objectif clair pour chaque seance
4. Suggerer une activite d'accroche engageante pour la 1ere seance
5. Identifier 2-3 points de vigilance

Tu ne connais pas mes eleves ni le detail exact de mon programme. Tes suggestions sont un point de depart que je vais adapter et valider.

Format souhaite : liste structuree avec titres, sous-titres et puces. Concis et actionnable.`;
}

function buildGenerationRequest(sequence: SequenceInput | null) {
  return `Tu es un assistant pedagogique expert en ingenierie de formation pour le second degre en France.

Contexte enseignant :
- Objectif final : ${sequence?.objectif || "Non precise"}
- Chapitre / notion : ${sequence?.chapitre || "Non precise"}
- Nombre de seances disponibles : ${sequence?.seances || "Non precise"}
- Acquis prealables : ${sequence?.acquis || "Non precise"}

Retourne uniquement un JSON valide, sans markdown, sans texte avant ou apres, avec exactement cette structure :
{
  "title": "string",
  "overview": "string",
  "sessions": [
    {
      "title": "string",
      "objective": "string",
      "focus": "string",
      "activity": "string"
    }
  ],
  "firstSessionHook": "string",
  "checkpoints": ["string"],
  "vigilancePoints": ["string"],
  "teacherAdjustments": ["string"],
  "finalAssessment": "string"
}

Contraintes de contenu :
- Reponse en francais.
- Entre 3 et 8 seances selon les informations disponibles.
- Chaque seance doit etre concrete et actionnable.
- Les checkpoints doivent aider l'enseignant a verifier la progression.
- Les vigilancePoints doivent rappeler ce que l'enseignant doit corriger ou verifier.
- Les teacherAdjustments doivent insister sur le fait que l'enseignant garde la maitrise pedagogique.
- finalAssessment doit etre une proposition breve et coherente avec l'objectif final.
- Ne jamais inventer de programme officiel trop precis si l'information n'est pas fournie.`;
}

function getReflexSheet() {
  return {
    title: "Fiche reflexe - Structurer une sequence avec l'IA",
    points: [
      {
        icon: "Prompt",
        label: "Ce que vous mettez dans le prompt",
        text: "Precisez l'objectif final, le chapitre/notion exact, le nombre de seances et les acquis prealables. Plus c'est contextualise, plus la proposition sera pertinente et moins vous corrigerez en sortie.",
      },
      {
        icon: "Controle",
        label: "Ce que vous verifiez toujours",
        text: "Verifiez que la progression proposee correspond a ce que votre classe a reellement travaille, pas seulement aux attendus officiels. L'IA ne connait pas votre avancement reel.",
      },
      {
        icon: "Maitrise",
        label: "Ce que vous ne deleguez pas",
        text: "La logique de progression reste de votre ressort. L'IA propose un squelette, vous apportez la connaissance de vos eleves et la coherence pedagogique.",
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
      emoji: "Expert",
    };
  }

  if (correct >= 2) {
    return {
      label: "En bonne voie",
      color: "#ffc200",
      bg: "#fffce6",
      border: "rgba(255,212,29,0.3)",
      emoji: "Progression",
    };
  }

  return {
    label: "A consolider",
    color: "#ff33ad",
    bg: "#fff0fa",
    border: "rgba(255,51,173,0.25)",
    emoji: "Reprise",
  };
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallbacks: string[]) {
  if (!Array.isArray(value)) return fallbacks;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallbacks;
}

function normalizeSessions(value: unknown) {
  if (!Array.isArray(value)) return FALLBACK_GENERATION.sessions;

  const sessions = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const session = item as Record<string, unknown>;
      return {
        title: normalizeString(session.title, `Seance ${index + 1}`),
        objective: normalizeString(
          session.objective,
          "Objectif a preciser par l'enseignant.",
        ),
        focus: normalizeString(
          session.focus,
          "Point de progression a valider.",
        ),
        activity: normalizeString(
          session.activity,
          "Activite a adapter au contexte de classe.",
        ),
      };
    })
    .filter(Boolean) as GeneratedSession[];

  return sessions.length > 0 ? sessions : FALLBACK_GENERATION.sessions;
}

function normalizeGeneration(payload: unknown): GeneratedSequence {
  if (!payload || typeof payload !== "object") {
    return FALLBACK_GENERATION;
  }

  const data = payload as Record<string, unknown>;

  return {
    title: normalizeString(data.title, FALLBACK_GENERATION.title),
    overview: normalizeString(data.overview, FALLBACK_GENERATION.overview),
    sessions: normalizeSessions(data.sessions),
    firstSessionHook: normalizeString(
      data.firstSessionHook,
      FALLBACK_GENERATION.firstSessionHook,
    ),
    checkpoints: normalizeStringArray(
      data.checkpoints,
      FALLBACK_GENERATION.checkpoints,
    ),
    vigilancePoints: normalizeStringArray(
      data.vigilancePoints,
      FALLBACK_GENERATION.vigilancePoints,
    ),
    teacherAdjustments: normalizeStringArray(
      data.teacherAdjustments,
      FALLBACK_GENERATION.teacherAdjustments,
    ),
    finalAssessment: normalizeString(
      data.finalAssessment,
      FALLBACK_GENERATION.finalAssessment,
    ),
  };
}

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

async function generateSequenceWithMistral(sequence: SequenceInput | null) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu reponds uniquement avec du JSON valide. Aucun markdown. Aucun commentaire hors JSON.",
        },
        {
          role: "user",
          content: buildGenerationRequest(sequence),
        },
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
    throw new Error("Reponse vide recue depuis Mistral.");
  }

  return normalizeGeneration(JSON.parse(rawContent));
}

function formatSequenceForDownload(
  sequence: SequenceInput | null,
  generated: GeneratedSequence,
  prompt: string,
) {
  const lines = [
    generated.title,
    "",
    generated.overview,
    "",
    "Contexte enseignant",
    `- Objectif final: ${sequence?.objectif || "Non precise"}`,
    `- Chapitre / notion: ${sequence?.chapitre || "Non precise"}`,
    `- Nombre de seances: ${sequence?.seances || "Non precise"}`,
    `- Acquis prealables: ${sequence?.acquis || "Non precise"}`,
    "",
    "Proposition de sequence",
    ...generated.sessions.flatMap((session, index) => [
      "",
      `${index + 1}. ${session.title}`,
      `   Objectif: ${session.objective}`,
      `   Focus: ${session.focus}`,
      `   Activite: ${session.activity}`,
    ]),
    "",
    "Accroche premiere seance",
    generated.firstSessionHook,
    "",
    "Checkpoints",
    ...generated.checkpoints.map((item) => `- ${item}`),
    "",
    "Points de vigilance",
    ...generated.vigilancePoints.map((item) => `- ${item}`),
    "",
    "Ajustements enseignant",
    ...generated.teacherAdjustments.map((item) => `- ${item}`),
    "",
    "Evaluation finale",
    generated.finalAssessment,
    "",
    "Prompt complet",
    prompt,
  ];

  return lines.join("\n");
}

function buildPdf(
  sequence: SequenceInput | null,
  generated: GeneratedSequence,
  prompt: string,
) {
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

  const writeTextBlock = (
    text: string,
    options?: { size?: number; color?: [number, number, number]; gapAfter?: number },
  ) => {
    const size = options?.size ?? 11;
    const gapAfter = options?.gapAfter ?? 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    if (options?.color) doc.setTextColor(...options.color);
    else doc.setTextColor(...colors.body);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = size * 1.45;
    ensureSpace(lines.length * lineHeight + gapAfter);
    doc.text(lines, marginX, y);
    y += lines.length * lineHeight + gapAfter;
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

  const writeBulletList = (items: string[]) => {
    items.forEach((item) => {
      const wrapped = doc.splitTextToSize(item, contentWidth - 16);
      const blockHeight = wrapped.length * 16 + 4;
      ensureSpace(blockHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...colors.body);
      doc.text("•", marginX, y);
      doc.text(wrapped, marginX + 14, y);
      y += wrapped.length * 16 + 4;
    });
    y += 4;
  };

  const drawInfoCard = (
    x: number,
    cardY: number,
    width: number,
    title: string,
    value: string,
    fill: [number, number, number],
    accent: [number, number, number],
  ) => {
    doc.setFillColor(...fill);
    doc.roundedRect(x, cardY, width, 62, 10, 10, "F");
    doc.setFillColor(...accent);
    doc.roundedRect(x, cardY + 10, 4, 42, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(title.toUpperCase(), x + 16, cardY + 18);
    doc.setFontSize(12);
    doc.setTextColor(...colors.ink);
    const valueLines = doc.splitTextToSize(value, width - 28);
    doc.text(valueLines, x + 16, cardY + 37);
  };

  const drawLabeledPanel = (
    title: string,
    body: string | string[],
    accent: [number, number, number],
    fill: [number, number, number],
  ) => {
    const items = Array.isArray(body) ? body : [body];
    const bodyLines = items.flatMap((item) => doc.splitTextToSize(item, contentWidth - 30));
    const blockHeight = 34 + bodyLines.length * 15 + 16;
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
    items.forEach((item, idx) => {
      const lines = doc.splitTextToSize(item, contentWidth - 30);
      doc.text(lines, marginX + 18, cursorY);
      cursorY += lines.length * 15 + (idx < items.length - 1 ? 6 : 0);
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
  const introLines = doc.splitTextToSize(generated.overview, contentWidth - 48);
  doc.text(introLines, marginX + 24, y + 96);
  y += 138;

  const gap = 12;
  const cardWidth = (contentWidth - gap) / 2;
  drawInfoCard(
    marginX,
    y,
    cardWidth,
    "Objectif final",
    sequence?.objectif || "Non precise",
    colors.greenSoft,
    colors.green,
  );
  drawInfoCard(
    marginX + cardWidth + gap,
    y,
    cardWidth,
    "Chapitre / notion",
    sequence?.chapitre || "Non precise",
    colors.yellowSoft,
    colors.yellow,
  );
  y += 74;
  drawInfoCard(
    marginX,
    y,
    cardWidth,
    "Nombre de seances",
    sequence?.seances || "Non precise",
    colors.pinkSoft,
    colors.pink,
  );
  drawInfoCard(
    marginX + cardWidth + gap,
    y,
    cardWidth,
    "Acquis prealables",
    sequence?.acquis || "Non precise",
    colors.white,
    colors.green,
  );
  y += 84;

  drawLabeledPanel(
    "Accroche premiere seance",
    generated.firstSessionHook,
    colors.green,
    colors.greenSoft,
  );

  drawLabeledPanel(
    "Evaluation finale",
    generated.finalAssessment,
    colors.yellow,
    colors.yellowSoft,
  );

  writeSectionTitle("Proposition de sequence");
  generated.sessions.forEach((session, index) => {
    const objectiveLines = doc.splitTextToSize(`Objectif : ${session.objective}`, contentWidth - 32);
    const focusLines = doc.splitTextToSize(`Focus : ${session.focus}`, contentWidth - 32);
    const activityLines = doc.splitTextToSize(`Activite : ${session.activity}`, contentWidth - 32);
    const blockHeight =
      42 +
      objectiveLines.length * 15 +
      focusLines.length * 15 +
      activityLines.length * 15 +
      18;
    ensureSpace(blockHeight + 10);
    doc.setFillColor(...colors.white);
    doc.roundedRect(marginX, y, contentWidth, blockHeight, 14, 14, "F");
    doc.setFillColor(...colors.yellow);
    doc.roundedRect(marginX + 14, y + 12, contentWidth - 28, 4, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.green);
    doc.text(`SEANCE ${index + 1}`, marginX + 18, y + 28);
    doc.setFontSize(13);
    doc.setTextColor(...colors.ink);
    doc.text(session.title, marginX + 92, y + 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.body);
    let sessionY = y + 50;
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(0.6);
    doc.line(marginX + 18, y + 38, marginX + contentWidth - 18, y + 38);
    doc.text(objectiveLines, marginX + 18, sessionY);
    sessionY += objectiveLines.length * 15 + 6;
    doc.text(focusLines, marginX + 18, sessionY);
    sessionY += focusLines.length * 15 + 6;
    doc.text(activityLines, marginX + 18, sessionY);
    y += blockHeight + 12;
  });

  writeSectionTitle("Checkpoints");
  drawLabeledPanel("Checkpoints", generated.checkpoints, colors.green, colors.greenSoft);

  writeSectionTitle("Points de vigilance");
  drawLabeledPanel(
    "Points de vigilance",
    generated.vigilancePoints,
    colors.pink,
    colors.pinkSoft,
  );

  writeSectionTitle("Ajustements enseignant");
  drawLabeledPanel(
    "Ajustements enseignant",
    generated.teacherAdjustments,
    colors.yellow,
    colors.yellowSoft,
  );

  writeSectionTitle("Prompt complet");
  drawLabeledPanel("Prompt complet", prompt, colors.ink, colors.white);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...colors.line);
    doc.line(marginX, pageHeight - 30, pageWidth - marginX, pageHeight - 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(
      `TANDEM · Y-Days 2026 · Page ${page}/${pageCount}`,
      marginX,
      pageHeight - 16,
    );
  }

  return doc;
}

export default function Screen4() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState<GeneratedSequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const { triggerRipple, RippleLayer } = useCtaRipple();
  const progressIntervalRef = useRef<number | null>(null);

  const raw = localStorage.getItem("tandem_sequence");
  const sequence = raw ? (JSON.parse(raw) as SequenceInput) : null;
  const answers = getQuizAnswers();
  const score = getScore();
  const badge = getScoreBadge(score.correct);
  const reflex = getReflexSheet();
  const fullPrompt = useMemo(() => buildPrompt(sequence), [sequence]);

  const runGeneration = async () => {
    setError(null);
    setLoading(true);
    setLoadingProgress(8);

    const cacheKey = JSON.stringify(sequence || {});
    const cachedRaw = localStorage.getItem(GENERATED_SEQUENCE_KEY);

    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as {
          cacheKey: string;
          data: GeneratedSequence;
        };

        if (cached.cacheKey === cacheKey) {
          setGenerated(normalizeGeneration(cached.data));
          setLoadingProgress(100);
          window.setTimeout(() => setLoading(false), 250);
          return;
        }
      } catch {
        localStorage.removeItem(GENERATED_SEQUENCE_KEY);
      }
    }

    try {
      const result = await generateSequenceWithMistral(sequence);
      localStorage.setItem(
        GENERATED_SEQUENCE_KEY,
        JSON.stringify({ cacheKey, data: result }),
      );
      setGenerated(result);
      setLoadingProgress(100);
      window.setTimeout(() => {
        setLoading(false);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
          colors: ["#ffd41d", "#1da82a", "#ff33ad", "#ffc200"],
        });
      }, 250);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "La generation IA a echoue.",
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    runGeneration();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
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
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [loading]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success("Prompt copie", {
        description: "Collez-le dans ChatGPT, Claude ou Mistral si besoin.",
      });
    });
  };

  const handleDownload = () => {
    if (!generated) return;
    const doc = buildPdf(sequence, generated, fullPrompt);
    doc.save("tandem-livrable-sequence.pdf");
    toast.success("Livrable telecharge", {
      description: "Le contenu genere a ete exporte en PDF.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "TANDEM - Kit d'onboarding IA pour enseignants",
        text: "Decouvrez TANDEM, le kit d'onboarding IA pour structurer vos sequences de cours.",
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Lien copie", {
        description: "Partagez ce kit avec vos collegues.",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{
              border: "1px solid rgba(255,212,29,0.3)",
              background: "#fffce6",
              color: "#ffd41d",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: 2,
            }}
          >
            <Trophy size={11} /> TROPHEE - SALLE 04/04
          </div>

          <h1
            style={{
              color: "#1A1208",
              fontSize: "clamp(22px,4vw,36px)",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Mission{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg,#ffd41d,#1da82a,#ff33ad)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              accomplie
            </span>
          </h1>

          {Object.keys(answers).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
              style={{ background: badge.bg, border: `1px solid ${badge.border}` }}
            >
              <span
                style={{
                  color: badge.color,
                  fontSize: 11,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                {score.correct}/3 REFLEXES - {badge.label.toUpperCase()}
              </span>
              <div className="flex gap-1 ml-1">
                {[1, 2, 3].map((qNum) => (
                  <div
                    key={qNum}
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        answers[qNum] === true
                          ? "#1da82a"
                          : answers[qNum] === false
                            ? "#ff33ad"
                            : "rgba(0,0,0,0.08)",
                      fontSize: 8,
                      color: "#fff",
                    }}
                  >
                    {answers[qNum] === true
                      ? "✓"
                      : answers[qNum] === false
                        ? "×"
                        : ""}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden mb-5"
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
              style={{
                borderBottom: "1px solid rgba(255,212,29,0.3)",
                background: "#fffce6",
              }}
            >
              <LoaderCircle
                size={18}
                style={{ color: "#ffc200" }}
                className="animate-spin"
              />
              <div className="flex-1">
                <div
                  style={{
                    color: "#ffc200",
                    fontSize: 9,
                    fontFamily: "monospace",
                    letterSpacing: 2,
                  }}
                >
                  GENERATION IA EN COURS
                </div>
                <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                  Construction de la proposition pedagogique
                </div>
              </div>
              <span
                style={{
                  color: "#ffc200",
                  fontFamily: "monospace",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {loadingProgress}%
              </span>
            </div>

            <div className="p-5">
              <div
                className="w-full rounded-full overflow-hidden mb-4"
                style={{ background: "#F5EFE8", height: 14 }}
              >
                <motion.div
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    background:
                      "linear-gradient(90deg,#ffd41d 0%,#ffc200 55%,#1da82a 100%)",
                  }}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "Lecture du contexte enseignant",
                  "Structuration des seances et jalons",
                  "Preparation des points de vigilance",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="rounded-xl p-4"
                    style={{
                      background: "#F9F4EE",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        color: "#C4B8AE",
                        fontSize: 10,
                        fontFamily: "monospace",
                        marginBottom: 6,
                      }}
                    >
                      ETAPE 0{index + 1}
                    </div>
                    <div
                      style={{
                        color: "#1A1208",
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.5,
                      }}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden mb-5"
            style={{
              background: "#FFFFFF",
              borderLeft: "1px solid rgba(255,51,173,0.25)",
              borderRight: "1px solid rgba(255,51,173,0.25)",
              borderBottom: "1px solid rgba(255,51,173,0.25)",
              borderTop: "3px solid #ff33ad",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            }}
          >
            <div
              className="px-5 py-4"
              style={{
                borderBottom: "1px solid rgba(255,51,173,0.25)",
                background: "#fff0fa",
              }}
            >
              <div
                style={{
                  color: "#ff33ad",
                  fontSize: 9,
                  fontFamily: "monospace",
                  letterSpacing: 2,
                }}
              >
                GENERATION ECHOUEE
              </div>
              <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                La page n'a pas recu de livrable IA exploitable
              </div>
            </div>

            <div className="p-5">
              <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.7 }}>
                {error}
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                <motion.button
                  onClick={runGeneration}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-3 rounded-xl flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg,#ffd41d,#ffc200)",
                    color: "#1A1208",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <RefreshCw size={15} />
                  Relancer la generation
                </motion.button>

                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-3 rounded-xl flex items-center gap-2"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.12)",
                    color: "#4A3D30",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <Copy size={15} />
                  Copier le prompt de secours
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && generated && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden mb-5"
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
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(29,168,42,0.25)",
                    color: "#1da82a",
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      color: "#1da82a",
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: 2,
                    }}
                  >
                    SEQUENCE GENEREE PAR L'IA
                  </div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>
                    {generated.title}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `${generated.sessions.length} seances`,
                    "Livrable IA",
                    "A valider",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: "#edfaee",
                        border: "1px solid rgba(29,168,42,0.25)",
                        color: "#1da82a",
                        fontSize: 9,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <p
                  style={{
                    color: "#4A3D30",
                    fontSize: 13.5,
                    lineHeight: 1.75,
                    marginBottom: 16,
                  }}
                >
                  {generated.overview}
                </p>

                <div className="grid lg:grid-cols-[1.3fr,0.7fr] gap-4 mb-4">
                  <div
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
                        letterSpacing: 2,
                        marginBottom: 8,
                      }}
                    >
                      ACCROCHE PREMIERE SEANCE
                    </div>
                    <p style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.65 }}>
                      {generated.firstSessionHook}
                    </p>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "#fffce6",
                      border: "1px solid rgba(255,212,29,0.3)",
                    }}
                  >
                    <div
                      style={{
                        color: "#ffc200",
                        fontSize: 10,
                        fontFamily: "monospace",
                        letterSpacing: 2,
                        marginBottom: 8,
                      }}
                    >
                      EVALUATION FINALE
                    </div>
                    <p style={{ color: "#1A1208", fontSize: 13, lineHeight: 1.65 }}>
                      {generated.finalAssessment}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {generated.sessions.map((session, index) => (
                    <div
                      key={`${session.title}-${index}`}
                      className="rounded-xl p-4"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.08)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span
                          className="px-2.5 py-1 rounded-full"
                          style={{
                            background: "#edfaee",
                            border: "1px solid rgba(29,168,42,0.25)",
                            color: "#1da82a",
                            fontSize: 10,
                            fontFamily: "monospace",
                            fontWeight: 700,
                          }}
                        >
                          SEANCE {index + 1}
                        </span>
                        <span
                          style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}
                        >
                          {session.title}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div
                          className="rounded-lg p-3"
                          style={{
                            background: "#F9F4EE",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <div
                            style={{
                              color: "#9C8B76",
                              fontSize: 10,
                              fontFamily: "monospace",
                              marginBottom: 6,
                            }}
                          >
                            OBJECTIF
                          </div>
                          <p
                            style={{
                              color: "#1A1208",
                              fontSize: 12.5,
                              lineHeight: 1.6,
                            }}
                          >
                            {session.objective}
                          </p>
                        </div>

                        <div
                          className="rounded-lg p-3"
                          style={{
                            background: "#F9F4EE",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <div
                            style={{
                              color: "#9C8B76",
                              fontSize: 10,
                              fontFamily: "monospace",
                              marginBottom: 6,
                            }}
                          >
                            FOCUS
                          </div>
                          <p
                            style={{
                              color: "#1A1208",
                              fontSize: 12.5,
                              lineHeight: 1.6,
                            }}
                          >
                            {session.focus}
                          </p>
                        </div>

                        <div
                          className="rounded-lg p-3"
                          style={{
                            background: "#F9F4EE",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <div
                            style={{
                              color: "#9C8B76",
                              fontSize: 10,
                              fontFamily: "monospace",
                              marginBottom: 6,
                            }}
                          >
                            ACTIVITE
                          </div>
                          <p
                            style={{
                              color: "#1A1208",
                              fontSize: 12.5,
                              lineHeight: 1.6,
                            }}
                          >
                            {session.activity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Checkpoints",
                      color: "#1da82a",
                      bg: "#edfaee",
                      border: "rgba(29,168,42,0.25)",
                      items: generated.checkpoints,
                    },
                    {
                      title: "Points de vigilance",
                      color: "#ff33ad",
                      bg: "#fff0fa",
                      border: "rgba(255,51,173,0.25)",
                      items: generated.vigilancePoints,
                    },
                    {
                      title: "Ajustements enseignant",
                      color: "#ffc200",
                      bg: "#fffce6",
                      border: "rgba(255,212,29,0.3)",
                      items: generated.teacherAdjustments,
                    },
                  ].map((block) => (
                    <div
                      key={block.title}
                      className="rounded-xl p-4"
                      style={{
                        background: block.bg,
                        border: `1px solid ${block.border}`,
                      }}
                    >
                      <div
                        style={{
                          color: block.color,
                          fontSize: 10,
                          fontFamily: "monospace",
                          letterSpacing: 2,
                          marginBottom: 8,
                        }}
                      >
                        {block.title.toUpperCase()}
                      </div>
                      <div className="space-y-2">
                        {block.items.map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-2"
                            style={{ color: "#1A1208", fontSize: 12.5, lineHeight: 1.6 }}
                          >
                            <span style={{ color: block.color, marginTop: 2 }}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden mb-5"
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
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(29,168,42,0.25)",
                    color: "#1da82a",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  P
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      color: "#1da82a",
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: 2,
                    }}
                  >
                    PROMPT PERSONNALISE - PRET A L'EMPLOI
                  </div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 13 }}>
                    Structurer une sequence
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Personnalise", "Pret a l'emploi", "Copier/Coller"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: "#edfaee",
                          border: "1px solid rgba(29,168,42,0.25)",
                          color: "#1da82a",
                          fontSize: 9,
                        }}
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="p-5">
                <textarea
                  readOnly
                  value={fullPrompt}
                  className="rounded-xl p-4 mb-4 w-full resize-none overflow-auto"
                  style={{
                    background: "#F9F4EE",
                    border: "1px solid rgba(0,0,0,0.12)",
                    minHeight: 260,
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#4A3D30",
                    lineHeight: 1.6,
                    outline: "none",
                  }}
                  rows={11}
                />
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: "#1da82a",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: "0 2px 12px rgba(29,168,42,0.3)",
                  }}
                >
                  {copied ? (
                    <>
                      <CheckCircle size={15} /> COPIE
                    </>
                  ) : (
                    <>
                      <Copy size={15} /> COPIER LE PROMPT COMPLET
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden mb-5"
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
                className="flex items-center justify-between px-5 py-4"
                style={{
                  borderBottom: "1px solid rgba(255,212,29,0.3)",
                  background: "#fffce6",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(255,212,29,0.3)",
                      color: "#ffc200",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    F
                  </div>
                  <div>
                    <div
                      style={{
                        color: "#ffc200",
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: 2,
                      }}
                    >
                      FICHE REFLEXE
                    </div>
                    <div
                      style={{ color: "#1A1208", fontWeight: 700, fontSize: 13 }}
                    >
                      {reflex.title}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {reflex.points.map((point) => (
                  <div
                    key={point.label}
                    className="flex gap-3 items-start p-3 rounded-xl"
                    style={{
                      background: "#F9F4EE",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        background: "#fffce6",
                        border: "1px solid rgba(255,212,29,0.3)",
                        color: "#ffc200",
                        fontSize: 10,
                        fontFamily: "monospace",
                        flexShrink: 0,
                      }}
                    >
                      {point.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          color: "#ffc200",
                          fontSize: 10,
                          fontFamily: "monospace",
                          letterSpacing: 1,
                          fontWeight: 700,
                          marginBottom: 3,
                        }}
                      >
                        {point.label.toUpperCase()}
                      </div>
                      <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.65 }}>
                        {point.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                className="py-4 rounded-xl flex items-center justify-center gap-3"
                style={{
                  background: "linear-gradient(135deg,#ffd41d,#ffc200)",
                  color: "#1A1208",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: "0 2px 12px rgba(255,212,29,0.25)",
                }}
              >
                <Download size={18} />
                Telecharger le livrable genere
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="py-4 rounded-xl flex items-center justify-center gap-3"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.12)",
                  color: "#4A3D30",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                }}
              >
                <Share2 size={18} />
                Partager ce kit avec un(e) collegue
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-6 text-center"
              style={{
                background: "#fffce6",
                border: "1px solid rgba(255,212,29,0.3)",
                boxShadow: "0 2px 12px rgba(255,212,29,0.12)",
              }}
            >
              <h2
                style={{
                  color: "#1A1208",
                  fontWeight: 800,
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                Kit termine - Livrables prets
              </h2>
              <p
                style={{
                  color: "#4A3D30",
                  fontSize: 13,
                  lineHeight: 1.7,
                  maxWidth: 440,
                  margin: "0 auto 4px",
                }}
              >
                Vous repartez avec une proposition de sequence generee, un prompt
                complet et une fiche reflexe. Verifiez, corrigez, puis reutilisez.
              </p>
              <p
                style={{
                  color: "#9C8B76",
                  fontSize: 12,
                  fontStyle: "italic",
                  marginTop: 4,
                }}
              >
                L'IA fournit une base, l'enseignant garde la validation pedagogique.
              </p>
              <motion.button
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-5 px-7 py-2.5 rounded-xl inline-flex items-center gap-2"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(255,212,29,0.3)",
                  color: "#ffd41d",
                  fontWeight: 600,
                  fontSize: 13,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                }}
              >
                Retour a l'accueil
              </motion.button>
            </motion.div>
          </>
        )}
      </div>

      <RippleLayer />
    </div>
  );
}
