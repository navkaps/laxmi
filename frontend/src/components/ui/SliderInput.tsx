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
      <motion.div
        key={display}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-center"
      >
        <span className="gradient-text font-display text-5xl md:text-6xl tracking-tight">
          {display}
        </span>
      </motion.div>

      <div className="relative px-1">
        <label className="sr-only">Adjust value</label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #C9A96E ${pct}%, rgba(255,255,255,0.10) ${pct}%)`,
          }}
        />
        <div className="flex justify-between mt-4">
          <span className="font-sans text-xs text-white/40">{minLabel}</span>
          <span className="font-sans text-xs text-white/40">{maxLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default SliderInput;
