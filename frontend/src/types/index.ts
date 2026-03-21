export type QuestionType = "single" | "slider" | "multi";

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  isOther?: boolean;
}

export interface Question {
  id: string;
  category: string;
  question: string;
  subtext?: string;
  type: QuestionType;
  options?: QuestionOption[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    minLabel: string;
    maxLabel: string;
    unit?: string;
    formatValue?: (v: number) => string;
  };
}

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  country: string;
}

export interface UserProfile {
  [questionId: string]: string | number | string[];
}

export interface Holding {
  ticker: string;
  name: string;
  type: "ETF" | "Stock";
  allocation: number;
  rationale: string;
  sector?: string;
}

export interface BacktestData {
  year: number;
  portfolioValue: number;
  benchmarkValue: number;
}

export interface TuneLevelSummary {
  level: number;
  riskProfile: string;
  expectedAnnualReturn: string;
  volatility: string;
}

export interface PortfolioRecommendation {
  profileSummary: string;
  riskProfile: string;
  holdings: Holding[];
  rationale: string;
  expectedAnnualReturn: string;
  volatility: string;
  keyStrengths: string[];
  considerations: string[];
  backtestData: BacktestData[];
  profileLevel: number;
  allProfiles: TuneLevelSummary[];
}
