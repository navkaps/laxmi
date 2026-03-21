import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { UserProfile, PortfolioRecommendation, UserInfo } from "../types";
import axios from "axios";

const LOADING_STEPS = [
  "Analysing your investor profile...",
  "Assessing risk capacity and timeline...",
  "Selecting optimal asset classes...",
  "Constructing portfolio allocation...",
  "Running 30-year historical backtest...",
  "Preparing your recommendation...",
];

const TUNE_LABELS = [
  "Very Conservative",
  "Conservative",
  "Moderate",
  "Aggressive",
  "Very Aggressive",
];

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile as UserProfile;
  const userInfo = location.state?.userInfo as UserInfo;

  const [loading, setLoading] = useState(true);
  const [tuning, setTuning] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [tuneLevel, setTuneLevel] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = useCallback(
    (level: number, isInitial = false) => {
      if (!isInitial) setTuning(true);

      axios
        .post("http://localhost:4000/api/recommend", { profile, userInfo, tuneLevel: level })
        .then((res) => {
          setRecommendation(res.data);
          if (isInitial) setTuneLevel(res.data.profileLevel ?? 2);
          setLoading(false);
          setTuning(false);
        })
        .catch(() => {
          setError("We encountered an issue. Please try again.");
          setLoading(false);
          setTuning(false);
        });
    },
    [profile]
  );

  useEffect(() => {
    if (!profile) { navigate("/"); return; }

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1600);

    fetchRecommendation(2, true);
    return () => clearInterval(stepInterval);
  }, []);

  const handleTune = (level: number) => {
    setTuneLevel(level);
    fetchRecommendation(level);
  };

  if (!profile) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-10">
        <div className="w-8 h-8 border border-gold-500/40 flex items-center justify-center">
          <motion.div
            className="w-2 h-2 bg-gold-500 rotate-45"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        </div>
        <div className="h-5 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-cream-200/40 font-sans text-sm tracking-wide"
            >
              {LOADING_STEPS[loadingStep]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-1.5">
          {LOADING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`h-px w-8 transition-all duration-700 ${
                i <= loadingStep ? "bg-gold-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-6">
        <p className="text-cream-200/40 font-sans text-sm">{error}</p>
        <button onClick={() => navigate("/")} className="btn-ghost">Start over</button>
      </div>
    );
  }

  const { holdings, riskProfile, rationale, profileSummary, expectedAnnualReturn, volatility, keyStrengths, considerations, backtestData } = recommendation;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-navy-800 border border-white/10 px-4 py-3 text-left">
        <p className="label-overline mb-2 opacity-50">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="font-sans text-xs mb-0.5" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">${entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  };

  const CRASH_YEARS = [2000, 2008, 2020, 2022];

  return (
    <div className="min-h-screen bg-navy-950 pb-24">
      {/* Header */}
      <div className="border-b border-white/5 py-16 px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="label-overline opacity-40 block mb-4">
              {userInfo?.name ? `${userInfo.name}'s Portfolio` : "Your Portfolio"}
            </span>
            <h1 className="font-display text-5xl text-cream-50 mb-4">{riskProfile} Strategy</h1>
            <p className="text-cream-200/45 font-sans font-light text-lg max-w-2xl leading-relaxed">
              {profileSummary}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 mt-14 space-y-16">

        {/* Key metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-px bg-white/5"
        >
          {[
            { label: "Expected Annual Return", value: expectedAnnualReturn },
            { label: "Estimated Volatility", value: volatility },
            { label: "Portfolio Holdings", value: `${holdings.length} positions` },
          ].map((m) => (
            <div key={m.label} className="bg-navy-950 px-8 py-7">
              <div className="label-overline opacity-35 mb-2">{m.label}</div>
              <div className="font-display text-3xl text-gold-400">{m.value}</div>
            </div>
          ))}
        </motion.div>

        {/* PORTFOLIO TUNER — prominent, above holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="border border-gold-500/20 bg-gold-500/3 p-8 no-print"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="label-overline opacity-50 block mb-2">Adjust your portfolio</span>
              <h2 className="font-display text-2xl text-cream-50">
                Not quite right? Tune the risk level.
              </h2>
            </div>
            {tuning && <span className="text-cream-200/30 font-sans text-xs animate-pulse mt-1">Rebuilding...</span>}
          </div>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {TUNE_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => handleTune(i)}
                className={`py-3 px-2 text-center border transition-all duration-200 text-xs font-sans ${
                  tuneLevel === i
                    ? "border-gold-500 text-gold-400 bg-gold-500/10"
                    : "border-white/8 text-cream-200/30 hover:border-white/20 hover:text-cream-200/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="range" min={0} max={4} step={1} value={tuneLevel}
            onChange={(e) => handleTune(Number(e.target.value))}
            className="w-full mb-4"
            style={{ background: `linear-gradient(to right, #C9A96E ${(tuneLevel / 4) * 100}%, rgba(201,169,110,0.15) ${(tuneLevel / 4) * 100}%)` }}
          />
          <div className="flex justify-between">
            <span className="font-sans text-xs text-cream-200/20">Preserve capital</span>
            <span className="font-sans text-xs text-cream-200/20">Maximum growth</span>
          </div>
        </motion.div>

        {/* Holdings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-2xl text-cream-50 mb-8">Portfolio Allocation</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={riskProfile}
              initial={{ opacity: 0 }}
              animate={{ opacity: tuning ? 0.4 : 1 }}
              className="space-y-3"
            >
              {holdings.map((h, i) => (
                <motion.div
                  key={h.ticker}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-navy-800/50 border border-white/5 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="bg-navy-700/80 px-3 py-1 min-w-[60px] text-center">
                        <span className="font-sans text-sm font-medium text-gold-400 tracking-wider">
                          {h.ticker}
                        </span>
                      </div>
                      <div>
                        <div className="font-sans text-sm font-medium text-cream-100">{h.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="label-overline opacity-25 text-xs">{h.type}</span>
                          {h.sector && <span className="label-overline opacity-25 text-xs">· {h.sector}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-display text-2xl text-cream-50 flex-shrink-0">{h.allocation}%</span>
                  </div>
                  <div className="h-px bg-white/5 mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${h.allocation}%` }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                      className="h-full bg-gold-500/70"
                    />
                  </div>
                  <p className="text-cream-200/35 font-sans text-xs leading-relaxed">{h.rationale}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 30-year backtest */}
        {backtestData?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="font-display text-2xl text-cream-50 mb-2">30-Year Historical Backtest</h2>
            <p className="text-cream-200/25 font-sans text-xs mb-8">
              Hypothetical $10,000 investment · 1995–2024 · Actual S&P 500 annual returns · Dotcom crash, 2008 crisis, COVID, 2022 rate shock all included
            </p>
            <div className="bg-navy-800/30 border border-white/5 p-8">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={backtestData}>
                  <defs>
                    <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.04} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                  {CRASH_YEARS.map((yr) => (
                    <ReferenceLine
                      key={yr}
                      x={yr}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="3 3"
                      label={{ value: yr, fill: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "Inter" }}
                    />
                  ))}
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "rgba(253,250,244,0.25)", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false} tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "rgba(253,250,244,0.25)", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false} tickLine={false} width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="portfolioValue" name="This portfolio"
                    stroke="#C9A96E" strokeWidth={1.5} fill="url(#pgGrad)" />
                  <Area type="monotone" dataKey="benchmarkValue" name="S&P 500"
                    stroke="rgba(255,255,255,0.25)" strokeWidth={1}
                    fill="url(#bmGrad)" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Rationale + strengths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="grid grid-cols-2 gap-8"
        >
          <div className="card-dark">
            <h3 className="label-overline mb-6 opacity-50">Why this portfolio</h3>
            <p className="font-sans text-sm text-cream-200/55 leading-relaxed">{rationale}</p>
          </div>
          <div className="space-y-6">
            <div className="card-dark">
              <h3 className="label-overline mb-4 opacity-50">Key strengths</h3>
              <ul className="space-y-3">
                {keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/55 leading-relaxed">
                    <span className="text-gold-500 mt-0.5 flex-shrink-0 text-base leading-none">—</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark">
              <h3 className="label-overline mb-4 opacity-50">Things to consider</h3>
              <ul className="space-y-3">
                {considerations.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/40 leading-relaxed">
                    <span className="text-cream-200/20 mt-0.5 flex-shrink-0 text-base leading-none">—</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* PORTFOLIO TUNER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="border border-gold-500/15 bg-navy-800/30 p-10"
        >
          <div className="mb-8">
            <span className="label-overline opacity-50 block mb-3">Tune your portfolio</span>
            <h2 className="font-display text-2xl text-cream-50 mb-2">Adjust your risk and return</h2>
            <p className="text-cream-200/35 font-sans text-sm">
              Not quite right? Slide to a different risk level and we'll rebuild the portfolio instantly.
            </p>
          </div>

          {/* Preset buttons */}
          <div className="grid grid-cols-5 gap-2 mb-8">
            {TUNE_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => handleTune(i)}
                className={`py-3 px-2 text-center border transition-all duration-200 text-xs font-sans ${
                  tuneLevel === i
                    ? "border-gold-500 text-gold-400 bg-gold-500/8"
                    : "border-white/8 text-cream-200/30 hover:border-white/20 hover:text-cream-200/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="px-2">
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={tuneLevel}
              onChange={(e) => handleTune(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #C9A96E ${(tuneLevel / 4) * 100}%, rgba(201,169,110,0.15) ${(tuneLevel / 4) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-3">
              <span className="font-sans text-xs text-cream-200/25">Preserve capital</span>
              <span className="font-sans text-xs text-cream-200/25">Maximum growth</span>
            </div>
          </div>

          {/* Current level stats */}
          {recommendation.allProfiles && (
            <div className="mt-8 flex gap-6">
              <div>
                <div className="label-overline opacity-25 mb-1">Selected level</div>
                <div className="font-display text-lg text-gold-400">{TUNE_LABELS[tuneLevel]}</div>
              </div>
              {recommendation.allProfiles[tuneLevel] && (
                <>
                  <div>
                    <div className="label-overline opacity-25 mb-1">Expected return</div>
                    <div className="font-sans text-sm text-cream-100">
                      {recommendation.allProfiles[tuneLevel].expectedAnnualReturn}
                    </div>
                  </div>
                  <div>
                    <div className="label-overline opacity-25 mb-1">Volatility</div>
                    <div className="font-sans text-sm text-cream-100">
                      {recommendation.allProfiles[tuneLevel].volatility}
                    </div>
                  </div>
                </>
              )}
              {tuning && (
                <div className="flex items-end pb-0.5">
                  <span className="text-cream-200/30 font-sans text-xs animate-pulse">Rebuilding portfolio...</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex gap-4 no-print">
          <button
            onClick={() => window.print()}
            className="btn-primary"
          >
            Download report
          </button>
          <button onClick={() => navigate("/start")} className="btn-ghost">
            Start a new profile
          </button>
          <button onClick={() => navigate("/assess")} className="btn-ghost">
            Assess existing portfolio
          </button>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/5 pt-8">
          <p className="text-cream-200/15 font-sans text-xs leading-relaxed max-w-3xl">
            This recommendation is generated for informational and educational purposes only. It does not constitute financial advice, an offer to sell, or a solicitation to buy any security. Past performance is not indicative of future results. All backtested data is hypothetical. Always consult a licensed financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;
