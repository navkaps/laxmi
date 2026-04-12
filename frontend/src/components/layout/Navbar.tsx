import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 ${isHome ? "bg-transparent" : "bg-navy-950/90 backdrop-blur-sm border-b border-white/5"}`}>
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-7 h-7 border border-gold-500/60 flex items-center justify-center">
          <div className="w-2 h-2 bg-gold-500 rotate-45" />
        </div>
        <span className="font-display text-lg text-cream-50 tracking-wide">Plutus</span>
      </Link>

      <div className="flex items-center gap-8">
        <span className="label-overline opacity-50 text-xs">
          Wealth Advisory
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
