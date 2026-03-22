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
          ? "bg-gold-500/10 border border-gold-500/50"
          : "bg-white/3 border border-white/12 hover:bg-white/6 hover:border-white/25"
      }`}
    >
      {selected && (
        <motion.div
          layoutId={multi ? undefined : "card-glow"}
          className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent pointer-events-none"
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* Indicator — larger touch target */}
        <div className={`flex-shrink-0 mt-0.5 transition-all duration-200 ${
          multi
            ? `w-5 h-5 border flex items-center justify-center ${selected ? "border-gold-500 bg-gold-500" : "border-white/30 group-hover:border-white/50"}`
            : `w-5 h-5 rounded-full border flex items-center justify-center ${selected ? "border-gold-500" : "border-white/30 group-hover:border-white/50"}`
        }`}>
          {selected && (
            multi
              ? <svg width="9" height="7" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="#0C1426" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <div className="w-2 h-2 rounded-full bg-gold-500" />
          )}
        </div>

        <div className="min-w-0">
          <p className={`font-sans text-sm transition-colors duration-200 leading-snug ${
            selected ? "text-cream-50 font-medium" : "text-cream-200/65 font-normal group-hover:text-cream-50"
          }`}>
            {label}
          </p>
          {description && (
            <p className={`mt-1 font-sans text-xs leading-relaxed transition-colors duration-200 ${
              selected ? "text-cream-200/65" : "text-cream-200/40 group-hover:text-cream-200/65"
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
