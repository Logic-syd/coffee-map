"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { tapSpring, popupMotion } from "@/lib/motion";

const langs = [
  { code: "en", label: "EN" },
  { code: "ko", label: "KO" },
];

export default function FloatingLang({
  current = "en",
  onChange,
}: {
  current?: string;
  onChange?: (lang: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            {...popupMotion}
            className="mb-2 bg-white rounded-2xl shadow-card px-3 py-2 flex flex-col gap-1 border border-pinkcream"
          >
            {langs.map((l) => (
              <button
                key={l.code}
                className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${current === l.code ? "bg-pinkaccent text-white" : "text-inkblack hover:bg-mintice"}`}
                onClick={() => {
                  onChange?.(l.code);
                  setOpen(false);
                }}
              >
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        className="w-12 h-12 rounded-full bg-pinkcream shadow-card flex items-center justify-center border-2 border-pinkaccent hover:bg-pinkaccent hover:text-white transition-colors"
        whileTap={tapSpring}
        aria-label="Change language"
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={26} className="" />
      </motion.button>
    </div>
  );
}
