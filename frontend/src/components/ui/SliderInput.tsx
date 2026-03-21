import React from "react";
import { motion } from "framer-motion";

interface SliderInputProps {
  min: number;
  max: number;
  step: number;
  value: number;
  minLabel: string;
  maxLabel: string;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({
  min, max, step, value, minLabel, maxLabel, formatValue, onChange,
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${value}`;

  return (
    <div className="w-full space-y-10">
      {/* Large value display */}
      <motion.div
        key={display}
        initial={{ opacity: 0.6, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-center"
      >
        <span className="font-display text-5xl md:text-6xl text-gold-400 tracking-tight">
          {display}
        </span>
      </motion.div>

      {/* Slider track */}
      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #C9A96E ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
          }}
        />
        {/* Labels */}
        <div className="flex justify-between mt-4">
          <span className="font-sans text-xs text-cream-200/25">{minLabel}</span>
          <span className="font-sans text-xs text-cream-200/25">{maxLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default SliderInput;
