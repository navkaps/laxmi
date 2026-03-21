import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserInfo } from "../types";

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
  const [info, setInfo] = useState<UserInfo>({
    name: "",
    email: "",
    phone: "",
    country: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserInfo, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof UserInfo, string>> = {};
    if (!info.name.trim()) e.name = "Required";
    if (!info.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email))
      e.email = "Enter a valid email address";
    if (!info.country) e.country = "Please select your country";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    navigate("/profile", { state: { userInfo: info } });
  };

  const field = (
    id: "name" | "email" | "phone",
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div className="space-y-2">
      <label className="label-overline opacity-40">{label}</label>
      <input
        type={type}
        value={info[id]}
        onChange={(e) => {
          setInfo((p) => ({ ...p, [id]: e.target.value }));
          setErrors((p) => ({ ...p, [id]: undefined }));
        }}
        placeholder={placeholder}
        className={`w-full bg-transparent border-b ${
          errors[id] ? "border-red-400/50" : "border-white/12"
        } py-3 font-sans text-base text-cream-50 placeholder:text-cream-200/18 focus:outline-none focus:border-gold-500/50 transition-colors`}
      />
      {errors[id] && <p className="text-red-400/60 font-sans text-xs">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="fixed top-6 left-10 flex items-center gap-3">
        <div className="w-6 h-6 border border-gold-500/60 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gold-500 rotate-45" />
        </div>
        <span className="font-display text-base text-cream-50">Laxmi</span>
      </div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="label-overline opacity-35 block mb-5">Before we begin</span>
          <h1 className="font-display text-4xl text-cream-50 mb-3 leading-tight">
            Tell us who you are.
          </h1>
          <p className="text-cream-200/35 font-sans text-sm leading-relaxed mb-12">
            Your profile and recommendation will be saved so we can personalise your experience.
          </p>

          <div className="space-y-8">
            {field("name", "Full name", "Jane Smith")}
            {field("email", "Email address", "jane@example.com", "email")}
            {field("phone", "Phone number (optional)", "+1 555 000 0000", "tel")}

            {/* Country selector */}
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
                        ? "border-gold-500 bg-gold-500/8"
                        : "border-white/8 bg-navy-800/30 hover:border-white/18"
                    }`}
                  >
                    <span className="text-xl leading-none">{c.flag}</span>
                    <span className={`font-sans text-sm transition-colors ${
                      info.country === c.code ? "text-cream-50" : "text-cream-200/50"
                    }`}>
                      {c.name}
                    </span>
                  </motion.button>
                ))}
              </div>
              {errors.country && (
                <p className="text-red-400/60 font-sans text-xs">{errors.country}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="btn-primary w-full mt-12 text-center block"
          >
            Continue to your profile →
          </button>

          <p className="text-cream-200/18 font-sans text-xs mt-6 text-center leading-relaxed">
            Your information is stored securely and never shared or sold.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default UserInfoPage;
