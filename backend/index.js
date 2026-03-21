const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Anthropic = require("@anthropic-ai/sdk");

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(profile) {
  const profileLines = Object.entries(profile)
    .map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  return `You are a senior private wealth advisor at a top-tier US investment firm. You speak with precision, warmth, and confidence — never like a chatbot or AI. Your client has completed a detailed investor profile. Based on this profile, build them a personalized US investment portfolio.

INVESTOR PROFILE:
${profileLines}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation outside the JSON):

{
  "profileSummary": "2-3 sentence summary of this investor written in second person, warm and professional tone",
  "riskProfile": "One of: Conservative / Moderately Conservative / Moderate / Moderately Aggressive / Aggressive",
  "expectedAnnualReturn": "e.g. 7–9% p.a.",
  "volatility": "e.g. Moderate (12–15%)",
  "rationale": "3-4 sentences explaining why this specific portfolio was built for this client. Written as a human advisor would write it.",
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "considerations": ["consideration 1", "consideration 2"],
  "holdings": [
    {
      "ticker": "VTI",
      "name": "Vanguard Total Stock Market ETF",
      "type": "ETF",
      "allocation": 40,
      "sector": "Broad Market",
      "rationale": "1 sentence explaining why this specific holding fits this client"
    }
  ],
  "backtestData": [
    { "year": 1995, "portfolioValue": 10000, "benchmarkValue": 10000 },
    ...through 2024, showing growth of a $10,000 investment
  ]
}

Rules:
- Holdings must sum to exactly 100%
- Include 5–9 holdings (mix of ETFs and individual stocks as appropriate for the profile)
- All holdings must be US-listed, real tickers
- Backtest data must cover 1995–2024 (30 data points) with realistic, mathematically consistent compound growth
- The portfolio benchmark should be the S&P 500 (SPY performance)
- Write everything as a human expert, not an AI — no phrases like "certainly", "as an AI", "I'd recommend"
- Be specific, not generic`;
}

app.post("/api/recommend", async (req, res) => {
  const { profile } = req.body;

  if (!profile) {
    return res.status(400).json({ error: "Profile is required" });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildPrompt(profile),
        },
      ],
    });

    const raw = message.content[0].text.trim();

    // Extract JSON if wrapped in code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, raw];
    const jsonStr = jsonMatch[1];

    const recommendation = JSON.parse(jsonStr);
    res.json(recommendation);
  } catch (err) {
    console.error("Claude API error:", err);
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Laxmi backend running on port ${PORT}`));
