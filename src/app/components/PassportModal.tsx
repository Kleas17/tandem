import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface Room {
  path: string;
  label: string;
  short: string;
  icon: string;
  desc: string;
  color: string;
  time: number;
}

interface PassportModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  currentIndex: number;
}

const STAMP_ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2];
const STAMP_DATES = ["Lun. 2 juin", "Lun. 2 juin", "Lun. 2 juin", "Lun. 2 juin", "Lun. 2 juin", "Lun. 2 juin", "Lun. 2 juin"];

export function PassportModal({ open, onClose, rooms, currentIndex }: PassportModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[600]"
            style={{ background: "rgba(26,18,8,0.45)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Modal — bottom sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-[700] rounded-t-3xl overflow-hidden"
            style={{
              background: "#FDF8F0",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.18)",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            {/* Parchment texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px)",
                zIndex: 0,
              }}
            />

            <div className="relative z-10 px-6 pb-10 pt-5 max-w-2xl mx-auto">
              {/* Handle */}
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.15)" }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#ffc200,#ffd41d)", boxShadow: "0 2px 10px rgba(255,212,29,0.3)" }}
                  >
                    <span style={{ fontSize: 20 }}>📔</span>
                  </div>
                  <div>
                    <div style={{ color: "#9C8B76", fontFamily: "monospace", fontSize: 8, letterSpacing: 3 }}>CAMPUS TANDEM · 2026</div>
                    <div style={{ color: "#1A1208", fontWeight: 800, fontSize: 15, fontFamily: "'Bebas Neue', sans-serif" }}>Carnet de bord</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                >
                  <X size={14} style={{ color: "#9C8B76" }} />
                </button>
              </div>

              {/* Stamps legend */}
              <div className="flex items-center gap-2 mb-5">
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
                <span style={{ color: "#C4B8AE", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>
                  {currentIndex}/{rooms.length} SALLES VISITÉES
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
              </div>

              {/* Stamps grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {rooms.map((room, i) => {
                  const visited = i < currentIndex;
                  const isCurrent = i === currentIndex;
                  return (
                    <div
                      key={room.path}
                      className="flex flex-col items-center"
                      style={{ transform: `rotate(${STAMP_ROTATIONS[i]}deg)` }}
                    >
                      <motion.div
                        initial={visited ? { scale: 1.6, opacity: 0 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={
                          visited
                            ? { type: "spring", stiffness: 380, damping: 20, delay: i * 0.09 }
                            : {}
                        }
                        className="flex flex-col items-center justify-center rounded-xl p-2"
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          border: `2px dashed ${visited ? room.color : "rgba(0,0,0,0.12)"}`,
                          background: visited ? room.color + "12" : "transparent",
                          opacity: isCurrent ? 0.5 : visited ? 1 : 0.28,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* Stamp ink overlay */}
                        {visited && (
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${room.color}08 0%, transparent 70%)`,
                            }}
                          />
                        )}

                        <span style={{ fontSize: 22, position: "relative" }}>{room.icon}</span>
                        <span
                          style={{
                            color: visited ? room.color : "#C4B8AE",
                            fontSize: 7,
                            fontFamily: "monospace",
                            fontWeight: 800,
                            letterSpacing: 0.5,
                            textAlign: "center",
                            lineHeight: 1.2,
                            marginTop: 3,
                            position: "relative",
                          }}
                        >
                          {room.short.toUpperCase()}
                        </span>

                        {visited && (
                          <span
                            style={{
                              color: room.color,
                              fontSize: 6,
                              fontFamily: "monospace",
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              marginTop: 1,
                              position: "relative",
                            }}
                          >
                            ✓ VISITÉ
                          </span>
                        )}
                      </motion.div>

                      {/* Date under stamp */}
                      {visited && (
                        <span style={{ color: "#C4B8AE", fontSize: 7, fontFamily: "monospace", marginTop: 4, letterSpacing: 0.5 }}>
                          {STAMP_DATES[i]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress details */}
              <div
                className="rounded-2xl p-4"
                style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <div style={{ color: "#9C8B76", fontFamily: "monospace", fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>
                  📊 PROGRESSION
                </div>
                <div className="space-y-2">
                  {rooms.map((room, i) => {
                    const completed = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <motion.div
                        key={room.path}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2.5 p-2 rounded-lg"
                        style={{
                          background: completed ? room.color + "08" : isCurrent ? room.color + "12" : "transparent",
                          border: `1px solid ${completed || isCurrent ? room.color + "25" : "rgba(0,0,0,0.05)"}`,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: completed ? room.color : isCurrent ? room.color + "35" : "rgba(0,0,0,0.05)",
                            color: completed ? "#fff" : isCurrent ? room.color : "#C4B8AE",
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                          {completed ? "✓" : i + 1}
                        </div>
                        <div className="flex-1">
                          <div style={{ color: completed || isCurrent ? "#1A1208" : "#9C8B76", fontSize: 11, fontWeight: 600 }}>
                            {room.label}
                          </div>
                          <div style={{ color: completed || isCurrent ? room.color : "#C4B8AE", fontSize: 9 }}>
                            {room.desc}
                          </div>
                        </div>
                        <span style={{ fontSize: 16 }}>{room.icon}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
