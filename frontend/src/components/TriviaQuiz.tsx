import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TRIVIA_CATEGORIES, TriviaCategory, TriviaQuestion } from "../data/trivia";

// Shuffle an array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "pick" | "question" | "feedback";

export const TriviaQuiz: React.FC = () => {
  const [phase, setPhase] = useState<Phase>("pick");
  const [category, setCategory] = useState<TriviaCategory | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQ = questions[qIndex];

  const pickCategory = (cat: TriviaCategory) => {
    setCategory(cat);
    setQuestions(shuffle(cat.questions));
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setPhase("question");
  };

  const handleAnswer = (idx: number) => {
    if (phase !== "question" || selected !== null) return;
    setSelected(idx);
    setPhase("feedback");

    const correct = idx === currentQ.answer;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }

    nextTimer.current = setTimeout(() => {
      setSelected(null);
      setQIndex((i) => (i + 1) % questions.length);
      setPhase("question");
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (nextTimer.current) clearTimeout(nextTimer.current);
    };
  }, []);

  // ── Topic picker ──────────────────────────────────────────────────────────
  if (phase === "pick" || !category || !currentQ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg mx-auto px-4"
      >
        <p className="text-center font-sans text-xs tracking-[0.2em] uppercase text-white/30 mb-2">
          While we crunch your numbers
        </p>
        <p className="text-center font-sans text-base font-semibold text-white/70 mb-6">
          Pick a trivia topic
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TRIVIA_CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => pickCategory(cat)}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors hover:border-gold-500/40 hover:bg-white/[0.07]"
            >
              <span className="text-3xl block mb-2">{cat.emoji}</span>
              <span className="font-sans text-sm font-semibold text-white/80">{cat.label}</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Question ──────────────────────────────────────────────────────────────
  const isCorrect = selected !== null && selected === currentQ.answer;
  const isWrong = selected !== null && selected !== currentQ.answer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto px-4"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setPhase("pick")}
          className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-sans text-xs">{category.emoji} {category.label}</span>
        </button>
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-sans text-xs text-orange-400/80"
            >
              🔥 {streak} streak
            </motion.span>
          )}
          <span className="font-sans text-xs text-white/30">
            {score}/{qIndex} correct
          </span>
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Question */}
          <div className="mb-5 rounded-xl border border-white/8 bg-white/[0.04] px-5 py-4">
            <p className="font-sans text-sm font-medium text-white/80 leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelectedCorrect = selected === i && i === currentQ.answer;
              const isSelectedWrong = selected === i && i !== currentQ.answer;
              const isRevealedCorrect = phase === "feedback" && i === currentQ.answer && selected !== null;

              let borderClass = "border-white/10 hover:border-gold-500/40";
              let bgClass = "bg-white/[0.03] hover:bg-white/[0.06]";
              let textClass = "text-white/65";

              if (isSelectedCorrect || isRevealedCorrect) {
                borderClass = "border-emerald-500/60";
                bgClass = "bg-emerald-500/10";
                textClass = "text-emerald-300";
              } else if (isSelectedWrong) {
                borderClass = "border-red-500/50";
                bgClass = "bg-red-500/10";
                textClass = "text-red-400";
              }

              return (
                <motion.button
                  key={i}
                  whileHover={selected === null ? { scale: 1.01 } : {}}
                  whileTap={selected === null ? { scale: 0.99 } : {}}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-all duration-200 ${borderClass} ${bgClass} ${selected !== null ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-sans text-xs w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelectedCorrect || isRevealedCorrect ? "border-emerald-400 text-emerald-300" :
                      isSelectedWrong && selected === i ? "border-red-400 text-red-400" :
                      "border-white/20 text-white/30"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={`font-sans text-sm transition-colors ${textClass}`}>{opt}</span>
                    {(isSelectedCorrect || isRevealedCorrect) && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-emerald-400 text-base"
                      >
                        ✓
                      </motion.span>
                    )}
                    {isSelectedWrong && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-red-400 text-base"
                      >
                        ✗
                      </motion.span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback banner */}
          <AnimatePresence>
            {phase === "feedback" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`mt-3 rounded-lg px-4 py-2.5 text-center font-sans text-xs font-medium ${
                  isCorrect ? "bg-emerald-500/10 text-emerald-300/80" : "bg-red-500/10 text-red-400/80"
                }`}>
                  {isCorrect
                    ? streak >= 3
                      ? `🔥 ${streak} in a row! Nice.`
                      : "Correct!"
                    : `The answer was: ${currentQ.options[currentQ.answer]}`
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-px w-4 transition-all duration-500 ${
              i < qIndex ? "bg-gold-500/60" : i === qIndex ? "bg-gold-400" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};
