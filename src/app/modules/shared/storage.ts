export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function writeStoredItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function hasStoredItem(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

export function removeStoredItem(key: string): void {
  localStorage.removeItem(key);
}
