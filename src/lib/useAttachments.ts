import { useState, useCallback } from "react";
import { Attachment } from "@/components/chat/types";

export function useAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newAttachments: Attachment[] = [];

    for (const file of fileArray) {
      const isImg = file.type.startsWith("image/");
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let url = "";
      let base64: string | undefined;
      let text: string | undefined;

      try {
        if (isImg) {
          // Convert image to Data URL & base64 for preview and Gemini API
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          url = dataUrl;
          base64 = dataUrl.split(",")[1] || dataUrl;
        } else if (
          file.type.startsWith("text/") ||
          file.type === "application/json" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".js") ||
          file.name.endsWith(".jsx") ||
          file.name.endsWith(".ts") ||
          file.name.endsWith(".tsx") ||
          file.name.endsWith(".py") ||
          file.name.endsWith(".css") ||
          file.name.endsWith(".html")
        ) {
          url = URL.createObjectURL(file);
          text = await file.text();
        } else {
          url = URL.createObjectURL(file);
          // General binary/pdf
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          base64 = dataUrl.split(",")[1] || dataUrl;
        }
      } catch (err) {
        console.warn("Error reading attachment:", err);
      }

      newAttachments.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        url,
        isImage: isImg,
        base64,
        text,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.url && target.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((item) => {
        if (item.url && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
      return [];
    });
  }, []);

  return {
    attachments,
    addFiles,
    removeAttachment,
    clearAttachments,
  };
}
