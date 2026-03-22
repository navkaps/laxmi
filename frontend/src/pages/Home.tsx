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
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`;
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
    <div className="relative min-h-screen bg-navy-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="absolute top-6 left-10 flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g-logo" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/>
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="6" fill="url(#g-logo)"/>
          <path d="M14 20 L14 9 M10 13 L14 9 L18 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-display text-lg font-bold tracking-tight text-white">Laxmi</span>
        <span className="hidden sm:inline font-sans text-xs text-white/50 tracking-wide border-l border-white/15 pl-2 ml-1">Your AI wealth advisor</span>
      </div>

      {/* Horizontal rule top */}
      <div className="absolute top-32 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="relative z-10 text-center max-w-3xl px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <span className="label-overline">Private Wealth Advisory</span>
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
          className="text-cream-200/50 text-lg font-sans font-light leading-relaxed mb-12 max-w-xl mx-auto"
        >
          A ten-minute conversation. A portfolio built for your goals, your timeline, and your appetite for risk — backed by decades of market data.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/start")}
            className="btn-primary"
          >
            Build my portfolio
          </button>
          <button
            onClick={() => navigate("/assess")}
            className="btn-ghost"
          >
            Assess existing portfolio
          </button>
        </motion.div>
      </div>

      {/* Bottom stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-0 left-0 right-0 border-t border-white/5 py-6 px-10"
      >
        <div className="flex justify-center gap-16">
          {[
            { label: "Backtested", value: "30 years" },
            { label: "Asset classes", value: "ETFs & Stocks" },
            { label: "Profile questions", value: "10 questions" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-xl text-white font-semibold">{stat.value}</div>
              <div className="label-overline mt-1 opacity-50">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
