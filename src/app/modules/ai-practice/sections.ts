import type { RiskAnalysis } from "../ai/sequenceAi";

export const SECTIONS = [
  {
    id: "bien",
    num: "01",
    emoji: "OK",
    label: "Ce que l'IA fait bien ici",
    color: "#1da82a",
    colorBg: "#edfaee",
    colorBorder: "rgba(29,168,42,0.25)",
    body: [
      "Tu travailles sur des notions qui demandent une vraie progression cognitive. C'est la que l'IA est la plus utile : decomposer une sequence en etapes coherentes, identifier les jalons, formuler les questions a se poser avant de construire.",
      "Elle peut aussi proposer des variantes d'activites ou d'evaluation selon les profils d'eleves.",
      "Ce qu'elle ne fait pas : connaitre ta classe. Le rythme reel de tes eleves, les blocages deja observes, les seances qui ont moins bien fonctionne, c'est toi qui portes ces informations.",
    ],
    highlight: "Plus tu contextualises, moins tu corriges en sortie.",
  },
  {
    id: "limites",
    num: "02",
    emoji: "ALERTE",
    label: "Ce qu'elle ne peut pas faire a ta place",
    color: "#ffd41d",
    colorBg: "#fffce6",
    colorBorder: "rgba(255,212,29,0.3)",
    body: [
      "L'IA ne connait pas ton programme tel qu'il a reellement avance cette annee. Verifie toujours que la structure proposee correspond a ce que ta classe a deja travaille, pas seulement aux attendus officiels.",
      "Elle peut proposer une evaluation finale bien construite sur le papier mais inadaptée au niveau reel de tes eleves. La validation des criteres de reussite reste entierement de ton cote.",
    ],
    highlight: "L'IA produit un cadre, toi tu valides la coherence.",
  },
  {
    id: "verifier",
    num: "03",
    emoji: "CHECK",
    label: "Ce qu'il reste imperatif de verifier",
    color: "#ff33ad",
    colorBg: "#fff0fa",
    colorBorder: "rgba(255,51,173,0.25)",
    body: [
      "Une structure generee rapidement peut donner l'impression d'une sequence aboutie. Le risque est de passer trop vite a la production de supports sans avoir vraiment questionne la logique de progression.",
      "C'est precisement la partie la plus difficile a deleguer.",
    ],
    highlight: "La progression pedagogique reste ton travail, pas le sien.",
  },
];

export const FALLBACK_RISK_ANALYSIS: RiskAnalysis = {
  title: "2 risques a surveiller",
  risks: [
    {
      title: "Progression trop generique",
      detail:
        "Sans assez de contexte, l'IA peut proposer une progression propre en apparence mais insuffisamment ancree dans la realite de la classe.",
    },
    {
      title: "Charge de seance mal calibree",
      detail:
        "Le rythme, la densite et l'ambition des seances doivent toujours etre verifies par rapport au temps reel et au niveau observe.",
    },
  ],
};
