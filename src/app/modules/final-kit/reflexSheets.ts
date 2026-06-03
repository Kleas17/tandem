export function getReflexSheetSequence() {
  return {
    title: "Fiche reflexe 1 - Structurer une sequence avec l'IA",
    points: [
      "Ce que vous mettez dans le prompt : sujet, objectif final, discipline, niveau, temps disponible, acquis et contraintes utiles.",
      "Ce que vous verifiez toujours : coherence avec le programme reel, rythme reel de la classe, articulation entre jalons et evaluation.",
      "Ce que vous ne deleguez pas : logique de progression, arbitrages pedagogiques, niveau d'exigence final.",
    ],
  };
}

export function getReflexSheetEvaluation() {
  return {
    title: "Fiche reflexe 2 - Differencier une evaluation avec l'IA",
    points: [
      "Ce que l'IA peut faire : proposer des variantes de consignes, de guidage ou de difficulte a partir d'un meme sujet.",
      "Ce que vous gardez en main : competence visee, criteres, niveau d'exigence et validation finale des rendus.",
      "Ce que vous surveillez : risque de simplification excessive, perte d'alignement pedagogique, variations incoherentes entre versions.",
    ],
  };
}

export function getScoreBadge(correct: number) {
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
