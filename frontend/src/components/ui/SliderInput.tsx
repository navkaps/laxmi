import React from "react";

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
  min,
  max,
  step,
  value,
  minLabel,
  maxLabel,
  formatValue,
  onChange,
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${value}`;

  return (
    <div className="w-full space-y-6">
      {/* Value display */}
      <div className="text-center">
        <span className="font-display text-4xl text-gold-400">{display}</span>
      </div>

      {/* Slider */}
      <div className="relative px-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #C9A96E ${pct}%, rgba(201,169,110,0.15) ${pct}%)`,
          }}
        />
        <div className="flex justify-between mt-3">
          <span className="text-xs text-cream-200/30 font-sans">{minLabel}</span>
          <span className="text-xs text-cream-200/30 font-sans">{maxLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default SliderInput;
