import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserInfo, CurrentHolding } from "../types";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "OTHER", name: "Other", flag: "🌐" },
];

const UserInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState<UserInfo>({ name: "", email: "", phone: "", country: "" });
  const [errors, setErrors] = useState<{ country?: string }>({});
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [currentHoldings, setCurrentHoldings] = useState<CurrentHolding[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Pre-load holdings if coming from Assess page
  useEffect(() => {
    const preloaded = (location.state as any)?.currentHoldings;
    if (preloaded?.length > 0) {
      setCurrentHoldings(preloaded);
      setShowPortfolio(true);
    }
  }, []);

  const handleFileUpload = async (f: File) => {
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", f);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/parse-portfolio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.holdings?.length > 0) {
        setCurrentHoldings(res.data.holdings);
      } else {
        setUploadError(res.data.error || "No holdings found. Try a CSV export from your brokerage.");
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e: { country?: string } = {};
    if (!info.country) e.country = "Please select your country";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    navigate("/profile", {
      state: {
        userInfo: {
          ...info,
          currentHoldings: currentHoldings.length > 0 ? currentHoldings : undefined,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      {/* Logo */}
      <div className="fixed top-6 left-10 flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g-logo" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/>
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="6" fill="url(#g-logo)"/>
          <path d="M14 20 L14 9 M10 13 L14 9 L18 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-display text-lg font-bold tracking-tight text-white">Laxmi</span>
        <span className="hidden sm:inline font-sans text-xs text-white/50 tracking-wide border-l border-white/15 pl-2 ml-1">Your AI wealth advisor</span>
      </div>

      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="label-overline block mb-5">Before we begin</span>
          <h1 className="font-display text-3xl sm:text-4xl mb-3 leading-tight">
            <span className="gradient-text">Where are you</span>
            <span className="text-white"> investing?</span>
          </h1>
          <p className="text-white/65 font-sans text-sm leading-relaxed mb-12">
            Your country determines which markets, instruments, and tax structures we recommend.
          </p>

          <div className="space-y-8">
            {/* Country */}
            <div className="space-y-3">
              <label className="label-overline opacity-40 block">Country</label>
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES.map((c) => (
                  <motion.button
                    key={c.code}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setInfo((p) => ({ ...p, country: c.code }));
                      setErrors((p) => ({ ...p, country: undefined }));
                    }}
                    className={`flex items-center gap-3 px-4 py-3 border text-left transition-all duration-200 ${
                      info.country === c.code
                        ? "border-gold-500/60 bg-gold-500/10"
                        : "border-white/12 bg-white/3 hover:border-white/25 hover:bg-white/5"
                    }`}
                    style={info.country === c.code ? { boxShadow: "0 0 16px rgba(99,102,241,0.15)" } : {}}
                  >
                    <span className="text-xl leading-none">{c.flag}</span>
                    <span className={`font-sans text-sm font-medium transition-colors ${
                      info.country === c.code ? "text-white" : "text-white/65"
                    }`}>{c.name}</span>
                  </motion.button>
                ))}
              </div>
              {errors.country && <p className="text-red-400/60 font-sans text-xs">{errors.country}</p>}
            </div>

            {/* Optional existing portfolio */}
            <div className="border-t border-white/6 pt-8">
              <button
                onClick={() => setShowPortfolio((v) => !v)}
                className="flex items-start gap-4 w-full text-left group"
              >
                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 border transition-all ${
                  showPortfolio ? "border-gold-500 bg-gold-500" : "border-white/20 group-hover:border-white/35"
                } flex items-center justify-center`}>
                  {showPortfolio && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="#0C1426" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-sans text-sm text-white/65 group-hover:text-white transition-colors font-medium">
                    I already have investments
                  </p>
                  <p className="font-sans text-xs text-white/40 mt-0.5 leading-relaxed">
                    Optional — we'll show you exactly what to sell, keep, and buy to reach your ideal portfolio
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {showPortfolio && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6">
                      {currentHoldings.length === 0 ? (
                        <div>
                          <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,.pdf"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                          />
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setDragOver(false);
                              const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f);
                            }}
                            onClick={() => fileRef.current?.click()}
                            className={`cursor-pointer border transition-all px-6 py-8 flex flex-col items-center gap-3 ${
                              dragOver ? "border-gold-500/50 bg-gold-500/5" : "border-white/8 hover:border-white/18 bg-navy-800/20"
                            }`}
                          >
                            {uploading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                  className="w-6 h-6 border border-gold-500/30 border-t-gold-500 rounded-full"
                                />
                                <p className="font-sans text-xs text-cream-200/35">Reading your portfolio...</p>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 border border-white/15 flex items-center justify-center">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-cream-200/30">
                                    <path d="M10 13V4M10 4L7 7M10 4L13 7" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" strokeLinecap="round"/>
                                  </svg>
                                </div>
                                <p className="font-sans text-sm text-cream-200/40">
                                  Drop your portfolio file or <span className="text-gold-400">browse</span>
                                </p>
                                <p className="font-sans text-xs text-cream-200/20">CSV · Excel · PDF</p>
                              </>
                            )}
                          </div>
                          {uploadError && (
                            <p className="font-sans text-xs text-cream-200/40 mt-3 leading-relaxed">{uploadError}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="label-overline opacity-25 text-xs">{currentHoldings.length} holdings loaded</span>
                            <button
                              onClick={() => setCurrentHoldings([])}
                              className="font-sans text-xs text-cream-200/25 hover:text-cream-200/60 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-44 overflow-y-auto">
                            {currentHoldings.map((h, i) => (
                              <div key={i} className="flex justify-between border border-white/5 px-4 py-2.5">
                                <span className="font-sans text-sm font-medium text-gold-400 tracking-wider">{h.ticker}</span>
                                <span className="font-sans text-sm text-cream-200/60">{h.allocation}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full mt-10 text-center block">
            Continue to your profile →
          </button>

        </motion.div>
      </div>
    </div>
  );
};

export default UserInfoPage;
