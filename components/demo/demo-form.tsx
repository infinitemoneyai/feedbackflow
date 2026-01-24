"use client";

import { useState, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { FileText } from "lucide-react";
import { DemoHeader } from "./shared/demo-header";
import type { DemoFeedback } from "@/lib/demo/types";

interface DemoFormProps {
  screenshot: string;
  onSubmit: (feedback: DemoFeedback) => void;
  onBack: () => void;
}

export function DemoForm({ screenshot, onSubmit, onBack }: DemoFormProps) {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        setError("Please enter a title");
        return;
      }

      onSubmit({
        type,
        title: title.trim(),
        description: description.trim(),
      });
    },
    [type, title, description, onSubmit]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <DemoHeader onBack={onBack} title="DETAILS" icon={<FileText size={18} />} />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Screenshot Preview */}
          <div className="group relative overflow-hidden border-2 border-retro-black shadow-retro transition-transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-retro-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <img
              src={screenshot}
              alt="Screenshot preview"
              className="h-full w-full object-cover"
              style={{ minHeight: "200px" }}
            />
            <div className="absolute bottom-2 right-2 rounded border-2 border-retro-black bg-white px-2 py-1 font-mono text-xs font-bold shadow-sm">
              ATTACHMENT.PNG
            </div>
          </div>

          {/* Type Selector */}
          <div className="space-y-4">
            <label className="block font-mono text-xs font-bold uppercase tracking-widest text-stone-500">
              Feedback Type
            </label>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`group relative flex items-center gap-4 border-2 p-4 text-left transition-all ${
                  type === "bug"
                    ? "border-retro-black bg-retro-red/10 shadow-retro"
                    : "border-stone-200 bg-white hover:border-retro-black hover:shadow-sm"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                  type === "bug" ? "border-retro-red bg-retro-red text-white" : "border-stone-200 bg-stone-50 text-stone-400 group-hover:border-retro-black"
                }`}>
                  <Icon name="solar:bug-linear" size={20} />
                </div>
                <div>
                  <span className={`block font-bold ${type === "bug" ? "text-retro-red" : "text-stone-700"}`}>BUG REPORT</span>
                  <span className="text-xs text-stone-500">Something is broken</span>
                </div>
                {type === "bug" && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Icon name="solar:check-circle-bold" size={24} className="text-retro-black" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setType("feature")}
                className={`group relative flex items-center gap-4 border-2 p-4 text-left transition-all ${
                  type === "feature"
                    ? "border-retro-black bg-retro-blue/10 shadow-retro"
                    : "border-stone-200 bg-white hover:border-retro-black hover:shadow-sm"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                  type === "feature" ? "border-retro-blue bg-retro-blue text-white" : "border-stone-200 bg-stone-50 text-stone-400 group-hover:border-retro-black"
                }`}>
                  <Icon name="solar:lightbulb-linear" size={20} />
                </div>
                <div>
                  <span className={`block font-bold ${type === "feature" ? "text-retro-blue" : "text-stone-700"}`}>FEATURE REQUEST</span>
                  <span className="text-xs text-stone-500">I have an idea</span>
                </div>
                {type === "feature" && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Icon name="solar:check-circle-bold" size={24} className="text-retro-black" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block font-mono text-xs font-bold uppercase tracking-widest text-stone-500">
            Title <span className="text-retro-red">*</span>
          </label>
          <div className="relative">
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder={
                type === "bug"
                  ? "e.g., Checkout button unresponsive on mobile"
                  : "e.g., Add dark mode toggle to settings"
              }
              className={`w-full border-2 bg-white px-4 py-4 text-lg font-medium transition-all placeholder:text-stone-300 focus:outline-none focus:ring-0 ${
                error 
                  ? "border-retro-red focus:border-retro-red focus:shadow-[4px_4px_0px_0px_#e85d52]" 
                  : "border-stone-300 focus:border-retro-black focus:shadow-retro"
              }`}
            />
            {error && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-red">
                <Icon name="solar:danger-triangle-linear" size={20} />
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs font-bold text-retro-red">{error}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block font-mono text-xs font-bold uppercase tracking-widest text-stone-500">
            Description <span className="text-stone-300">(Optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "bug"
                ? "Steps to reproduce:\n1. Go to cart\n2. Click checkout\n3. Nothing happens"
                : "It would be great if..."
            }
            rows={5}
            className="w-full resize-none border-2 border-stone-300 bg-white px-4 py-4 text-base transition-all placeholder:text-stone-300 focus:border-retro-black focus:outline-none focus:ring-0 focus:shadow-retro"
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-3 border-2 border-retro-black bg-retro-black px-6 py-4 text-lg font-bold text-white shadow-[4px_4px_0px_0px_#F3C952] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-retro-blue hover:text-retro-black hover:shadow-[2px_2px_0px_0px_#F3C952]"
          >
            <Icon name="solar:magic-stick-3-bold" size={24} className="animate-pulse" />
            CREATE TICKET
          </button>
          
          <p className="mt-4 text-center text-xs font-medium text-stone-400">
            <Icon name="solar:shield-check-linear" size={12} className="mr-1 inline" />
            Secure demo environment. No data is stored.
          </p>
        </div>
      </form>
    </div>
  );
}
