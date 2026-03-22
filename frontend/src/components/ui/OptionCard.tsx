import React from "react";
import { motion } from "framer-motion";

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}

const OptionCard: React.FC<OptionCardProps> = ({ label, description, selected, onClick, multi = false }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full text-left px-6 py-5 transition-all duration-200 group relative overflow-hidden ${
        selected
          ? "bg-gold-500/12 border border-gold-500/50"
          : "bg-white/3 border border-white/10 hover:bg-white/5 hover:border-white/20"
      }`}
      style={selected ? { boxShadow: "0 0 20px rgba(99,102,241,0.12)" } : {}}
    >
      {selected && (
        <motion.div
          layoutId={multi ? undefined : "card-glow"}
          className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-violet-500/6 to-transparent pointer-events-none"
        />
      )}

      <div className="relative flex items-start gap-4">
        <div className={`flex-shrink-0 mt-0.5 transition-all duration-200 ${
          multi
            ? `w-5 h-5 border flex items-center justify-center ${selected ? "border-gold-500 bg-gold-500" : "border-white/25 group-hover:border-white/45"}`
            : `w-5 h-5 rounded-full border flex items-center justify-center ${selected ? "border-gold-500" : "border-white/25 group-hover:border-white/45"}`
        }`}>
          {selected && (
            multi
              ? <svg width="9" height="7" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="#07071A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <div className="w-2 h-2 rounded-full bg-gold-500" />
          )}
        </div>

        <div className="min-w-0">
          <p className={`font-sans text-sm font-medium transition-colors duration-200 leading-snug ${
            selected ? "text-white" : "text-white/65 group-hover:text-white"
          }`}>
            {label}
          </p>
          {description && (
            <p className={`mt-1 font-sans text-xs leading-relaxed transition-colors duration-200 ${
              selected ? "text-white/65" : "text-white/40 group-hover:text-white/65"
            }`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default OptionCard;
