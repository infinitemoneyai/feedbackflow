"use client";

import { useState, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { DemoUpload } from "@/components/demo/demo-upload";
import { DemoAnnotate } from "@/components/demo/demo-annotate";
import { DemoForm } from "@/components/demo/demo-form";
import { DemoTicketPreview } from "@/components/demo/demo-ticket-preview";
import { DemoSignupCta } from "@/components/demo/demo-signup-cta";
import { Icon } from "@/components/ui/icon";
import { generateDemoTicket } from "@/lib/demo/ticket-generator";
import { DEMO_CONFIG } from "@/lib/demo/constants";
import type { DemoStep, DemoTicket, DemoFeedback } from "@/lib/demo/types";

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>("upload");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [ticket, setTicket] = useState<DemoTicket | null>(null);

  const handleScreenshotUpload = useCallback((dataUrl: string) => {
    setScreenshot(dataUrl);
    setStep("annotate");
  }, []);

  const handleAnnotationComplete = useCallback((annotatedDataUrl: string) => {
    setScreenshot(annotatedDataUrl);
    setStep("form");
  }, []);

  const handleAnnotationSkip = useCallback(() => {
    setStep("form");
  }, []);

  const handleFeedbackSubmit = useCallback(
    async (feedbackData: DemoFeedback) => {
      setStep("processing");

      // Simulate AI processing with typing effect delay
      await new Promise((resolve) => setTimeout(resolve, DEMO_CONFIG.AI_PROCESSING_DELAY_MS));

      // Generate ticket
      const generatedTicket = generateDemoTicket(feedbackData);
      setTicket(generatedTicket);
      setStep("ticket");
    },
    []
  );

  const handleReset = useCallback(() => {
    setStep("upload");
    setScreenshot(null);
    setTicket(null);
  }, []);

  const handleBack = useCallback(() => {
    if (step === "annotate") {
      setStep("upload");
      setScreenshot(null);
    } else if (step === "form") {
      setStep("annotate");
    }
  }, [step]);

  return (
    <PageLayout>
      <div className="border-b-2 border-retro-black bg-white">
        {/* Header */}
        <div className="border-b-2 border-retro-black bg-retro-yellow p-6 md:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded border border-retro-black/30 bg-white/50 px-3 py-1 font-mono text-xs uppercase tracking-widest">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-retro-red"></span>
              Interactive Demo
            </div>
            <h1 className="mb-4 text-3xl font-medium tracking-tighter sm:text-4xl md:text-5xl">
              Screenshot to Ticket in 30 Seconds
            </h1>
            <p className="text-lg text-retro-black/70 md:text-xl">
              Upload a screenshot, describe the issue, and watch AI turn it into a structured ticket.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <DemoProgressStep
              number={1}
              label="Upload"
              active={step === "upload"}
              completed={step !== "upload"}
            />
            <div className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${step !== "upload" ? "bg-retro-black" : "bg-stone-300"}`} />
            <DemoProgressStep
              number={2}
              label="Annotate"
              active={step === "annotate"}
              completed={step === "form" || step === "processing" || step === "ticket"}
            />
            <div className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${step === "form" || step === "processing" || step === "ticket" ? "bg-retro-black" : "bg-stone-300"}`} />
            <DemoProgressStep
              number={3}
              label="Describe"
              active={step === "form"}
              completed={step === "processing" || step === "ticket"}
            />
            <div className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${step === "processing" || step === "ticket" ? "bg-retro-black" : "bg-stone-300"}`} />
            <DemoProgressStep
              number={4}
              label="Get Ticket"
              active={step === "processing" || step === "ticket"}
              completed={false}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-[600px] bg-bg-page p-6 md:p-10">
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {/* Retro Card Container for Content */}
              <div className="relative z-10 border-2 border-retro-black bg-white p-8 shadow-retro-lg md:p-12">
                
                {/* Step 1: Upload Screenshot */}
                {step === "upload" && (
                  <div className="animate-ff-fade-in">
                    <DemoUpload onUpload={handleScreenshotUpload} />
                  </div>
                )}

                {/* Step 2: Annotate */}
                {step === "annotate" && screenshot && (
                  <div className="animate-ff-fade-in">
                    <DemoAnnotate
                      screenshot={screenshot}
                      onComplete={handleAnnotationComplete}
                      onSkip={handleAnnotationSkip}
                      onBack={handleBack}
                    />
                  </div>
                )}

                {/* Step 3: Feedback Form */}
                {step === "form" && screenshot && (
                  <div className="animate-ff-fade-in">
                    <DemoForm
                      screenshot={screenshot}
                      onSubmit={handleFeedbackSubmit}
                      onBack={handleBack}
                    />
                  </div>
                )}

                {/* Step 4: Processing */}
                {step === "processing" && (
                  <div className="flex flex-col items-center justify-center py-20 animate-ff-fade-in">
                    <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-retro-black bg-retro-lavender shadow-retro">
                      <Icon
                        name="solar:magic-stick-3-bold"
                        size={48}
                        className="animate-spin-slow text-retro-black"
                      />
                    </div>
                    <h2 className="mb-3 font-mono text-2xl font-bold tracking-tight">
                      AI IS ANALYZING...
                    </h2>
                    <p className="text-stone-500 font-medium">
                      Structuring your feedback into a developer-ready ticket
                    </p>
                    
                    <div className="mt-8 flex flex-col gap-2 w-64">
                      <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
                        <div className="h-2 w-2 rounded-full bg-retro-black animate-bounce [animation-delay:0ms]" />
                        Generating reproduction steps
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
                        <div className="h-2 w-2 rounded-full bg-retro-black animate-bounce [animation-delay:150ms]" />
                        Assigning priority & tags
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
                        <div className="h-2 w-2 rounded-full bg-retro-black animate-bounce [animation-delay:300ms]" />
                        Writing acceptance criteria
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Ticket Preview */}
                {step === "ticket" && ticket && (
                  <div className="animate-ff-fade-in">
                    <DemoTicketPreview ticket={ticket} screenshot={screenshot} />
                    <div className="mt-12">
                      <DemoSignupCta onTryAgain={handleReset} />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Decorative elements behind card */}
              <div className="absolute -right-4 top-12 h-24 w-24 border-2 border-retro-black bg-retro-yellow/20" />
              <div className="absolute -left-4 bottom-12 h-24 w-24 border-2 border-retro-black bg-retro-blue/20" />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Progress step component
function DemoProgressStep({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${active ? "scale-110" : "scale-100 opacity-60"}`}>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-base font-bold transition-colors ${
          completed
            ? "border-retro-black bg-retro-black text-white"
            : active
              ? "border-retro-black bg-retro-yellow text-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
              : "border-stone-300 bg-white text-stone-400"
        }`}
      >
        {completed ? (
          <Icon name="solar:check-circle-bold" size={20} />
        ) : (
          number
        )}
      </div>
      <span
        className={`hidden font-mono text-[10px] uppercase tracking-widest sm:block ${
          active || completed ? "font-bold text-retro-black" : "font-medium text-stone-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

