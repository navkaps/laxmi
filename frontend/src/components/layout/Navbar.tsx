import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 bg-white border-b border-gray-100">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-7 h-7 border-2 border-gold-500 flex items-center justify-center rounded">
          <div className="w-2 h-2 bg-gold-500 rotate-45" />
        </div>
        <span className="font-display text-lg font-bold tracking-wide" style={{ color: "#0A2540" }}>Laxmi</span>
      </Link>

      <div className="flex items-center gap-8">
        <span className="label-overline opacity-60 text-xs">
          Wealth Advisory
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
