import { motion } from "motion/react";
import type { RoomConfig } from "../modules/campus/rooms";

const ROOM_POSITIONS = [
  { x: 12, y: 72 },
  { x: 28, y: 52 },
  { x: 22, y: 28 },
  { x: 46, y: 18 },
  { x: 68, y: 30 },
  { x: 76, y: 56 },
  { x: 58, y: 74 },
];

function buildPath(positions: { x: number; y: number }[], width: number, height: number) {
  if (positions.length < 2) return "";
  const pts = positions.map((p) => ({ x: (p.x / 100) * width, y: (p.y / 100) * height }));
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1];
    const current = pts[i];
    path += ` Q ${prev.x} ${prev.y} ${(prev.x + current.x) / 2} ${(prev.y + current.y) / 2}`;
  }
  const last = pts[pts.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

interface CampusMapProps {
  rooms: RoomConfig[];
  currentIndex: number;
  compact?: boolean;
  onRoomClick?: (index: number) => void;
}

export function CampusMap({ rooms, currentIndex, compact = false, onRoomClick }: CampusMapProps) {
  const width = 520;
  const height = compact ? 260 : 340;
  const positions = ROOM_POSITIONS.slice(0, rooms.length);
  const path = buildPath(positions, width, height);
  const visitedPath = buildPath(positions.slice(0, Math.max(1, currentIndex + 1)), width, height);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "#FDF6E3", border: "1px solid rgba(184,148,80,0.22)" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(184,148,80,0.08) 22px, rgba(184,148,80,0.08) 23px)",
        }}
      />
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}>
        <path d={path} fill="none" stroke="rgba(184,148,80,0.34)" strokeWidth={3} strokeDasharray="7 7" />
        {currentIndex > 0 && (
          <motion.path
            d={visitedPath}
            fill="none"
            stroke="#ffd41d"
            strokeWidth={4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        )}

        {rooms.map((room, index) => {
          const pos = positions[index];
          const cx = (pos.x / 100) * width;
          const cy = (pos.y / 100) * height;
          const visited = index < currentIndex;
          const active = index === currentIndex;
          const locked = index > currentIndex;

          return (
            <g key={room.path} onClick={() => !locked && onRoomClick?.(index)} style={{ cursor: locked || !onRoomClick ? "default" : "pointer" }}>
              {active && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={28}
                  fill="none"
                  stroke={room.color}
                  strokeWidth={2}
                  animate={{ r: [24, 34, 24], opacity: [0.65, 0, 0.65] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.circle
                cx={cx}
                cy={cy}
                r={active ? 22 : visited ? 18 : 16}
                fill={active ? room.color : visited ? `${room.color}30` : "rgba(184,148,80,0.12)"}
                stroke={active ? room.color : visited ? `${room.color}70` : "rgba(184,148,80,0.34)"}
                strokeWidth={active ? 2.5 : 1.5}
                whileHover={!locked && onRoomClick ? { scale: 1.08 } : {}}
              />
              <text x={cx} y={cy + 5} textAnchor="middle" fontSize={active ? 16 : 13} style={{ pointerEvents: "none", userSelect: "none" }} opacity={locked ? 0.45 : 1}>
                {visited && !active ? "✓" : locked ? "🔒" : room.icon}
              </text>
              <text
                x={cx}
                y={cy + (active ? 38 : 32)}
                textAnchor="middle"
                fontSize={active ? 9 : 8}
                fontFamily="monospace"
                fontWeight={active ? 800 : 500}
                fill={active ? room.color : visited ? "#9C8B76" : "rgba(184,148,80,0.58)"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {room.short.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
