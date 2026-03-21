import { Question, QuestionOption } from "../types";

// ─── Country-specific account types ────────────────────────────────────────────
export const ACCOUNT_TYPE_OPTIONS: Record<string, QuestionOption[]> = {
  US: [
    { value: "taxable", label: "Taxable brokerage account", description: "Standard account — capital gains and dividends taxed annually" },
    { value: "roth_ira", label: "Roth IRA", description: "After-tax contributions, tax-free growth and withdrawals" },
    { value: "traditional_ira", label: "Traditional IRA", description: "Pre-tax contributions, taxable at withdrawal" },
    { value: "401k", label: "401(k) / employer plan", description: "Employer-sponsored retirement plan with limited fund selection" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  IN: [
    { value: "demat", label: "Demat / Trading account", description: "Standard brokerage account — capital gains taxed at 10–15%" },
    { value: "ppf", label: "PPF (Public Provident Fund)", description: "Government-backed, tax-free returns, 15-year lock-in" },
    { value: "nps", label: "NPS (National Pension System)", description: "Tax-advantaged pension — Section 80C + 80CCD(1B) deductions" },
    { value: "elss", label: "ELSS (Tax-Saving Mutual Fund)", description: "Equity mutual funds with 3-year lock-in and 80C deduction" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  GB: [
    { value: "gia", label: "General Investment Account (GIA)", description: "Standard account — dividends and gains subject to UK income / CGT" },
    { value: "isa", label: "Stocks & Shares ISA", description: "Annual £20,000 allowance — all growth and income fully tax-free" },
    { value: "sipp", label: "SIPP (Personal Pension)", description: "Self-invested pension — contributions get 20–45% tax relief" },
    { value: "lisa", label: "Lifetime ISA (LISA)", description: "25% government bonus on up to £4,000/year (under 40s only)" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  CA: [
    { value: "non_reg", label: "Non-registered account", description: "Standard account — capital gains and dividends taxable" },
    { value: "tfsa", label: "TFSA (Tax-Free Savings Account)", description: "Contributions post-tax, all growth and withdrawals tax-free" },
    { value: "rrsp", label: "RRSP (Retirement Savings Plan)", description: "Pre-tax contributions, tax-deferred growth, taxed at withdrawal" },
    { value: "fhsa", label: "FHSA (First Home Savings Account)", description: "Tax-free savings for first-time home buyers — $8,000/year limit" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  AU: [
    { value: "non_super", label: "Investment account (non-super)", description: "Standard account — CGT and dividend income taxed at marginal rate" },
    { value: "super", label: "Superannuation", description: "15% tax on contributions and earnings — preserved until retirement" },
    { value: "smsf", label: "Self-Managed Super Fund (SMSF)", description: "Full control over your super investments — higher compliance cost" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  SG: [
    { value: "brokerage", label: "Standard brokerage account", description: "No capital gains tax in Singapore — dividends taxable for some" },
    { value: "cpf_oa", label: "CPF Ordinary Account (OA)", description: "Use CPF OA funds to invest via the CPFIS scheme" },
    { value: "srs", label: "SRS (Supplementary Retirement Scheme)", description: "Voluntary scheme with tax deduction on contributions" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  AE: [
    { value: "brokerage", label: "Standard brokerage account", description: "No income tax or capital gains tax in the UAE" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
  OTHER: [
    { value: "taxable", label: "Standard / taxable account", description: "Regular investment account subject to your country's tax rules" },
    { value: "pension", label: "Pension / retirement account", description: "Tax-advantaged retirement savings vehicle" },
    { value: "mixed", label: "Multiple accounts", description: "Spread across more than one account type" },
  ],
};

// ─── Country-specific currency config ──────────────────────────────────────────
export const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; factor: number }> = {
  US:    { symbol: "$",  locale: "en-US", factor: 1 },
  IN:    { symbol: "₹",  locale: "en-IN", factor: 83 },   // approx INR/USD
  GB:    { symbol: "£",  locale: "en-GB", factor: 0.79 },
  CA:    { symbol: "CA$", locale: "en-CA", factor: 1.36 },
  AU:    { symbol: "A$", locale: "en-AU", factor: 1.52 },
  SG:    { symbol: "S$", locale: "en-SG", factor: 1.34 },
  AE:    { symbol: "AED", locale: "en-AE", factor: 3.67 },
  OTHER: { symbol: "$",  locale: "en-US", factor: 1 },
};

export function getCurrencyConfig(country: string) {
  return CURRENCY_CONFIG[country] || CURRENCY_CONFIG["OTHER"];
}

export const questions: Question[] = [
  {
    id: "age",
    category: "About You",
    question: "How old are you?",
    subtext:
      "Age is the single most important input in building your portfolio. It determines how much time the market has to work in your favor.",
    type: "slider",
    sliderConfig: {
      min: 18,
      max: 75,
      step: 1,
      minLabel: "18",
      maxLabel: "75",
      formatValue: (v) => `${v} years old`,
    },
  },
  {
    id: "goal",
    category: "Goals",
    question: "What's driving this investment?",
    subtext:
      "Your goal shapes everything — the assets we choose, how aggressive we are, and how we measure success.",
    type: "single",
    options: [
      {
        value: "retire_early",
        label: "Retire early",
        description: "Financial independence before the traditional retirement age",
      },
      {
        value: "retirement",
        label: "Retire comfortably",
        description: "Build a nest egg that sustains your lifestyle in retirement",
      },
      {
        value: "wealth_building",
        label: "Build long-term wealth",
        description: "Grow capital significantly over a decade or more",
      },
      {
        value: "income",
        label: "Generate passive income",
        description: "Create a portfolio that pays you regularly through dividends or distributions",
      },
      {
        value: "preserve",
        label: "Preserve and protect capital",
        description: "You have wealth — the priority is keeping it intact with modest growth",
      },
      {
        value: "other",
        label: "Something else",
        description: "Tell us in your own words",
        isOther: true,
      },
    ],
  },
  {
    id: "target_value",
    category: "Goals",
    question: "What does success look like in numbers?",
    subtext:
      "Give us a target portfolio value. There's no right or wrong answer — this helps us calibrate the return we need to aim for.",
    type: "slider",
    sliderConfig: {
      min: 100000,
      max: 10000000,
      step: 50000,
      minLabel: "$100,000",
      maxLabel: "$10M+",
      formatValue: (v) =>
        v >= 10000000
          ? "$10M+"
          : v >= 1000000
          ? `$${(v / 1000000).toFixed(1)}M`
          : `$${(v / 1000).toFixed(0)}K`,
    },
  },
  {
    id: "timeline",
    category: "Goals",
    question: "How long will you let this money grow?",
    subtext:
      "A longer runway means we can absorb short-term volatility and target higher returns. Be honest — liquidity needs matter here.",
    type: "slider",
    sliderConfig: {
      min: 1,
      max: 40,
      step: 1,
      minLabel: "1 year",
      maxLabel: "40 years",
      formatValue: (v) => (v === 1 ? "1 year" : `${v} years`),
    },
  },
  {
    id: "initial_amount",
    category: "Capital",
    question: "How much are you investing today?",
    subtext:
      "Your starting capital affects which instruments make sense and how much diversification is achievable.",
    type: "slider",
    sliderConfig: {
      min: 5000,
      max: 10000000,
      step: 5000,
      minLabel: "$5,000",
      maxLabel: "$10M+",
      formatValue: (v) =>
        v >= 10000000
          ? "$10M+"
          : v >= 1000000
          ? `$${(v / 1000000).toFixed(2)}M`
          : `$${v.toLocaleString()}`,
    },
  },
  {
    id: "monthly_contribution",
    category: "Capital",
    question: "How much can you add each month?",
    subtext:
      "Regular contributions are one of the most powerful wealth-building tools available. Even small, consistent additions compound dramatically over time.",
    type: "slider",
    sliderConfig: {
      min: 0,
      max: 20000,
      step: 250,
      minLabel: "$0",
      maxLabel: "$20,000",
      formatValue: (v) =>
        v === 0 ? "No monthly addition" : `$${v.toLocaleString()} / month`,
    },
  },
  {
    id: "income_stability",
    category: "Financial Profile",
    question: "How stable is your income?",
    subtext:
      "Income stability affects how much risk your overall financial situation can actually handle — regardless of what you want the portfolio to do.",
    type: "single",
    options: [
      {
        value: "very_stable",
        label: "Very stable",
        description: "Government, tenured, or long-term corporate employment",
      },
      {
        value: "stable",
        label: "Stable",
        description: "Salaried employee with low risk of disruption",
      },
      {
        value: "variable",
        label: "Variable",
        description: "Commission, freelance, or business income that fluctuates",
      },
      {
        value: "entrepreneurial",
        label: "Entrepreneurial",
        description: "Business owner — income can be high but unpredictable",
      },
      {
        value: "retired",
        label: "Retired / Passive income",
        description: "Living primarily off savings, investments, or pension",
      },
    ],
  },
  {
    id: "risk_visual",
    category: "Risk",
    question: "Two portfolios. Which one do you choose?",
    subtext:
      "Both are real, historically-grounded scenarios. Pick the one you'd actually be comfortable holding through its worst year.",
    type: "single",
    options: [
      {
        value: "steady",
        label: "Portfolio A — Steady & Protected",
        description:
          "Average return: ~6% per year · Worst single year: −12% · Best single year: +18% · Sleeps well at night",
      },
      {
        value: "balanced",
        label: "Portfolio B — Balanced Growth",
        description:
          "Average return: ~9% per year · Worst single year: −28% · Best single year: +32% · Requires patience",
      },
      {
        value: "growth",
        label: "Portfolio C — High Growth",
        description:
          "Average return: ~12% per year · Worst single year: −45% · Best single year: +55% · Only for the disciplined",
      },
    ],
  },
  {
    id: "max_loss",
    category: "Risk",
    question: "What's the most you could lose in a year without abandoning your plan?",
    subtext:
      "Be honest with yourself. Many investors overestimate their tolerance until they're actually facing losses.",
    type: "slider",
    sliderConfig: {
      min: 5,
      max: 50,
      step: 5,
      minLabel: "−5%",
      maxLabel: "−50%",
      formatValue: (v) => `−${v}%`,
    },
  },
  {
    id: "crash_behavior",
    category: "Risk",
    question: "The market drops 35% in six months. Your portfolio is down significantly. What do you actually do?",
    subtext: "Answer based on what you would really do, not what you think you should do.",
    type: "single",
    options: [
      {
        value: "sell_all",
        label: "Sell and move to cash",
        description: "I can't watch it fall further — protecting what's left is the priority",
      },
      {
        value: "sell_some",
        label: "Reduce exposure",
        description: "Sell some positions to ease the pain and reassess",
      },
      {
        value: "hold",
        label: "Do nothing — stay the course",
        description: "Markets recover. This has happened before. I won't touch it.",
      },
      {
        value: "buy_more",
        label: "Deploy more capital",
        description: "Everything is on sale. I increase my position.",
      },
    ],
  },
  {
    id: "account_type",
    category: "Tax & Structure",
    question: "Where will this portfolio live?",
    subtext:
      "The account type changes which instruments we recommend and how we think about dividends versus growth.",
    type: "single",
    options: [], // dynamically replaced in Profiler based on country
  },
  {
    id: "focus_areas",
    category: "Preferences",
    question: "Are there areas you want to lean into?",
    subtext: "Optional — select any sectors or themes you want this portfolio to overweight.",
    type: "multi",
    options: [
      { value: "tech", label: "Technology & AI" },
      { value: "healthcare", label: "Healthcare & biotech" },
      { value: "clean_energy", label: "Clean & renewable energy" },
      { value: "dividends", label: "Dividend income" },
      { value: "international", label: "International markets" },
      { value: "real_estate", label: "Real estate" },
      { value: "consumer", label: "Consumer brands" },
      { value: "other_focus", label: "Something else", isOther: true },
    ],
  },
  {
    id: "avoid_areas",
    category: "Preferences",
    question: "Anything you want to keep out of your portfolio?",
    subtext: "Optional — select any sectors, industries, or instruments you want excluded.",
    type: "multi",
    options: [
      { value: "avoid_fossil", label: "Fossil fuels & oil" },
      { value: "avoid_weapons", label: "Weapons & defence" },
      { value: "avoid_tobacco", label: "Tobacco & alcohol" },
      { value: "avoid_gambling", label: "Gambling" },
      { value: "avoid_stocks", label: "No individual stocks" },
      { value: "avoid_intl", label: "No international exposure" },
      { value: "other_avoid", label: "Something else", isOther: true },
    ],
  },
];
