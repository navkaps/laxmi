import React from "react";
import { motion } from "framer-motion";

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}

const OptionCard: React.FC<OptionCardProps> = ({
  label,
  description,
  selected,
  onClick,
  multi = false,
}) => {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-5 border transition-all duration-200 group ${
        selected
          ? "border-gold-500 bg-gold-500/8"
          : "border-white/8 bg-navy-800/50 hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`mt-0.5 flex-shrink-0 transition-all duration-200 ${
            multi ? "w-4 h-4 border" : "w-4 h-4 rounded-full border"
          } ${
            selected ? "border-gold-500 bg-gold-500" : "border-white/20"
          } flex items-center justify-center`}
        >
          {selected && (
            <div className={`bg-navy-900 ${multi ? "w-2 h-2" : "w-1.5 h-1.5 rounded-full"}`} />
          )}
        </div>
        <div>
          <div className={`font-sans text-sm font-medium transition-colors duration-200 ${
            selected ? "text-cream-50" : "text-cream-100/70 group-hover:text-cream-100"
          }`}>
            {label}
          </div>
          {description && (
            <div className={`mt-1 font-sans text-xs font-light transition-colors duration-200 ${
              selected ? "text-cream-200/60" : "text-cream-200/40"
            }`}>
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default OptionCard;
