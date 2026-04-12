import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { questions, ACCOUNT_TYPE_OPTIONS, getCurrencyConfig } from "../data/questions";
import { UserProfile } from "../types";
import OptionCard from "../components/ui/OptionCard";
import SliderInput from "../components/ui/SliderInput";

const Profiler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = location.state?.userInfo;

  const [current, setCurrent] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);

  const country = userInfo?.country || "US";
  const currency = getCurrencyConfig(country);

  // Inject country-specific options and localised currency into questions
  const localQuestions = questions.map((q) => {
    if (q.id === "account_type") {
      return { ...q, options: ACCOUNT_TYPE_OPTIONS[country] || ACCOUNT_TYPE_OPTIONS["OTHER"] };
    }
    if ((q.id === "initial_amount" || q.id === "monthly_contribution" || q.id === "target_value") && q.sliderConfig) {
      const f = currency.factor;
      const sym = currency.symbol;
      if (q.id === "initial_amount") {
        return {
          ...q, sliderConfig: {
            ...q.sliderConfig,
            min: Math.round(5000 * f),
            max: Math.round(10000000 * f),
            step: Math.round(5000 * f),
            minLabel: `${sym}${(5000 * f).toLocaleString()}`,
            maxLabel: `${sym}10M+`,
            formatValue: (v: number) => {
              const m = 1000000 * f;
              if (v >= m * 10) return `${sym}10M+`;
              if (v >= m) return `${sym}${(v / m).toFixed(1)}M`;
              return `${sym}${Math.round(v / (1000 * f))}K`;
            },
          },
        };
      }
      if (q.id === "monthly_contribution") {
        return {
          ...q, sliderConfig: {
            ...q.sliderConfig,
            min: 0,
            max: Math.round(20000 * f),
            step: Math.round(250 * f),
            minLabel: `${sym}0`,
            maxLabel: `${sym}${(20000 * f).toLocaleString()}`,
            formatValue: (v: number) =>
              v === 0 ? "No monthly addition" : `${sym}${Math.round(v).toLocaleString()} / month`,
          },
        };
      }
      if (q.id === "target_value") {
        return {
          ...q, sliderConfig: {
            ...q.sliderConfig,
            min: Math.round(100000 * f),
            max: Math.round(10000000 * f),
            step: Math.round(50000 * f),
            minLabel: `${sym}${(100000 * f / 1000).toFixed(0)}K`,
            maxLabel: `${sym}10M+`,
            formatValue: (v: number) => {
              const m = 1000000 * f;
              if (v >= m * 10) return `${sym}10M+`;
              if (v >= m) return `${sym}${(v / m).toFixed(1)}M`;
              return `${sym}${(v / (1000 * f)).toFixed(0)}K`;
            },
          },
        };
      }
    }
    return q;
  });

  const question = localQuestions[current];
  const progress = (current / localQuestions.length) * 100;
  const answer = profile[question.id];

  const isAnswered = (): boolean => {
    if (question.type === "slider") return answer !== undefined && answer !== null;
    if (question.type === "multi") return true; // always skippable
    if (question.type === "textarea") return true; // always skippable
    if (question.type === "single") {
      if (!answer) return false;
      if (answer === "other") return (otherText[question.id] || "").trim().length > 0;
      return true;
    }
    return false;
  };

  const handleSingle = (value: string) => {
    setProfile((p) => ({ ...p, [question.id]: value }));
  };

  const handleSlider = (value: number) => {
    setProfile((p) => ({ ...p, [question.id]: value }));
  };

  const handleMulti = (value: string) => {
    const cur = (answer as string[]) || [];
    const updated = cur.includes(value)
      ? cur.filter((v) => v !== value)
      : [...cur, value];
    setProfile((p) => ({ ...p, [question.id]: updated }));
  };

  const handleNext = () => {
    // For "other" option, save the text as the answer
    if (answer === "other" && otherText[question.id]) {
      setProfile((p) => ({ ...p, [question.id]: `other:${otherText[question.id]}` }));
    }
    if (current < localQuestions.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    } else {
      navigate("/results", { state: { profile, userInfo } });
    }
  };

  const handleBack = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  };

  // Initialize slider defaults
  useEffect(() => {
    if (question.type === "slider" && question.sliderConfig && profile[question.id] === undefined) {
      const { min, max } = question.sliderConfig;
      const defaultVal = question.id === "age" ? 35 : Math.round((min + max) / 3);
      setProfile((p) => ({ ...p, [question.id]: defaultVal }));
    }
  }, [current]);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
  };

  const firstName = userInfo?.name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/5 z-50">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(to right, #6366F1, #8B5CF6)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-6 right-10 z-50">
        <span className="label-overline opacity-30">
          {current + 1} / {localQuestions.length}
        </span>
      </div>

      {/* Logo */}
      {/* Logo */}
      <div className="fixed top-6 left-10 z-50 flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g-logo" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4A843"/><stop offset="1" stopColor="#A07A35"/>
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="6" fill="url(#g-logo)"/>
          <path d="M14 20 L14 9 M10 13 L14 9 L18 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-display text-lg font-bold tracking-tight text-white">Plutus</span>
        <span className="hidden sm:inline font-sans text-xs text-white/50 tracking-wide border-l border-white/15 pl-2 ml-1">AI Wealth Advisory</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-28">
        <div className="w-full max-w-2xl">
          <motion.div
            key={`cat-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <span className="label-overline opacity-30">{question.category}</span>
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white mb-3 leading-tight">
                {current === 0 && firstName
                  ? `${firstName}, how old are you?`
                  : question.question}
              </h2>
              {question.subtext && (
                <p className="text-cream-200/65 font-sans text-sm mb-10 leading-relaxed max-w-lg">
                  {question.subtext}
                </p>
              )}

              {/* Answer input */}
              <div className="mt-8">
                {question.type === "single" && question.options && (
                  <div className="grid gap-3">
                    {question.options.map((opt) => (
                      <React.Fragment key={opt.value}>
                        <OptionCard
                          label={opt.label}
                          description={opt.description}
                          selected={
                            answer === opt.value ||
                            (opt.value === "other" && typeof answer === "string" && answer.startsWith("other:"))
                          }
                          onClick={() => handleSingle(opt.value)}
                        />
                        {/* Text input for "Other" */}
                        {opt.isOther &&
                          (answer === "other" ||
                            (typeof answer === "string" && answer.startsWith("other:"))) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="pl-9"
                            >
                              <input
                                autoFocus
                                type="text"
                                value={otherText[question.id] || ""}
                                onChange={(e) =>
                                  setOtherText((p) => ({
                                    ...p,
                                    [question.id]: e.target.value,
                                  }))
                                }
                                placeholder="Describe your goal..."
                                className="w-full bg-transparent border-b border-gold-500/40 py-3 font-sans text-sm text-cream-50 placeholder:text-cream-200/25 focus:outline-none focus:border-gold-500/70 transition-colors"
                              />
                            </motion.div>
                          )}
                      </React.Fragment>
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

                {question.type === "textarea" && (
                  <textarea
                    autoFocus
                    rows={4}
                    value={(answer as string) || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, [question.id]: e.target.value }))}
                    placeholder="Type anything — specific tickers to include or exclude, themes you care about, concentrations you want to avoid..."
                    className="w-full bg-transparent border border-white/10 rounded px-4 py-3 font-sans text-sm text-cream-50 placeholder:text-cream-200/25 focus:outline-none focus:border-gold-500/50 transition-colors resize-none leading-relaxed"
                  />
                )}

                {question.type === "slider" && question.sliderConfig && (
                  <div className="py-8 px-2">
                    <SliderInput
                      min={question.sliderConfig.min}
                      max={question.sliderConfig.max}
                      step={question.sliderConfig.step}
                      value={(answer as number) ?? question.sliderConfig.min}
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
            className="text-cream-200/25 hover:text-cream-200/60 text-xs tracking-widest uppercase font-sans transition-colors disabled:opacity-10 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <div className="flex items-center gap-4">
            {(question.type === "multi" || question.type === "textarea") && (
              <button
                onClick={handleNext}
                className="text-cream-200/30 hover:text-cream-200/60 text-xs tracking-widest uppercase font-sans transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isAnswered()}
              className="btn-primary disabled:opacity-25 disabled:cursor-not-allowed"
            >
              {current === localQuestions.length - 1 ? "Build my portfolio →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profiler;
