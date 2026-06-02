import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface FloatItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

let _id = 0;

export function useXpFloat() {
  const [items, setItems] = useState<FloatItem[]>([]);

  const spawn = useCallback((text: string, x: number, y: number) => {
    const id = ++_id;
    setItems((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 1200);
  }, []);

  const XpLayer = () => (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y,
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 800,
              color: "#FFFFFF",
              background: "linear-gradient(135deg,#ffc200,#ffd41d)",
              borderRadius: 20,
              padding: "3px 10px",
              boxShadow: "0 2px 12px rgba(255,212,29,0.4)",
              letterSpacing: 1,
              whiteSpace: "nowrap",
            }}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return { spawn, XpLayer };
}
