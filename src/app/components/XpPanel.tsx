import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getQuizAnswers, subscribeQuiz } from "../quizStore";
import { subscribeXp } from "../xpStore";

const TOTAL_ROOMS = 7;
const TOTAL_QUIZZES = 3;

function getRoomsVisited(): number {
  try {
    const raw = localStorage.getItem("tandem_xp_rooms");
    if (!raw) return 0;
    return JSON.parse(raw).length;
  } catch {
    return 0;
  }
}

export function XpPanel() {
  const [answers, setAnswers] = useState(() => getQuizAnswers());
  const [rooms, setRooms] = useState(getRoomsVisited);

  useEffect(() => {
    const unsubQuiz = subscribeQuiz(() => setAnswers({ ...getQuizAnswers() }));
    const unsubXp = subscribeXp(() => setRooms(getRoomsVisited()));
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
        width: 168,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{ background: "#fffce6", borderBottom: "1px solid rgba(255,212,29,0.2)" }}
      >
        <span style={{ fontSize: 10 }}>🗺️</span>
        <span style={{ color: "#ffc200", fontFamily: "monospace", fontSize: 7, letterSpacing: 2, fontWeight: 700 }}>
          PROGRESSION CAMPUS
        </span>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Quiz dots */}
        <div>
          <div style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 7, letterSpacing: 1, marginBottom: 6 }}>
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
                  className="flex-1 h-8 rounded-lg flex items-center justify-center"
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
          <div style={{ color: "#C4B8AE", fontFamily: "monospace", fontSize: 7, letterSpacing: 1, marginBottom: 6 }}>
            CAMPUS · {rooms}/{TOTAL_ROOMS} SALLES
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: TOTAL_ROOMS }, (_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: 5 }}
                animate={{ background: i < rooms ? "#ffd41d" : "rgba(0,0,0,0.07)" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              />
            ))}
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
