const MISTRAL_API_KEY = "AtKHEFJAavv5Unaj1wopV9GXpntVMtyr";
const MISTRAL_MODEL = "mistral-small-latest";

export interface SequenceClarification {
  question: string;
  answer: string;
  reason?: string;
}

export interface SequenceInput {
  objectif?: string;
  discipline?: string;
  niveau?: string;
  seances?: string;
  acquis?: string;
  aiClarifications?: SequenceClarification[];
}

export interface FollowUpQuestion {
  id: string;
  label: string;
  placeholder: string;
  reason: string;
}

export interface ClarificationResponse {
  needsMoreInfo: boolean;
  intro: string;
  questions: FollowUpQuestion[];
}

export interface GeneratedSession {
  title: string;
  objective: string;
  focus: string;
  activity: string;
}

export interface GeneratedSequence {
  title: string;
  overview: string;
  whyThisStructure: string;
  sessions: GeneratedSession[];
  firstSessionHook: string;
  checkpoints: string[];
  vigilancePoints: string[];
  teacherAdjustments: string[];
  finalAssessment: string;
  fragilePoints: string[];
}

export interface RiskAnalysis {
  title: string;
  risks: Array<{
    title: string;
    detail: string;
  }>;
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

async function callMistralJson(prompt: string, temperature = 0.4) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature,
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
  if (!rawContent) throw new Error("Reponse vide recue depuis Mistral.");
  return JSON.parse(rawContent) as unknown;
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

export const FALLBACK_GENERATION: GeneratedSequence = {
  title: "Proposition de sequence a retravailler",
  overview:
    "L'IA a prepare une premiere base. Verifie la progression, le niveau reel de la classe et les contraintes de temps avant utilisation.",
  whyThisStructure:
    "La structure proposee part du contexte fourni, organise les apprentissages de facon progressive et garde des points de controle pour limiter les angles morts.",
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
  fragilePoints: [
    "Le rythme reel de la classe reste a verifier sur le terrain.",
    "Le niveau de difficulte doit etre teste sur une activite intermediaire.",
  ],
};

function formatClarifications(sequence: SequenceInput | null, withAnswers = true) {
  if (!sequence?.aiClarifications || sequence.aiClarifications.length === 0) {
    return "Aucune precision complementaire.";
  }

  return sequence.aiClarifications
    .map((item) =>
      withAnswers
        ? `- ${item.question} : ${item.answer || "Non precise"}`
        : `- ${item.question}`,
    )
    .join("\n");
}

export function buildPrompt(sequence: SequenceInput | null) {
  const clarificationBlock =
    sequence?.aiClarifications && sequence.aiClarifications.length > 0
      ? `\nPrecisions complementaires issues de la couche IA :\n${formatClarifications(
          sequence,
          true,
        )}\n`
      : "";

  if (!sequence) {
    return `Tu es un assistant pedagogique expert en ingenierie de formation pour le second degre.

Je veux structurer une sequence pedagogique.

Aide-moi a :
1. Decomposer ce sujet en etapes pedagogiques coherentes
2. Identifier les jalons d'une progression
3. Proposer un titre et un objectif clair pour chaque seance
4. Suggerer une activite d'accroche engageante pour la 1ere seance
5. Identifier 2-3 points de vigilance

Tu ne connais pas mes eleves ni le detail exact de mon programme. Tes suggestions sont un point de depart que je vais adapter et valider.

Format souhaite : liste structuree avec titres, sous-titres et puces. Concis et actionnable.`;
  }

  return `Tu es un assistant pedagogique expert en ingenierie de formation pour le second degre.

Je veux structurer une sequence pedagogique avec les elements suivants :

Sujet, contexte et objectif final :
${sequence.objectif || "[A completer]"}

Discipline :
${sequence.discipline || "[A completer]"}

Niveau / classe :
${sequence.niveau || "[A completer]"}

Nombre de seances disponibles :
${sequence.seances || "[A completer]"}

Acquis prealables des eleves :
${sequence.acquis || "[A completer]"}
${clarificationBlock}

Aide-moi a :
1. Decomposer ce sujet en etapes pedagogiques coherentes adaptees au temps disponible
2. Identifier les jalons d'une progression logique
3. Proposer un titre et un objectif clair pour chaque seance
4. Suggerer une activite d'accroche engageante pour la 1ere seance
5. Identifier des points de vigilance et des ajustements enseignant

Tu ne connais pas mes eleves ni le detail exact de mon programme. Tes suggestions sont un point de depart que je vais adapter et valider.

Format souhaite : liste structuree avec titres, sous-titres et puces. Concis et actionnable.`;
}

export async function requestClarifyingQuestions(form: Record<string, string>) {
  const prompt = `Tu aides un enseignant du second degre a mieux cadrer une demande pedagogique.

Reponses actuelles :
- Sujet + objectif final : ${form.objectif || "Non precise"}
- Discipline : ${form.discipline || "Non precise"}
- Niveau / classe : ${form.niveau || "Non precise"}
- Nombre de seances : ${form.seances || "Non precise"}
- Acquis prealables : ${form.acquis || "Non precise"}

Tu dois poser des questions seulement si elles permettent d'aller plus loin dans la personnalisation.

Regles strictes :
- Pose 0, 1 ou 2 questions dans la grande majorite des cas.
- 3 questions uniquement si plusieurs zones critiques bloquent clairement la qualite.
- Ne pose jamais une question deja couverte.
- Ne redemande ni discipline, ni niveau, ni sujet, ni nombre de seances, ni acquis sauf si la reponse est incomprehensible.
- Priorite aux preferences et aux choix utiles : type d'evaluation souhaite, contraintes fortes, heterogeneite, type d'activite privilegie, points de blocage deja observes, supports deja prevus.
- Si la precision n'influencerait pas concretement la sequence finale, ne pose pas la question.

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

  const payload = await callMistralJson(prompt, 0.25);
  if (!payload || typeof payload !== "object") {
    return { needsMoreInfo: false, intro: "", questions: [] } satisfies ClarificationResponse;
  }
  const data = payload as Record<string, unknown>;
  const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
  const questions = rawQuestions
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const question = item as Record<string, unknown>;
      const label = normalizeString(question.label, "");
      if (!label) return null;
      return {
        id: normalizeString(question.id, `follow_up_${index + 1}`),
        label,
        placeholder: normalizeString(question.placeholder, "Precise ta reponse..."),
        reason: normalizeString(
          question.reason,
          "Precision utile pour fiabiliser la proposition.",
        ),
      };
    })
    .filter(Boolean) as FollowUpQuestion[];

  return {
    needsMoreInfo: Boolean(data.needsMoreInfo) && questions.length > 0,
    intro: normalizeString(
      data.intro,
      "L'IA a besoin de quelques precisions avant de proposer une structure pertinente.",
    ),
    questions,
  };
}

export async function generateRiskAnalysis(sequence: SequenceInput | null) {
  const prompt = `Au vu de ce cadrage enseignant, identifie les 2 risques pedagogiques principaux si l'on genere une sequence trop vite.

Contexte :
- Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}
- Discipline : ${sequence?.discipline || "Non precise"}
- Niveau / classe : ${sequence?.niveau || "Non precise"}
- Nombre de seances : ${sequence?.seances || "Non precise"}
- Acquis prealables : ${sequence?.acquis || "Non precise"}
- Precisions complementaires : ${formatClarifications(sequence, true)}

Retourne uniquement un JSON valide avec cette structure :
{
  "title": "string",
  "risks": [
    { "title": "string", "detail": "string" },
    { "title": "string", "detail": "string" }
  ]
}`;

  const payload = await callMistralJson(prompt, 0.35);
  if (!payload || typeof payload !== "object") {
    return {
      title: "2 risques a surveiller",
      risks: [
        {
          title: "Progression trop generique",
          detail: "L'IA peut proposer une progression propre en apparence mais trop peu ancree dans le contexte reel de la classe.",
        },
        {
          title: "Charge de seance mal calibree",
          detail: "Le rythme et la densite des seances doivent etre verifies par rapport au niveau et au temps reel.",
        },
      ],
    } satisfies RiskAnalysis;
  }
  const data = payload as Record<string, unknown>;
  const rawRisks = Array.isArray(data.risks) ? data.risks : [];
  const risks = rawRisks
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const risk = item as Record<string, unknown>;
      return {
        title: normalizeString(risk.title, ""),
        detail: normalizeString(risk.detail, ""),
      };
    })
    .filter((item) => item && item.title && item.detail) as RiskAnalysis["risks"];

  return {
    title: normalizeString(data.title, "2 risques a surveiller"),
    risks:
      risks.length > 0
        ? risks.slice(0, 2)
        : [
            {
              title: "Progression trop generique",
              detail: "L'IA peut proposer une progression propre en apparence mais trop peu ancree dans le contexte reel de la classe.",
            },
            {
              title: "Charge de seance mal calibree",
              detail: "Le rythme et la densite des seances doivent etre verifies par rapport au niveau et au temps reel.",
            },
          ],
  };
}

export async function generateSequence(sequence: SequenceInput | null) {
  const prompt = `Tu es un assistant pedagogique expert en ingenierie de formation pour le second degre en France.

Contexte enseignant :
- Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}
- Discipline : ${sequence?.discipline || "Non precise"}
- Niveau / classe : ${sequence?.niveau || "Non precise"}
- Nombre de seances disponibles : ${sequence?.seances || "Non precise"}
- Acquis prealables : ${sequence?.acquis || "Non precise"}
- Precisions complementaires : ${formatClarifications(sequence, true)}

Retourne uniquement un JSON valide, sans markdown, avec exactement cette structure :
{
  "title": "string",
  "overview": "string",
  "whyThisStructure": "string",
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

Contraintes :
- Reponse en francais.
- Entre 3 et 8 seances selon le temps disponible.
- Chaque seance doit etre concrete et actionnable.
- whyThisStructure doit expliquer en 2 ou 3 phrases pourquoi ce decoupage est pertinent.
- Les teacherAdjustments doivent rester du cote enseignant.
- Ne jamais pretendre connaitre exactement le programme reel si l'info n'est pas fournie.`;

  return normalizeGeneration(await callMistralJson(prompt, 0.45));
}

export async function generateSelfCheck(
  sequence: SequenceInput | null,
  generated: GeneratedSequence,
) {
  const prompt = `Tu joues le role d'un relecteur critique.

Contexte enseignant :
- Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}
- Discipline : ${sequence?.discipline || "Non precise"}
- Niveau / classe : ${sequence?.niveau || "Non precise"}
- Nombre de seances : ${sequence?.seances || "Non precise"}
- Acquis prealables : ${sequence?.acquis || "Non precise"}
- Precisions complementaires : ${formatClarifications(sequence, true)}

Proposition de sequence generee :
- Titre : ${generated.title}
- Vue d'ensemble : ${generated.overview}
- Seances : ${generated.sessions
    .map((session, index) => `${index + 1}. ${session.title} / ${session.objective}`)
    .join(" | ")}
- Evaluation finale : ${generated.finalAssessment}

Retourne uniquement un JSON valide avec cette structure :
{
  "fragilePoints": ["string"],
  "vigilancePoints": ["string"]
}

Regles :
- 2 a 4 fragilePoints maximum.
- vigilancePoints doit enrichir, pas dupliquer mot pour mot les points existants.
- Sois concret, pas generique.`;

  const payload = await callMistralJson(prompt, 0.3);
  if (!payload || typeof payload !== "object") {
    return {
      fragilePoints: FALLBACK_GENERATION.fragilePoints,
      vigilancePoints: FALLBACK_GENERATION.vigilancePoints,
    };
  }
  const data = payload as Record<string, unknown>;
  return {
    fragilePoints: normalizeStringArray(
      data.fragilePoints,
      FALLBACK_GENERATION.fragilePoints,
    ),
    vigilancePoints: normalizeStringArray(
      data.vigilancePoints,
      FALLBACK_GENERATION.vigilancePoints,
    ),
  };
}

export async function refineSequence(
  sequence: SequenceInput | null,
  generated: GeneratedSequence,
  mode: "concrete" | "progressive" | "differentiated" | "shorter",
) {
  const modeInstruction = {
    concrete:
      "Rends la proposition plus concrete et operationnelle, avec des activites plus tangibles et moins de formulations abstraites.",
    progressive:
      "Rends la progression plus explicite, plus graduee et plus lisible d'une seance a l'autre.",
    differentiated:
      "Rends la sequence plus differenciee, avec davantage d'options d'adaptation selon les profils d'eleves.",
    shorter:
      "Rends la proposition plus courte, plus dense et plus directement exploitable, sans perdre la coherence.",
  }[mode];

  const prompt = `Tu raffines une sequence pedagogique existante sans tout refaire.

Contexte enseignant :
- Sujet, contexte et objectif final : ${sequence?.objectif || "Non precise"}
- Discipline : ${sequence?.discipline || "Non precise"}
- Niveau / classe : ${sequence?.niveau || "Non precise"}
- Nombre de seances : ${sequence?.seances || "Non precise"}
- Acquis prealables : ${sequence?.acquis || "Non precise"}
- Precisions complementaires : ${formatClarifications(sequence, true)}

Proposition actuelle :
${JSON.stringify(generated)}

Instruction de raffinement :
${modeInstruction}

Retourne uniquement un JSON valide avec exactement la meme structure que la proposition actuelle :
{
  "title": "string",
  "overview": "string",
  "whyThisStructure": "string",
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
}`;

  return normalizeGeneration(await callMistralJson(prompt, 0.45));
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
        focus: normalizeString(session.focus, "Point de progression a valider."),
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
    whyThisStructure: normalizeString(
      data.whyThisStructure,
      FALLBACK_GENERATION.whyThisStructure,
    ),
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
    fragilePoints: FALLBACK_GENERATION.fragilePoints,
  };
}
