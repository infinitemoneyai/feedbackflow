"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface OnboardingStepInstallProps {
  widgetKey: string;
  projectId: Id<"projects">;
}

export function OnboardingStepInstall({ widgetKey, projectId }: OnboardingStepInstallProps) {
  const [copied, setCopied] = useState(false);
  const [showFramework, setShowFramework] = useState<string | null>(null);
  const completeStep = useMutation(api.onboarding.completeStep);

  const project = useQuery(api.projects.getProject, { projectId });

  const scriptSnippet = `<script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="${widgetKey}"
  async
></script>`;

  const nextjsSnippet = `// In your layout.tsx or _app.tsx
import Script from 'next/script'

<Script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="${widgetKey}"
  strategy="lazyOnload"
/>`;

  const reactSnippet = `// In your index.html or App component
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.feedbackflow.dev/widget.js';
  script.dataset.widgetKey = '${widgetKey}';
  script.async = true;
  document.body.appendChild(script);
}, []);`;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = async () => {
    await completeStep({ step: 4 });
  };

  const isMobileApp = project?.projectType === "mobile_app";

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-blue">
          <Icon name="solar:code-linear" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-retro-black">Install the feedback widget</h2>
          <p className="text-sm text-stone-600">Add this snippet to your site</p>
        </div>
      </div>

      {isMobileApp ? (
        <div className="mb-6 rounded border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <Icon name="solar:smartphone-linear" size={32} className="mx-auto mb-3 text-stone-400" />
          <p className="mb-2 font-medium text-stone-600">Mobile SDK coming soon</p>
          <p className="text-sm text-stone-500">
            For now, you can skip this step and test with our web widget.
          </p>
        </div>
      ) : (
        <>
          {/* Main snippet */}
          <div className="mb-4">
            <div className="flex items-center justify-between border-2 border-retro-black border-b-0 bg-stone-100 px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-600">HTML</span>
              <button
                onClick={() => handleCopy(scriptSnippet)}
                className="flex items-center gap-1 text-sm text-stone-600 transition-colors hover:text-retro-black"
              >
                <Icon name={copied ? "solar:check-circle-linear" : "solar:copy-linear"} size={16} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto border-2 border-retro-black bg-stone-900 p-4 text-sm text-green-400">
              <code>{scriptSnippet}</code>
            </pre>
          </div>

          {/* Framework hints */}
          <div className="mb-6 space-y-2">
            <button
              onClick={() => setShowFramework(showFramework === "nextjs" ? null : "nextjs")}
              className="flex w-full items-center justify-between text-sm text-stone-600 hover:text-retro-black"
            >
              <span>Using Next.js?</span>
              <Icon
                name="solar:alt-arrow-down-linear"
                size={16}
                className={cn("transition-transform", showFramework === "nextjs" && "rotate-180")}
              />
            </button>
            {showFramework === "nextjs" && (
              <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                <code>{nextjsSnippet}</code>
              </pre>
            )}

            <button
              onClick={() => setShowFramework(showFramework === "react" ? null : "react")}
              className="flex w-full items-center justify-between text-sm text-stone-600 hover:text-retro-black"
            >
              <span>Using React?</span>
              <Icon
                name="solar:alt-arrow-down-linear"
                size={16}
                className={cn("transition-transform", showFramework === "react" && "rotate-180")}
              />
            </button>
            {showFramework === "react" && (
              <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                <code>{reactSnippet}</code>
              </pre>
            )}
          </div>
        </>
      )}

      <button
        onClick={handleContinue}
        className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
      >
        I&apos;ve installed it
        <Icon name="solar:arrow-right-linear" size={20} />
      </button>
    </div>
  );
}
