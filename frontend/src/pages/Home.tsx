import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle particle / line animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.05,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw connections
        particles.slice(i + 1).forEach((q) => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(201, 169, 110, ${0.07 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-navy-950 overflow-x-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="absolute top-6 left-10 flex items-center gap-3 z-20">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g-logo" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4A843"/><stop offset="1" stopColor="#A07A35"/>
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="6" fill="url(#g-logo)"/>
          <path d="M14 20 L14 9 M10 13 L14 9 L18 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-display text-lg font-bold tracking-tight text-white">Plutus</span>
        <span className="hidden sm:inline font-sans text-xs text-white/50 tracking-wide border-l border-white/15 pl-2 ml-1">AI Wealth Advisory</span>
      </div>

      {/* Scrollable content wrapper */}
      <div className="relative z-10 w-full">
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16">
          <div className="text-center max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <span className="label-overline">Private Wealth Advisory · Powered by Claude AI</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6"
            >
              Your portfolio,
              <br />
              <span className="text-white/70 italic font-bold">precisely crafted.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="text-cream-200/60 text-lg md:text-xl font-sans font-light leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              A ten-minute conversation. A portfolio built for your goals, your timeline, and your appetite for risk — backed by decades of market data and the reasoning power of Anthropic's Claude.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <button onClick={() => navigate("/start")} className="btn-primary">
                Build my portfolio
              </button>
              <button onClick={() => navigate("/assess")} className="btn-ghost">
                Assess existing portfolio
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-white/30 text-xs font-sans"
            >
              Free · No signup required to start · Your data never leaves the session
            </motion.p>
          </div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 text-xs font-sans tracking-widest uppercase"
          >
            Scroll to learn more ↓
          </motion.div>
        </section>

        {/* WHAT IS THIS */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="label-overline mb-4">What is Plutus?</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              An AI-powered second opinion on your money.
            </h2>
            <p className="text-cream-200/60 text-lg font-sans font-light leading-relaxed mb-6">
              Plutus is a free AI wealth advisory tool that asks you ten carefully designed questions about your financial life — your age, income, goals, risk tolerance, time horizon, and existing holdings — and returns a personalized portfolio recommendation grounded in modern portfolio theory and decades of historical market data.
            </p>
            <p className="text-cream-200/60 text-lg font-sans font-light leading-relaxed">
              No signup. No email harvesting. No hidden fees. No AUM charges. No upsell to a human advisor trying to sell you products. Just a clear, reasoned recommendation you can take to any brokerage and execute yourself — or show to your existing advisor for a second opinion.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-6 border-t border-white/5 bg-white/[0.015]">
          <div className="max-w-5xl mx-auto">
            <div className="label-overline mb-4">How it works</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-16 leading-tight">
              Four steps. Ten minutes. One portfolio.
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: "01", title: "Tell us about you", body: "Age, country, income, net worth, goals, dependents, time horizon, and how you feel about risk." },
                { num: "02", title: "Claude reasons over your profile", body: "Anthropic's Claude model analyzes your situation against portfolio theory and decades of market data." },
                { num: "03", title: "See your portfolio", body: "A clear asset allocation across ETFs and stocks, with the exact reasoning behind each choice." },
                { num: "04", title: "Backtest and tune", body: "See how the portfolio would have performed over 30 years. Ask Plutus to adjust anything." },
              ].map((step) => (
                <div key={step.num} className="border-l border-white/10 pl-5">
                  <div className="font-display text-2xl text-[#C9A96E] font-bold mb-3">{step.num}</div>
                  <div className="font-display text-lg text-white font-semibold mb-2">{step.title}</div>
                  <div className="text-cream-200/50 text-sm font-sans font-light leading-relaxed">{step.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY TRUST */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="label-overline mb-4">Why you can trust this</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-12 leading-tight">
              Transparent by design.
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              {[
                { t: "No accounts, no data harvesting", b: "You don't create an account. We don't store your answers after the session. Nothing is sold, shared, or used to train AI." },
                { t: "Not a brokerage", b: "Plutus gives recommendations — not trades. You execute at whatever brokerage you already use (Fidelity, Schwab, Vanguard, Interactive Brokers, Zerodha, etc.)." },
                { t: "Powered by Claude, not a black box", b: "Every recommendation comes with the reasoning behind it. You can see the exact prompt and logic Claude used to arrive at your allocation." },
                { t: "Backtested on real data", b: "Your portfolio is tested against 30 years of historical market data so you can see how it would have performed through real bull and bear markets." },
                { t: "Not financial advice", b: "Plutus is a decision-support tool, not a licensed fiduciary. For complex situations (estate planning, tax optimization, business structuring), consult a CFP or CPA." },
                { t: "Built by one person", b: "No VC funding, no growth team, no dark patterns. Built by Navin Kapoor because existing robo-advisors charge AUM fees for work an LLM can now do for free." },
              ].map((item) => (
                <div key={item.t}>
                  <div className="font-display text-lg text-white font-semibold mb-2">{item.t}</div>
                  <div className="text-cream-200/50 text-sm font-sans font-light leading-relaxed">{item.b}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT THE NAME */}
        <section className="py-24 px-6 border-t border-white/5 bg-white/[0.015]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="label-overline mb-4">About the name</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Plutus <span className="text-white/50 italic font-light">(Πλοῦτος)</span>
            </h2>
            <p className="text-cream-200/60 text-lg font-sans font-light leading-relaxed mb-4">
              In Greek mythology, <span className="text-[#C9A96E]">Plutus is the god of wealth</span> — son of the goddess Demeter and the mortal Iasion. Unlike gods of luck or chance, Plutus represents <em>earned</em> prosperity, distributed with discernment to those who build it patiently.
            </p>
            <p className="text-cream-200/60 text-lg font-sans font-light leading-relaxed">
              We thought that was the right spirit for a tool that helps you build wealth slowly, carefully, and on your own terms.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ten minutes. One better portfolio.
            </h2>
            <p className="text-cream-200/60 text-lg font-sans font-light leading-relaxed mb-10">
              No signup. No credit card. No email. Start now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate("/start")} className="btn-primary">
                Build my portfolio
              </button>
              <button onClick={() => navigate("/assess")} className="btn-ghost">
                Assess existing portfolio
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-10 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/30 text-xs font-sans">
              © {new Date().getFullYear()} Plutus · AI Wealth Advisory · Not financial advice
            </div>
            <div className="text-white/30 text-xs font-sans">
              Built with Claude · React · Backtested on 30 years of market data
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
