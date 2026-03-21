import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface ParsedHolding {
  ticker: string;
  allocation: number;
  name?: string;
}

interface Assessment {
  overallRisk: string;
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  sectorBreakdown: { sector: string; weight: number }[];
  suggestions: { action: string; detail: string }[];
  verdict: string;
}

type Tab = "upload" | "manual";

const ACCEPTED = ".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png";

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M10 13V4M10 4L7 7M10 4L13 7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" strokeLinecap="round"/>
  </svg>
);

const Assess: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedHoldings, setParsedHoldings] = useState<ParsedHolding[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [manualHoldings, setManualHoldings] = useState<ParsedHolding[]>([
    { ticker: "", allocation: 0 },
    { ticker: "", allocation: 0 },
    { ticker: "", allocation: 0 },
  ]);

  const handleFileDrop = (f: File) => {
    setFile(f);
    setParseError(null);
    setParsedHoldings([]);
    uploadAndParse(f);
  };

  const uploadAndParse = async (f: File) => {
    setParsing(true);
    const formData = new FormData();
    formData.append("file", f);
    try {
      const res = await axios.post("http://localhost:4000/api/parse-portfolio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.requiresAI) {
        setParseError("ai_required");
      } else if (res.data.holdings?.length > 0) {
        setParsedHoldings(res.data.holdings);
      } else {
        setParseError("no_data");
      }
    } catch {
      setParseError("error");
    } finally {
      setParsing(false);
    }
  };

  const handleAssess = async (holdings: ParsedHolding[]) => {
    setAssessing(true);
    try {
      const res = await axios.post("http://localhost:4000/api/assess", { holdings });
      setAssessment(res.data);
    } catch {
      // silent
    } finally {
      setAssessing(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 75 ? "#6ee7b7" : s >= 50 ? "#C9A96E" : "#f87171";

  const totalManual = manualHoldings.reduce((s, h) => s + (h.allocation || 0), 0);
  const manualValid =
    manualHoldings.some((h) => h.ticker.trim()) && Math.abs(totalManual - 100) <= 5;

  const activeHoldings =
    tab === "upload"
      ? parsedHoldings
      : manualHoldings.filter((h) => h.ticker.trim() && h.allocation > 0);

  if (assessing) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-10 h-10 border border-gold-500/30 border-t-gold-500 rounded-full"
        />
        <p className="text-cream-200/35 font-sans text-sm tracking-widest uppercase">
          Analysing portfolio
        </p>
      </div>
    );
  }

  if (assessment) {
    const scoreCol = scoreColor(assessment.score);
    return (
      <div className="min-h-screen bg-navy-950 pb-24">
        <div className="border-b border-white/5 py-16 px-10">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <span className="label-overline opacity-35 block mb-4">Portfolio Analysis</span>
              <h1 className="font-display text-5xl text-cream-50 mb-4">
                {assessment.overallRisk} Portfolio
              </h1>
              <p className="text-cream-200/40 font-sans font-light text-lg max-w-2xl leading-relaxed">
                {assessment.summary}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-10 mt-14 space-y-14">
          {/* Score row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-px bg-white/5"
          >
            {[
              {
                label: "Portfolio Score",
                value: (
                  <span className="font-display text-5xl" style={{ color: scoreCol }}>
                    {assessment.score}
                    <span className="text-2xl text-cream-200/20">/100</span>
                  </span>
                ),
              },
              { label: "Risk Profile", value: <span className="font-display text-3xl text-gold-400">{assessment.overallRisk}</span> },
              { label: "Positions Reviewed", value: <span className="font-display text-3xl text-cream-50">{activeHoldings.length}</span> },
            ].map((m) => (
              <div key={m.label} className="bg-navy-950 px-8 py-7">
                <div className="label-overline opacity-30 mb-3">{m.label}</div>
                {m.value}
              </div>
            ))}
          </motion.div>

          {/* Sector concentration */}
          {assessment.sectorBreakdown?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-display text-2xl text-cream-50 mb-8">Sector Concentration</h2>
              <div className="space-y-5">
                {assessment.sectorBreakdown.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="font-sans text-xs text-cream-200/45">{s.sector}</span>
                      <span className={`font-sans text-xs font-medium ${s.weight > 40 ? "text-red-400/70" : "text-cream-200/45"}`}>{s.weight}%</span>
                    </div>
                    <div className="h-px bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(s.weight, 100)}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.7, ease: "easeOut" }}
                        className={`h-full ${s.weight > 40 ? "bg-red-400/50" : "bg-gold-500/60"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Strengths + risks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-8"
          >
            <div className="card-dark">
              <h3 className="label-overline mb-6 opacity-35">Strengths</h3>
              <ul className="space-y-4">
                {assessment.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/55 leading-relaxed">
                    <span className="text-gold-500 flex-shrink-0 mt-0.5 text-sm leading-none">—</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark">
              <h3 className="label-overline mb-6 opacity-35">Risks & Weaknesses</h3>
              <ul className="space-y-4">
                {assessment.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/40 leading-relaxed">
                    <span className="text-red-400/50 flex-shrink-0 mt-0.5 text-sm leading-none">—</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Recommended actions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="font-display text-2xl text-cream-50 mb-8">Recommended Actions</h2>
            <div className="space-y-3">
              {assessment.suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  className="bg-navy-800/40 border border-white/5 p-6 flex gap-6"
                >
                  <span className="font-display text-xl text-gold-500/30 flex-shrink-0 w-6 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="font-sans text-sm font-medium text-cream-100 mb-1">{s.action}</p>
                    <p className="font-sans text-xs text-cream-200/40 leading-relaxed">{s.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Verdict */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="border-l-2 border-gold-500/30 pl-8 py-2"
          >
            <h3 className="label-overline mb-3 opacity-35">Verdict</h3>
            <p className="font-display text-xl text-cream-50 leading-relaxed">{assessment.verdict}</p>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-4 no-print">
            <button onClick={() => window.print()} className="btn-primary">Download report</button>
            <button onClick={() => setAssessment(null)} className="btn-ghost">Analyse another</button>
            <button onClick={() => navigate("/start")} className="btn-ghost">Build optimised portfolio →</button>
          </div>

          <div className="border-t border-white/5 pt-8">
            <p className="text-cream-200/15 font-sans text-xs leading-relaxed max-w-3xl">
              This analysis is for informational purposes only and does not constitute financial advice. Consult a licensed financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 pb-24">
      {/* Header */}
      <div className="border-b border-white/5 py-16 px-10">
        <div className="max-w-4xl mx-auto">
          <span className="label-overline opacity-35 block mb-4">Portfolio Analysis</span>
          <h1 className="font-display text-5xl text-cream-50 mb-4 leading-tight">
            How healthy is<br />your portfolio?
          </h1>
          <p className="text-cream-200/40 font-sans font-light text-lg max-w-lg leading-relaxed">
            Upload your holdings or enter them manually. We'll score the portfolio, flag concentration risks, and tell you exactly what to fix.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-10 mt-14">
        {/* Tab switcher */}
        <div className="flex border-b border-white/8 mb-10">
          {(["upload", "manual"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-4 mr-10 font-sans text-xs tracking-widest uppercase transition-colors relative ${
                tab === t ? "text-cream-50" : "text-cream-200/30 hover:text-cream-200/60"
              }`}
            >
              {t === "upload" ? "Upload file" : "Enter manually"}
              {tab === t && (
                <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-px bg-gold-500" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Upload tab ── */}
          {tab === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {!file && !parsing ? (
                <>
                  {/* Drop zone — clean, minimal */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                    onClick={() => fileRef.current?.click()}
                    className={`relative cursor-pointer transition-all duration-300 group ${
                      dragOver ? "bg-gold-500/6 border-gold-500/50" : "bg-navy-800/20 hover:bg-navy-800/40 border-white/8 hover:border-white/15"
                    } border px-10 py-14 flex flex-col items-center gap-5`}
                  >
                    <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }} />

                    <div className={`w-10 h-10 border flex items-center justify-center transition-colors ${dragOver ? "border-gold-500/60 text-gold-400" : "border-white/15 text-cream-200/30 group-hover:border-white/25 group-hover:text-cream-200/50"}`}>
                      <UploadIcon />
                    </div>

                    <div className="text-center">
                      <p className="font-sans text-sm text-cream-200/50 mb-1">
                        Drop your file here, or <span className="text-gold-400">browse</span>
                      </p>
                      <p className="font-sans text-xs text-cream-200/20">
                        CSV · Excel · PDF · Screenshot
                      </p>
                    </div>
                  </div>

                  {/* Format guide — minimal, inline */}
                  <div className="mt-5 grid grid-cols-4 gap-3">
                    {[
                      { label: "CSV", sub: "Best option", note: "Ticker + allocation columns" },
                      { label: "Excel", sub: "Brokerage exports", note: ".xlsx or .xls" },
                      { label: "PDF", sub: "Account statements", note: "Text-based PDFs" },
                      { label: "Screenshot", sub: "Requires AI key", note: "Enable with Claude API", dim: true },
                    ].map((f) => (
                      <div key={f.label} className={`border border-white/5 px-4 py-4 ${f.dim ? "opacity-40" : ""}`}>
                        <div className="font-sans text-xs font-medium text-cream-100 mb-0.5">{f.label}</div>
                        <div className="font-sans text-xs text-gold-500/60 mb-1">{f.sub}</div>
                        <div className="font-sans text-xs text-cream-200/25">{f.note}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : parsing ? (
                <div className="flex items-center gap-5 py-14 justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-7 h-7 border border-gold-500/30 border-t-gold-500 rounded-full"
                  />
                  <span className="text-cream-200/35 font-sans text-sm">Reading {file?.name}...</span>
                </div>
              ) : (
                /* File parsed */
                <div>
                  {/* File confirmed */}
                  <div className="flex items-center justify-between border border-white/8 bg-navy-800/30 px-6 py-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 border border-gold-500/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-gold-500 rotate-45" />
                      </div>
                      <div>
                        <div className="font-sans text-sm text-cream-100">{file?.name}</div>
                        <div className="font-sans text-xs text-cream-200/30 mt-0.5">
                          {parsedHoldings.length > 0 ? `${parsedHoldings.length} holdings extracted` : "No structured data found"}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setFile(null); setParsedHoldings([]); setParseError(null); }}
                      className="text-cream-200/25 hover:text-cream-200/60 font-sans text-xs transition-colors">
                      Remove
                    </button>
                  </div>

                  {/* AI required */}
                  {parseError === "ai_required" && (
                    <div className="border border-gold-500/15 bg-gold-500/4 px-6 py-5 mb-8">
                      <p className="font-sans text-sm text-gold-400 mb-1">Image parsing requires the Claude API</p>
                      <p className="font-sans text-xs text-cream-200/40 leading-relaxed">
                        Add your Anthropic API key to <code className="text-gold-400 text-xs">backend/.env</code> to enable AI-powered screenshot reading. Use CSV export from your broker in the meantime.
                      </p>
                    </div>
                  )}

                  {/* Parsed holdings */}
                  {parsedHoldings.length > 0 && (
                    <div className="space-y-2 mb-8">
                      {parsedHoldings.map((h, i) => (
                        <div key={i} className="flex items-center justify-between border border-white/5 px-5 py-3.5">
                          <div className="flex items-center gap-5">
                            <span className="font-sans text-sm font-medium text-gold-400 w-20 tracking-wider">{h.ticker}</span>
                            {h.name && <span className="font-sans text-xs text-cream-200/30">{h.name}</span>}
                          </div>
                          <span className="font-display text-lg text-cream-50">{h.allocation}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {parsedHoldings.length > 0 && (
                <button onClick={() => handleAssess(parsedHoldings)} className="btn-primary mt-4">
                  Analyse this portfolio →
                </button>
              )}
            </motion.div>
          )}

          {/* ── Manual tab ── */}
          {tab === "manual" && (
            <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <p className="text-cream-200/30 font-sans text-sm mb-8 leading-relaxed">
                Enter each position's ticker and percentage allocation. Total must equal 100%.
              </p>

              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-12 gap-4 px-1 mb-3">
                  <div className="col-span-7"><span className="label-overline opacity-25 text-xs">Ticker / Symbol</span></div>
                  <div className="col-span-4"><span className="label-overline opacity-25 text-xs">Allocation</span></div>
                </div>
                {manualHoldings.map((h, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-7">
                      <input
                        type="text"
                        value={h.ticker}
                        onChange={(e) => setManualHoldings((p) => p.map((x, idx) => idx === i ? { ...x, ticker: e.target.value.toUpperCase() } : x))}
                        placeholder={["VTI", "AAPL", "BND", "QQQ", "MSFT", "NVDA"][i] || "TICKER"}
                        className="w-full bg-transparent border-b border-white/10 py-3 font-sans text-sm text-cream-50 placeholder:text-cream-200/18 focus:outline-none focus:border-gold-500/40 transition-colors tracking-wider"
                      />
                    </div>
                    <div className="col-span-4">
                      <div className="relative">
                        <input
                          type="number" min={0} max={100}
                          value={h.allocation || ""}
                          onChange={(e) => setManualHoldings((p) => p.map((x, idx) => idx === i ? { ...x, allocation: parseFloat(e.target.value) || 0 } : x))}
                          placeholder="0"
                          className="w-full bg-transparent border-b border-white/10 py-3 font-sans text-sm text-cream-50 placeholder:text-cream-200/18 focus:outline-none focus:border-gold-500/40 transition-colors pr-8"
                        />
                        <span className="absolute right-0 top-3 text-cream-200/20 font-sans text-sm">%</span>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {manualHoldings.length > 2 && (
                        <button onClick={() => setManualHoldings((p) => p.filter((_, idx) => idx !== i))}
                          className="text-cream-200/15 hover:text-red-400/50 transition-colors text-sm leading-none">✕</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-10">
                <button onClick={() => setManualHoldings((p) => [...p, { ticker: "", allocation: 0 }])}
                  className="text-gold-500/40 hover:text-gold-400 font-sans text-xs tracking-widest uppercase transition-colors">
                  + Add position
                </button>
                <div className="flex items-center gap-3">
                  <span className="label-overline opacity-25">Total</span>
                  <span className={`font-display text-2xl transition-colors ${Math.abs(totalManual - 100) <= 5 ? "text-gold-400" : totalManual > 0 ? "text-red-400/60" : "text-cream-200/20"}`}>
                    {totalManual.toFixed(0)}%
                  </span>
                </div>
              </div>

              <button onClick={() => handleAssess(manualHoldings.filter(h => h.ticker.trim() && h.allocation > 0))}
                disabled={!manualValid}
                className="btn-primary disabled:opacity-20 disabled:cursor-not-allowed">
                Analyse portfolio →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Assess;
