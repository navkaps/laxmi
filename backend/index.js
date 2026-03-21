const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─── Database setup ────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, "laxmi.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT,
    email       TEXT,
    phone       TEXT,
    country     TEXT,
    profile     TEXT,
    risk_profile TEXT,
    tune_level  INTEGER,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertSubmission = db.prepare(`
  INSERT INTO submissions (name, email, phone, country, profile, risk_profile, tune_level)
  VALUES (@name, @email, @phone, @country, @profile, @risk_profile, @tune_level)
`);

// ─── Historical returns ─────────────────────────────────────────────────────────
// Actual S&P 500 annual total returns (dividends reinvested)
const SP500_RETURNS = {
  1995: 0.376, 1996: 0.229, 1997: 0.334, 1998: 0.286, 1999: 0.211,
  2000: -0.091, 2001: -0.119, 2002: -0.221, 2003: 0.287, 2004: 0.109,
  2005: 0.049, 2006: 0.158, 2007: 0.055, 2008: -0.370, 2009: 0.265,
  2010: 0.151, 2011: 0.021, 2012: 0.160, 2013: 0.324, 2014: 0.137,
  2015: 0.014, 2016: 0.120, 2017: 0.218, 2018: -0.044, 2019: 0.315,
  2020: 0.184, 2021: 0.287, 2022: -0.181, 2023: 0.263, 2024: 0.250,
};

// Approximate AGG/BND bond index annual returns
const BOND_RETURNS = {
  1995: 0.185, 1996: 0.036, 1997: 0.097, 1998: 0.087, 1999: -0.008,
  2000: 0.116, 2001: 0.084, 2002: 0.101, 2003: 0.041, 2004: 0.044,
  2005: 0.024, 2006: 0.044, 2007: 0.070, 2008: 0.055, 2009: 0.059,
  2010: 0.065, 2011: 0.078, 2012: 0.042, 2013: -0.020, 2014: 0.060,
  2015: 0.005, 2016: 0.026, 2017: 0.035, 2018: 0.001, 2019: 0.087,
  2020: 0.076, 2021: -0.015, 2022: -0.130, 2023: 0.055, 2024: 0.035,
};

function generateBacktest(equityPct, bondPct, amplifier) {
  const data = [];
  let portfolio = 10000;
  let benchmark = 10000;
  const years = Object.keys(SP500_RETURNS).map(Number).sort();

  years.forEach((year) => {
    data.push({
      year,
      portfolioValue: Math.round(portfolio),
      benchmarkValue: Math.round(benchmark),
    });
    const equityReturn = SP500_RETURNS[year] * equityPct * amplifier;
    const bondReturn = BOND_RETURNS[year] * bondPct;
    portfolio *= 1 + equityReturn + bondReturn;
    benchmark *= 1 + SP500_RETURNS[year];
  });

  return data;
}

// ─── Portfolio profiles ─────────────────────────────────────────────────────────
function getPortfolioProfiles() {
  return [
    {
      level: 0,
      riskProfile: "Very Conservative",
      expectedAnnualReturn: "4–6% p.a.",
      volatility: "Very Low (5–8%)",
      equityPct: 0.25, bondPct: 0.75, amplifier: 0.6,
      profileSummary: "Capital preservation is your north star. You've worked hard to accumulate what you have, and protecting it matters more than chasing returns. This portfolio is built to hold its ground in turbulent markets while delivering modest, consistent growth that outpaces inflation.",
      rationale: "At this risk level, the portfolio is anchored in investment-grade bonds and dividend-paying equities. The equity exposure is intentionally limited and tilted toward defensive sectors — companies that generate cash regardless of economic conditions. The result is a portfolio that tends to fall less than half as much as the broader market in bad years.",
      keyStrengths: ["Portfolio designed to lose less than 10% even in severe market downturns", "Regular income from bonds and dividend stocks reduces reliance on capital appreciation", "Low correlation across asset classes provides a genuine cushion during equity selloffs"],
      considerations: ["At 4–6% returns, this barely outpaces inflation over long periods — consider whether this matches your growth needs", "Bond prices fall when interest rates rise — this portfolio carried meaningful rate risk in 2022"],
      holdings: [
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", allocation: 35, sector: "Fixed Income", rationale: "Broad investment-grade bond exposure providing income stability and a hedge against equity volatility." },
        { ticker: "SCHP", name: "Schwab US TIPS ETF", type: "ETF", allocation: 15, sector: "Inflation-Protected Bonds", rationale: "Treasury Inflation-Protected Securities preserve real purchasing power — especially valuable for capital preservation goals." },
        { ticker: "VYM", name: "Vanguard High Dividend Yield ETF", type: "ETF", allocation: 20, sector: "Dividend Equities", rationale: "High-quality dividend payers that hold value better than growth stocks during market corrections." },
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", allocation: 15, sector: "Broad US Equity", rationale: "A modest broad market allocation ensures participation in long-term US economic growth at near-zero cost." },
        { ticker: "VCIT", name: "Vanguard Intermediate-Term Corporate Bond ETF", type: "ETF", allocation: 10, sector: "Corporate Bonds", rationale: "Investment-grade corporate bonds deliver incremental yield over Treasuries without material credit risk." },
        { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "ETF", allocation: 5, sector: "Real Estate", rationale: "REITs provide real asset exposure and inflation protection with a regular dividend stream." },
      ],
    },
    {
      level: 1,
      riskProfile: "Conservative",
      expectedAnnualReturn: "5–7% p.a.",
      volatility: "Low (8–12%)",
      equityPct: 0.40, bondPct: 0.60, amplifier: 0.75,
      profileSummary: "You want your money to grow, but not at the cost of your peace of mind. You've seen markets fall and you know how it feels — this portfolio is designed to let you stay invested through the hard years without second-guessing every decision.",
      rationale: "The 40/60 equity-to-bond structure is a time-tested allocation for investors who want steady growth without stomach-churning drawdowns. Equity exposure is concentrated in low-volatility, dividend-paying names. The bond sleeve acts as ballast — when equities sell off, it typically holds steady or appreciates, softening the overall portfolio impact.",
      keyStrengths: ["Balanced structure has historically recovered from drawdowns significantly faster than all-equity portfolios", "Dividend income component creates a return floor independent of capital gains", "Quality tilt in equity selection reduces exposure to speculative names that collapse in bear markets"],
      considerations: ["Underperforms in strong bull markets — this is the deliberate trade-off for lower drawdowns", "With a long time horizon, this level of conservatism may cost you significant compounding"],
      holdings: [
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", allocation: 30, sector: "Fixed Income", rationale: "Core fixed income holding providing stability and income across the economic cycle." },
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", allocation: 25, sector: "Broad US Equity", rationale: "Broad market exposure at minimal cost — the bedrock of any long-term equity allocation." },
        { ticker: "VYM", name: "Vanguard High Dividend Yield ETF", type: "ETF", allocation: 20, sector: "Dividend Equities", rationale: "Dividend-paying companies demonstrate financial discipline and hold value better during corrections." },
        { ticker: "VCIT", name: "Vanguard Intermediate-Term Corporate Bond ETF", type: "ETF", allocation: 10, sector: "Corporate Bonds", rationale: "Higher yield than Treasuries at modest additional credit risk — appropriate for this risk level." },
        { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "ETF", allocation: 8, sector: "Real Estate", rationale: "Real estate provides diversification, inflation protection, and income not correlated with traditional bonds." },
        { ticker: "SCHP", name: "Schwab US TIPS ETF", type: "ETF", allocation: 7, sector: "Inflation-Protected Bonds", rationale: "Inflation protection ensures the real value of this portfolio is maintained in high-inflation environments." },
      ],
    },
    {
      level: 2,
      riskProfile: "Moderate",
      expectedAnnualReturn: "7–9% p.a.",
      volatility: "Moderate (12–16%)",
      equityPct: 0.65, bondPct: 0.35, amplifier: 1.0,
      profileSummary: "You're a balanced investor with a clear-eyed understanding of both risk and opportunity. You want meaningful growth over time, and you're willing to endure short-term turbulence to get there — as long as the strategy is sound and the reasoning is clear.",
      rationale: "A 65/35 equity-to-bond structure is the classic moderate portfolio, built around decades of evidence that this blend delivers strong risk-adjusted returns across full market cycles. The equity allocation is diversified across US large caps, international markets, and a growth tilt. The bond component acts as dry powder during corrections.",
      keyStrengths: ["65/35 equity/bond blend has one of the best long-term Sharpe ratios of any simple allocation", "International diversification reduces dependence on any single economy or currency", "Individual stock positions in proven compounders add alpha potential above pure index exposure"],
      considerations: ["International exposure introduces currency and geopolitical risk that a US-only portfolio avoids", "In a strong US bull market, the bond and international allocations will drag on relative performance — this is intentional"],
      holdings: [
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", allocation: 30, sector: "Broad US Equity", rationale: "The single most efficient way to own the entire US equity market across all sectors and market caps." },
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", allocation: 20, sector: "Fixed Income", rationale: "Broad investment-grade bond exposure providing genuine diversification from equity risk." },
        { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "ETF", allocation: 15, sector: "International Equity", rationale: "Developed and emerging market equity diversification reduces US-concentration risk over the long term." },
        { ticker: "QQQ", name: "Invesco QQQ Trust", type: "ETF", allocation: 12, sector: "Nasdaq 100", rationale: "Growth tilt toward the most innovative US companies — the leaders of the current technological cycle." },
        { ticker: "AAPL", name: "Apple Inc.", type: "Stock", allocation: 8, sector: "Technology", rationale: "Exceptional cash generation, ecosystem lock-in, and expanding services margin make this a core long-term compounder." },
        { ticker: "MSFT", name: "Microsoft Corporation", type: "Stock", allocation: 8, sector: "Technology", rationale: "Cloud and AI infrastructure dominance positions Microsoft for durable growth across multiple business cycles." },
        { ticker: "VNQ", name: "Vanguard Real Estate ETF", type: "ETF", allocation: 7, sector: "Real Estate", rationale: "Real asset exposure providing inflation protection and income diversification outside traditional asset classes." },
      ],
    },
    {
      level: 3,
      riskProfile: "Aggressive",
      expectedAnnualReturn: "9–12% p.a.",
      volatility: "High (17–22%)",
      equityPct: 0.85, bondPct: 0.15, amplifier: 1.15,
      profileSummary: "You're here to build wealth, and you understand the price of that ambition: volatility, patience, and the discipline not to sell when things look darkest. This portfolio doesn't hedge against discomfort — it converts discomfort into long-term return.",
      rationale: "With a high equity concentration and deliberate tilt toward growth sectors, this portfolio is designed to compound aggressively over a long time horizon. The small bond allocation is a tactical reserve deployable during sharp corrections. Individual stock positions in dominant technology companies add return potential above what any index can deliver.",
      keyStrengths: ["High equity concentration maximises long-term compounding — the most powerful force in investing", "Technology and innovation overweight reflects where the most durable earnings growth is occurring", "Individual positions in best-in-class companies can significantly outperform broad index funds over time"],
      considerations: ["Drawdowns of 30–40% are not just possible — they are likely at some point over a long investment horizon", "Technology concentration adds sector-specific risk; a regulatory shift or cycle turn can hit hard and fast"],
      holdings: [
        { ticker: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", allocation: 25, sector: "Broad US Equity", rationale: "Broad diversified foundation ensuring exposure to the entire US market, not just the sectors we're overweighting." },
        { ticker: "QQQ", name: "Invesco QQQ Trust", type: "ETF", allocation: 20, sector: "Nasdaq 100", rationale: "Concentrated exposure to the 100 most innovative US companies — where secular growth is concentrated." },
        { ticker: "VGT", name: "Vanguard Information Technology ETF", type: "ETF", allocation: 15, sector: "Technology", rationale: "Dedicated technology allocation to capture the sector driving the most earnings growth this decade." },
        { ticker: "AAPL", name: "Apple Inc.", type: "Stock", allocation: 10, sector: "Technology", rationale: "The world's most valuable company by market cap — financial fortress with irreplaceable ecosystem." },
        { ticker: "MSFT", name: "Microsoft Corporation", type: "Stock", allocation: 10, sector: "Technology", rationale: "Azure cloud growth and AI integration create decades of earnings runway." },
        { ticker: "NVDA", name: "NVIDIA Corporation", type: "Stock", allocation: 10, sector: "Semiconductors", rationale: "AI infrastructure monopoly with pricing power and multi-year demand tailwind still in its early innings." },
        { ticker: "VXUS", name: "Vanguard Total International Stock ETF", type: "ETF", allocation: 5, sector: "International Equity", rationale: "Minimal international allocation as a hedge against US-specific risks." },
        { ticker: "BND", name: "Vanguard Total Bond Market ETF", type: "ETF", allocation: 5, sector: "Fixed Income", rationale: "Small tactical reserve — held in bonds to deploy into equities during sharp corrections." },
      ],
    },
    {
      level: 4,
      riskProfile: "Very Aggressive",
      expectedAnnualReturn: "11–15% p.a.",
      volatility: "Very High (22–30%)",
      equityPct: 0.95, bondPct: 0.05, amplifier: 1.3,
      profileSummary: "Maximum growth. You are not here for a smooth ride — you're here to build wealth as aggressively as the market allows. You've thought through the worst-case scenarios and you're still in. This portfolio reflects that conviction.",
      rationale: "Nearly 100% equity with significant concentration in high-growth, high-conviction positions. This is a deliberate bet on technology, innovation, and US equity markets compounding at above-average rates. The risks are real: in 2022 a portfolio like this fell over 30%, and in 2020 it dropped 35% in weeks. Each time it recovered. The question is whether you'll hold.",
      keyStrengths: ["Maximum long-term compounding through near-total equity concentration", "Concentrated conviction positions in AI, cloud, and semiconductor leaders", "Aggressive growth portfolios have historically created more wealth per dollar than any other approach over 20+ year periods"],
      considerations: ["This portfolio can and will lose 35–50% in a severe bear market — you must be prepared to hold through it", "Only appropriate if this represents a portion of your total wealth, not your entire financial safety net"],
      holdings: [
        { ticker: "QQQ", name: "Invesco QQQ Trust", type: "ETF", allocation: 25, sector: "Nasdaq 100", rationale: "The core of an aggressive growth portfolio — concentrated in the best businesses the US economy has produced." },
        { ticker: "VGT", name: "Vanguard Information Technology ETF", type: "ETF", allocation: 20, sector: "Technology", rationale: "All-in on the sector delivering the highest earnings growth and return on capital in the modern economy." },
        { ticker: "NVDA", name: "NVIDIA Corporation", type: "Stock", allocation: 15, sector: "Semiconductors", rationale: "The picks-and-shovels play of the AI era — every AI model runs on NVIDIA infrastructure." },
        { ticker: "AAPL", name: "Apple Inc.", type: "Stock", allocation: 12, sector: "Technology", rationale: "1.5 billion active devices, the world's most profitable app store, and a hardware cycle that never ends." },
        { ticker: "MSFT", name: "Microsoft Corporation", type: "Stock", allocation: 12, sector: "Technology", rationale: "Enterprise software moat + fastest-growing hyperscaler + OpenAI partnership — a rare three-way winner." },
        { ticker: "AMZN", name: "Amazon.com Inc.", type: "Stock", allocation: 10, sector: "Technology / E-Commerce", rationale: "AWS cloud leadership and retail logistics moat provide two independent compounding engines." },
        { ticker: "META", name: "Meta Platforms Inc.", type: "Stock", allocation: 6, sector: "Technology", rationale: "3 billion daily users and a balance sheet funding the next computing platform." },
      ],
    },
  ];
}

function buildPortfolio(profile, tuneLevel, isIndia = false) {
  const profiles = isIndia ? getIndiaPortfolioProfiles() : getPortfolioProfiles();

  const riskMap = { steady: 0, balanced: 2, growth: 4 };
  const crashMap = { sell_all: -1, sell_some: 0, hold: 1, buy_more: 2 };
  const goalMap = { preserve: -1, income: 0, retirement: 1, wealth_building: 2, retire_early: 2 };

  const age = Number(profile.age) || 35;
  const ageFactor = age > 55 ? -1 : age < 35 ? 1 : 0;
  const maxLoss = Number(profile.max_loss) || 20;
  const lossAdjust = maxLoss < 15 ? -1 : maxLoss > 30 ? 1 : 0;

  const baseScore =
    (riskMap[profile.risk_visual] ?? 2) +
    (crashMap[profile.crash_behavior] ?? 0) +
    (goalMap[profile.goal] ?? 1) +
    ageFactor + lossAdjust;

  const profileLevel = Math.max(0, Math.min(4, Math.round(baseScore / 1.4)));
  const level = tuneLevel !== undefined && tuneLevel !== null ? tuneLevel : profileLevel;
  const clamped = Math.max(0, Math.min(4, level));

  const selected = profiles[clamped];

  return {
    ...selected,
    backtestData: generateBacktest(selected.equityPct, selected.bondPct, selected.amplifier),
    profileLevel,
    allProfiles: profiles.map(({ level, riskProfile, expectedAnnualReturn, volatility }) => ({
      level, riskProfile, expectedAnnualReturn, volatility,
    })),
  };
}

// ─── India portfolio profiles ────────────────────────────────────────────────────
function getIndiaPortfolioProfiles() {
  return [
    {
      level: 0,
      riskProfile: "Very Conservative",
      expectedAnnualReturn: "7–9% p.a.",
      volatility: "Very Low (5–8%)",
      equityPct: 0.25, bondPct: 0.75, amplifier: 0.6,
      profileSummary: "Capital preservation is your priority. You want your money to grow steadily without the anxiety of sharp market swings. This portfolio is built around India's most stable fixed income instruments and blue-chip dividend payers, designed to deliver consistent returns in all market conditions.",
      rationale: "A defensive portfolio anchored in government securities and liquid funds, with limited exposure to large-cap Indian equities. The equity component is concentrated in Nifty 50 — India's 50 most financially sound companies — providing market participation with inherently lower volatility than mid or small caps.",
      keyStrengths: ["Government bond exposure provides near-zero default risk with steady coupon income", "Nifty 50 has historically been far less volatile than mid-cap or sector indices", "Liquid fund allocation provides capital preservation with better returns than a savings account"],
      considerations: ["At 7–9% nominal returns, real returns after India's inflation are more modest", "Government bond prices fall when RBI raises rates — the bond allocation carries interest rate sensitivity"],
      holdings: [
        { ticker: "LIQUIDBEES", name: "Nippon India ETF Liquid BeES", type: "ETF", allocation: 25, sector: "Liquid / Money Market", rationale: "The most liquid ETF on NSE — equivalent to a high-yield savings account with intraday liquidity." },
        { ticker: "GILT", name: "SBI Nifty India Government Securities ETF", type: "ETF", allocation: 25, sector: "Government Bonds", rationale: "Sovereign-backed fixed income providing stable returns with zero credit risk." },
        { ticker: "NIFTYBEES", name: "Nippon India ETF Nifty 50 BeES", type: "ETF", allocation: 20, sector: "Large Cap Equity", rationale: "Tracks the Nifty 50 — India's 50 most liquid and financially sound listed companies." },
        { ticker: "ICICIB22", name: "ICICI Prudential Corporate Bond ETF", type: "ETF", allocation: 15, sector: "Corporate Bonds", rationale: "High-quality corporate bonds yielding above government securities with investment-grade credit ratings." },
        { ticker: "MAFSETF90", name: "Mirae Asset ESG Sector Leaders ETF", type: "ETF", allocation: 10, sector: "ESG Equity", rationale: "Exposure to India's best-governed companies — ESG leaders tend to be more resilient in downturns." },
        { ticker: "GOLDBEES", name: "Nippon India ETF Gold BeES", type: "ETF", allocation: 5, sector: "Gold", rationale: "Gold has historically acted as a store of value during Indian market corrections and currency weakness." },
      ],
    },
    {
      level: 1,
      riskProfile: "Conservative",
      expectedAnnualReturn: "9–11% p.a.",
      volatility: "Low (8–12%)",
      equityPct: 0.40, bondPct: 0.60, amplifier: 0.75,
      profileSummary: "You want meaningful growth without losing sleep over market corrections. India's equity markets can be volatile, but a well-structured 40/60 portfolio gives you meaningful participation in India's economic growth while protecting the majority of your capital in fixed income.",
      rationale: "The portfolio leans on India's most established large-cap ETFs for equity exposure, while the majority of capital sits in government securities and high-quality debt. Gold acts as a traditional Indian hedge. This structure has historically delivered Nifty-beating risk-adjusted returns over full market cycles.",
      keyStrengths: ["40/60 structure has delivered superior risk-adjusted returns in India's historically volatile markets", "Gold allocation reflects India's unique market dynamics — gold outperforms Indian equities during risk-off periods", "Large-cap focus avoids the liquidity risks common in Indian mid and small-cap stocks"],
      considerations: ["Underperforms pure equity in bull markets — acceptable trade-off for meaningful downside protection", "India's inflation has historically run at 5–6%, so real returns need to be assessed in that context"],
      holdings: [
        { ticker: "NIFTYBEES", name: "Nippon India ETF Nifty 50 BeES", type: "ETF", allocation: 25, sector: "Large Cap Equity", rationale: "Core Nifty 50 exposure — the bedrock of any Indian equity portfolio." },
        { ticker: "GILT", name: "SBI Nifty India Government Securities ETF", type: "ETF", allocation: 20, sector: "Government Bonds", rationale: "Sovereign debt providing stable income with no credit risk." },
        { ticker: "LIQUIDBEES", name: "Nippon India ETF Liquid BeES", type: "ETF", allocation: 15, sector: "Liquid / Money Market", rationale: "Capital preservation and liquidity buffer for opportunities during market corrections." },
        { ticker: "ICICIB22", name: "ICICI Prudential Corporate Bond ETF", type: "ETF", allocation: 15, sector: "Corporate Bonds", rationale: "Investment-grade corporate bonds delivering above-government yields." },
        { ticker: "GOLDBEES", name: "Nippon India ETF Gold BeES", type: "ETF", allocation: 15, sector: "Gold", rationale: "Traditional Indian store of value; historically inversely correlated with equity markets." },
        { ticker: "JUNIORBEES", name: "Nippon India ETF Nifty Next 50 BeES", type: "ETF", allocation: 10, sector: "Large-Mid Cap Equity", rationale: "The next 50 companies by market cap — historically outperforms Nifty 50 over long periods." },
      ],
    },
    {
      level: 2,
      riskProfile: "Moderate",
      expectedAnnualReturn: "11–14% p.a.",
      volatility: "Moderate (13–18%)",
      equityPct: 0.65, bondPct: 0.35, amplifier: 1.0,
      profileSummary: "You believe in India's long-term growth story and are comfortable riding its market cycles. A majority-equity portfolio gives you meaningful exposure to India's expanding economy, while the fixed income and gold allocation keep volatility at a level that doesn't disrupt your financial plans.",
      rationale: "India has one of the best long-term equity compounding stories in the world. A 65/35 equity-heavy allocation — spread across Nifty 50, mid-caps, and select individual leaders like Reliance and HDFC Bank — captures this growth. The debt sleeve absorbs shocks from India's periodic sharp corrections.",
      keyStrengths: ["India's GDP growth rate (6–8%) provides a strong tailwind for equity compounding over 10+ years", "Mid-cap allocation (MIDFTY) has historically delivered 2–3% annual alpha over Nifty 50 over long periods", "Individual stock positions in category leaders provide additional return potential above index"],
      considerations: ["Indian mid-caps can fall 30–40% in corrections before recovering — patience is essential", "Concentration in Indian markets means no geographic diversification; global events that impact emerging markets will hit hard"],
      holdings: [
        { ticker: "NIFTYBEES", name: "Nippon India ETF Nifty 50 BeES", type: "ETF", allocation: 25, sector: "Large Cap Equity", rationale: "The core allocation — efficient, low-cost, and tracks India's most financially sound companies." },
        { ticker: "MIDFTY", name: "Nippon India ETF Nifty Midcap 150", type: "ETF", allocation: 15, sector: "Mid Cap Equity", rationale: "Mid-cap exposure to capture India's next generation of large-cap companies while they're still growing fast." },
        { ticker: "RELIANCE", name: "Reliance Industries Ltd", type: "Stock", allocation: 10, sector: "Energy / Retail / Digital", rationale: "India's largest conglomerate with dominant positions in energy, telecom, and retail — a proxy for India's economy." },
        { ticker: "HDFCBANK", name: "HDFC Bank Ltd", type: "Stock", allocation: 10, sector: "Banking / Financial Services", rationale: "India's most well-managed private bank; a compounding machine for the past two decades." },
        { ticker: "GILT", name: "SBI Nifty India Government Securities ETF", type: "ETF", allocation: 15, sector: "Government Bonds", rationale: "Sovereign debt anchor providing stability when equity markets correct sharply." },
        { ticker: "GOLDBEES", name: "Nippon India ETF Gold BeES", type: "ETF", allocation: 10, sector: "Gold", rationale: "Gold remains a critical portfolio diversifier in the Indian context — performs well when equities don't." },
        { ticker: "INFOSYS", name: "Infosys Ltd", type: "Stock", allocation: 8, sector: "IT Services", rationale: "India's second-largest IT exporter with global revenue streams, providing USD earnings in an INR portfolio." },
        { ticker: "LIQUIDBEES", name: "Nippon India ETF Liquid BeES", type: "ETF", allocation: 7, sector: "Liquid / Money Market", rationale: "Liquidity buffer to capitalise on market dips without selling long-term equity positions." },
      ],
    },
    {
      level: 3,
      riskProfile: "Aggressive",
      expectedAnnualReturn: "14–18% p.a.",
      volatility: "High (20–28%)",
      equityPct: 0.85, bondPct: 0.15, amplifier: 1.2,
      profileSummary: "You're fully committed to India's growth story and you're willing to endure the volatility that comes with it. This portfolio is equity-heavy with a tilt toward mid-caps, high-growth sectors, and India's best individual businesses — built to compound significantly over a 10+ year horizon.",
      rationale: "An aggressive Indian portfolio needs significant mid and small-cap exposure alongside sector-specific bets. India's IT sector, banking sector, and consumer companies are global-standard compounders. The concentrated equity positions in India's category leaders — TCS, Reliance, HDFC Bank — provide stability within an otherwise aggressive structure.",
      keyStrengths: ["Mid and small-cap tilt has historically generated 4–6% annual alpha over Nifty 50 in India over 15+ years", "IT sector provides USD revenue exposure — a natural hedge against INR depreciation", "India's banking sector is entering a multi-decade credit expansion cycle as the economy formalises"],
      considerations: ["Sharp drawdowns of 35–50% are not unusual for aggressive Indian portfolios during global risk-off events", "Small-cap liquidity can be poor during market corrections — may be difficult to exit positions at fair prices"],
      holdings: [
        { ticker: "NIFTYBEES", name: "Nippon India ETF Nifty 50 BeES", type: "ETF", allocation: 20, sector: "Large Cap Equity", rationale: "Diversified foundation across India's 50 largest companies as a ballast against individual stock risk." },
        { ticker: "MIDFTY", name: "Nippon India ETF Nifty Midcap 150", type: "ETF", allocation: 20, sector: "Mid Cap Equity", rationale: "The sweet spot of Indian equity — companies large enough to be liquid, small enough to still grow fast." },
        { ticker: "TCS", name: "Tata Consultancy Services Ltd", type: "Stock", allocation: 12, sector: "IT Services", rationale: "India's crown jewel IT company — global revenues, exceptional margins, and decades of reliable compounding." },
        { ticker: "RELIANCE", name: "Reliance Industries Ltd", type: "Stock", allocation: 12, sector: "Energy / Retail / Digital", rationale: "India's most diversified conglomerate with massive capital allocation into Jio, Reliance Retail, and green energy." },
        { ticker: "HDFCBANK", name: "HDFC Bank Ltd", type: "Stock", allocation: 10, sector: "Banking", rationale: "The defining private sector bank of India's credit expansion — quality compounding at scale." },
        { ticker: "BANKBEES", name: "Nippon India ETF Bank BeES", type: "ETF", allocation: 10, sector: "Banking Sector", rationale: "Broad exposure to India's private banking sector, which benefits directly from India's economic formalisation." },
        { ticker: "GOLDBEES", name: "Nippon India ETF Gold BeES", type: "ETF", allocation: 8, sector: "Gold", rationale: "Tactical gold position to deploy into equities opportunistically during severe market corrections." },
        { ticker: "LIQUIDBEES", name: "Nippon India ETF Liquid BeES", type: "ETF", allocation: 8, sector: "Liquid / Money Market", rationale: "Dry powder held in liquid form, ready to be deployed into equities during corrections." },
      ],
    },
    {
      level: 4,
      riskProfile: "Very Aggressive",
      expectedAnnualReturn: "16–22% p.a.",
      volatility: "Very High (25–35%)",
      equityPct: 0.95, bondPct: 0.05, amplifier: 1.4,
      profileSummary: "Maximum conviction in India's equity markets. You're here for long-term wealth creation and you accept that the path will include sharp drawdowns. This portfolio concentrates in India's highest-growth companies and sectors — the ones driving the country's transformation over the next two decades.",
      rationale: "A near-100% equity portfolio concentrated in India's highest-quality compounders and high-growth sectors. Mid and small-caps dominate because that's where India's next generation of Nifty 50 companies are being built today. Individual stock selection focuses on companies with durable competitive advantages and multi-decade growth runways. This is not a diversified portfolio — it's a high-conviction bet on India.",
      keyStrengths: ["India's equity markets have delivered some of the best long-term returns of any major emerging market", "Concentration in quality mid and small-caps captures India's structural economic shift at an early stage", "IT and financial services companies provide global earnings exposure within an India-focused portfolio"],
      considerations: ["A 40–60% drawdown is possible in a severe bear market — requires absolute conviction to hold", "Small-cap liquidity is a genuine risk; some positions may not be sellable quickly at fair prices during a crisis", "Only appropriate for a portion of total wealth — ensure you have adequate liquid reserves outside this portfolio"],
      holdings: [
        { ticker: "MIDFTY", name: "Nippon India ETF Nifty Midcap 150", type: "ETF", allocation: 22, sector: "Mid Cap Equity", rationale: "The engine of this portfolio — India's fastest-growing publicly listed mid-sized companies." },
        { ticker: "TCS", name: "Tata Consultancy Services Ltd", type: "Stock", allocation: 15, sector: "IT Services", rationale: "India's most internationalised company — global revenues in USD with India-level costs provide structural margin advantage." },
        { ticker: "RELIANCE", name: "Reliance Industries Ltd", type: "Stock", allocation: 13, sector: "Diversified", rationale: "India's largest private company by market cap, aggressively investing in the next decade's growth sectors." },
        { ticker: "HDFCBANK", name: "HDFC Bank Ltd", type: "Stock", allocation: 12, sector: "Banking", rationale: "Two decades of 20%+ loan growth with class-leading asset quality — the defining bank of Indian economic growth." },
        { ticker: "NIFTYBEES", name: "Nippon India ETF Nifty 50 BeES", type: "ETF", allocation: 15, sector: "Large Cap Equity", rationale: "Diversification anchor — ensures exposure to the full Nifty 50 even in a concentrated stock portfolio." },
        { ticker: "WIPRO", name: "Wipro Ltd", type: "Stock", allocation: 10, sector: "IT Services", rationale: "Under-appreciated relative to TCS/Infosys — significant restructuring upside under new leadership." },
        { ticker: "BANKBEES", name: "Nippon India ETF Bank BeES", type: "ETF", allocation: 8, sector: "Banking Sector", rationale: "Broad private banking exposure as India's formalisation of credit continues to accelerate." },
        { ticker: "LIQUIDBEES", name: "Nippon India ETF Liquid BeES", type: "ETF", allocation: 5, sector: "Liquid / Money Market", rationale: "Minimal liquid reserve to seize opportunities during sharp market corrections." },
      ],
    },
  ];
}

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.post("/api/recommend", (req, res) => {
  const { profile, userInfo, tuneLevel } = req.body;
  if (!profile) return res.status(400).json({ error: "Profile is required" });

  const country = userInfo?.country || "US";
  const isIndia = country === "IN";

  setTimeout(() => {
    const recommendation = buildPortfolio(profile, tuneLevel, isIndia);

    // Save to database
    try {
      insertSubmission.run({
        name: userInfo?.name || null,
        email: userInfo?.email || null,
        phone: userInfo?.phone || null,
        country: userInfo?.country || null,
        profile: JSON.stringify(profile),
        risk_profile: recommendation.riskProfile,
        tune_level: tuneLevel ?? recommendation.profileLevel,
      });
    } catch (e) {
      console.error("DB save error:", e.message);
    }

    res.json(recommendation);
  }, 3000);
});

// View all submissions (admin)
app.get("/api/submissions", (req, res) => {
  const rows = db.prepare("SELECT id, name, email, phone, risk_profile, tune_level, created_at FROM submissions ORDER BY created_at DESC").all();
  res.json(rows);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Laxmi backend running on port ${PORT}`));
