import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";

interface Room {
  path: string;
  label: string;
  short: string;
  icon: string;
  desc: string;
  color: string;
}

interface TreasureMapProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  currentIndex: number;
}

// Winding path positions on the map (% of container width/height)
const ROOM_POSITIONS = [
  { x: 12, y: 72 },  // Room 1 - bottom left
  { x: 28, y: 52 },  // Room 2 - mid left
  { x: 22, y: 28 },  // Room 3 - upper left
  { x: 46, y: 18 },  // Room 4 - upper center
  { x: 68, y: 30 },  // Room 5 - upper right
  { x: 76, y: 56 },  // Room 6 - mid right
  { x: 58, y: 74 },  // Room 7 - bottom center-right (treasure)
];

// SVG path connecting the rooms
function buildPath(positions: { x: number; y: number }[], W: number, H: number): string {
  if (positions.length < 2) return "";
  const pts = positions.map((p) => ({ x: (p.x / 100) * W, y: (p.y / 100) * H }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function TreasureMap({ open, onClose, rooms, currentIndex }: TreasureMapProps) {
  const navigate = useNavigate();

  const W = 520;
  const H = 340;

  const pathD = buildPath(ROOM_POSITIONS, W, H);
  const visitedPathD = buildPath(ROOM_POSITIONS.slice(0, currentIndex + 1), W, H);

  const handleRoomClick = (idx: number) => {
    if (idx > currentIndex) return; // locked
    navigate(rooms[idx].path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center px-4"
          style={{ background: "rgba(26,18,8,0.55)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-3xl overflow-hidden"
            style={{
              maxWidth: 600,
              background: "#FDF6E3",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
              border: "2px solid rgba(255,212,29,0.35)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg,#ffc200,#ffd41d)", borderBottom: "none" }}
            >
              <div>
                <div style={{ color: "rgba(26,18,8,0.5)", fontFamily: "monospace", fontSize: 9, letterSpacing: 3 }}>
                  🗺️ PLAN DU CAMPUS
                </div>
                <div style={{ color: "#1A1208", fontWeight: 900, fontSize: 16, fontFamily: "'Bebas Neue', sans-serif" }}>
                  Carte au trésor
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(26,18,8,0.12)", color: "#1A1208" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Map */}
            <div className="relative p-4" style={{ background: "#FDF6E3" }}>
              {/* Parchment texture lines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(184,148,80,0.08) 22px, rgba(184,148,80,0.08) 23px)",
                }}
              />

              <svg
                width="100%"
                viewBox={`0 0 ${W} ${H}`}
                style={{ display: "block", overflow: "visible" }}
              >
                {/* Dashed full path (unvisited) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(184,148,80,0.3)"
                  strokeWidth={3}
                  strokeDasharray="6 6"
                />

                {/* Solid visited path */}
                {currentIndex > 0 && (
                  <motion.path
                    d={visitedPathD}
                    fill="none"
                    stroke="#ffd41d"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                )}

                {/* Room nodes */}
                {rooms.map((room, i) => {
                  const pos = ROOM_POSITIONS[i];
                  const cx = (pos.x / 100) * W;
                  const cy = (pos.y / 100) * H;
                  const visited = i < currentIndex;
                  const active = i === currentIndex;
                  const locked = i > currentIndex;

                  return (
                    <g key={room.path}>
                      {/* Fog overlay for locked rooms */}
                      {locked && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={32}
                          fill="rgba(184,148,80,0.12)"
                          stroke="rgba(184,148,80,0.2)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Active room pulse ring */}
                      {active && (
                        <motion.circle
                          cx={cx}
                          cy={cy}
                          r={28}
                          fill="none"
                          stroke={room.color}
                          strokeWidth={2}
                          animate={{ r: [24, 34, 24], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}

                      {/* Room circle */}
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={active ? 22 : visited ? 18 : 16}
                        fill={
                          active
                            ? room.color
                            : visited
                            ? `${room.color}30`
                            : "rgba(184,148,80,0.1)"
                        }
                        stroke={
                          active
                            ? room.color
                            : visited
                            ? `${room.color}70`
                            : "rgba(184,148,80,0.3)"
                        }
                        strokeWidth={active ? 2.5 : 1.5}
                        style={{ cursor: locked ? "not-allowed" : "pointer", filter: locked ? "blur(1px)" : "none" }}
                        onClick={() => handleRoomClick(i)}
                        whileHover={!locked ? { scale: 1.1 } : {}}
                      />

                      {/* Room icon / number */}
                      <text
                        x={cx}
                        y={cy + (active ? 6 : 5)}
                        textAnchor="middle"
                        fontSize={active ? 16 : visited ? 13 : 10}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                        opacity={locked ? 0.3 : 1}
                      >
                        {visited && !active ? "✅" : locked ? "🔒" : room.icon}
                      </text>

                      {/* Label */}
                      <text
                        x={cx}
                        y={cy + (active ? 38 : 32)}
                        textAnchor="middle"
                        fontSize={active ? 9 : 8}
                        fontFamily="monospace"
                        fontWeight={active ? 700 : 400}
                        fill={
                          active ? room.color : visited ? "#9C8B76" : "rgba(184,148,80,0.5)"
                        }
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {room.short.toUpperCase()}
                      </text>

                      {/* Room number badge */}
                      <text
                        x={cx + (active ? 18 : 14)}
                        y={cy - (active ? 16 : 12)}
                        textAnchor="middle"
                        fontSize={7}
                        fontFamily="monospace"
                        fontWeight={700}
                        fill={locked ? "rgba(184,148,80,0.4)" : room.color}
                        opacity={locked ? 0.5 : 1}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Treasure chest at end */}
                {currentIndex >= rooms.length - 1 && (
                  <motion.text
                    x={(ROOM_POSITIONS[6].x / 100) * W + 30}
                    y={(ROOM_POSITIONS[6].y / 100) * H}
                    fontSize={24}
                    animate={{ y: [(ROOM_POSITIONS[6].y / 100) * H, (ROOM_POSITIONS[6].y / 100) * H - 6, (ROOM_POSITIONS[6].y / 100) * H] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ pointerEvents: "none" }}
                  >
                    🏆
                  </motion.text>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "rgba(255,212,29,0.06)", borderTop: "1px solid rgba(255,212,29,0.2)" }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#1da82a30", border: "1.5px solid #1da82a70" }} />
                  <span style={{ color: "#9C8B76", fontFamily: "monospace", fontSize: 8 }}>VISITÉE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#ffd41d" }} />
                  <span style={{ color: "#9C8B76", fontFamily: "monospace", fontSize: 8 }}>EN COURS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(184,148,80,0.1)", border: "1px dashed rgba(184,148,80,0.3)" }} />
                  <span style={{ color: "#9C8B76", fontFamily: "monospace", fontSize: 8 }}>VERROUILLÉE</span>
                </div>
              </div>
              <span style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 8 }}>
                {currentIndex + 1}/{rooms.length} SALLES
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
