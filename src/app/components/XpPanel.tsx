import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getQuizAnswers, subscribeQuiz } from "../quizStore";
import { subscribeXp } from "../xpStore";
import { ROOMS, TOTAL_CAMPUS_PROGRESS_ROOMS } from "../modules/campus/rooms";
import { getVisitedRoomCount } from "../modules/campus/roomProgress";
const TOTAL_QUIZZES = 3;

export function XpPanel() {
  const [answers, setAnswers] = useState(() => getQuizAnswers());
  const [rooms, setRooms] = useState(getVisitedRoomCount);

  useEffect(() => {
    const unsubQuiz = subscribeQuiz(() => setAnswers({ ...getQuizAnswers() }));
    const unsubXp = subscribeXp(() => setRooms(getVisitedRoomCount()));
    return () => { unsubQuiz(); unsubXp(); };
  }, []);

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(Boolean).length;
  const allDone = answeredCount === TOTAL_QUIZZES;

  const scoreColor = allDone
    ? correctCount === 3 ? "#1da82a" : correctCount >= 2 ? "#ffc200" : "#ff33ad"
    : "#C4B8AE";

  return (
    <motion.div
      className="fixed bottom-14 right-4 z-[150] rounded-2xl overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        width: "clamp(168px, 18vw, 248px)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, scale: [1, 1.035, 1] }}
      transition={{ delay: 0.5, scale: { duration: 0.42 } }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3"
        style={{ background: "#fffce6", borderBottom: "1px solid rgba(255,212,29,0.2)" }}
      >
        <motion.span key={`map_${rooms}`} animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.22, 1] }} transition={{ duration: 0.55 }} style={{ fontSize: 13 }}>🗺️</motion.span>
        <div className="flex-1">
          <div style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 8, letterSpacing: 2, fontWeight: 800 }}>
            PROGRESSION CAMPUS
          </div>
          <div className="hidden md:block" style={{ color: "#9C8B76", fontSize: 10, marginTop: 2 }}>
            Salle {Math.min(rooms + 1, ROOMS.length)}/{ROOMS.length} · +50 XP par salle
          </div>
        </div>
      </div>

      <div className="px-3 py-3 md:px-4 md:py-4 space-y-3 md:space-y-4">
        {/* Quiz dots */}
        <div>
          <div style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 8, letterSpacing: 1, marginBottom: 7 }}>
            RÉFLEXES · {answeredCount}/{TOTAL_QUIZZES}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_QUIZZES }, (_, i) => {
              const qNum = i + 1;
              const answered = answers[qNum] !== undefined;
              const correct = answers[qNum] === true;
              return (
                <motion.div
                  key={i}
                  animate={answered ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.35 }}
                  className="flex-1 h-8 md:h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: answered
                      ? correct ? "#edfaee" : "#fff0fa"
                      : "rgba(0,0,0,0.04)",
                    border: `1.5px solid ${
                      answered
                        ? correct ? "rgba(29,168,42,0.3)" : "rgba(255,51,173,0.3)"
                        : "rgba(0,0,0,0.07)"
                    }`,
                    fontSize: answered ? 13 : 9,
                    color: answered
                      ? correct ? "#1da82a" : "#ff33ad"
                      : "#C4B8AE",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    transition: "all 0.3s ease",
                  }}
                >
                  {answered ? (correct ? "✓" : "✗") : qNum}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Room progress bar */}
        <div>
          <div style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 8, letterSpacing: 1, marginBottom: 7 }}>
            CAMPUS · {rooms}/{TOTAL_CAMPUS_PROGRESS_ROOMS} SALLES
          </div>
          <div className="flex gap-0.5 md:gap-1">
            {Array.from({ length: TOTAL_CAMPUS_PROGRESS_ROOMS }, (_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: 6 }}
                animate={{
                  background: i < rooms ? "#ffd41d" : "rgba(0,0,0,0.07)",
                  scaleY: i === rooms - 1 ? [1, 1.8, 1] : 1,
                }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
              />
            ))}
          </div>
          <div className="hidden md:grid grid-cols-4 gap-1.5 mt-3">
            {ROOMS.map((room, index) => {
              const unlocked = index < rooms;
              const active = index === Math.max(0, Math.min(rooms - 1, ROOMS.length - 1));
              return (
                <motion.div
                  key={room.path}
                  animate={unlocked ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="rounded-lg flex flex-col items-center justify-center gap-0.5"
                  style={{
                    minHeight: 42,
                    background: unlocked ? `${room.color}12` : active ? `${room.color}08` : "rgba(0,0,0,0.025)",
                    border: `1px solid ${unlocked || active ? `${room.color}30` : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{unlocked ? "✓" : room.icon}</span>
                  <span style={{ color: unlocked || active ? room.color : "#C4B8AE", fontSize: 7, fontFamily: "monospace", fontWeight: 800 }}>
                    {room.step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Score summary */}
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg px-2 py-1.5 text-center"
            style={{
              background: correctCount === 3 ? "#edfaee" : correctCount >= 2 ? "#fffce6" : "#fff0fa",
              border: `1px solid ${correctCount === 3 ? "rgba(29,168,42,0.2)" : correctCount >= 2 ? "rgba(255,212,29,0.3)" : "rgba(255,51,173,0.2)"}`,
            }}
          >
            <div style={{ color: scoreColor, fontSize: 8, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>
              {correctCount}/3 ·{" "}
              {correctCount === 3 ? "EXPERT" : correctCount >= 2 ? "EN MAÎTRISE" : "DÉCOUVERTE"}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
