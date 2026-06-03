import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Copy, Download, Share2, Trophy, CheckCircle } from "lucide-react";
import { useCtaRipple } from "../../components/useCtaRipple";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getQuizAnswers, getScore } from "../quizStore";
import { STORAGE_KEYS } from "../../modules/shared/storageKeys";
import { readJson } from "../../modules/shared/storage";

const PROMPT_1 = `Tu es un assistant pédagogique expert en ingénierie de formation pour le second degré.

Je suis enseignant(e) en [DISCIPLINE] et je travaille avec des élèves de [NIVEAU].

Je veux structurer une séquence pédagogique sur : [SUJET].

Aide-moi à :
1. Décomposer ce sujet en 3 à 5 notions clés à enseigner dans l'ordre logique
2. Proposer un titre et un objectif clair pour chaque séance
3. Suggérer une activité d'accroche engageante pour la 1ère séance
4. Identifier 2-3 points de vigilance (confusions fréquentes, prérequis à vérifier)

⚠️ Tu ne connais pas mes élèves ni le détail exact de mon programme — tes suggestions sont un point de départ que je vais adapter et valider.

Format souhaité : liste structurée avec titres, sous-titres et puces. Concis et actionnable.`;

function getReflexSheet(discipline?: string, niveau?: string) {
  return {
    title: discipline ? `Réflexes — ${discipline}` : "Réflexes clés",
    subtitle: niveau ? `Niveau ${niveau}` : "Tous niveaux",
    points: [
      {
        icon: "💬",
        label: "Ce que vous mettez dans le prompt",
        text: discipline
          ? `En ${discipline}, précisez la notion exacte, l'objectif de compétence visé et les ressources déjà disponibles. Plus c'est contextualisé, plus la proposition sera pertinente — et moins vous corrigez en sortie.`
          : "Précisez la notion exacte, l'objectif de compétence visé et vos ressources disponibles. Plus c'est contextualisé, moins vous corrigez en sortie.",
      },
      {
        icon: "🔎",
        label: "Ce que vous vérifiez toujours",
        text: niveau
          ? `Avec des élèves de ${niveau}, vérifiez que la progression proposée correspond à ce que votre classe a réellement travaillé — pas seulement aux attendus officiels. L'IA ne connaît pas votre avancement réel.`
          : "Vérifiez que la progression proposée correspond à ce que votre classe a réellement travaillé — pas seulement aux attendus officiels.",
      },
      {
        icon: "🛑",
        label: "Ce que vous ne déléguez pas",
        text: "La logique de progression reste de votre ressort. L'IA propose un squelette — vous apportez la connaissance de vos élèves et la cohérence pédagogique. Ne validez jamais une structure sans l'avoir confrontée à votre vécu de classe.",
      },
    ],
  };
}

function getScoreBadge(correct: number) {
  if (correct === 3) return { label: "Réflexes intégrés", color: "#1da82a", bg: "#edfaee", border: "rgba(29,168,42,0.25)", emoji: "🎯" };
  if (correct >= 2) return { label: "En bonne voie", color: "#ffc200", bg: "#fffce6", border: "rgba(255,212,29,0.3)", emoji: "⚡" };
  return { label: "À consolider", color: "#ff33ad", bg: "#fff0fa", border: "rgba(255,51,173,0.25)", emoji: "💡" };
}

export default function TreasureRecapPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const { triggerRipple, RippleLayer } = useCtaRipple();

  const profile = readJson<{ discipline?: string; niveau?: string } | null>(
    STORAGE_KEYS.profile,
    null,
  );
  const answers = getQuizAnswers();
  const score = getScore();
  const badge = getScoreBadge(score.correct);
  const reflex = getReflexSheet(profile?.discipline, profile?.niveau);

  const handleOpenChest = () => {
    setChestOpen(true);
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ["#ffd41d", "#1da82a", "#ff33ad", "#ffc200"] });
    setTimeout(() => {
      confetti({ particleCount: 70, spread: 110, angle: 60, origin: { y: 0.6 }, colors: ["#ffd41d", "#ff33ad"] });
      confetti({ particleCount: 70, spread: 110, angle: 120, origin: { y: 0.6 }, colors: ["#1da82a", "#ffd41d"] });
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT_1).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success("✅ Prompt copié !", { description: "Collez-le directement dans ChatGPT, Claude ou Gemini." });
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Tandem — Éducation nationale", text: "Découvrez Tandem, le kit d'onboarding IA pour enseignants du secondaire !" });
    } else {
      toast.success("🔗 Lien copié !", { description: "Partagez ce kit avec vos collègues." });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <motion.div
            className="flex items-center justify-center gap-1 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <span style={{ fontSize: 32 }}>🎒</span>
            {["📌","📝","📚","📋","💡","🗝️","🏆"].map((item, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -12, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
                style={{ fontSize: 22 }}
              >
                {item}
              </motion.span>
            ))}
          </motion.div>

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ border: "1px solid rgba(255,212,29,0.3)", background: "#fffce6", color: "#ffd41d", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}
          >
            <Trophy size={11} /> HALL DES TROPHÉES — SALLE 07/07
          </div>

          <h1 style={{ color: "#1A1208", fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, lineHeight: 1.2 }}>
            Sac à dos{" "}
            <span style={{ background: "linear-gradient(90deg,#ffd41d,#1da82a,#ff33ad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              complet — mission accomplie !
            </span>
          </h1>

          {/* Quiz score badge */}
          {Object.keys(answers).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
              style={{ background: badge.bg, border: `1px solid ${badge.border}` }}
            >
              <span style={{ fontSize: 14 }}>{badge.emoji}</span>
              <span style={{ color: badge.color, fontSize: 11, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700 }}>
                {score.correct}/3 RÉFLEXES · {badge.label.toUpperCase()}
              </span>
              <div className="flex gap-1 ml-1">
                {[1, 2, 3].map((qNum) => (
                  <div
                    key={qNum}
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: answers[qNum] === true ? "#1da82a" : answers[qNum] === false ? "#ff33ad" : "rgba(0,0,0,0.08)",
                      fontSize: 8,
                      color: "#fff",
                    }}
                  >
                    {answers[qNum] === true ? "✓" : answers[qNum] === false ? "✗" : ""}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Chest CTA */}
        {!chestOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-10"
          >
            <motion.button
              onClick={(e) => { triggerRipple(e); handleOpenChest(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: ["0 4px 20px rgba(255,212,29,0.35)", "0 8px 40px rgba(255,212,29,0.55)", "0 4px 20px rgba(255,212,29,0.35)"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative px-14 py-5 rounded-2xl flex items-center gap-4 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#ffc200,#ffd41d,#ffc200)", color: "#1A1208", fontWeight: 900, fontSize: 18 }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.3) 50%,transparent 60%)", animation: "shimmer 1.8s linear infinite" }} />
              <RippleLayer />
              <span style={{ fontSize: 26, position: "relative" }}>📦</span>
              <span style={{ position: "relative" }}>OUVRIR MES LIVRABLES</span>
              <span style={{ fontSize: 26, position: "relative" }}>✨</span>
            </motion.button>
          </motion.div>
        )}

        {/* Loot content */}
        {chestOpen && (
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

            {/* Prompt 1 — full width */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden mb-5"
              style={{
                background: "#FFFFFF",
                borderLeft: "1px solid rgba(29,168,42,0.25)",
                borderRight: "1px solid rgba(29,168,42,0.25)",
                borderBottom: "1px solid rgba(29,168,42,0.25)",
                borderTop: "3px solid #1da82a",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(29,168,42,0.25)", background: "#edfaee" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fff", border: "1px solid rgba(29,168,42,0.25)", color: "#1da82a", fontSize: 13, fontWeight: 800 }}>
                  #1
                </div>
                <div className="flex-1">
                  <div style={{ color: "#1da82a", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>PROMPT CAS D'USAGE 1 — LEGENDARY</div>
                  <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 13 }}>Structurer une séquence</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Prêt à l'emploi", "Questions à poser", "Ce qu'on vérifie"].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: "#edfaee", border: "1px solid rgba(29,168,42,0.25)", color: "#1da82a", fontSize: 9 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <textarea
                  readOnly
                  value={PROMPT_1.slice(0, 320) + "…"}
                  className="rounded-xl p-4 mb-4 w-full resize-none overflow-auto"
                  style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.12)", maxHeight: 160, fontFamily: "monospace", fontSize: 11, color: "#4A3D30", lineHeight: 1.6, outline: "none" }}
                  rows={6}
                />
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: copied ? "#1da82a" : "#1da82a",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: "0 2px 12px rgba(29,168,42,0.3)",
                  }}
                >
                  {copied ? <><CheckCircle size={15} /> COPIÉ !</> : <><Copy size={15} /> LOOT — COPIER LE PROMPT COMPLET</>}
                </motion.button>
              </div>
            </motion.div>

            {/* Adaptive reflex sheet */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden mb-5"
              style={{
                background: "#FFFFFF",
                borderLeft: "1px solid rgba(255,212,29,0.3)",
                borderRight: "1px solid rgba(255,212,29,0.3)",
                borderBottom: "1px solid rgba(255,212,29,0.3)",
                borderTop: "3px solid #ffd41d",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,212,29,0.3)", background: "#fffce6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fff", border: "1px solid rgba(255,212,29,0.3)", color: "#ffc200", fontSize: 13, fontWeight: 800 }}>
                    📋
                  </div>
                  <div>
                    <div style={{ color: "#ffc200", fontSize: 9, fontFamily: "monospace", letterSpacing: 2 }}>FICHE RÉFLEXE PERSONNALISÉE</div>
                    <div style={{ color: "#1A1208", fontWeight: 700, fontSize: 13 }}>{reflex.title}</div>
                  </div>
                </div>
                {reflex.subtitle !== "Tous niveaux" && (
                  <span className="px-2.5 py-1 rounded-full" style={{ background: "#FFFFFF", border: "1px solid rgba(255,212,29,0.3)", color: "#ffc200", fontSize: 10, fontFamily: "monospace" }}>
                    {reflex.subtitle}
                  </span>
                )}
              </div>

              <div className="p-5 space-y-3">
                {reflex.points.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex gap-3 items-start p-3 rounded-xl"
                    style={{ background: "#F9F4EE", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{point.icon}</span>
                    <div>
                      <div style={{ color: "#ffc200", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, fontWeight: 700, marginBottom: 3 }}>
                        {point.label.toUpperCase()}
                      </div>
                      <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.65 }}>{point.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Actions row */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toast.success("📄 Génération en cours…", { description: "Votre fiche réflexe + prompt sera téléchargeable dans quelques secondes." })}
                className="py-4 rounded-xl flex items-center justify-center gap-3"
                style={{ background: "linear-gradient(135deg,#ffd41d,#ffc200)", color: "#1A1208", fontWeight: 700, fontSize: 14, boxShadow: "0 2px 12px rgba(255,212,29,0.25)" }}
              >
                <Download size={18} />
                Télécharger ma fiche réflexe (PDF)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="py-4 rounded-xl flex items-center justify-center gap-3"
                style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: "#4A3D30", fontWeight: 700, fontSize: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
              >
                <Share2 size={18} />
                Partager ce kit avec un(e) collègue
              </motion.button>
            </div>

            {/* Final card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-6 text-center"
              style={{ background: "#fffce6", border: "1px solid rgba(255,212,29,0.3)", boxShadow: "0 2px 12px rgba(255,212,29,0.12)" }}
            >
              <div className="flex justify-center gap-2 mb-4">
                {["🎖","⚡","🏫","🏆","📖"].map((e, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 + i * 0.07 }}
                    style={{ fontSize: 26 }}
                  >
                    {e}
                  </motion.span>
                ))}
              </div>
              <h2 style={{ color: "#1A1208", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                🏆 Campus complété — Sac à dos plein !
              </h2>
              <p style={{ color: "#4A3D30", fontSize: 13, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 4px" }}>
                Comme Marie, vous repartez avec un outil prêt à l'emploi — pas une séquence de plus à construire from scratch.
              </p>
              <p style={{ color: "#9C8B76", fontSize: 12, fontStyle: "italic", marginTop: 4 }}>
                Testez le prompt dès cette semaine.
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span style={{ color: "#C4B8AE", fontSize: 11 }}>Eduscol IA ·</span>
                <span style={{ color: "#C4B8AE", fontSize: 11 }}>Y-Days 2026 — Groupe 11</span>
              </div>
              <motion.button
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-5 px-7 py-2.5 rounded-xl inline-flex items-center gap-2"
                style={{ background: "#FFFFFF", border: "1px solid rgba(255,212,29,0.3)", color: "#ffd41d", fontWeight: 600, fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
              >
                🏫 Refaire la chasse au trésor
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
