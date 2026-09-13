import React from "react";
import {
  Feather,
  ShieldCheck,
  Sparkles,
  Terminal,
  Mail,
  Heart,
} from "lucide-react";

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {

  return (
    <footer
      className={`border-t border-[#E7DCCC]/70 dark:border-[#2E2820]/70 bg-[#FAF6F0]/50 dark:bg-[#141210]/50 pt-16 pb-12 font-sans transition-colors ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row of Footer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 border-b border-[#E7DCCC]/60 dark:border-[#2E2820]/60">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#C4552F] flex items-center justify-center text-white shadow-sm">
                <Feather className="w-4 h-4" />
              </div>
              <span className="font-serif-display font-bold text-xl text-[#1A1A1A] dark:text-[#EDE8E1] tracking-tight">
                Safvan AI
              </span>
            </div>
            <p className="text-xs text-[#8A7E6C] dark:text-[#9A8E80] leading-relaxed">
              An independently crafted, high-performance conversational AI interface built with minimal human design aesthetics, high-speed streaming, and zero-logging privacy.
            </p>
          </div>

        </div>

        {/* Multi-Column Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-12 text-xs">
          {/* Column 1: Product Capabilities */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#C4552F] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Product
            </h4>
            <ul className="space-y-2 font-mono text-[#8A7E6C] dark:text-[#9A8E80]">
              <li>
                <a href="#features" className="hover:text-[#1A1A1A] dark:hover:text-[#EDE8E1] hover:translate-x-0.5 transition-all inline-block">
                  Voice Mode Interface
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#1A1A1A] dark:hover:text-[#EDE8E1] hover:translate-x-0.5 transition-all inline-block">
                  Temporary Incognito
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#1A1A1A] dark:hover:text-[#EDE8E1] hover:translate-x-0.5 transition-all inline-block">
                  Live Markdown Canvas
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#1A1A1A] dark:hover:text-[#EDE8E1] hover:translate-x-0.5 transition-all inline-block">
                  Multimodal Input & Audio
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Privacy */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#C4552F] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Craft & Privacy
            </h4>
            <ul className="space-y-2 font-mono text-[#8A7E6C] dark:text-[#9A8E80]">
              <li>
                <span className="text-[#1A1A1A] dark:text-[#EDE8E1]">Client-Side Memory</span>
              </li>
              <li>
                <span>No Third-Party Analytics</span>
              </li>
              <li>
                <span>Zero Chat Log Retention</span>
              </li>
              <li>
                <span>Human-First UI System</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Author & Origin */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-[#C4552F] font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Author & Origin
            </h4>
            <p className="text-[#8A7E6C] dark:text-[#9A8E80] leading-relaxed">
              Designed & engineered by <span className="text-[#1A1A1A] dark:text-[#EDE8E1] font-medium">Safvan</span>, Software Developer from Mannarkkad, Palakkad, Kerala.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[#8A7E6C] dark:text-[#9A8E80]">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C4552F] transition-colors p-1 -m-1"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C4552F] transition-colors p-1 -m-1"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="mailto:contact@safvan.dev"
                className="hover:text-[#C4552F] transition-colors p-1 -m-1"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E7DCCC]/60 dark:border-[#2E2820]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8A7E6C] dark:text-[#9A8E80]">
          <div className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} Safvan AI.</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span>Handcrafted with</span>
            <Heart className="w-3 h-3 text-[#C4552F] fill-[#C4552F]" />
            <span>in Mannarkkad, Palakkad, Kerala</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
