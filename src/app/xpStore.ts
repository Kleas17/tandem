const XP_KEY = "tandem_xp";
const listeners = new Set<() => void>();

export function getXp(): number {
  return parseInt(localStorage.getItem(XP_KEY) || "0");
}

export function addXp(amount: number): number {
  const newXp = getXp() + amount;
  localStorage.setItem(XP_KEY, String(newXp));
  listeners.forEach((fn) => fn());
  return newXp;
}

export function subscribeXp(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export interface Level {
  name: string;
  color: string;
  minXp: number;
  nextXp: number | null;
}

const LEVELS: Level[] = [
  { name: "NOVICE",           color: "#9C8B76", minXp: 0,   nextXp: 100 },
  { name: "PROF JUNIOR",      color: "#1da82a", minXp: 100, nextXp: 300 },
  { name: "PROF AGUERRI·E",   color: "#ffd41d", minXp: 300, nextXp: 500 },
  { name: "EXPERT IA",        color: "#ff33ad", minXp: 500, nextXp: 700 },
  { name: "MAÎTRE DU CAMPUS",  color: "#ffd41d", minXp: 700, nextXp: null },
];

export function getLevel(xp: number): Level {
  return [...LEVELS].reverse().find((l) => xp >= l.minXp) ?? LEVELS[0];
}
