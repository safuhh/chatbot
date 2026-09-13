// /src/pages/ProductFeaturesPage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Feather,
  CheckCircle2,
  Zap,
  Headphones,
  FileCode2,
  Shield,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";

/**
 * RevealSection
 *
 * - Wrap any content that should "pop up" on scroll.
 * - Accessible: respects prefers-reduced-motion, uses IntersectionObserver.
 * - Props: delayMs (stagger), durationMs, direction (popup | up | fade | scale)
 */
function RevealSection({
  children,
  className = "",
  delayMs = 0,
  durationMs = 420,
  direction = "popup",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  direction?: "popup" | "up" | "fade" | "scale";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Respect reduced motion preference
  const prefersReduced = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced) {
      // If reduced motion is enabled, reveal immediately and don't animate.
      setIsVisible(true);
      return;
    }

    let mounted = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!mounted) return;
        if (entry.isIntersecting) {
          setIsVisible(true);
          // once visible, we can unobserve for performance
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px", // trigger slightly before fully visible
        threshold: 0.02,
      }
    );

    observer.observe(el);

    // Safety: fallback check in case IntersectionObserver is unavailable or delayed
    const timeout = window.setTimeout(() => {
      if (mounted && !isVisible) {
        // quick bounding client rect check as a fallback
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setIsVisible(true);
        }
      }
    }, 200);

    return () => {
      mounted = false;
      observer.disconnect();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  const hiddenClasses = (() => {
    switch (direction) {
      case "fade":
        return "opacity-0 translate-y-0 scale-100";
      case "up":
        return "opacity-0 translate-y-6";
      case "scale":
        return "opacity-0 scale-[0.96]";
      case "popup":
      default:
        return "opacity-0 translate-y-3 scale-[0.98]";
    }
  })();

  // We purposely use inline style for delay/duration so it's easy to tweak per-instance.
  return (
    <div
      ref={ref}
      style={{
        transitionProperty: "opacity, transform, filter",
        transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
      className={cn(
        "will-change-transform will-change-opacity",
        isVisible
          ? "opacity-100 translate-y-0 scale-100 filter-none blur-0"
          : cn(hiddenClasses, "pointer-events-none"),
        className
      )}
      aria-hidden={!isVisible}
    >
      {children}
    </div>
  );
}

/* Content */
const featureItems = [
  {
    number: "01",
    icon: Zap,
    title: "Real-time Token Streaming",
    desc:
      "Sub-300ms streaming via SSE: tokens are delivered to the client as they are produced with no artificial buffering. Designed for terminal-speed responses and smooth progressive rendering.",
  },
  {
    number: "02",
    icon: Headphones,
    title: "Hands-Free Voice Mode",
    desc:
      "Bi-directional voice experience with Speech-to-Text and WebTTS. Speak naturally and receive spoken replies for hands-free workflows and accessibility-first interactions.",
  },
  {
    number: "03",
    icon: FileCode2,
    title: "Multimodal Attachments",
    desc:
      "Safely ingest code files, images, and documents into prompt context. Attachments are analyzed in a sandboxed pipeline and summarized into the conversation for precise results.",
  },
  {
    number: "04",
    icon: Shield,
    title: "Incognito Temporary Mode",
    desc:
      "One-click ephemeral chats that never hit persistent storage. Perfect for private queries using memory-only sessions that disappear when closed.",
  },
  {
    number: "05",
    icon: Lock,
    title: "Adaptive Persistence",
    desc:
      "Session-first UX using sessionStorage for guests and optional database sync for authenticated users. Fast local restoration with server-side long-term backup when enabled.",
  },
  {
    number: "06",
    icon: Layers,
    title: "Design & Editorial Tokens",
    desc:
      "Carefully tuned typography and a warm editorial palette for readable output and purposeful contrast across light/dark modes.",
  },
];

export const ProductFeaturesPage: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-[#FAF6F0] dark:bg-[#141210] text-[#1A1A1A] dark:text-[#EDE8E1]",
        !isEmbedded ? "min-h-screen" : ""
      )}
    >
      {/* Header */}
      {!isEmbedded && (
        <header className="sticky top-0 z-30 bg-[#FAF6F0]/95 dark:bg-[#141210]/95 backdrop-blur-md border-b border-[#E7DCCC] dark:border-[#2E2820] px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C4552F] flex items-center justify-center text-white shadow-sm">
                <Feather className="w-4 h-4" />
              </div>
              <span className="font-sans text-lg font-semibold tracking-tight">Safvan AI</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#8A7E6C] dark:text-[#9A8E80]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Product Specifications</span>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-16">
        {/* Hero */}
        <section className="space-y-4 border-b border-[#E7DCCC]/60 dark:border-[#2E2820]/60 pb-10 text-center flex flex-col items-center">
          <RevealSection delayMs={20} direction="fade">
            <div className="inline-flex items-center justify-center gap-2 text-[11px] font-mono tracking-widest text-[#C4552F] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#C4552F] animate-pulse" />
              <span>OVERVIEW & DESIGN PHILOSOPHY</span>
            </div>
          </RevealSection>

          <RevealSection delayMs={60} direction="up">
            <h1 className="font-sans text-2xl sm:text-4xl font-semibold tracking-tight leading-snug max-w-3xl mx-auto text-[#1A1A1A] dark:text-[#EDE8E1]">
              Fast, focused AI designed for real work and human clarity.
            </h1>
          </RevealSection>

          <RevealSection delayMs={100} direction="up">
            <p className="font-sans text-xs sm:text-sm text-[#8A7E6C] dark:text-[#9A8E80] leading-relaxed max-w-2xl mx-auto">
              Safvan AI blends engineering-grade infrastructure with editorial care. We prioritize low-latency token streaming, predictable behavior for
              attachments and code, and privacy-conscious session modes for sensitive tasks.
            </p>
          </RevealSection>
        </section>

        {/* Feature grid */}
        <section className="space-y-6">
          <RevealSection delayMs={20} direction="fade">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#C4552F] uppercase font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CORE CAPABILITIES</span>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealSection
                  key={item.number}
                  delayMs={70 + idx * 40}
                  durationMs={420}
                  direction="popup"
                >
                  <article
                    className="group bg-[#FAF6F0] dark:bg-[#1E1A15] border border-[#E7DCCC] dark:border-[#2E2820] rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    aria-labelledby={`feature-${item.number}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold text-[#C4552F] bg-[#C4552F]/10">
                          {item.number}
                        </span>
                        <h3 id={`feature-${item.number}`} className="text-base font-semibold">
                          {item.title}
                        </h3>
                      </div>
                      <div className="w-9 h-9 rounded-md bg-[#E7DCCC]/30 dark:bg-[#2E2820]/60 flex items-center justify-center text-[#8A7E6C]">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[#8A7E6C] dark:text-[#9A8E80] leading-relaxed">
                      {item.desc}
                    </p>
                  </article>
                </RevealSection>
              );
            })}
          </div>
        </section>

        {/* Technical spec card */}
        <section className="space-y-6">
          <RevealSection delayMs={20} direction="fade">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#C4552F] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#C4552F]" />
              <span>PIPELINE & TECHNICAL SPECS</span>
            </div>
          </RevealSection>

          <RevealSection delayMs={60} direction="up">
            <div className="bg-[#FAF6F0] dark:bg-[#1E1A15] border border-[#E7DCCC] dark:border-[#2E2820] rounded-xl p-6 shadow-sm">
              <header className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">System Architecture Highlights</h2>
                  <p className="text-xs text-[#8A7E6C] mt-1">
                    Design decisions and tradeoffs we made for fast, reliable responses.
                  </p>
                </div>
                <div className="text-xs text-[#8A7E6C] font-mono">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C4552F]" />
                    Production-ready
                  </span>
                </div>
              </header>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-sm text-[#8A7E6C] dark:text-[#9A8E80]">
                      <th className="py-2 px-3 font-mono font-semibold">Capability</th>
                      <th className="py-2 px-3 font-mono font-semibold text-[#C4552F]">Safvan AI</th>
                      <th className="py-2 px-3 font-mono font-semibold">Typical Apps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DCCC]/40 dark:divide-[#2E2820]/40">
                    <tr>
                      <td className="py-3 px-3 font-medium">Latency</td>
                      <td className="py-3 px-3 text-[#C4552F] font-medium">Sub-300ms SSE streaming</td>
                      <td className="py-3 px-3 text-[#8A7E6C]">Buffered responses (1s+)</td>
                    </tr>

                    <tr>
                      <td className="py-3 px-3 font-medium">Voice Mode</td>
                      <td className="py-3 px-3 text-[#C4552F] font-medium">Full STT + WebTTS</td>
                      <td className="py-3 px-3 text-[#8A7E6C]">Text only</td>
                    </tr>

                    <tr>
                      <td className="py-3 px-3 font-medium">Privacy</td>
                      <td className="py-3 px-3 text-[#C4552F] font-medium">Memory-only ephemeral chats</td>
                      <td className="py-3 px-3 text-[#8A7E6C]">Server logs by default</td>
                    </tr>

                    <tr>
                      <td className="py-3 px-3 font-medium">Persistence</td>
                      <td className="py-3 px-3 text-[#C4552F] font-medium">Session-first, optional DB sync</td>
                      <td className="py-3 px-3 text-[#8A7E6C]">Local-only or server-first</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-[#8A7E6C]">
                <strong>Implementation notes:</strong> streaming is implemented over SSE or WebSocket (backend choice). Attachments are processed in a sandboxed worker to generate compact summaries before injecting them into prompts. <span className="hidden sm:inline">For auth and persistence, wire the authenticated sync to your Supabase/Postgres layer and keep ephemeral sessions in-memory or sessionStorage for guests.</span>
              </p>

           
            </div>
          </RevealSection>
        </section>
      </main>

      {/* Footer */}
      <RevealSection delayMs={40} direction="fade">
        <Footer className="mt-20" />
      </RevealSection>
    </div>
  );
};

export default ProductFeaturesPage;