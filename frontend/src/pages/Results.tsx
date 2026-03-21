import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { UserProfile, PortfolioRecommendation } from "../types";
import axios from "axios";

const LOADING_STEPS = [
  "Analyzing your investor profile...",
  "Assessing risk tolerance and timeline...",
  "Selecting optimal asset classes...",
  "Building portfolio allocation...",
  "Running 30-year backtest...",
  "Preparing your recommendation...",
];

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile as UserProfile;

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      navigate("/profile");
      return;
    }

    // Cycle through loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1800);

    // Fetch recommendation
    axios
      .post("http://localhost:4000/api/recommend", { profile })
      .then((res) => {
        setRecommendation(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("We encountered an issue building your portfolio. Please try again.");
        setLoading(false);
      })
      .finally(() => clearInterval(stepInterval));

    return () => clearInterval(stepInterval);
  }, []);

  if (!profile) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border border-gold-500/40 flex items-center justify-center mb-10">
          <div className="w-2 h-2 bg-gold-500 rotate-45 animate-pulse" />
        </div>
        <div className="h-6">
          <motion.p
            key={loadingStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-cream-200/50 font-sans text-sm tracking-wide"
          >
            {LOADING_STEPS[loadingStep]}
          </motion.p>
        </div>
        <div className="mt-10 flex gap-1">
          {LOADING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 w-8 transition-all duration-500 ${
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
        <p className="text-cream-200/50 font-sans">{error}</p>
        <button onClick={() => navigate("/profile")} className="btn-ghost">
          Start over
        </button>
      </div>
    );
  }

  const { holdings, riskProfile, rationale, profileSummary, expectedAnnualReturn, volatility, keyStrengths, considerations, backtestData } = recommendation;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-800 border border-white/10 px-4 py-3">
          <p className="label-overline mb-2">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="font-sans text-xs" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-navy-950 pb-24">
      {/* Header */}
      <div className="border-b border-white/5 py-16 px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="label-overline opacity-50 block mb-4">Your Portfolio</span>
            <h1 className="font-display text-5xl text-cream-50 mb-4">{riskProfile} Strategy</h1>
            <p className="text-cream-200/50 font-sans font-light text-lg max-w-2xl leading-relaxed">
              {profileSummary}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10 mt-16 space-y-16">

        {/* Key metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-px bg-white/5"
        >
          {[
            { label: "Expected Annual Return", value: expectedAnnualReturn },
            { label: "Estimated Volatility", value: volatility },
            { label: "Portfolio Holdings", value: `${holdings.length} assets` },
          ].map((m) => (
            <div key={m.label} className="bg-navy-950 px-8 py-7">
              <div className="label-overline opacity-40 mb-2">{m.label}</div>
              <div className="font-display text-3xl text-gold-400">{m.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Holdings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-2xl text-cream-50 mb-8">Portfolio Allocation</h2>
          <div className="space-y-3">
            {holdings.map((h, i) => (
              <motion.div
                key={h.ticker}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="bg-navy-800/60 border border-white/5 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-navy-700 px-3 py-1">
                      <span className="font-sans text-sm font-medium text-gold-400 tracking-wider">
                        {h.ticker}
                      </span>
                    </div>
                    <div>
                      <div className="font-sans text-sm font-medium text-cream-100">{h.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="label-overline opacity-30 text-xs">{h.type}</span>
                        {h.sector && <span className="label-overline opacity-30 text-xs">· {h.sector}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl text-cream-50">{h.allocation}%</span>
                  </div>
                </div>

                {/* Allocation bar */}
                <div className="mt-3 mb-4">
                  <div className="h-0.5 bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${h.allocation}%` }}
                      transition={{ delay: 0.4 + i * 0.07, duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-gold-500"
                    />
                  </div>
                </div>

                <p className="text-cream-200/40 font-sans text-xs leading-relaxed">{h.rationale}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Backtest chart */}
        {backtestData && backtestData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-2xl text-cream-50 mb-2">30-Year Backtest</h2>
            <p className="text-cream-200/30 font-sans text-xs mb-8">
              Hypothetical $10,000 initial investment · Past performance is not indicative of future results
            </p>
            <div className="bg-navy-800/40 border border-white/5 p-8">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={backtestData}>
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "rgba(253,250,244,0.3)", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "rgba(253,250,244,0.3)", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="portfolioValue"
                    name="Your portfolio"
                    stroke="#C9A96E"
                    strokeWidth={1.5}
                    fill="url(#portfolioGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="benchmarkValue"
                    name="S&P 500"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                    fill="url(#benchmarkGrad)"
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Rationale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-8"
        >
          <div className="card-dark">
            <h3 className="label-overline mb-6">Why this portfolio</h3>
            <p className="font-sans text-sm text-cream-200/60 leading-relaxed">{rationale}</p>
          </div>
          <div className="space-y-8">
            <div className="card-dark">
              <h3 className="label-overline mb-4">Key strengths</h3>
              <ul className="space-y-2">
                {keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-sm text-cream-200/60">
                    <span className="text-gold-500 mt-0.5 flex-shrink-0">—</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark">
              <h3 className="label-overline mb-4">Things to consider</h3>
              <ul className="space-y-2">
                {considerations.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-sm text-cream-200/60">
                    <span className="text-cream-200/20 mt-0.5 flex-shrink-0">—</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="border-t border-white/5 pt-8">
          <p className="text-cream-200/20 font-sans text-xs leading-relaxed max-w-3xl">
            This recommendation is generated for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results. Always consult a licensed financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;
