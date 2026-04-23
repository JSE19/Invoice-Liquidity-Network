"use client";

import { useTheme } from "../hooks/useTheme";
import WalletButton from "./WalletButton";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/15 shadow-sm h-20 transition-colors duration-300">
      <div className="flex justify-between items-center px-8 h-full max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-primary tracking-tight">ILN</div>
        <div className="hidden md:flex items-center gap-8">
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="#"
          >
            How it works
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="#for-freelancers"
          >
            For Freelancers
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="#for-lps"
          >
            For LPs
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-medium"
            href="#"
          >
            Docs
          </a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-surface-variant transition-colors text-foreground"
            aria-label="Toggle dark mode"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
