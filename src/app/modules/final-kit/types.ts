import type {
  EvaluationKit,
  GeneratedSequence,
  PromptDetails,
  RecommendationSummary,
} from "../ai/sequenceAi";

export type RefineMode = "concrete" | "progressive" | "differentiated" | "shorter";

export interface FinalKitState {
  recommendation: RecommendationSummary;
  sequence: GeneratedSequence;
  evaluationKit: EvaluationKit;
}

export interface PromptModalCache {
  sequence: PromptDetails | null;
  evaluation: PromptDetails | null;
}

export type PromptModalState = {
  kind: "sequence" | "evaluation";
  source: "ai" | "generic";
} | null;
