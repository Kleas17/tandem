export interface RoomConfig {
  path: string;
  step: number;
  label: string;
  short: string;
  icon: string;
  desc: string;
  color: string;
  time: number;
}

export const ROOMS: RoomConfig[] = [
  {
    path: "/step/1",
    step: 1,
    label: "Structurer une séquence de cours",
    short: "Intro",
    icon: "📚",
    desc: "Introduction au cas d'usage",
    color: "#1da82a",
    time: 2,
  },
  {
    path: "/step/2",
    step: 2,
    label: "Questionnaire structurant",
    short: "Infos",
    icon: "📝",
    desc: "Informations essentielles",
    color: "#ff33ad",
    time: 2,
  },
  {
    path: "/step/3",
    step: 3,
    label: "L'IA dans ta pratique",
    short: "Recul",
    icon: "🔍",
    desc: "Ce qu'il faut savoir",
    color: "#ffd41d",
    time: 2,
  },
  {
    path: "/step/4",
    step: 4,
    label: "Mission accomplie",
    short: "Trophée",
    icon: "🏆",
    desc: "Prompt + Fiche réflexe",
    color: "#1da82a",
    time: 2,
  },
];

export const TOTAL_ROOMS = ROOMS.length;
export const TOTAL_CAMPUS_PROGRESS_ROOMS = 7;
