"use client";

import { useState, useCallback, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { generateDemoScreenshot } from "@/lib/demo/screenshot-generator";
import { validateImageFile, readFileAsDataUrl } from "@/lib/demo/file-utils";

interface DemoUploadProps {
  onUpload: (dataUrl: string) => void;
}

export function DemoUpload({ onUpload }: DemoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        onUpload(dataUrl);
      } catch (err) {
        setError("Failed to read file. Please try again.");
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            return;
          }
        }
      }
    },
    [handleFileSelect]
  );

  const handleDemoScreenshot = useCallback(() => {
    try {
      const screenshot = generateDemoScreenshot();
      onUpload(screenshot);
    } catch (err) {
      setError("Failed to generate demo screenshot");
    }
  }, [onUpload]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Main Upload Area */}
      <div className="relative group">
        <div className="absolute -inset-2 rounded-lg bg-retro-black/5 opacity-50 blur transition duration-500 group-hover:opacity-100" />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          className={`relative flex flex-col items-center justify-center rounded-none border-2 border-retro-black bg-white p-12 transition-all focus:outline-none ${
            isDragging
              ? "bg-retro-blue/5 shadow-[inset_4px_4px_0px_0px_rgba(26,26,26,0.1)]"
              : "shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
          }`}
        >
          {/* Decorative corner markers */}
          <div className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-retro-black" />
          <div className="absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-retro-black" />
          <div className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-retro-black" />
          <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-retro-black" />

          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-retro-black bg-stone-50">
            <Icon
              name="solar:gallery-add-linear"
              size={36}
              className={isDragging ? "text-retro-blue" : "text-stone-400"}
            />
          </div>
          
          <h3 className="mb-2 font-mono text-lg font-bold tracking-tight">
            UPLOAD SCREENSHOT
          </h3>
          <p className="mb-8 text-center text-sm text-stone-500 max-w-xs">
            Drag & drop, paste from clipboard, or select a file
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group/btn flex items-center gap-2 border-2 border-retro-black bg-retro-black px-6 py-3 font-mono text-sm font-bold text-white transition-all hover:bg-retro-blue hover:text-retro-black"
          >
            <Icon name="solar:folder-open-linear" size={18} />
            SELECT FILE
          </button>

          {error && (
            <div className="mt-6 flex items-center gap-2 border-2 border-retro-red/20 bg-retro-red/5 px-4 py-2 text-sm font-bold text-retro-red">
              <Icon name="solar:danger-triangle-linear" size={16} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Divider with text */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-stone-200"></div>
        </div>
        <div className="relative bg-retro-paper px-4 font-mono text-xs text-stone-400 uppercase tracking-widest">
          OR
        </div>
      </div>

      {/* Demo Screenshot Button */}
      <button
        onClick={handleDemoScreenshot}
        className="group flex w-full items-center justify-center gap-3 border-2 border-retro-black bg-retro-yellow px-6 py-4 font-mono text-base font-bold text-retro-black shadow-retro transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-retro-yellow/90"
      >
        <Icon name="solar:magic-stick-3-linear" size={20} className="transition-transform group-hover:rotate-12" />
        TRY WITH DEMO SCREENSHOT
      </button>

      {/* Tips */}
      <div className="border-2 border-stone-200 bg-white p-6">
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-stone-400">
          Instructions
        </p>
        <ul className="space-y-3 text-sm text-stone-600 font-medium">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 text-[10px] font-bold text-stone-400">1</div>
            Take a screenshot of any bug or feature idea
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 text-[10px] font-bold text-stone-400">2</div>
            Upload it here (we don't store it)
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 text-[10px] font-bold text-stone-400">3</div>
            Let AI write the ticket for you
          </li>
        </ul>
      </div>
    </div>
  );
}
