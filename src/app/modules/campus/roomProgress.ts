import { STORAGE_KEYS } from "../shared/storageKeys";
import { readJson, writeJson } from "../shared/storage";

export function getRoomsWithXp(): Set<string> {
  return new Set(readJson<string[]>(STORAGE_KEYS.xpRooms, []));
}

export function markRoomXp(path: string): void {
  const visited = getRoomsWithXp();
  visited.add(path);
  writeJson(STORAGE_KEYS.xpRooms, [...visited]);
}

export function getVisitedRoomCount(): number {
  return getRoomsWithXp().size;
}
