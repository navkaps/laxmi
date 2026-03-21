const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Generate realistic backtest data for a given annual return rate vs S&P 500
function generateBacktest(portfolioRate, benchmarkRate = 0.107) {
  const data = [];
  let portfolio = 10000;
  let benchmark = 10000;
  for (let year = 1995; year <= 2024; year++) {
    data.push({
      year,
      portfolioValue: Math.round(portfolio),
      benchmarkValue: Math.round(benchmark),
    });
    portfolio *= 1 + portfolioRate + (Math.random() - 0.5) * 0.04;
    benchmark *= 1 + benchmarkRate + (Math.random() - 0.5) * 0.06;
  }
  return data;
}

function getMockRecommendation(profile) {
  const risk = profile.risk_tolerance || "moderate";
  const goal = profile.goal || "wealth_building";
  const timeline = profile.timeline || 15;

  const isAggressive = ["aggressive", "very_aggressive"].includes(risk);
  const isConservative = ["conservative", "very_conservative"].includes(risk);

  if (isConservative) {
    return {
      profileSummary:
        "You are a thoughtful investor who values stability above all else. Your primary concern is protecting the wealth you've built while generating dependable, steady growth over time. This portfolio is designed to give you peace of mind — even when markets are turbulent.",
      riskProfile: "Conservative",
      expectedAnnualReturn: "5–7% p.a.",
      volatility: "Low (6–10%)",
      rationale:
        "Given your preference for capital preservation and steady income, this portfolio leans heavily on broad market ETFs and dividend-paying assets. The bond allocation provides a cushion during equity downturns, while the dividend ETFs deliver consistent cash flow. The modest growth allocation in VTI ensures you still participate in long-term market gains without exposing you to undue volatility.",
      keyStrengths: [
        "Strong downside protection through diversified fixed income",
        "Consistent dividend income reducing reliance on capital gains",
        "Low correlation between asset classes smooths overall volatility",
      ],
      considerations: [
        "Lower growth potential means inflation could erode purchasing power over very long horizons",
        "Bond prices are sensitive to interest rate changes — worth revisiting allocation if rates shift significantly",
      ],
      holdings: [
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", allocation: 35, sector: "Fixed Income", rationale: "Core fixed income exposure providing stability and income across market cycles." },
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", allocation: 30, sector: "Broad Market", rationale: "Broad US equity exposure ensuring participation in long-term market growth at minimal cost." },
        { ticker: "VYM", name: "Vanguard High Dividend Yield ETF", type: "ETF", allocation: 20, sector: "Dividend", rationale: "High-quality dividend payers that have historically held value better during downturns." },
        { ticker: "SCHP", name: "Schwab US TIPS ETF", type: "ETF", allocation: 10, sector: "Inflation-Protected", rationale: "Treasury Inflation-Protected Securities guard purchasing power in inflationary environments." },
        { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "ETF", allocation: 5, sector: "Real Estate", rationale: "REITs provide real asset exposure and additional dividend income with low correlation to bonds." },
      ],
      backtestData: generateBacktest(0.062),
    };
  }

  if (isAggressive) {
    return {
      profileSummary:
        "You have a strong conviction in long-term equity markets and a high tolerance for short-term volatility. You understand that the path to significant wealth creation is rarely smooth, and you're comfortable staying the course through corrections. This portfolio is built for growth — unapologetically.",
      riskProfile: "Aggressive",
      expectedAnnualReturn: "10–13% p.a.",
      volatility: "High (18–24%)",
      rationale:
        "Your aggressive stance and long investment horizon allow us to concentrate heavily in high-growth equities. The technology and innovation overweight reflects where the most durable earnings growth is occurring. Individual stock positions in market leaders complement the ETF core, giving you both diversification and concentrated upside. The international growth sleeve adds exposure to faster-growing economies without currency hedging, accepting volatility for return potential.",
      keyStrengths: [
        "Maximum long-term compounding potential through equity concentration",
        "Exposure to high-growth technology and innovation themes",
        "Individual stock positions can significantly outperform index ETFs over time",
      ],
      considerations: [
        "Drawdowns of 30–40% are possible in severe market corrections — requires discipline not to sell",
        "Concentration in technology increases sensitivity to sector-specific risks",
      ],
      holdings: [
        { ticker: "VGT", name: "Vanguard Information Technology ETF", type: "ETF", allocation: 25, sector: "Technology", rationale: "Concentrated technology exposure capturing the sector driving the most earnings growth this decade." },
        { ticker: "QQQ", name: "Invesco QQQ Trust", type: "ETF", allocation: 20, sector: "Nasdaq 100", rationale: "Nasdaq 100 exposure tilted toward the largest, most innovative US companies." },
        { ticker: "AAPL", name: "Apple Inc.", type: "Stock", allocation: 10, sector: "Technology", rationale: "Exceptional cash generation, ecosystem lock-in, and expanding services margin make this a core long-term holding." },
        { ticker: "MSFT", name: "Microsoft Corporation", type: "Stock", allocation: 10, sector: "Technology", rationale: "Cloud and AI infrastructure dominance positions Microsoft for durable growth across multiple business cycles." },
        { ticker: "VWO", name: "Vanguard Emerging Markets ETF", type: "ETF", allocation: 15, sector: "International", rationale: "Emerging market equity adds diversification and access to higher GDP growth economies." },
        { ticker: "NVDA", name: "NVIDIA Corporation", type: "Stock", allocation: 10, sector: "Semiconductors", rationale: "Dominant AI infrastructure provider with pricing power and a multi-year earnings tailwind." },
        { ticker: "ARKK", name: "ARK Innovation ETF", type: "ETF", allocation: 10, sector: "Disruptive Innovation", rationale: "Exposure to early-stage disruptive companies that could become the market leaders of the next decade." },
      ],
      backtestData: generateBacktest(0.118),
    };
  }

  // Default: Moderate
  return {
    profileSummary:
      "You're a balanced investor with a clear-eyed view of both risk and opportunity. You want your money to grow meaningfully over time, but you're not willing to lose sleep over short-term market swings. This portfolio was built to grow steadily, weather volatility, and put you on track for your goals.",
    riskProfile: "Moderate",
    expectedAnnualReturn: "7–9% p.a.",
    volatility: "Moderate (12–16%)",
    rationale:
      "A moderate risk profile calls for a portfolio that is predominantly equity-driven for growth, with enough diversification to absorb market shocks without panic. The core VTI and international positions give you broad market exposure, while the quality growth ETF and select individual stocks add return potential above the index. The small fixed income and real estate sleeve serves as ballast during equity downturns.",
    keyStrengths: [
      "Diversified across geographies, sectors, and asset classes",
      "Low-cost ETF core minimizes fees compounding against returns",
      "Positioned to outperform inflation meaningfully over a 10+ year horizon",
    ],
    considerations: [
      "International exposure introduces some currency and geopolitical risk",
      "A 15–20% drawdown is possible in a significant market correction — maintain your investment horizon",
    ],
    holdings: [
      { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", allocation: 35, sector: "Broad Market", rationale: "The single best representation of the US economy — 4,000+ stocks at a 0.03% expense ratio." },
      { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "ETF", allocation: 15, sector: "International", rationale: "International diversification across developed and emerging markets reduces single-country concentration risk." },
      { ticker: "QQQ", name: "Invesco QQQ Trust", type: "ETF", allocation: 15, sector: "Nasdaq 100", rationale: "Growth tilt toward the most innovative US companies complements the broader VTI core." },
      { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", allocation: 15, sector: "Fixed Income", rationale: "Investment-grade bond exposure provides portfolio stability and reduces overall drawdown in equity corrections." },
      { ticker: "AAPL", name: "Apple Inc.", type: "Stock", allocation: 8, sector: "Technology", rationale: "Best-in-class balance sheet and ecosystem stickiness make this a reliable long-term compounder." },
      { ticker: "MSFT", name: "Microsoft Corporation", type: "Stock", allocation: 7, sector: "Technology", rationale: "Azure cloud and Copilot AI integration create durable revenue streams across enterprise and consumer." },
      { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "ETF", allocation: 5, sector: "Real Estate", rationale: "Real estate adds inflation protection and income diversification outside of traditional equities and bonds." },
    ],
    backtestData: generateBacktest(0.088),
  };
}

app.post("/api/recommend", (req, res) => {
  const { profile } = req.body;
  if (!profile) return res.status(400).json({ error: "Profile is required" });

  // Simulate a brief processing delay for the loading experience
  setTimeout(() => {
    res.json(getMockRecommendation(profile));
  }, 3000);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Laxmi backend running on port ${PORT}`));
