import { jsPDF } from "jspdf";
import type {
  EvaluationKit,
  GeneratedSequence,
  SequenceInput,
} from "../ai/sequenceAi";

type Rgb = [number, number, number];

interface PdfSection {
  title: string;
  body: string | string[];
  variant?: "default" | "success" | "warning" | "accent" | "code";
}

interface PdfTheme {
  ink: Rgb;
  body: Rgb;
  muted: Rgb;
  border: Rgb;
  page: Rgb;
  panel: Rgb;
  yellow: Rgb;
  green: Rgb;
  pink: Rgb;
  codeBg: Rgb;
}

const theme: PdfTheme = {
  ink: [26, 18, 8],
  body: [74, 61, 48],
  muted: [126, 108, 90],
  border: [226, 216, 204],
  page: [255, 248, 240],
  panel: [255, 255, 255],
  yellow: [255, 194, 0],
  green: [29, 168, 42],
  pink: [255, 51, 173],
  codeBg: [32, 24, 17],
};

function formatClarifications(sequence: SequenceInput | null) {
  if (!sequence?.aiClarifications || sequence.aiClarifications.length === 0) {
    return [];
  }
  return sequence.aiClarifications.map(
    (item) => `${item.question}: ${item.answer || "Non precise"}`,
  );
}

function sectionColor(variant: PdfSection["variant"]): Rgb {
  if (variant === "success") return theme.green;
  if (variant === "accent") return theme.pink;
  return theme.yellow;
}

function normalizeLines(value: string | string[]) {
  return (Array.isArray(value) ? value : [value])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function buildPdfDoc(title: string, subtitle: string, sections: PdfSection[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 44;
  const marginTop = 46;
  const marginBottom = 54;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginTop;

  doc.setProperties({
    title,
    subject: "Livrable TANDEM",
    author: "TANDEM",
    creator: "TANDEM",
  });

  const maxY = () => pageHeight - marginBottom;

  const paintPage = () => {
    doc.setFillColor(...theme.page);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
  };

  const addPage = () => {
    doc.addPage();
    paintPage();
    y = marginTop;
  };

  const ensureSpace = (height: number) => {
    if (y + height > maxY()) addPage();
  };

  const setText = (
    color: Rgb,
    size: number,
    style: "normal" | "bold" = "normal",
    font = "helvetica",
  ) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const writeWrapped = (
    text: string,
    x: number,
    width: number,
    options: {
      color?: Rgb;
      fontSize?: number;
      style?: "normal" | "bold";
      lineHeight?: number;
      bullet?: boolean;
      font?: string;
    } = {},
  ) => {
    const fontSize = options.fontSize ?? 10.5;
    const lineHeight = options.lineHeight ?? 15;
    const indent = options.bullet ? 12 : 0;
    setText(options.color ?? theme.body, fontSize, options.style ?? "normal", options.font);
    const lines = doc.splitTextToSize(text, width - indent) as string[];

    lines.forEach((line, index) => {
      ensureSpace(lineHeight);
      if (options.bullet && index === 0) {
        doc.setFillColor(...(options.color ?? theme.body));
        doc.circle(x + 3, y - 3, 1.4, "F");
      }
      doc.text(line, x + indent, y);
      y += lineHeight;
    });
  };

  const writeSection = (section: PdfSection) => {
    const items = normalizeLines(section.body);
    const color = sectionColor(section.variant);
    const isCode = section.variant === "code";

    ensureSpace(58);

    const headerY = y;
    doc.setFillColor(...theme.panel);
    doc.roundedRect(marginX, headerY, contentWidth, 42, 10, 10, "F");
    doc.setDrawColor(...theme.border);
    doc.roundedRect(marginX, headerY, contentWidth, 42, 10, 10, "S");
    doc.setFillColor(...color);
    doc.roundedRect(marginX, headerY, 5, 42, 2, 2, "F");
    setText(color, 8, "bold");
    doc.text(section.title.toUpperCase(), marginX + 18, headerY + 19);
    setText(theme.muted, 8, "normal");
    doc.text("TANDEM", pageWidth - marginX - 48, headerY + 19);
    y += 56;

    if (isCode) {
      const codeX = marginX;
      const codeWidth = contentWidth;
      items.forEach((item, itemIndex) => {
        const lines = doc.splitTextToSize(item, codeWidth - 28) as string[];
        lines.forEach((line) => {
          ensureSpace(18);
          doc.setFillColor(...theme.codeBg);
          doc.rect(codeX, y - 12, codeWidth, 18, "F");
          setText([255, 248, 240], 8.7, "normal", "courier");
          doc.text(line, codeX + 14, y);
          y += 18;
        });
        if (itemIndex < items.length - 1) y += 6;
      });
      y += 16;
      return;
    }

    items.forEach((item, index) => {
      const looksLikeLabel = /^[A-ZÀ-Ÿ][^:]{2,28}\s:/.test(item);
      writeWrapped(item, marginX + 8, contentWidth - 16, {
        color: looksLikeLabel ? theme.ink : theme.body,
        fontSize: looksLikeLabel ? 10.3 : 10.5,
        style: looksLikeLabel ? "bold" : "normal",
        lineHeight: 15,
        bullet: items.length > 1 && !looksLikeLabel,
      });
      if (index < items.length - 1) y += 7;
    });
    y += 18;
  };

  const writeCover = () => {
    paintPage();

    doc.setFillColor(...theme.panel);
    doc.roundedRect(marginX, y, contentWidth, 122, 18, 18, "F");
    doc.setDrawColor(...theme.border);
    doc.roundedRect(marginX, y, contentWidth, 122, 18, 18, "S");
    doc.setFillColor(...theme.yellow);
    doc.roundedRect(marginX, y + 18, 7, 86, 4, 4, "F");

    setText(theme.muted, 8.5, "bold");
    doc.text("TANDEM - LIVRABLE PERSONNALISE", marginX + 24, y + 27);
    setText(theme.ink, 20, "bold");
    const titleLines = doc.splitTextToSize(title, contentWidth - 48) as string[];
    doc.text(titleLines.slice(0, 2), marginX + 24, y + 57);
    setText(theme.body, 10.8, "normal");
    const subtitleLines = doc.splitTextToSize(subtitle, contentWidth - 48) as string[];
    doc.text(subtitleLines.slice(0, 3), marginX + 24, y + 88);

    y += 148;
  };

  const writeFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(...theme.border);
      doc.line(marginX, pageHeight - 32, pageWidth - marginX, pageHeight - 32);
      setText(theme.muted, 8.5, "normal");
      doc.text("TANDEM - Y-Days 2026", marginX, pageHeight - 17);
      doc.text(`Page ${page}/${pageCount}`, pageWidth - marginX - 46, pageHeight - 17);
    }
  };

  writeCover();
  sections.forEach(writeSection);
  writeFooter();

  return doc;
}

export function buildSequencePdf(
  sequence: SequenceInput | null,
  generated: GeneratedSequence,
  prompt: string,
) {
  return buildPdfDoc(
    "Fiche reflexe 1 - Structurer une sequence avec l'IA",
    generated.overview,
    [
      {
        title: "Contexte enseignant",
        variant: "success",
        body: [
          `Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}`,
          `Discipline : ${sequence?.discipline || "Non precise"}`,
          `Niveau / classe : ${sequence?.niveau || "Non precise"}`,
          `Nombre de seances : ${sequence?.seances || "Non precise"}`,
          `Acquis prealables : ${sequence?.acquis || "Non precise"}`,
          ...formatClarifications(sequence),
        ],
      },
      {
        title: "Pourquoi cette structure",
        variant: "success",
        body: generated.whyThisStructure,
      },
      {
        title: "Accroche premiere seance",
        body: generated.firstSessionHook,
      },
      ...generated.sessions.map((session, index): PdfSection => ({
        title: `Seance ${index + 1} - ${session.title}`,
        variant: "default",
        body: [
          `Objectif : ${session.objective}`,
          `Focus : ${session.focus}`,
          `Activite : ${session.activity}`,
        ],
      })),
      { title: "Checkpoints", body: generated.checkpoints },
      {
        title: "Points de vigilance",
        variant: "warning",
        body: generated.vigilancePoints,
      },
      {
        title: "Points encore fragiles",
        variant: "accent",
        body: generated.fragilePoints,
      },
      {
        title: "Ajustements enseignant",
        body: generated.teacherAdjustments,
      },
      { title: "Evaluation finale", body: generated.finalAssessment },
      { title: "Prompt de depart", variant: "code", body: prompt },
    ],
  );
}

export function buildEvaluationPdf(
  sequence: SequenceInput | null,
  generated: EvaluationKit,
  prompt: string,
) {
  return buildPdfDoc(
    "Fiche reflexe 2 - Differencier une evaluation avec l'IA",
    generated.overview,
    [
      {
        title: "Contexte enseignant",
        variant: "success",
        body: [
          `Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}`,
          `Discipline : ${sequence?.discipline || "Non precise"}`,
          `Niveau / classe : ${sequence?.niveau || "Non precise"}`,
          `Nombre de seances : ${sequence?.seances || "Non precise"}`,
          `Acquis prealables : ${sequence?.acquis || "Non precise"}`,
          ...formatClarifications(sequence),
        ],
      },
      { title: "Pourquoi ce cas d'usage", variant: "success", body: generated.whyUseful },
      { title: "Leviers de differenciation", body: generated.differentiationLevers },
      { title: "Exemples de variantes", body: generated.exampleVariants },
      {
        title: "Ce que l'enseignant garde en main",
        variant: "warning",
        body: generated.whatTeacherKeeps,
      },
      {
        title: "Points de vigilance",
        variant: "accent",
        body: generated.vigilancePoints,
      },
      { title: "Prompt de depart", variant: "code", body: prompt },
    ],
  );
}
