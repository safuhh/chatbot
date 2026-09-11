import React from "react";
import { X, FileText } from "lucide-react";
import { Attachment } from "./types";
import { cn } from "@/lib/utils";

interface AttachmentPreviewBarProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AttachmentPreviewBar: React.FC<AttachmentPreviewBarProps> = ({
  attachments,
  onRemove,
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 pb-2.5 overflow-x-auto max-w-full px-1 scrollbar-none animate-fade-in">
      {attachments.map((att) => (
        <div
          key={att.id}
          className={cn(
            "relative group flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border text-xs shrink-0 transition-all shadow-2xs",
            "bg-[#F4ECE1] border-[#E7DCCC] text-[#1A1A1A]",
            "dark:bg-[#262019] dark:border-[#3D2F22] dark:text-[#EDE8E1]"
          )}
        >
          {att.isImage ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
              <img
                src={att.url}
                alt={att.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#C4552F]/10 text-[#C4552F] dark:bg-[#C4552F]/20 dark:text-[#D4663F] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0 max-w-[120px] sm:max-w-[160px]">
            <p className="font-medium truncate text-xs leading-tight">{att.name}</p>
            <p className="text-[10px] text-[#8A7E6C] dark:text-[#6B6358] font-mono leading-none mt-0.5">
              {formatFileSize(att.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0",
              "bg-[#E7DCCC] hover:bg-red-500 hover:text-white text-[#8A7E6C]",
              "dark:bg-[#3D2F22] dark:hover:bg-red-600 dark:hover:text-white dark:text-[#9A8E80]"
            )}
            title="Remove attachment"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
