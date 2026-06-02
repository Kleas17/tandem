import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, BookMarked } from "lucide-react";
import { useCtaRipple } from "./useCtaRipple";
import { requestQuiz } from "../quizStore";

const SECTIONS = [
  {
    id: "bien",
    num: "01",
    emoji: "✅",
    label: "Ce que l'IA fait bien ici",
    color: "#1da82a",
    colorBg: "#edfaee",
    colorBorder: "rgba(29,168,42,0.25)",
    body: [
      "Tu travailles sur des notions qui demandent une vraie progression cognitive. C'est là que l'IA est la plus utile : décomposer une séquence en étapes cohérentes, identifier les jalons, formuler les questions à se poser avant de construire.",
      "Elle peut aussi proposer des variantes d'activités ou d'évaluation selon les profils d'élèves.",
      "Ce qu'elle ne fait pas : connaître ta classe. Le rythme réel de tes élèves, les blocages que tu as déjà repérés, les séances qui ont moins bien fonctionné — c'est toi qui portes ces informations. Plus tu les mets dans le prompt, plus la structure proposée sera pertinente. Moins tu le fais, plus tu devras corriger en sortie.",
    ],
    highlight: "Plus tu contextualises, moins tu corriges en sortie.",
  },
  {
    id: "limites",
    num: "02",
    emoji: "⚠️",
    label: "Ce qu'elle ne peut pas faire à ta place",
    color: "#ffd41d",
    colorBg: "#fffce6",
    colorBorder: "rgba(255,212,29,0.3)",
    body: [
      "L'IA ne connaît pas ton programme tel que tu l'as réellement avancé cette année. Vérifie toujours que la structure proposée correspond à ce que ta classe a déjà travaillé, pas seulement aux attendus officiels.",
      "Elle peut proposer une évaluation finale bien construite sur le papier mais inadaptée au niveau réel de tes élèves. La validation des critères de réussite reste entièrement de ton côté.",
    ],
    highlight: "L'IA produit un cadre — toi tu valides la cohérence.",
  },
  {
    id: "verifier",
    num: "03",
    emoji: "🔍",
    label: "Ce qu'il reste impératif de vérifier",
    color: "#ff33ad",
    colorBg: "#fff0fa",
    colorBorder: "rgba(255,51,173,0.25)",
    body: [
      "Une structure générée rapidement peut donner l'impression d'une séquence aboutie. Le risque est de passer trop vite à la production de supports sans avoir vraiment questionné la logique de progression.",
      "C'est précisément la partie la plus difficile à déléguer.",
    ],
    highlight: "La progression pédagogique reste ton travail, pas le sien.",
  },
];

export default function Screen3() {
  const navigate = useNavigate();
  const { triggerRipple, RippleLayer } = useCtaRipple();
  const [read, setRead] = useState<string[]>([]);

  const markRead = (id: string) => setRead((prev) => prev.includes(id) ? prev : [...prev, id]);
  const allRead = read.length === SECTIONS.length;

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(255,51,173,0.25)", background: "#fff0fa", color: "#ff33ad", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}
          >
            <BookMarked size={11} /> FICHE MÉMO — CDI · SALLE 03/07
          </div>
          <h1 style={{ color: "#1A1208", fontSize: "clamp(20px,3.5vw,30px)", fontWeight: 800 }}>
            L'IA dans ta pratique :{" "}
            <span style={{ color: "#ff33ad" }}>ce qu'il faut savoir</span>
          </h1>
          <p style={{ color: "#9C8B76", marginTop: 6, fontSize: 13 }}>
            Lis chaque section et marque-la comme lue pour continuer.
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {SECTIONS.map((s) => {
              const done = read.includes(s.id);
              return (
                <motion.div
                  key={s.id}
                  animate={done ? { scale: [1, 1.35, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: done ? s.color : "#F9F4EE",
                    border: `1.5px solid ${done ? s.color : "rgba(0,0,0,0.08)"}`,
                    fontSize: 10,
                    color: done ? "#fff" : "#C4B8AE",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    transition: "all 0.3s ease",
                  }}
                >
                  {done ? "✓" : s.num}
                </motion.div>
              );
            })}
            <div style={{ color: "#C4B8AE", fontSize: 10, fontFamily: "monospace", marginLeft: 4 }}>
              {read.length}/{SECTIONS.length}
            </div>
          </div>
        </motion.div>

        {/* Section cards */}
        <div className="space-y-4 mb-8">
          {SECTIONS.map((s, i) => {
            const isDone = read.includes(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: isDone ? s.colorBg : "#FFFFFF",
                  borderLeft: `1px solid ${isDone ? s.colorBorder : "rgba(0,0,0,0.08)"}`,
                  borderRight: `1px solid ${isDone ? s.colorBorder : "rgba(0,0,0,0.08)"}`,
                  borderBottom: `1px solid ${isDone ? s.colorBorder : "rgba(0,0,0,0.08)"}`,
                  borderTop: `3px solid ${s.color}`,
                  boxShadow: isDone ? `0 4px 20px ${s.color}15` : "0 2px 12px rgba(0,0,0,0.07)",
                  transition: "all 0.35s ease",
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: `1px solid ${s.colorBorder}`, background: s.colorBg }}
                >
                  <span style={{ fontSize: 20 }}>{s.emoji}</span>
                  <div className="flex-1">
                    <div style={{ color: s.color, fontSize: 9, fontFamily: "monospace", letterSpacing: 2, fontWeight: 700 }}>
                      SECTION {s.num}
                    </div>
                    <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                  </div>
                  {isDone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: s.color }}
                    >
                      <span style={{ color: "#fff", fontSize: 11 }}>✓</span>
                    </motion.div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  {s.body.map((para, j) => (
                    <motion.p
                      key={j}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 + j * 0.06 }}
                      style={{ color: j === 0 ? "#1A1208" : "#4A3D30", fontSize: 13.5, lineHeight: 1.75 }}
                    >
                      {para}
                    </motion.p>
                  ))}

                  {/* Highlight pill */}
                  <div
                    className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl"
                    style={{ background: "#FFFFFF", border: `1px solid ${s.colorBorder}` }}
                  >
                    <span style={{ color: s.color, fontSize: 12 }}>›</span>
                    <span style={{ color: s.color, fontSize: 12, fontWeight: 600, fontStyle: "italic" }}>{s.highlight}</span>
                  </div>

                  {/* Mark as read */}
                  <AnimatePresence>
                    {!isDone && (
                      <motion.button
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => markRead(s.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 mt-3"
                        style={{
                          background: s.colorBg,
                          border: `1px solid ${s.colorBorder}`,
                          color: s.color,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Pris en compte — section suivante
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <motion.button
            onClick={(e) => {
              if (allRead) {
                triggerRipple(e);
                requestQuiz(3, () => navigate("/step/4"));
              }
            }}
            animate={allRead ? {
              boxShadow: ["0 2px 16px rgba(255,212,29,0.3)", "0 4px 32px rgba(255,212,29,0.5)", "0 2px 16px rgba(255,212,29,0.3)"],
            } : {}}
            transition={{ duration: 1.6, repeat: Infinity }}
            whileHover={allRead ? { scale: 1.04 } : {}}
            whileTap={allRead ? { scale: 0.97 } : {}}
            className="px-10 py-4 rounded-xl flex items-center gap-3 relative overflow-hidden transition-all duration-300"
            style={{
              background: allRead ? "linear-gradient(135deg,#ffd41d,#ffc200)" : "#F9F4EE",
              color: allRead ? "#1A1208" : "#C4B8AE",
              fontWeight: 900,
              fontSize: 15,
              cursor: allRead ? "pointer" : "not-allowed",
              border: allRead ? "none" : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {allRead && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.25) 50%,transparent 60%)", animation: "shimmer 2s linear infinite" }} />
            )}
            <RippleLayer />
            {allRead
              ? <><span>✓</span> CAS PRATIQUES <ChevronRight size={18} /></>
              : `📖 LIRE ENCORE ${SECTIONS.length - read.length} SECTION${SECTIONS.length - read.length > 1 ? "S" : ""}`
            }
          </motion.button>
        </div>
      </div>
    </div>
  );
}
