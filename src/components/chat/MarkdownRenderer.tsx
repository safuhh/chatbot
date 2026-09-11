import React, { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = memo(({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = (language || "text").toLowerCase();

  return (
    <div className="rounded-xl border border-[#E7DCCC] dark:border-[#2E2820] overflow-hidden shadow-sm my-3 bg-[#1A1612] text-[#EAD9BE]">
      {/* Code Block Header */}
      <div className="bg-[#241F1A] px-4 py-2 flex items-center justify-between border-b border-white/10 text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-[#C4552F]">
          <Terminal className="w-3.5 h-3.5" />
          <span className="uppercase text-[11px] font-bold tracking-wider text-[#EAD9BE]/90">
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all duration-150",
            "bg-white/5 hover:bg-white/10 text-[#EAD9BE]/80 hover:text-white active:scale-95"
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Syntax Highlight Area */}
      <div className="p-3.5 sm:p-4 overflow-x-auto text-xs sm:text-[13px] leading-relaxed font-mono">
        <SyntaxHighlighter
          language={displayLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            fontSize: "inherit",
            lineHeight: "1.6",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', monospace",
            },
          }}
        >
          {value.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({ content, className }) => {
    return (
      <div className={cn("markdown-body space-y-2 text-[#1A1A1A] dark:text-[#EDE8E1]", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Code Blocks & Inline Code
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");

              if (match) {
                return <CodeBlock language={match[1]} value={codeString} />;
              }

              // Handle multi-line block without language tag
              if (codeString.includes("\n")) {
                return <CodeBlock language="text" value={codeString} />;
              }

              // Inline Code styling
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md font-mono text-[12px] sm:text-[13px] bg-[#F4ECE1] text-[#A83D1D] dark:bg-[#2A231C] dark:text-[#E87A53] border border-[#E7DCCC]/60 dark:border-[#3D3227]"
                  {...props}
                >
                  {children}
                </code>
              );
            },

            // Pre tag wrapper bypass (handled inside code component)
            pre({ children }) {
              return <>{children}</>;
            },

            // Paragraphs
            p({ children }) {
              return (
                <p className="text-[14px] sm:text-[15px] leading-[1.68] my-1.5 first:mt-0 last:mb-0">
                  {children}
                </p>
              );
            },

            // Headings
            h1({ children }) {
              return (
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1A1A1A] dark:text-[#EDE8E1] mt-5 mb-2.5 tracking-tight border-b border-[#E7DCCC]/50 dark:border-[#2E2820]/50 pb-1.5">
                  {children}
                </h1>
              );
            },
            h2({ children }) {
              return (
                <h2 className="text-lg sm:text-xl font-semibold font-serif text-[#1A1A1A] dark:text-[#EDE8E1] mt-4 mb-2 tracking-tight">
                  {children}
                </h2>
              );
            },
            h3({ children }) {
              return (
                <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A] dark:text-[#EDE8E1] mt-3 mb-1.5">
                  {children}
                </h3>
              );
            },
            h4({ children }) {
              return (
                <h4 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#EDE8E1] mt-2.5 mb-1">
                  {children}
                </h4>
              );
            },

            // Lists
            ul({ children }) {
              return (
                <ul className="list-disc list-outside pl-5 space-y-1 my-2 text-[14px] sm:text-[15px] leading-relaxed">
                  {children}
                </ul>
              );
            },
            ol({ children }) {
              return (
                <ol className="list-decimal list-outside pl-5 space-y-1 my-2 text-[14px] sm:text-[15px] leading-relaxed">
                  {children}
                </ol>
              );
            },
            li({ children }) {
              return <li className="pl-0.5">{children}</li>;
            },

            // Blockquote
            blockquote({ children }) {
              return (
                <blockquote className="border-l-3 border-[#C4552F] pl-4 py-1.5 my-3 text-[#5A5043] dark:text-[#A39889] bg-[#F8F3EC]/70 dark:bg-[#1B1713]/70 rounded-r-xl text-sm italic">
                  {children}
                </blockquote>
              );
            },

            // Horizontal Rule
            hr() {
              return (
                <hr className="my-4 border-t border-[#E7DCCC] dark:border-[#2E2820]" />
              );
            },

            // Tables
            table({ children }) {
              return (
                <div className="overflow-x-auto rounded-xl border border-[#E7DCCC] dark:border-[#2E2820] my-3 shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    {children}
                  </table>
                </div>
              );
            },
            thead({ children }) {
              return (
                <thead className="bg-[#F4ECE1] dark:bg-[#1E1A15] border-b border-[#E7DCCC] dark:border-[#2E2820] text-xs font-semibold text-[#1A1A1A] dark:text-[#EDE8E1]">
                  {children}
                </thead>
              );
            },
            th({ children }) {
              return <th className="px-3.5 py-2.5 font-semibold">{children}</th>;
            },
            td({ children }) {
              return (
                <td className="px-3.5 py-2 border-b border-[#E7DCCC]/50 dark:border-[#2E2820]/50 text-xs sm:text-sm">
                  {children}
                </td>
              );
            },

            // Links
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[#C4552F] dark:text-[#E87A53] hover:underline font-medium"
                >
                  <span>{children}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);

MarkdownRenderer.displayName = "MarkdownRenderer";
