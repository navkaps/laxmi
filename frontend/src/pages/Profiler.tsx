import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "../data/questions";
import { UserProfile } from "../types";
import OptionCard from "../components/ui/OptionCard";
import SliderInput from "../components/ui/SliderInput";

const Profiler: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({});
  const [direction, setDirection] = useState(1);

  const question = questions[current];
  const progress = ((current) / questions.length) * 100;
  const answer = profile[question.id];

  const isAnswered = () => {
    if (!answer && answer !== 0) return false;
    if (question.type === "multi") return Array.isArray(answer) && (answer as string[]).length > 0;
    return true;
  };

  const handleSingle = (value: string) => {
    setProfile((p) => ({ ...p, [question.id]: value }));
  };

  const handleSlider = (value: number) => {
    setProfile((p) => ({ ...p, [question.id]: value }));
  };

  const handleMulti = (value: string) => {
    const current = (answer as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setProfile((p) => ({ ...p, [question.id]: updated }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    } else {
      navigate("/results", { state: { profile } });
    }
  };

  const handleBack = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  };

  const handleSkip = () => {
    setDirection(1);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      navigate("/results", { state: { profile } });
    }
  };

  // Initialize slider defaults
  React.useEffect(() => {
    if (question.type === "slider" && question.sliderConfig && !profile[question.id]) {
      const { min, max } = question.sliderConfig;
      setProfile((p) => ({ ...p, [question.id]: Math.round((min + max) / 2) }));
    }
  }, [current]);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/5 z-50">
        <motion.div
          className="h-full bg-gold-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-6 right-10 z-50">
        <span className="label-overline opacity-40">
          {current + 1} / {questions.length}
        </span>
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-10 z-50 flex items-center gap-3">
        <div className="w-6 h-6 border border-gold-500/60 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gold-500 rotate-45" />
        </div>
        <span className="font-display text-base text-cream-50">Laxmi</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-24">
        <div className="w-full max-w-2xl">
          {/* Category */}
          <motion.div
            key={`cat-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <span className="label-overline opacity-50">{question.category}</span>
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              {/* Question */}
              <h2 className="font-display text-3xl md:text-4xl text-cream-50 mb-3 leading-tight">
                {question.question}
              </h2>
              {question.subtext && (
                <p className="text-cream-200/40 font-sans text-sm mb-10 leading-relaxed">
                  {question.subtext}
                </p>
              )}

              {/* Answer input */}
              <div className="mt-8">
                {question.type === "single" && question.options && (
                  <div className="grid gap-3">
                    {question.options.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={answer === opt.value}
                        onClick={() => handleSingle(opt.value)}
                      />
                    ))}
                  </div>
                )}

                {question.type === "multi" && question.options && (
                  <div className="grid grid-cols-2 gap-3">
                    {question.options.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={((answer as string[]) || []).includes(opt.value)}
                        onClick={() => handleMulti(opt.value)}
                        multi
                      />
                    ))}
                  </div>
                )}

                {question.type === "slider" && question.sliderConfig && (
                  <div className="py-8 px-4">
                    <SliderInput
                      min={question.sliderConfig.min}
                      max={question.sliderConfig.max}
                      step={question.sliderConfig.step}
                      value={(answer as number) || question.sliderConfig.min}
                      minLabel={question.sliderConfig.minLabel}
                      maxLabel={question.sliderConfig.maxLabel}
                      formatValue={question.sliderConfig.formatValue}
                      onChange={handleSlider}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-navy-950/95 backdrop-blur-sm px-10 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="text-cream-200/30 hover:text-cream-200/60 text-xs tracking-widest uppercase font-sans transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <div className="flex items-center gap-4">
            {question.type === "multi" && (
              <button
                onClick={handleSkip}
                className="text-cream-200/30 hover:text-cream-200/60 text-xs tracking-widest uppercase font-sans transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={question.type !== "multi" && !isAnswered()}
              className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {current === questions.length - 1 ? "Build my portfolio →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profiler;
