"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Your users click the feedback button",
    description: "A sleek widget appears in the corner of your site, ready to capture feedback.",
    icon: "solar:cursor-linear",
    color: "bg-retro-blue",
  },
  {
    title: "They capture screenshots and describe issues",
    description: "Users can annotate screenshots, record their screen, and explain the problem.",
    icon: "solar:camera-linear",
    color: "bg-retro-lavender",
  },
  {
    title: "Tickets land in your inbox instantly",
    description: "Every piece of feedback flows into your dashboard in real-time.",
    icon: "solar:inbox-linear",
    color: "bg-retro-yellow",
  },
  {
    title: "Export to Linear, Notion, or your tools",
    description: "One click exports formatted tickets to your project management tools.",
    icon: "solar:export-linear",
    color: "bg-retro-pink",
  },
];

export function OnboardingStepWalkthrough() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const completeStep = useMutation(api.onboarding.completeStep);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleContinue = async () => {
    await completeStep({ step: 2 });
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div
      className="border-2 border-retro-black bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide content */}
      <div className="relative h-64 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500",
              slide.color,
              index === currentSlide
                ? "translate-x-0 opacity-100"
                : index < currentSlide
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
            )}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-retro-black bg-white">
              <Icon name={slide.icon} size={32} />
            </div>
            <div
              className={cn(
                "h-2 w-2 rounded-full bg-retro-black",
                index === currentSlide && "animate-ping"
              )}
            />
          </div>
        ))}
      </div>

      {/* Text content */}
      <div className="border-t-2 border-retro-black p-8">
        <h2 className="mb-2 text-xl font-bold text-retro-black">
          {slides[currentSlide].title}
        </h2>
        <p className="mb-6 text-stone-600">
          {slides[currentSlide].description}
        </p>

        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 w-2 rounded-full border border-retro-black transition-all",
                index === currentSlide ? "w-6 bg-retro-black" : "bg-transparent hover:bg-stone-200"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-retro-black disabled:opacity-30"
          >
            <Icon name="solar:arrow-left-linear" size={16} />
            Back
          </button>

          {isLastSlide ? (
            <button
              onClick={handleContinue}
              className="flex items-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-2 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
            >
              Got it, let&apos;s go
              <Icon name="solar:arrow-right-linear" size={18} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentSlide((prev) => prev + 1)}
              className="flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-retro-black"
            >
              Next
              <Icon name="solar:arrow-right-linear" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
