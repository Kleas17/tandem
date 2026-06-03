import type { GeneratedSequence } from "../ai/sequenceAi";

function mergeUnique(base: string[], extra: string[]) {
  const seen = new Set<string>();
  return [...base, ...extra].filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function enrichSequence(
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
