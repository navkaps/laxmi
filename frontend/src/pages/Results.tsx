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
        .post(`${process.env.REACT_APP_API_URL}/api/recommend`, { profile, userInfo, tuneLevel: level })
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
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-6 px-6">
        <div className="alert-error max-w-sm text-center">{error || "Something went wrong."}</div>
        <button onClick={() => navigate("/")} className="btn-ghost">Start over</button>
      </div>
    );
  }

  const { holdings, riskProfile, rationale, profileSummary, expectedAnnualReturn, volatility, keyStrengths, considerations, backtestData } = recommendation;

  // Compute projected value from initial amount + monthly contributions
  const computeProjection = (): string | null => {
    const initial = Number(profile.initial_amount);
    const monthly = Number(profile.monthly_contribution) || 0;
    const years = Number(profile.timeline);
    if (!initial || !years) return null;
    const match = expectedAnnualReturn.match(/(\d+(?:\.\d+)?)[–\-](\d+(?:\.\d+)?)/);
    if (!match) return null;
    const rate = (parseFloat(match[1]) + parseFloat(match[2])) / 2 / 100;
    const monthlyRate = rate / 12;
    const months = years * 12;
    const fv = initial * Math.pow(1 + rate, years) +
      (monthly > 0 ? monthly * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate : 0);
    const symbol = userInfo?.country === "IN" ? "₹" : "$";
    if (fv >= 10000000) return `${symbol}${(fv / 1000000).toFixed(0)}M+`;
    if (fv >= 1000000) return `${symbol}${(fv / 1000000).toFixed(1)}M`;
    return `${symbol}${Math.round(fv / 1000).toLocaleString()}K`;
  };
  const projection = computeProjection();

  const acctMap: Record<string, { title: string; guidance: string }> = {
    roth_ira:       { title: "Roth IRA placement strategy", guidance: "Your Roth IRA grows tax-free — ideal for your highest-growth holdings (tech ETFs, small caps). Allocate your most aggressive positions here. Bonds and dividend payers can sit in a taxable account instead." },
    traditional_ira:{ title: "Traditional IRA placement strategy", guidance: "Tax-deferred growth means income-generating assets (bonds, REITs, dividend ETFs) belong here — you defer the tax until withdrawal. Hold growth-oriented ETFs in a Roth if you have one." },
    "401k":         { title: "401(k) placement strategy", guidance: "Maximise your employer match first — it's an instant 50–100% return. Within the 401(k), favour the lowest-cost index funds available. Hold any alternative assets or individual stocks in a separate taxable or Roth account." },
    taxable:        { title: "Taxable account strategy", guidance: "In a taxable account, tax efficiency is critical. Favour low-turnover index ETFs (VTI, VXUS) over actively managed funds. Consider tax-loss harvesting annually. Hold bonds in a tax-advantaged account if possible — bond income is taxed as ordinary income." },
    isa:            { title: "ISA placement strategy", guidance: "Your Stocks & Shares ISA shelters all growth and income from UK tax — maximise your annual £20,000 allowance. Hold your highest-growth and dividend-paying assets here first." },
    sipp:           { title: "SIPP placement strategy", guidance: "Your SIPP receives tax relief on contributions (up to 60% effective relief for higher-rate taxpayers). Ideal for long-term growth assets. Remember the 25% tax-free lump sum at retirement — plan for this in your asset mix." },
    ppf:            { title: "PPF placement strategy", guidance: "PPF provides guaranteed 7.1% tax-free returns — use your full ₹1.5L annual limit. It's your lowest-risk, highest-certainty holding. Let equity ETFs (NIFTYBEES, MIDFTY) handle the growth component of your portfolio." },
    demat:          { title: "Demat account strategy", guidance: "Your equity holdings in a demat account are subject to LTCG above ₹1 lakh. Hold ETFs for at least 12 months to qualify for 10% LTCG vs 15% STCG. Consider ELSS funds for Section 80C benefits alongside your direct equity." },
  };
  const accountGuidance = profile?.account_type && profile.account_type !== "mixed"
    ? acctMap[String(profile.account_type)] ?? null
    : null;

  type TransitionAction = 'SELL' | 'TRIM' | 'KEEP' | 'ADD' | 'BUY';
  interface TransitionItem {
    ticker: string;
    currentAlloc: number;
    targetAlloc: number;
    action: TransitionAction;
  }

  const computeTransitionPlan = (current: { ticker: string; allocation: number }[], recommended: typeof holdings): TransitionItem[] => {
    const norm = (t: string) => t.toUpperCase().replace(/['.]/g, "");
    const currentMap = new Map(current.map(h => [norm(h.ticker), h.allocation]));
    const recMap = new Map(recommended.map(h => [norm(h.ticker), h.allocation]));
    const items: TransitionItem[] = [];
    const processed = new Set<string>();

    for (const [ticker, curAlloc] of Array.from(currentMap.entries())) {
      const targetAlloc = recMap.get(ticker) ?? 0;
      let action: TransitionAction;
      if (targetAlloc === 0) action = 'SELL';
      else if (curAlloc > targetAlloc + 3) action = 'TRIM';
      else if (targetAlloc > curAlloc + 3) action = 'ADD';
      else action = 'KEEP';
      items.push({ ticker, currentAlloc: curAlloc, targetAlloc, action });
      processed.add(ticker);
    }

    for (const h of recommended) {
      const t = norm(h.ticker);
      if (!processed.has(t)) {
        items.push({ ticker: h.ticker, currentAlloc: 0, targetAlloc: h.allocation, action: 'BUY' });
      }
    }

    const order: Record<TransitionAction, number> = { SELL: 0, TRIM: 1, KEEP: 2, ADD: 3, BUY: 4 };
    return items.sort((a, b) => order[a.action] - order[b.action]);
  };

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
      {/* Logo */}
      {/* Logo — Option D: ascending staircase mark */}
      <div className="fixed top-6 left-10 z-50 flex items-center gap-3">
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g-d" x1="0" y1="24" x2="30" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1"/><stop offset="1" stopColor="#FB7185"/>
            </linearGradient>
          </defs>
          <path d="M2 22 L2 16 L10 16 L10 10 L18 10 L18 4 L28 4" stroke="url(#g-d)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-display text-lg font-bold tracking-tight gradient-text">Laxmi</span>
        <span className="hidden sm:inline font-sans text-xs text-white/25 tracking-wide border-l border-white/10 pl-2 ml-1">Your AI wealth advisor</span>
      </div>

      {/* Header */}
      <div className="border-b border-white/5 py-16 px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="label-overline block mb-4 opacity-70">
              {userInfo?.name ? `${userInfo.name}'s Portfolio` : "Your Portfolio"}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-4">
              <span className="gradient-text">{riskProfile}</span> Strategy
            </h1>
            <p className="text-white/65 font-sans font-light text-base md:text-lg max-w-2xl leading-relaxed">
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/8"
        >
          {[
            { label: "Expected Annual Return", value: expectedAnnualReturn },
            { label: "Estimated Volatility", value: volatility },
            ...(projection && profile.timeline ? [{ label: `Projected value in ${profile.timeline} years`, value: projection }] : [{ label: "Portfolio Holdings", value: `${holdings.length} positions` }]),
          ].map((m) => (
            <div key={m.label} className="bg-navy-950 px-8 py-7">
              <div className="label-overline mb-2 opacity-70">{m.label}</div>
              <div className="font-display text-2xl md:text-3xl gradient-text">{m.value}</div>
            </div>
          ))}
        </motion.div>

        {/* PORTFOLIO TUNER — prominent, above holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="border border-gold-500/25 bg-gold-500/5 p-8 no-print"
          style={{ boxShadow: "0 0 40px rgba(99,102,241,0.08)" }}
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
                disabled={tuning}
                className={`py-3 px-2 text-center border transition-all duration-200 text-xs font-sans disabled:opacity-40 disabled:cursor-not-allowed ${
                  tuneLevel === i
                    ? "border-gold-500 text-gold-400 bg-gold-500/10"
                    : "border-white/15 text-cream-200/40 hover:border-white/30 hover:text-cream-200/65"
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
            style={{ background: `linear-gradient(to right, #6366F1 ${(tuneLevel / 4) * 100}%, rgba(255,255,255,0.10) ${(tuneLevel / 4) * 100}%)` }}
          />
          <div className="flex justify-between">
            <span className="font-sans text-xs text-cream-200/20">Preserve capital</span>
            <span className="font-sans text-xs text-cream-200/20">Maximum growth</span>
          </div>
        </motion.div>

        {/* Holdings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-xl md:text-2xl text-cream-50 mb-8">Portfolio Allocation</h2>
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
                  className="bg-navy-800/50 border border-white/10 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="bg-navy-700/80 px-3 py-1 min-w-[60px] text-center">
                        <span className="font-sans text-sm font-semibold tracking-wider gradient-text">
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
                      className="h-full"
                      style={{ background: "linear-gradient(to right, #6366F1, #8B5CF6)" }}
                    />
                  </div>
                  <p className="text-cream-200/65 font-sans text-xs leading-relaxed">{h.rationale}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Account placement guidance — shown prominently right after holdings */}
        {accountGuidance && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="border border-gold-500/20 bg-gold-500/3 px-8 py-7"
          >
            <h3 className="label-overline mb-3 opacity-50">{accountGuidance.title}</h3>
            <p className="font-sans text-sm text-cream-200/65 leading-relaxed max-w-3xl">{accountGuidance.guidance}</p>
          </motion.div>
        )}

        {/* Transition Plan */}
        {userInfo?.currentHoldings && userInfo.currentHoldings.length > 0 && (() => {
          const plan = computeTransitionPlan(userInfo.currentHoldings!, holdings);
          const actionMeta: Record<TransitionAction, { label: string; color: string; bg: string }> = {
            SELL:  { label: "Sell all",    color: "text-red-400/80",    bg: "bg-red-400/8 border-red-400/20" },
            TRIM:  { label: "Trim",        color: "text-amber-400/80",  bg: "bg-amber-400/8 border-amber-400/20" },
            KEEP:  { label: "Keep",        color: "text-cream-200/45",  bg: "bg-white/4 border-white/8" },
            ADD:   { label: "Add more",    color: "text-emerald-400/80",bg: "bg-emerald-400/6 border-emerald-400/20" },
            BUY:   { label: "Buy",         color: "text-emerald-400/80",bg: "bg-emerald-400/6 border-emerald-400/20" },
          };
          return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="font-display text-2xl text-cream-50 mb-2">Your Transition Plan</h2>
              <p className="font-sans text-sm text-cream-200/35 mb-8 leading-relaxed">
                Exactly what to do with your existing portfolio to reach this allocation.
              </p>
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-5 mb-3">
                  <div className="col-span-3"><span className="label-overline opacity-20 text-xs">Ticker</span></div>
                  <div className="col-span-3"><span className="label-overline opacity-20 text-xs">Action</span></div>
                  <div className="col-span-2 text-right"><span className="label-overline opacity-20 text-xs">Current</span></div>
                  <div className="col-span-1 text-center"><span className="label-overline opacity-20 text-xs">→</span></div>
                  <div className="col-span-2 text-right"><span className="label-overline opacity-20 text-xs">Target</span></div>
                </div>
                {plan.map((item, i) => {
                  const meta = actionMeta[item.action];
                  return (
                    <motion.div
                      key={item.ticker}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      className={`grid grid-cols-12 gap-4 items-center border px-5 py-3.5 ${meta.bg}`}
                    >
                      <div className="col-span-3">
                        <span className="font-sans text-sm font-medium text-cream-100 tracking-wider">{item.ticker}</span>
                      </div>
                      <div className="col-span-3">
                        <span className={`font-sans text-xs font-medium ${meta.color}`}>{meta.label}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-sans text-sm text-cream-200/50">
                          {item.currentAlloc > 0 ? `${item.currentAlloc}%` : "—"}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-cream-200/20 font-sans text-xs">→</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`font-sans text-sm font-medium ${item.targetAlloc > 0 ? "text-cream-50" : "text-cream-200/30"}`}>
                          {item.targetAlloc > 0 ? `${item.targetAlloc}%` : "0%"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <p className="font-sans text-xs text-cream-200/18 mt-6 leading-relaxed">
                Execute trades in order: sell positions first to free capital, then purchase new holdings. Consult a licensed financial advisor before making investment decisions.
              </p>
            </motion.div>
          );
        })()}

        {/* 30-year backtest */}
        {backtestData?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="font-display text-xl md:text-2xl text-cream-50 mb-2">30-Year Historical Backtest</h2>
            <p className="text-cream-200/25 font-sans text-xs mb-8">
              Hypothetical $10,000 lump-sum · static allocation · 1995–2024 · no rebalancing, contributions, or withdrawals assumed · includes dotcom crash, 2008 crisis, COVID, 2022 rate shock · past performance does not predict future results
            </p>
            <div className="bg-navy-800/30 border border-white/5 p-8">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={backtestData}>
                  <defs>
                    <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
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
                    stroke="#818CF8" strokeWidth={2} fill="url(#pgGrad)" />
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
            <p className="font-sans text-sm text-cream-200/65 leading-relaxed">{rationale}</p>
          </div>
          <div className="space-y-6">
            <div className="card-dark">
              <h3 className="label-overline mb-4 opacity-50">Key strengths</h3>
              <ul className="space-y-3">
                {keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/65 leading-relaxed">
                    <span className="text-gold-500 mt-0.5 flex-shrink-0 text-base leading-none">—</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark">
              <h3 className="label-overline mb-4 opacity-50">Things to consider</h3>
              <ul className="space-y-3">
                {considerations.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/65 leading-relaxed">
                    <span className="text-cream-200/20 mt-0.5 flex-shrink-0 text-base leading-none">—</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
