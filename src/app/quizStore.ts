import { STORAGE_KEYS } from "./modules/shared/storageKeys";
import { readJson, writeJson } from "./modules/shared/storage";

export interface QuizQuestion {
  q: string;
  choices: [string, string];
  correct: 0 | 1;
  explanation: string;
  xp: number;
  num?: number;
}

export const SCREEN_QUIZZES: Record<number, QuizQuestion> = {
  1: {
    q: "Tu veux structurer une séquence avec l'IA. Par quoi commences-tu ?",
    choices: [
      "Tu définis objectif final + niveau + nombre de séances",
      "Tu donnes seulement le titre du chapitre",
    ],
    correct: 0,
    explanation: "Plus tu donnes de contexte précis (objectif, niveau, contraintes), plus la structure proposée sera adaptée à ta situation réelle. L'IA a besoin de ces éléments pour être vraiment utile.",
    xp: 30,
  },
  2: {
    q: "Tu reçois une séquence de 6 séances générée par l'IA. Que fais-tu ?",
    choices: [
      "Tu l'utilises comme base et tu l'adaptes à ta classe",
      "Tu la suis telle quelle",
    ],
    correct: 0,
    explanation: "La structure IA est un point de départ, pas un livrable final. L'ajustement à ta classe (rythme réel, blocages déjà repérés) est la valeur que l'IA ne peut pas apporter seule.",
    xp: 30,
  },
  3: {
    q: "L'IA propose une évaluation finale. Tu hésites. Pourquoi ?",
    choices: [
      "Parce qu'il manque une étape intermédiaire adaptée aux élèves",
      "Parce que ce n'est pas dans les programmes officiels",
    ],
    correct: 0,
    explanation: "L'IA ne connaît pas le rythme réel de ta classe ni les difficultés spécifiques de tes élèves. C'est toi qui portes cette connaissance — et c'est pour ça que la validation pédagogique reste de ton côté.",
    xp: 30,
  },
};

// Answer tracking — feeds into Screen 7 personalization
let _quizListeners: (() => void)[] = [];

export function recordAnswer(qNum: number, correct: boolean): void {
  const answers = readJson<Record<number, boolean>>(STORAGE_KEYS.quizAnswers, {});
  answers[qNum] = correct;
  writeJson(STORAGE_KEYS.quizAnswers, answers);
  _quizListeners.forEach((fn) => fn());
}

export function getQuizAnswers(): Record<number, boolean> {
  return readJson<Record<number, boolean>>(STORAGE_KEYS.quizAnswers, {});
}

export function getScore(): { correct: number; total: number } {
  const answers = getQuizAnswers();
  const total = Object.keys(SCREEN_QUIZZES).length;
  const correct = Object.values(answers).filter(Boolean).length;
  return { correct, total };
}

export function subscribeQuiz(fn: () => void): () => void {
  _quizListeners.push(fn);
  return () => {
    _quizListeners = _quizListeners.filter((l) => l !== fn);
  };
}

type Listener = (q: QuizQuestion, onPass: () => void) => void;
let _listener: Listener | null = null;

export function setQuizListener(fn: Listener) {
  _listener = fn;
}

export function requestQuiz(screenIndex: number, onPass: () => void) {
  const q = SCREEN_QUIZZES[screenIndex];
  if (q && _listener) {
    _listener({ ...q, num: screenIndex }, onPass);
  } else {
    onPass();
  }
}
