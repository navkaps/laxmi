const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// PDF text extraction using pdf2json
let PDFParser = null;
try { PDFParser = require("pdf2json"); } catch (e) { console.warn("pdf2json not available:", e.message); }

function extractPDFText(filePath) {
  return new Promise((resolve, reject) => {
    if (!PDFParser) return reject(new Error("PDF parser not available"));
    const parser = new PDFParser(null, 1);
    parser.on("pdfParser_dataReady", (data) => {
      try {
        const text = decodeURIComponent(
          data.Pages.flatMap(p => p.Texts.map(t => t.R.map(r => r.T).join(" "))).join("\n")
        );
        resolve(text);
      } catch { resolve(""); }
    });
    parser.on("pdfParser_dataError", reject);
    parser.loadPDF(filePath);
  });
}

// csv-parse: support both v4 (sync export) and v5+ (sync subpath)
let csvParseSync;
try { csvParseSync = require("csv-parse/sync").parse; } catch {
  try { csvParseSync = require("csv-parse").parse; } catch { csvParseSync = null; }
}

const upload = multer({ dest: path.join(__dirname, "uploads/"), limits: { fileSize: 20 * 1024 * 1024 } });

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
app.post("/api/recommend", async (req, res) => {
  const { profile, userInfo, tuneLevel } = req.body;
  if (!profile) return res.status(400).json({ error: "Profile is required" });

  const country = userInfo?.country || "US";
  const isIndia = country === "IN";

  // Build the 5 static profile labels for the tuner slider (kept as metadata)
  const allProfiles = isIndia ? getIndiaPortfolioProfiles() : getPortfolioProfiles();
  const allProfilesMeta = allProfiles.map(({ level, riskProfile, expectedAnnualReturn, volatility }) => ({
    level, riskProfile, expectedAnnualReturn, volatility,
  }));

  // Determine the target risk level (0=very conservative … 4=aggressive)
  const riskMap = { steady: 0, balanced: 2, growth: 4 };
  const crashMap = { sell_all: -1, sell_some: 0, hold: 1, buy_more: 2 };
  const goalMap = { preserve: -1, income: 0, retirement: 1, wealth_building: 2, retire_early: 2 };
  const age = Number(profile.age) || 35;
  const ageFactor = age > 55 ? -1 : age < 35 ? 1 : 0;
  const maxLoss = Number(profile.max_loss) || 20;
  const lossAdjust = maxLoss < 15 ? -1 : maxLoss > 30 ? 1 : 0;
  const baseScore = (riskMap[profile.risk_visual] ?? 2) + (crashMap[profile.crash_behavior] ?? 0) + (goalMap[profile.goal] ?? 1) + ageFactor + lossAdjust;
  const profileLevel = Math.max(0, Math.min(4, Math.round(baseScore / 1.4)));
  const level = tuneLevel !== undefined && tuneLevel !== null ? Math.max(0, Math.min(4, tuneLevel)) : profileLevel;
  const riskLabel = allProfilesMeta[level].riskProfile;

  const systemPrompt = `You are Laxmi, a sharp and empathetic AI financial advisor. You generate deeply personalized investment portfolio recommendations — not generic templates. Every response must reflect the specific investor's profile, goals, age, and behavior.

You always respond with a single valid JSON object. No markdown, no commentary, only the JSON.`;

  const userPrompt = `Generate a personalized investment portfolio recommendation for this investor:

Profile:
- Age: ${profile.age}
- Country: ${isIndia ? "India" : "United States"}
- Goal: ${profile.goal}
- Investment timeline: ${profile.timeline ? `${profile.timeline} years` : "not specified"}
- Initial investment amount: ${profile.initial_amount ? `${isIndia ? "₹" : "$"}${Number(profile.initial_amount).toLocaleString()}` : "not specified"}
- Monthly contribution: ${profile.monthly_contribution != null ? (Number(profile.monthly_contribution) === 0 ? "none" : `${isIndia ? "₹" : "$"}${Number(profile.monthly_contribution).toLocaleString()}/month`) : "not specified"}
- Target portfolio value: ${profile.target_value ? `${isIndia ? "₹" : "$"}${Number(profile.target_value).toLocaleString()}` : "not specified"}
- Income stability: ${profile.income_stability || "not specified"}
- Account type: ${profile.account_type || "not specified"}
- Risk appetite (self-described): ${profile.risk_visual}
- Crash behavior: ${profile.crash_behavior}
- Max acceptable loss: ${profile.max_loss}%
- Target risk level: ${riskLabel} (level ${level} of 4)
${profile.wishlist ? `- Specific wishlist / exclusions (MUST be honoured): ${profile.wishlist}` : ""}
${profile.focus_areas?.length ? `- Sectors to lean into: ${profile.focus_areas.join(", ")}` : ""}
${profile.avoid_areas?.length ? `- Sectors/instruments to exclude: ${profile.avoid_areas.join(", ")}` : ""}

Return a JSON object with exactly these fields:
{
  "riskProfile": "${riskLabel}",
  "profileLevel": ${level},
  "expectedAnnualReturn": "e.g. 7–10% p.a.",
  "volatility": "e.g. Moderate (12–18%)",
  "profileSummary": "2–3 sentence paragraph describing this specific investor and why this portfolio suits them. Make it feel personal.",
  "rationale": "2–3 sentence paragraph explaining the portfolio construction logic.",
  "keyStrengths": ["3 specific strengths of this portfolio for this investor"],
  "considerations": ["3 honest risks or caveats for this specific investor"],
  "holdings": [
    {
      "ticker": "${isIndia ? "e.g. NIFTYBEES" : "e.g. VTI"}",
      "name": "Full fund or stock name",
      "type": "ETF or Stock or Bond",
      "allocation": 25,
      "sector": "Sector name",
      "rationale": "1 sentence specific to this investor's situation"
    }
  ]
}

Holdings rules:
- Use ${isIndia ? "Indian market tickers (NSE/BSE)" : "US market tickers"}.
- Allocations must sum to exactly 100.
- Include 5–8 holdings appropriate for the ${riskLabel} risk level.
- Account type matters: if account_type is roth_ira put highest-growth assets there; if 401k reflect limited fund selection; if demat reflect Indian tax rules (LTCG/STCG); etc.
- Initial amount and monthly contribution matter: small amounts should favour low-cost broad ETFs over individual stocks; large amounts can diversify more.
- Timeline matters: short timelines (<5 years) need more conservative positioning regardless of risk appetite.
- Income stability matters: variable/entrepreneurial income needs more liquidity buffer than stable salaried income.
- Vary holdings and rationale based on ALL the profile data above. Do NOT use generic templates.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const recommendation = JSON.parse(raw);

    // Attach backtest data using equity/bond split inferred from holdings
    const equityPct = level >= 3 ? 0.85 : level === 2 ? 0.65 : level === 1 ? 0.45 : 0.25;
    const bondPct = 1 - equityPct;
    const amplifier = 0.6 + level * 0.2;
    recommendation.backtestData = generateBacktest(equityPct, bondPct, amplifier);
    recommendation.profileLevel = level;
    recommendation.allProfiles = allProfilesMeta;

    // Save to database
    try {
      insertSubmission.run({
        name: userInfo?.name || null,
        email: userInfo?.email || null,
        phone: userInfo?.phone || null,
        country: userInfo?.country || null,
        profile: JSON.stringify(profile),
        risk_profile: recommendation.riskProfile,
        tune_level: level,
      });
    } catch (e) {
      console.error("DB save error:", e.message);
    }

    res.json(recommendation);
  } catch (e) {
    console.error("Claude API error:", e.message);
    res.status(500).json({ error: "Failed to generate recommendation. Please try again." });
  }
});

// ─── Portfolio assessment ────────────────────────────────────────────────────────
const TICKER_SECTORS = {
  // US Broad Market ETFs
  VTI: "Broad US Equity", VXUS: "International Equity", QQQ: "Technology / Nasdaq",
  SPY: "Broad US Equity", IVV: "Broad US Equity", VOO: "Broad US Equity",
  // Bonds
  BND: "Fixed Income", AGG: "Fixed Income", TLT: "Long-Term Bonds",
  SCHP: "Inflation-Protected Bonds", VCIT: "Corporate Bonds", LQD: "Corporate Bonds",
  // Sectors
  VGT: "Technology", XLK: "Technology", ARKK: "Disruptive Innovation",
  VHT: "Healthcare", XLV: "Healthcare", XLE: "Energy", XLF: "Financials",
  VNQ: "Real Estate", O: "Real Estate", AMT: "Real Estate",
  VYM: "Dividend Equities", SCHD: "Dividend Equities", HDV: "Dividend Equities",
  GOLDBEES: "Gold", GLD: "Gold", IAU: "Gold",
  // US Stocks
  AAPL: "Technology", MSFT: "Technology", NVDA: "Semiconductors",
  AMZN: "Technology / E-Commerce", META: "Technology", GOOGL: "Technology",
  GOOG: "Technology", TSLA: "Consumer / EV", BRK: "Financials",
  JPM: "Financials", JNJ: "Healthcare", UNH: "Healthcare",
  // India ETFs
  NIFTYBEES: "Large Cap India Equity", JUNIORBEES: "Large-Mid Cap India Equity",
  MIDFTY: "Mid Cap India Equity", BANKBEES: "India Banking",
  LIQUIDBEES: "Liquid / Money Market", GILT: "India Government Bonds",
  ICICIB22: "India Corporate Bonds", MAFSETF90: "India ESG Equity",
  // India Stocks
  RELIANCE: "Energy / Retail / Digital", TCS: "IT Services",
  HDFCBANK: "Banking", INFOSYS: "IT Services", WIPRO: "IT Services",
};

function assessPortfolio(holdings) {
  const total = holdings.reduce((s, h) => s + h.allocation, 0);

  // Sector breakdown
  const sectorMap = {};
  holdings.forEach((h) => {
    const sector = TICKER_SECTORS[h.ticker.toUpperCase()] || "Other";
    sectorMap[sector] = (sectorMap[sector] || 0) + (h.allocation / total) * 100;
  });
  const sectorBreakdown = Object.entries(sectorMap)
    .map(([sector, weight]) => ({ sector, weight: Math.round(weight) }))
    .sort((a, b) => b.weight - a.weight);

  // Scoring
  let score = 60;
  const numHoldings = holdings.length;
  const techWeight = (sectorMap["Technology"] || 0) + (sectorMap["Technology / Nasdaq"] || 0) + (sectorMap["Semiconductors"] || 0) + (sectorMap["Disruptive Innovation"] || 0);
  const fixedIncomeWeight = (sectorMap["Fixed Income"] || 0) + (sectorMap["Long-Term Bonds"] || 0) + (sectorMap["Corporate Bonds"] || 0) + (sectorMap["Inflation-Protected Bonds"] || 0);
  const intlWeight = sectorMap["International Equity"] || 0;
  const goldWeight = sectorMap["Gold"] || 0;
  const largestPosition = Math.max(...holdings.map((h) => (h.allocation / total) * 100));

  if (numHoldings >= 5) score += 10;
  if (numHoldings >= 8) score += 5;
  if (intlWeight > 10) score += 8;
  if (fixedIncomeWeight > 10) score += 7;
  if (goldWeight >= 3 && goldWeight <= 15) score += 5;
  if (largestPosition > 40) score -= 15;
  if (largestPosition > 25) score -= 8;
  if (techWeight > 50) score -= 12;
  if (techWeight > 35) score -= 5;
  if (numHoldings < 3) score -= 10;
  score = Math.max(10, Math.min(98, score));

  // Risk profile
  const equityWeight = 100 - fixedIncomeWeight - (sectorMap["Liquid / Money Market"] || 0) - goldWeight;
  const riskProfile =
    equityWeight > 85 ? "Aggressive" :
    equityWeight > 65 ? "Moderate–Aggressive" :
    equityWeight > 45 ? "Moderate" :
    equityWeight > 25 ? "Conservative" : "Very Conservative";

  // Strengths
  const strengths = [];
  if (numHoldings >= 5) strengths.push(`Good diversification with ${numHoldings} distinct positions reduces single-security risk.`);
  if (fixedIncomeWeight > 10) strengths.push(`${Math.round(fixedIncomeWeight)}% fixed income allocation provides downside cushion and income stability.`);
  if (intlWeight > 10) strengths.push(`International exposure (${Math.round(intlWeight)}%) reduces concentration in any single economy.`);
  if (goldWeight >= 3) strengths.push(`Gold allocation (${Math.round(goldWeight)}%) acts as a store of value and hedge against equity drawdowns.`);
  if (techWeight >= 10 && techWeight <= 35) strengths.push("Technology exposure is meaningful without becoming a concentration risk.");
  if (strengths.length === 0) strengths.push("The portfolio holds real assets with long-term compounding potential.");

  // Risks
  const risks = [];
  if (largestPosition > 30) risks.push(`Largest single position represents ${Math.round(largestPosition)}% of the portfolio — a single bad outcome has outsized impact.`);
  if (techWeight > 40) risks.push(`Technology concentration (${Math.round(techWeight)}%) exposes the portfolio to sector-specific regulatory, valuation, or cycle risk.`);
  if (intlWeight < 10) risks.push("No meaningful international diversification — the portfolio is highly sensitive to US-specific market events.");
  if (fixedIncomeWeight < 5 && equityWeight > 80) risks.push("Near-zero fixed income means the portfolio could drawdown 35–50% in a severe bear market with no cushion.");
  if (numHoldings < 4) risks.push("Fewer than 4 holdings — highly concentrated. A single holding failure could materially impair the portfolio.");
  if (risks.length === 0) risks.push("Low obvious structural risks detected — focus on maintaining disciplined rebalancing.");

  // Suggestions — specific, actionable with real ticker recommendations
  const suggestions = [];
  const sortedBySize = [...holdings].sort((a, b) => (b.allocation / total) - (a.allocation / total));
  const biggestTicker = sortedBySize[0]?.ticker;

  if (largestPosition > 25) {
    const targetAlloc = Math.round(largestPosition / 2);
    const trimBy = Math.round(largestPosition - targetAlloc);
    suggestions.push({
      action: `Trim ${biggestTicker}: reduce from ${Math.round(largestPosition)}% to ~${targetAlloc}%`,
      detail: `${biggestTicker} is ${Math.round(largestPosition)}% of your portfolio — any adverse event in a single stock has outsized impact. Sell ~${trimBy}% and redirect into a broad ETF like VTI or SPY to maintain your growth exposure with far less single-stock risk.`,
    });
  }

  if (techWeight > 40) {
    const techTickers = holdings
      .filter(h => ["Technology", "Technology / Nasdaq", "Semiconductors", "Disruptive Innovation", "Technology / E-Commerce"].includes(TICKER_SECTORS[h.ticker.toUpperCase()]))
      .sort((a, b) => b.allocation - a.allocation);
    const topTech = techTickers[0]?.ticker;
    suggestions.push({
      action: `Rotate ${Math.round(techWeight - 30)}% out of tech into other sectors`,
      detail: `Technology is ${Math.round(techWeight)}% of your portfolio. Consider trimming ${topTech || "your largest tech position"} and rotating into VHT (Healthcare ETF), XLF (Financials ETF), or VXUS (International) — sectors that typically hold up when tech corrects.`,
    });
  }

  if (intlWeight < 8) {
    suggestions.push({
      action: "Add VXUS: 15–20% international allocation",
      detail: `Your portfolio has no international exposure — it moves entirely with US market cycles. Allocating 15–20% to VXUS (Vanguard Total International Stock ETF) gives you exposure to Europe, Asia, and emerging markets and has historically reduced drawdowns by 5–10% in US-specific crises.`,
    });
  }

  if (fixedIncomeWeight < 5 && equityWeight > 75) {
    suggestions.push({
      action: "Add BND: 10–15% bonds for downside protection",
      detail: `With ${Math.round(equityWeight)}% in equities and near-zero fixed income, this portfolio could drop 40–50% in a severe bear market. A 10–15% allocation to BND (Vanguard Total Bond Market ETF) acts as a cushion — it rises when equities fall, giving you dry powder to rebalance at market lows.`,
    });
  }

  if (numHoldings < 4) {
    suggestions.push({
      action: "Expand to 8–12 holdings for resilience",
      detail: `With only ${numHoldings} position${numHoldings === 1 ? "" : "s"}, a single bad outcome is highly material. Consider replacing concentrated individual stocks with diversified ETFs: VTI (US broad market), VXUS (international), BND (bonds), and VGT (technology sector) provide nearly the same return profile with dramatically less risk.`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      action: "Rebalance annually — your structure is solid",
      detail: "Your portfolio is well-diversified. Set a calendar reminder to review allocations once a year: trim any position that has drifted more than 5% above its target weight and redeploy into underweight positions. This alone adds ~0.5% annual return through systematic low-buy-high-sell discipline.",
    });
  }

  const verdict =
    score >= 80 ? "A well-constructed portfolio with thoughtful diversification. Minor adjustments could improve efficiency, but the core structure is sound."
    : score >= 60 ? "A reasonable portfolio with clear strengths, but some structural improvements would meaningfully reduce risk and improve long-term outcomes."
    : "This portfolio has meaningful concentration risks that should be addressed. Restructuring around the suggestions above would lead to better risk-adjusted returns.";

  return { overallRisk: riskProfile, score, summary: `Your ${numHoldings}-position portfolio has a ${riskProfile.toLowerCase()} risk profile with ${Math.round(equityWeight)}% equity exposure. ${score >= 70 ? "The overall structure is solid with room for refinement." : "There are some concentration and diversification issues worth addressing."}`, strengths, risks, sectorBreakdown, suggestions, verdict };
}

// ─── Portfolio file parser ───────────────────────────────────────────────────────

// Exhaustive column name patterns for real brokerage exports
const TICKER_KEYS   = ["symbol", "ticker", "stock", "security", "holding", "holdings", "instrument", "asset", "fund", "cusip", "name"];
const ALLOC_KEYS    = ["percent of account", "% of account", "percent_of_portfolio", "% of portfolio", "portfolio %", "portfolio weight", "% weight", "weight", "allocation", "alloc", "pct", "account %", "portfolio percent", "% of total", "percentage", "portion"];
const VALUE_KEYS    = ["current value", "market value", "total value ($)", "total value", "market val", "value", "equity", "amount", "position value", "mkt value"];

function findColumnKey(rowKeys, patterns) {
  // Exact match first
  for (const pat of patterns) {
    const found = rowKeys.find(k => k.toLowerCase().trim() === pat);
    if (found) return found;
  }
  // Substring match
  for (const pat of patterns) {
    const clean = pat.replace(/[%\s]/g, "");
    const found = rowKeys.find(k => k.toLowerCase().replace(/[%\s]/g, "").includes(clean));
    if (found) return found;
  }
  return null;
}

function isValidTicker(str) {
  const s = String(str || "").trim().toUpperCase().replace(/['"]/g, "");
  const excluded = ["TOTAL", "CASH", "N/A", "NA", "PENDING", "ACCOUNT", "BALANCE", "OTHER",
    "YTD", "ETF", "INC", "LLC", "LTD", "CORP", "USD", "EUR", "GBP", "INR", "CAD", "AUD",
    "AND", "THE", "FOR", "TAX", "NET", "FEE", "DIV", "INT", "QTY", "EXT", "EST", "PER",
    "NEW", "ALL", "ANY", "OUT", "BUY", "SELL", "QTR", "ANN", "AVG"];
  return s.length >= 1 && s.length <= 10 && /^[A-Z][A-Z0-9.\-]*$/.test(s) && !excluded.includes(s);
}

function normaliseHoldings(rows) {
  if (!rows || rows.length === 0) return [];

  const rowKeys = Object.keys(rows[0]);

  // ── 1. Name-based column detection ───────────────────────────────────────────
  let tickerKey = findColumnKey(rowKeys, TICKER_KEYS);
  let allocKey  = findColumnKey(rowKeys, ALLOC_KEYS);
  let valueKey  = findColumnKey(rowKeys, VALUE_KEYS);

  // ── 2. Content-based fallback — detect columns by what's actually in them ────
  // This handles any brokerage CSV regardless of column naming convention.
  if (!tickerKey) {
    // Ticker column: >50% of non-empty values pass isValidTicker
    for (const key of rowKeys) {
      const vals = rows.map(r => String(r[key] || "").trim()).filter(Boolean);
      const valid = vals.filter(v => isValidTicker(v.toUpperCase().replace(/['"]/g, "")));
      if (vals.length > 0 && valid.length / vals.length > 0.5) { tickerKey = key; break; }
    }
  }

  if (!allocKey && !valueKey) {
    // Find numeric columns — check if they look like percentages (sum ≈ 100) or market values (large $)
    const numericCols = rowKeys
      .filter(k => k !== tickerKey)
      .map(key => {
        const nums = rows.map(r => parseFloat(String(r[key] || "").replace(/[$%,\s]/g, ""))).filter(n => !isNaN(n) && n > 0);
        return { key, nums, sum: nums.reduce((s, v) => s + v, 0), max: Math.max(...nums, 0) };
      })
      .filter(c => c.nums.length / rows.length > 0.4);

    // Allocation column: all values ≤ 100 AND they sum close to 100
    const pctCol = numericCols.find(c => c.max <= 100 && c.sum > 80 && c.sum < 120);
    if (pctCol) { allocKey = pctCol.key; }
    // Value column: has numbers > $100 (market values)
    else {
      const valCol = numericCols.find(c => c.max > 100);
      if (valCol) valueKey = valCol.key;
    }
  }

  if (!tickerKey) {
    console.log("No ticker column found. Available keys:", rowKeys);
    return [];
  }

  const rawHoldings = [];

  rows.forEach((row) => {
    const ticker = String(row[tickerKey] || "").trim().toUpperCase().replace(/['"]/g, "");
    if (!isValidTicker(ticker)) return;

    let allocation = null;

    if (allocKey) {
      const raw = String(row[allocKey] || "").replace(/[%,$\s"]/g, "");
      const n = parseFloat(raw);
      if (!isNaN(n) && n > 0 && n <= 100) allocation = n;
    }

    if (allocation) {
      rawHoldings.push({ ticker, allocation });
    } else if (valueKey) {
      const raw = String(row[valueKey] || "").replace(/[%,$\s,"]/g, "");
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0) rawHoldings.push({ ticker, value: val });
    }
  });

  // If holdings have value (not %) — calculate percentages
  if (rawHoldings.length > 0 && rawHoldings[0].value !== undefined) {
    const total = rawHoldings.reduce((s, h) => s + (h.value || 0), 0);
    if (total <= 0) return [];
    return rawHoldings
      .map(h => ({ ticker: h.ticker, allocation: Math.round((h.value / total) * 1000) / 10 }))
      .filter(h => h.allocation >= 0.1);
  }

  return rawHoldings;
}

// For CSVs with metadata rows before the actual header — scan for real header row
function parseCSVWithSmartHeader(content) {
  const lines = content.split("\n").filter(l => l.trim());

  // Try to find the line that looks like a column header
  let headerLine = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (TICKER_KEYS.some(k => lower.includes(k)) ||
        ALLOC_KEYS.some(k => lower.includes(k)) ||
        VALUE_KEYS.some(k => lower.includes(k))) {
      headerLine = i;
      break;
    }
  }

  const dataContent = lines.slice(headerLine).join("\n");
  if (!csvParseSync) throw new Error("csv-parse not available");
  return csvParseSync(dataContent, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true, relax_column_count: true });
}

// Extract holdings from PDF text
function extractFromPDFText(text) {
  const holdings = [];
  const seen = new Set();

  // Pattern 1: "AAPL 8.45%" or "VTI 30.2 %" anywhere on a line
  const pct1 = /\b([A-Z][A-Z0-9]{1,8})\b[^\n]{0,60}?(\d{1,3}(?:\.\d{1,2})?)\s*%/g;
  for (const m of text.matchAll(pct1)) {
    const ticker = m[1], pct = parseFloat(m[2]);
    if (isValidTicker(ticker) && pct > 0 && pct <= 100 && !seen.has(ticker)) {
      seen.add(ticker);
      holdings.push({ ticker, allocation: pct });
    }
  }

  if (holdings.length > 0) return holdings;

  // Pattern 2: lines like "AAPL  Apple Inc  100  $185  $18500  8.45"
  // where the last number on a line with a ticker is the %
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  lines.forEach(line => {
    const tickerMatch = line.match(/^([A-Z][A-Z0-9]{1,8})\b/);
    if (!tickerMatch) return;
    const ticker = tickerMatch[1];
    if (!isValidTicker(ticker) || seen.has(ticker)) return;
    const nums = [...line.matchAll(/\b(\d{1,3}(?:\.\d{1,2})?)\b/g)]
      .map(m => parseFloat(m[1]))
      .filter(n => n > 0 && n <= 100);
    if (nums.length > 0) {
      seen.add(ticker);
      holdings.push({ ticker, allocation: nums[nums.length - 1] });
    }
  });

  return holdings;
}

// Coordinate-based extraction — three strategies to handle different brokerage layouts.
function extractFromPDFStructured(pdfData) {
  const seen = new Set();

  // Collect all text elements with their position
  const allElements = [];
  for (let pi = 0; pi < (pdfData.Pages || []).length; pi++) {
    for (const t of (pdfData.Pages[pi].Texts || [])) {
      try {
        const text = decodeURIComponent(t.R.map(r => r.T).join("")).trim();
        if (text) allElements.push({ page: pi, x: t.x, y: t.y, text });
      } catch { /* malformed URI encoding */ }
    }
  }
  allElements.sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);

  // ── Strategy 1: Row-based (ticker + % on the same horizontal row) ──────────
  // Handles CSV-style PDF tables: Fidelity, Schwab, Vanguard exports
  {
    const holdings = [];
    const rowMap = new Map();
    for (const el of allElements) {
      const key = `${el.page}-${Math.round(el.y * 5)}`; // 0.2-unit Y buckets
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key).push(el);
    }
    for (const [, cells] of [...rowMap].sort()) {
      const sorted = cells.sort((a, b) => a.x - b.x);
      const lineText = sorted.map(c => c.text).join(" ");
      const pctMatches = [...lineText.matchAll(/(\d{1,3}(?:\.\d{1,2})?)\s*%/g)];
      if (!pctMatches.length) continue;
      const pct = parseFloat(pctMatches[pctMatches.length - 1][1]);
      if (pct <= 0 || pct > 100) continue;
      const preText = lineText.slice(0, lineText.indexOf(pctMatches[pctMatches.length - 1][0]));
      for (const candidate of (preText.match(/\b([A-Z][A-Z0-9]{0,8})\b/g) || [])) {
        if (isValidTicker(candidate) && !seen.has(candidate)) {
          seen.add(candidate);
          holdings.push({ ticker: candidate, allocation: pct });
          break;
        }
      }
    }
    if (holdings.length > 0) return holdings;
  }

  // ── Strategy 2: Window-based (ticker and % on separate nearby lines) ────────
  // Handles "card" layouts where each holding spans multiple lines
  {
    const holdings = [];
    for (let i = 0; i < allElements.length; i++) {
      const rawTicker = allElements[i].text.replace(/['".,\s]/g, "").toUpperCase();
      if (!isValidTicker(rawTicker) || seen.has(rawTicker)) continue;
      for (let j = i + 1; j < Math.min(i + 12, allElements.length); j++) {
        const m = allElements[j].text.trim().match(/^(\d{1,3}(?:\.\d{1,2})?)\s*%$/);
        if (m) {
          const pct = parseFloat(m[1]);
          if (pct > 0 && pct <= 100) {
            seen.add(rawTicker);
            holdings.push({ ticker: rawTicker, allocation: pct });
            break;
          }
        }
      }
    }
    if (holdings.length > 0) return holdings;
  }

  // ── Strategy 3: "(TICKER)" in security name + Market Value column ──────────
  // Handles E*TRADE / Morgan Stanley statements where each holding is formatted as
  // "COMPANY NAME (TICKER)   qty   price   cost   marketValue   gain   income"
  // No % column exists — we compute % from market values.
  {
    // Find the x-position of the "Market Value" column header
    let mvHeaderX = null;
    for (const el of allElements) {
      if (/^market\s*value$/i.test(el.text) && el.x > 25 && el.x < 45) {
        mvHeaderX = el.x;
        break;
      }
    }

    const rawHoldings = [];
    for (const el of allElements) {
      // Match "COMPANY NAME (TICKER)" — ticker is last word in parentheses
      const m = el.text.match(/\(([A-Z][A-Z0-9'.]{0,9})\)\s*$/);
      if (!m) continue;
      // Skip "Gain/(Loss)", "Total/(Deficit)" and other formula-style expressions
      const parenIdx = el.text.lastIndexOf("(");
      if (parenIdx > 0 && /[\/\-\+]/.test(el.text[parenIdx - 1])) continue;
      const ticker = m[1].replace(/['.]/g, "").toUpperCase(); // normalise BRK'B → BRKB
      if (!isValidTicker(ticker) || seen.has(ticker)) continue;

      // Find the Market Value: a number at the mvHeaderX x-position on the same row
      const sameRow = allElements.filter(e => e.page === el.page && Math.abs(e.y - el.y) < 0.35);
      let marketVal = null;

      if (mvHeaderX !== null) {
        // Look for number closest to the Market Value column header x
        for (const e of sameRow) {
          if (Math.abs(e.x - mvHeaderX) < 3) {
            const n = parseFloat(e.text.replace(/[$,\s]/g, ""));
            if (!isNaN(n) && n > 0) { marketVal = n; break; }
          }
        }
      }

      // Fallback: take the largest positive number on the row (excluding qty/price)
      if (marketVal === null) {
        const nums = sameRow
          .map(e => parseFloat(e.text.replace(/[$,\s]/g, "")))
          .filter(n => !isNaN(n) && n > 50); // holdings worth < $50 are noise
        if (nums.length > 0) marketVal = Math.max(...nums);
      }

      if (marketVal !== null && marketVal > 0) {
        seen.add(ticker);
        rawHoldings.push({ ticker, marketValue: marketVal });
      }
    }

    if (rawHoldings.length > 0) {
      const total = rawHoldings.reduce((s, h) => s + h.marketValue, 0);
      if (total > 0) {
        return rawHoldings
          .map(h => ({ ticker: h.ticker, allocation: Math.round((h.marketValue / total) * 1000) / 10 }))
          .filter(h => h.allocation >= 0.1)
          .sort((a, b) => b.allocation - a.allocation);
      }
    }
  }

  // ── Strategy 4: Generic — leftmost-column ticker + Market Value column ──────
  // Handles Robinhood, TD Ameritrade, Webull, and other ticker-first table layouts.
  // No (TICKER) pattern needed — works on symbol-in-first-column format.
  {
    const mvKeywords = ["market value", "current value", "total value", "mkt value",
                        "market val", "value", "equity", "amount", "position value"];
    let mvX = null;
    for (const el of allElements) {
      if (mvKeywords.some(k => el.text.toLowerCase().trim() === k) && el.x > 10) {
        mvX = el.x; break;
      }
    }

    const rowMap = new Map();
    for (const el of allElements) {
      const key = `${el.page}-${Math.round(el.y * 5)}`;
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key).push(el);
    }

    const rawHoldings = [];
    for (const [, cells] of [...rowMap].sort()) {
      const sorted = cells.sort((a, b) => a.x - b.x);
      if (!sorted.length || sorted[0].x > 5) continue; // ticker must be at far left

      const ticker = sorted[0].text.trim().replace(/['".,]/g, "").toUpperCase();
      if (!isValidTicker(ticker) || seen.has(ticker)) continue;

      let mv = null;
      if (mvX !== null) {
        for (const el of sorted) {
          if (Math.abs(el.x - mvX) < 3) {
            const n = parseFloat(el.text.replace(/[$,\s]/g, ""));
            if (!isNaN(n) && n > 0) { mv = n; break; }
          }
        }
      }
      // No header found — use the largest dollar amount on the row (> $50)
      if (mv === null) {
        const nums = sorted.map(e => parseFloat(e.text.replace(/[$,\s]/g, ""))).filter(n => !isNaN(n) && n > 50);
        if (nums.length) mv = Math.max(...nums);
      }

      if (mv && mv > 0) { seen.add(ticker); rawHoldings.push({ ticker, marketValue: mv }); }
    }

    if (rawHoldings.length >= 2) {
      const total = rawHoldings.reduce((s, h) => s + h.marketValue, 0);
      if (total > 0) {
        return rawHoldings
          .map(h => ({ ticker: h.ticker, allocation: Math.round((h.marketValue / total) * 1000) / 10 }))
          .filter(h => h.allocation >= 0.1)
          .sort((a, b) => b.allocation - a.allocation);
      }
    }
  }

  return [];
}

app.post("/api/parse-portfolio", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  const mime = req.file.mimetype || "";
  const originalName = req.file.originalname.toLowerCase();
  const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

  try {
    // Images — require AI vision
    if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/.test(originalName)) {
      cleanup();
      return res.json({ requiresAI: true });
    }

    // CSV
    if (originalName.endsWith(".csv")) {
      // Read as buffer first to strip BOM and detect encoding
      const buf = fs.readFileSync(filePath);
      // Strip UTF-8 BOM (0xEF 0xBB 0xBF) if present
      const content = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF
        ? buf.slice(3).toString("utf8")
        : buf.toString("utf8");
      cleanup();
      try {
        const rows = parseCSVWithSmartHeader(content);
        const holdings = normaliseHoldings(rows);
        return res.json({ holdings });
      } catch (e) {
        return res.json({ holdings: [], error: "CSV parse error: " + e.message });
      }
    }

    // Excel
    if (originalName.endsWith(".xlsx") || originalName.endsWith(".xls")) {
      const wb = xlsx.readFile(filePath);
      cleanup();
      // Try each sheet, return first one with valid holdings
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(ws, { defval: "", raw: false });
        if (rows.length === 0) continue;
        const holdings = normaliseHoldings(rows);
        if (holdings.length > 0) return res.json({ holdings });
      }
      return res.json({ holdings: [], error: "No recognisable holdings found in this Excel file. Try CSV export." });
    }

    // PDF
    if (originalName.endsWith(".pdf")) {
      if (!PDFParser) {
        cleanup();
        return res.json({ holdings: [], error: "PDF parsing unavailable — please export as CSV from your brokerage." });
      }
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on("pdfParser_dataReady", (data) => {
        cleanup();
        // Try coordinate-based extraction first (handles multi-column table layouts)
        let holdings = extractFromPDFStructured(data);
        // Fallback: linear text extraction
        if (holdings.length === 0) {
          try {
            const text = decodeURIComponent(
              (data.Pages || []).flatMap(p => (p.Texts || []).map(t => t.R.map(r => r.T).join(" "))).join("\n")
            );
            holdings = extractFromPDFText(text);
          } catch { /* ignore */ }
        }
        if (holdings.length > 0) return res.json({ holdings });
        res.json({ holdings: [], error: "Couldn't extract holdings from this PDF. Export as CSV from your brokerage for reliable results." });
      });
      pdfParser.on("pdfParser_dataError", () => {
        cleanup();
        res.json({ holdings: [], error: "PDF could not be read — please export as CSV from your brokerage." });
      });
      pdfParser.loadPDF(filePath);
      return;
    }

    cleanup();
    res.json({ holdings: [], error: "Unsupported file type." });

  } catch (err) {
    cleanup();
    res.status(500).json({ error: "Processing failed: " + err.message });
  }
});

app.post("/api/assess", (req, res) => {
  const { holdings } = req.body;
  if (!holdings?.length) return res.status(400).json({ error: "Holdings required" });
  setTimeout(() => res.json(assessPortfolio(holdings)), 1500);
});

// Debug PDF text extraction (temporary — for diagnosing parse failures)
app.post("/api/debug-pdf", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  if (!PDFParser) return res.status(500).json({ error: "pdf2json not available" });
  const pdfParser = new PDFParser(null, 1);
  pdfParser.on("pdfParser_dataReady", (data) => {
    try { fs.unlinkSync(req.file.path); } catch {}
    const elements = [];
    for (let pi = 0; pi < (data.Pages || []).length; pi++) {
      for (const t of (data.Pages[pi].Texts || [])) {
        try {
          const text = decodeURIComponent(t.R.map(r => r.T).join("")).trim();
          if (text) elements.push({ page: pi, x: Math.round(t.x * 10) / 10, y: Math.round(t.y * 10) / 10, text });
        } catch { elements.push({ page: pi, x: t.x, y: t.y, text: "[decode error]" }); }
      }
    }
    const textDump = elements.map(e => `[p${e.page} y=${e.y} x=${e.x}] ${e.text}`).join("\n");
    res.json({ totalElements: elements.length, textDump: textDump.slice(0, 8000) });
  });
  pdfParser.on("pdfParser_dataError", (e) => {
    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ error: "PDF error", detail: String(e.parserError) });
  });
  pdfParser.loadPDF(req.file.path);
});

// View all submissions (admin)
app.get("/api/submissions", (req, res) => {
  const rows = db.prepare("SELECT id, name, email, phone, risk_profile, tune_level, created_at FROM submissions ORDER BY created_at DESC").all();
  res.json(rows);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Laxmi backend running on port ${PORT}`));
