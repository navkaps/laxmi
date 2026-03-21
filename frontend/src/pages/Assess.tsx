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

type Mode = "upload" | "manual" | "assessing" | "result";

const ACCEPTED = ".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png";

const Assess: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedHoldings, setParsedHoldings] = useState<ParsedHolding[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessError, setAssessError] = useState<string | null>(null);

  // Manual entry fallback
  const [manualHoldings, setManualHoldings] = useState<ParsedHolding[]>([
    { ticker: "", allocation: 0 },
    { ticker: "", allocation: 0 },
  ]);

  const getFileIcon = (f: File) => {
    if (f.type.startsWith("image/")) return "🖼";
    if (f.name.endsWith(".pdf")) return "📄";
    if (f.name.endsWith(".csv")) return "📊";
    return "📋";
  };

  const handleFileDrop = (f: File) => {
    setFile(f);
    setParseError(null);
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
        setParseError("Could not extract holdings from this file. Try a CSV or use manual entry below.");
      }
    } catch {
      setParseError("Upload failed. Try a CSV or use manual entry.");
    } finally {
      setParsing(false);
    }
  };

  const handleAssess = async (holdings: ParsedHolding[]) => {
    setMode("assessing");
    setAssessError(null);
    try {
      const res = await axios.post("http://localhost:4000/api/assess", { holdings });
      setAssessment(res.data);
      setMode("result");
    } catch {
      setAssessError("Assessment failed. Please try again.");
      setMode(parsedHoldings.length ? "upload" : "manual");
    }
  };

  const scoreColor = (s: number) =>
    s >= 75 ? "text-emerald-400" : s >= 50 ? "text-gold-400" : "text-red-400";

  const totalManual = manualHoldings.reduce((s, h) => s + (h.allocation || 0), 0);
  const manualValid = manualHoldings.some((h) => h.ticker.trim()) && Math.abs(totalManual - 100) <= 5;

  return (
    <div className="min-h-screen bg-navy-950 pb-24">
      {/* Header */}
      <div className="border-b border-white/5 py-16 px-10">
        <div className="max-w-4xl mx-auto">
          <span className="label-overline opacity-40 block mb-4">Portfolio Analysis</span>
          <h1 className="font-display text-5xl text-cream-50 mb-4">
            Assess your existing portfolio.
          </h1>
          <p className="text-cream-200/40 font-sans font-light text-lg max-w-xl leading-relaxed">
            Upload a file or enter holdings manually. We'll analyse the risk, diversification, concentration, and tell you exactly what's working and what isn't.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-10 mt-14 space-y-10">
        <AnimatePresence mode="wait">

          {/* ── Upload screen ── */}
          {(mode === "upload") && (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed transition-all duration-200 cursor-pointer p-16 text-center ${
                  dragOver ? "border-gold-500/60 bg-gold-500/5" : "border-white/10 hover:border-white/20"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }}
                />

                {parsing ? (
                  <div className="space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-8 h-8 border border-gold-500/40 border-t-gold-500 rounded-full mx-auto"
                    />
                    <p className="text-cream-200/40 font-sans text-sm">Reading your file...</p>
                  </div>
                ) : file && !parseError ? (
                  <div className="space-y-3">
                    <div className="text-4xl">{getFileIcon(file)}</div>
                    <p className="font-sans text-sm text-cream-100">{file.name}</p>
                    <p className="label-overline opacity-40 text-xs">{parsedHoldings.length} holdings extracted</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4 text-3xl opacity-60">
                      <span>📊</span><span>📄</span><span>🖼</span>
                    </div>
                    <div>
                      <p className="font-sans text-sm text-cream-200/50 mb-1">
                        Drop your portfolio file here, or <span className="text-gold-400">click to browse</span>
                      </p>
                      <p className="font-sans text-xs text-cream-200/25">
                        Supports CSV, Excel (.xlsx), PDF, or screenshot (JPG/PNG)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Format hints */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { icon: "📊", label: "CSV", desc: "Works best — ticker, allocation columns" },
                  { icon: "📋", label: "Excel", desc: "Brokerage exports in .xlsx format" },
                  { icon: "📄", label: "PDF", desc: "Account statements with text" },
                  { icon: "🖼", label: "Screenshot", desc: "AI-powered — requires Claude API key" },
                ].map((f) => (
                  <div key={f.label} className="bg-navy-800/30 border border-white/5 p-4 text-center">
                    <div className="text-xl mb-2">{f.icon}</div>
                    <div className="font-sans text-xs font-medium text-cream-100 mb-1">{f.label}</div>
                    <div className="font-sans text-xs text-cream-200/30 leading-relaxed">{f.desc}</div>
                  </div>
                ))}
              </div>

              {/* AI required notice */}
              {parseError === "ai_required" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-gold-500/20 bg-gold-500/5 p-6 mt-4"
                >
                  <p className="font-sans text-sm text-gold-400 mb-1 font-medium">Image parsing requires the Claude AI API</p>
                  <p className="font-sans text-xs text-cream-200/45 leading-relaxed">
                    Reading text from screenshots requires AI vision. Add your Anthropic API key to the backend <code className="text-gold-400">.env</code> file to enable this. In the meantime, use CSV export from your broker or enter holdings manually below.
                  </p>
                </motion.div>
              )}

              {/* Parse error */}
              {parseError && parseError !== "ai_required" && (
                <p className="text-red-400/60 font-sans text-sm mt-4">{parseError}</p>
              )}

              {/* Parsed holdings preview */}
              {parsedHoldings.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  <h3 className="label-overline opacity-40 mb-4">Extracted holdings</h3>
                  <div className="space-y-2 mb-8">
                    {parsedHoldings.map((h, i) => (
                      <div key={i} className="flex items-center justify-between bg-navy-800/40 border border-white/5 px-5 py-3">
                        <div className="flex items-center gap-4">
                          <span className="font-sans text-sm font-medium text-gold-400 w-20 tracking-wider">{h.ticker}</span>
                          {h.name && <span className="font-sans text-xs text-cream-200/40">{h.name}</span>}
                        </div>
                        <span className="font-display text-lg text-cream-50">{h.allocation}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleAssess(parsedHoldings)} className="btn-primary">
                      Analyse this portfolio →
                    </button>
                    <button onClick={() => { setFile(null); setParsedHoldings([]); setParseError(null); }} className="btn-ghost">
                      Upload different file
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Manual entry fallback */}
              <div className="border-t border-white/5 pt-8 mt-8">
                <p className="text-cream-200/30 font-sans text-sm mb-6">
                  Prefer to enter manually?
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 mb-1">
                    <div className="col-span-6"><span className="label-overline opacity-25 text-xs">Ticker</span></div>
                    <div className="col-span-4"><span className="label-overline opacity-25 text-xs">Allocation %</span></div>
                  </div>
                  {manualHoldings.map((h, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={h.ticker}
                          onChange={(e) => setManualHoldings((p) => p.map((x, idx) => idx === i ? { ...x, ticker: e.target.value.toUpperCase() } : x))}
                          placeholder={["VTI", "AAPL", "BND", "QQQ", "MSFT"][i] || "TICKER"}
                          className="w-full bg-navy-800/50 border border-white/8 px-4 py-3 font-sans text-sm text-cream-50 placeholder:text-cream-200/18 focus:outline-none focus:border-gold-500/40 transition-colors tracking-wider"
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="relative">
                          <input
                            type="number" min={0} max={100}
                            value={h.allocation || ""}
                            onChange={(e) => setManualHoldings((p) => p.map((x, idx) => idx === i ? { ...x, allocation: parseFloat(e.target.value) || 0 } : x))}
                            placeholder="0"
                            className="w-full bg-navy-800/50 border border-white/8 px-4 py-3 font-sans text-sm text-cream-50 placeholder:text-cream-200/18 focus:outline-none focus:border-gold-500/40 transition-colors"
                          />
                          <span className="absolute right-4 top-3 text-cream-200/20 font-sans text-sm">%</span>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        {manualHoldings.length > 2 && (
                          <button onClick={() => setManualHoldings((p) => p.filter((_, idx) => idx !== i))} className="text-cream-200/20 hover:text-red-400/50 font-sans text-xs transition-colors">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 mb-6">
                  <button onClick={() => setManualHoldings((p) => [...p, { ticker: "", allocation: 0 }])} className="text-gold-500/50 hover:text-gold-400 font-sans text-xs tracking-widest uppercase transition-colors">
                    + Add row
                  </button>
                  <span className={`font-display text-lg ${Math.abs(totalManual - 100) <= 5 ? "text-gold-400" : "text-red-400/60"}`}>
                    {totalManual.toFixed(0)}%
                  </span>
                </div>
                <button onClick={() => handleAssess(manualHoldings.filter(h => h.ticker.trim() && h.allocation > 0))} disabled={!manualValid} className="btn-ghost disabled:opacity-20 disabled:cursor-not-allowed">
                  Analyse manual entry →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Assessing ── */}
          {mode === "assessing" && (
            <motion.div key="assessing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24 gap-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-10 h-10 border border-gold-500/40 border-t-gold-500 rounded-full"
              />
              <p className="text-cream-200/40 font-sans text-sm tracking-wide">Analysing your portfolio...</p>
            </motion.div>
          )}

          {/* ── Result ── */}
          {mode === "result" && assessment && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">

              {/* Score */}
              <div className="grid grid-cols-3 gap-px bg-white/5">
                {[
                  { label: "Portfolio Score", value: <span className={`font-display text-5xl ${scoreColor(assessment.score)}`}>{assessment.score}<span className="text-2xl opacity-50">/100</span></span> },
                  { label: "Risk Profile", value: <span className="font-display text-3xl text-gold-400">{assessment.overallRisk}</span> },
                  { label: "Holdings Reviewed", value: <span className="font-display text-3xl text-cream-50">{(parsedHoldings.length || manualHoldings.filter(h => h.ticker.trim()).length)} positions</span> },
                ].map((m) => (
                  <div key={m.label} className="bg-navy-950 px-8 py-7">
                    <div className="label-overline opacity-35 mb-2">{m.label}</div>
                    {m.value}
                  </div>
                ))}
              </div>

              <div className="card-dark">
                <h3 className="label-overline mb-5 opacity-40">Assessment</h3>
                <p className="font-sans text-sm text-cream-200/55 leading-relaxed">{assessment.summary}</p>
              </div>

              {/* Sector breakdown */}
              {assessment.sectorBreakdown?.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-cream-50 mb-6">Sector Concentration</h2>
                  <div className="space-y-4">
                    {assessment.sectorBreakdown.map((s, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1.5">
                          <span className="font-sans text-xs text-cream-200/50">{s.sector}</span>
                          <span className="font-sans text-xs text-cream-200/50">{s.weight}%</span>
                        </div>
                        <div className="h-px bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.weight}%` }}
                            transition={{ delay: i * 0.05, duration: 0.6 }}
                            className={`h-full ${s.weight > 40 ? "bg-red-400/50" : "bg-gold-500/60"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div className="card-dark">
                  <h3 className="label-overline mb-5 opacity-40">Strengths</h3>
                  <ul className="space-y-3">
                    {assessment.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/55 leading-relaxed">
                        <span className="text-gold-500 flex-shrink-0 mt-0.5 text-base leading-none">—</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-dark">
                  <h3 className="label-overline mb-5 opacity-40">Risks & Weaknesses</h3>
                  <ul className="space-y-3">
                    {assessment.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 font-sans text-xs text-cream-200/40 leading-relaxed">
                        <span className="text-red-400/50 flex-shrink-0 mt-0.5 text-base leading-none">—</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl text-cream-50 mb-6">Recommended Actions</h2>
                <div className="space-y-3">
                  {assessment.suggestions.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-navy-800/50 border border-white/5 p-6 flex gap-6">
                      <div className="font-display text-2xl text-gold-500/30 flex-shrink-0 w-8">{i + 1}</div>
                      <div>
                        <div className="font-sans text-sm font-medium text-cream-100 mb-1">{s.action}</div>
                        <div className="font-sans text-xs text-cream-200/40 leading-relaxed">{s.detail}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="border border-gold-500/15 bg-gold-500/4 p-8">
                <h3 className="label-overline mb-3 opacity-40">Verdict</h3>
                <p className="font-display text-xl text-cream-50 leading-relaxed">{assessment.verdict}</p>
              </div>

              <div className="flex gap-4 no-print">
                <button onClick={() => window.print()} className="btn-primary">Download report</button>
                <button onClick={() => { setMode("upload"); setAssessment(null); setFile(null); setParsedHoldings([]); }} className="btn-ghost">Assess another portfolio</button>
                <button onClick={() => navigate("/start")} className="btn-ghost">Build an optimised portfolio →</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Assess;
