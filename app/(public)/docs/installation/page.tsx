"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { DocsLayout } from "@/components/layout";

type Framework = "html" | "react" | "vue" | "nextjs";

export default function InstallationDocsPage() {
  const [selectedFramework, setSelectedFramework] = useState<Framework>("html");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = async (text: string, snippetId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <DocsLayout
      title="Widget Installation Guide"
      description="Simple as adding Google Analytics"
      breadcrumb="Installation"
      iconName="solar:download-minimalistic-bold"
      iconBgColor="bg-retro-blue"
    >

        {/* Quick Navigation */}
        <nav className="mb-8 rounded border-2 border-retro-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-stone-600">Jump to:</span>
            <a href="#quick-start" className="text-retro-blue hover:underline">
              Quick Start
            </a>
            <span className="text-stone-300">|</span>
            <a href="#frameworks" className="text-retro-blue hover:underline">
              Frameworks
            </a>
            <span className="text-stone-300">|</span>
            <a href="#configuration" className="text-retro-blue hover:underline">
              Configuration
            </a>
            <span className="text-stone-300">|</span>
            <a href="#troubleshooting" className="text-retro-blue hover:underline">
              Troubleshooting
            </a>
          </div>
        </nav>

        {/* Quick Start */}
        <section id="quick-start" className="mb-12">
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-retro-yellow/20">
                <Icon name="solar:code-bold" size={24} className="text-retro-yellow" />
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-retro-black">
                  Quick Start
                </h2>
                <p className="text-stone-600">
                  Add the FeedbackFlow widget to your website in under a minute.
                  Just copy and paste the script tag before your closing{" "}
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-sm">&lt;/body&gt;</code> tag.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Installation Script
                </span>
                <CopyButton
                  text={`<script
  src="https://feedbackflow.cc/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
                  snippetId="quick-start"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>
              <CodeBlock
                code={`<script
  src="https://feedbackflow.cc/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
              />
              <p className="mt-3 text-sm text-stone-500">
                Replace <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono">YOUR_WIDGET_KEY</code> with
                your actual widget key from the{" "}
                <Link href="/settings" className="text-retro-blue hover:underline">
                  Settings page
                </Link>
                .
              </p>
            </div>

            <div className="mt-6 rounded border-2 border-retro-blue/30 bg-retro-blue/5 p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-retro-blue/20">
                    <Icon name="solar:question-circle-bold" size={16} className="text-retro-blue" />
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-retro-blue">
                    Where do I find my widget key?
                  </p>
                  <p className="mt-1 text-stone-600">
                    Go to{" "}
                    <Link href="/settings" className="font-medium text-retro-blue hover:underline">
                      Settings &rarr; Widget
                    </Link>{" "}
                    and select your project. Your widget key starts with{" "}
                    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono">wk_</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Framework-Specific Guides */}
        <section id="frameworks" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Framework-Specific Installation
          </h2>

          {/* Framework Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                { id: "html", label: "HTML / Vanilla JS", icon: "solar:global-linear" },
                { id: "react", label: "React", icon: "solar:atom-linear" },
                { id: "vue", label: "Vue.js", icon: "solar:widget-linear" },
                { id: "nextjs", label: "Next.js", icon: "solar:triangle-linear" },
              ] as const
            ).map((fw) => (
              <button
                key={fw.id}
                onClick={() => setSelectedFramework(fw.id)}
                className={`flex items-center gap-2 rounded border-2 px-4 py-2 text-sm font-medium transition-all ${
                  selectedFramework === fw.id
                    ? "border-retro-black bg-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                <Icon name={fw.icon} size={18} />
                {fw.label}
              </button>
            ))}
          </div>

          {/* HTML / Vanilla JS */}
          {selectedFramework === "html" && (
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-retro-black">
                <Icon name="solar:global-bold" size={24} /> HTML / Vanilla JavaScript
              </h3>
              <p className="mb-4 text-stone-600">
                The simplest installation method. Works with any website, CMS, or static HTML.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Add before &lt;/body&gt;
                    </span>
                    <CopyButton
                      text={`<!-- FeedbackFlow Widget -->
<script
  src="https://cdn.feedbackflow.cc/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
  data-position="bottom-right"
  async
></script>`}
                      snippetId="html-basic"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`<!-- FeedbackFlow Widget -->
<script
  src="https://feedbackflow.cc/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
  data-position="bottom-right"
  async
></script>`}
                  />
                </div>

                <div className="rounded border-2 border-stone-200 bg-stone-50 p-4">
                  <h4 className="mb-2 font-medium text-stone-700">Full Example</h4>
                  <CodeBlock
                    code={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my website</h1>

  <!-- Your content here -->

  <!-- FeedbackFlow Widget - Add just before </body> -->
  <script
    src="https://feedbackflow.cc/widget.js"
    data-widget-key="wk_abc123def456"
    data-position="bottom-right"
    async
  ></script>
</body>
</html>`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* React */}
          {selectedFramework === "react" && (
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-retro-black">
                <Icon name="solar:atom-bold" size={24} /> React
              </h3>
              <p className="mb-4 text-stone-600">
                Use a custom hook or load the widget in your App component.
              </p>

              <div className="space-y-6">
                {/* Method 1: Custom Hook */}
                <div>
                  <h4 className="mb-2 font-medium text-stone-700">
                    Method 1: Custom Hook (Recommended)
                  </h4>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      useFeedbackFlow.ts
                    </span>
                    <CopyButton
                      text={`import { useEffect } from 'react';

export function useFeedbackFlow(widgetKey: string) {
  useEffect(() => {
    // Don't load in development if you prefer
    // if (process.env.NODE_ENV === 'development') return;

    const script = document.createElement('script');
    script.src = 'https://feedbackflow.cc/widget.js';
    script.async = true;
    script.dataset.widgetKey = widgetKey;
    script.dataset.position = 'bottom-right';

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      // Clean up widget if it has a destroy method
      if (window.FeedbackFlow?.destroy) {
        window.FeedbackFlow.destroy();
      }
    };
  }, [widgetKey]);
}`}
                      snippetId="react-hook"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`import { useEffect } from 'react';

export function useFeedbackFlow(widgetKey: string) {
  useEffect(() => {
    // Don't load in development if you prefer
    // if (process.env.NODE_ENV === 'development') return;

    const script = document.createElement('script');
    script.src = 'https://feedbackflow.cc/widget.js';
    script.async = true;
    script.dataset.widgetKey = widgetKey;
    script.dataset.position = 'bottom-right';

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      // Clean up widget if it has a destroy method
      if (window.FeedbackFlow?.destroy) {
        window.FeedbackFlow.destroy();
      }
    };
  }, [widgetKey]);
}`}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      App.tsx
                    </span>
                    <CopyButton
                      text={`import { useFeedbackFlow } from './useFeedbackFlow';

function App() {
  useFeedbackFlow('wk_your_widget_key');

  return (
    <div>
      {/* Your app content */}
    </div>
  );
}`}
                      snippetId="react-usage"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`import { useFeedbackFlow } from './useFeedbackFlow';

function App() {
  useFeedbackFlow('wk_your_widget_key');

  return (
    <div>
      {/* Your app content */}
    </div>
  );
}`}
                  />
                </div>

                {/* Method 2: Component */}
                <div className="rounded border-2 border-stone-200 bg-stone-50 p-4">
                  <h4 className="mb-2 font-medium text-stone-700">
                    Method 2: Script Component
                  </h4>
                  <CodeBlock
                    code={`                // Add to your index.html or use react-helmet
<script
  src="https://feedbackflow.cc/widget.js"
  data-widget-key="wk_your_widget_key"
  async
/>`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vue.js */}
          {selectedFramework === "vue" && (
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-retro-black">
                <Icon name="solar:widget-bold" size={24} /> Vue.js
              </h3>
              <p className="mb-4 text-stone-600">
                Load the widget using a composable or in your main App component.
              </p>

              <div className="space-y-6">
                {/* Composable */}
                <div>
                  <h4 className="mb-2 font-medium text-stone-700">
                    Composable (Vue 3)
                  </h4>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      useFeedbackFlow.ts
                    </span>
                    <CopyButton
                      text={`import { onMounted, onUnmounted } from 'vue';

export function useFeedbackFlow(widgetKey: string) {
  let script: HTMLScriptElement | null = null;

  onMounted(() => {
    script = document.createElement('script');
    script.src = 'https://feedbackflow.cc/widget.js';
    script.async = true;
    script.dataset.widgetKey = widgetKey;
    script.dataset.position = 'bottom-right';

    document.body.appendChild(script);
  });

  onUnmounted(() => {
    if (script) {
      document.body.removeChild(script);
    }
    // Clean up widget
    if (window.FeedbackFlow?.destroy) {
      window.FeedbackFlow.destroy();
    }
  });
}`}
                      snippetId="vue-composable"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`import { onMounted, onUnmounted } from 'vue';

export function useFeedbackFlow(widgetKey: string) {
  let script: HTMLScriptElement | null = null;

  onMounted(() => {
    script = document.createElement('script');
    script.src = 'https://feedbackflow.cc/widget.js';
    script.async = true;
    script.dataset.widgetKey = widgetKey;
    script.dataset.position = 'bottom-right';

    document.body.appendChild(script);
  });

  onUnmounted(() => {
    if (script) {
      document.body.removeChild(script);
    }
    // Clean up widget
    if (window.FeedbackFlow?.destroy) {
      window.FeedbackFlow.destroy();
    }
  });
}`}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      App.vue
                    </span>
                    <CopyButton
                      text={`<script setup lang="ts">
import { useFeedbackFlow } from './composables/useFeedbackFlow';

useFeedbackFlow('wk_your_widget_key');
</script>

<template>
  <div>
    <!-- Your app content -->
  </div>
</template>`}
                      snippetId="vue-usage"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`<script setup lang="ts">
import { useFeedbackFlow } from './composables/useFeedbackFlow';

useFeedbackFlow('wk_your_widget_key');
</script>

<template>
  <div>
    <!-- Your app content -->
  </div>
</template>`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Next.js */}
          {selectedFramework === "nextjs" && (
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-retro-black">
                <Icon name="solar:triangle-bold" size={24} /> Next.js
              </h3>
              <p className="mb-4 text-stone-600">
                Use the built-in Script component for optimal loading.
              </p>

              <div className="space-y-6">
                {/* App Router */}
                <div>
                  <h4 className="mb-2 font-medium text-stone-700">
                    App Router (Next.js 13+)
                  </h4>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      app/layout.tsx
                    </span>
                    <CopyButton
                      text={`import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* FeedbackFlow Widget */}
        <Script
          src="https://feedbackflow.cc/widget.js"
          data-widget-key="wk_your_widget_key"
          data-position="bottom-right"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`}
                      snippetId="nextjs-app"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* FeedbackFlow Widget */}
        <Script
          src="https://feedbackflow.cc/widget.js"
          data-widget-key="wk_your_widget_key"
          data-position="bottom-right"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`}
                  />
                </div>

                {/* Pages Router */}
                <div className="rounded border-2 border-stone-200 bg-stone-50 p-4">
                  <h4 className="mb-2 font-medium text-stone-700">
                    Pages Router
                  </h4>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      pages/_app.tsx
                    </span>
                    <CopyButton
                      text={`import Script from 'next/script';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />

      <Script
        src="https://feedbackflow.cc/widget.js"
        data-widget-key="wk_your_widget_key"
        strategy="lazyOnload"
      />
    </>
  );
}`}
                      snippetId="nextjs-pages"
                      copiedSnippet={copiedSnippet}
                      onCopy={copyToClipboard}
                    />
                  </div>
                  <CodeBlock
                    code={`import Script from 'next/script';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />

      <Script
        src="https://feedbackflow.cc/widget.js"
        data-widget-key="wk_your_widget_key"
        strategy="lazyOnload"
      />
    </>
  );
}`}
                  />
                </div>

                {/* Environment variable tip */}
                <div className="rounded border-2 border-retro-blue/30 bg-retro-blue/5 p-4">
                  <p className="text-sm text-stone-600">
                    <strong className="text-retro-blue">Pro tip:</strong> Store your widget key in an
                    environment variable:
                  </p>
                  <code className="mt-2 block rounded bg-stone-100 p-2 font-mono text-sm">
                    data-widget-key={"{process.env.NEXT_PUBLIC_FEEDBACKFLOW_KEY}"}
                  </code>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Configuration Options */}
        <section id="configuration" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Configuration Options
          </h2>

          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-3 mb-6">
              <Icon name="solar:settings-bold" size={20} className="mt-1 text-retro-peach" />
              <p className="text-stone-600">
                Configure the widget using data attributes on the script tag.
                All options can also be set in the{" "}
                <Link href="/settings" className="text-retro-blue hover:underline">
                  Settings dashboard
                </Link>
                .
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-retro-black">
                    <th className="py-3 pr-4 text-left font-semibold text-retro-black">
                      Attribute
                    </th>
                    <th className="py-3 pr-4 text-left font-semibold text-retro-black">
                      Type
                    </th>
                    <th className="py-3 pr-4 text-left font-semibold text-retro-black">
                      Default
                    </th>
                    <th className="py-3 text-left font-semibold text-retro-black">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-widget-key
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4 text-stone-500">—</td>
                    <td className="py-3 text-stone-600">
                      <strong>Required.</strong> Your unique widget key (starts with{" "}
                      <code className="rounded bg-stone-100 px-1 font-mono">wk_</code>)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-position
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">bottom-right</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Widget position:{" "}
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">bottom-right</code>,{" "}
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">bottom-left</code>,{" "}
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">top-right</code>,{" "}
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">top-left</code>
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-primary-color
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">#1a1a1a</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Primary button/accent color (hex code)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-background-color
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">#ffffff</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Modal background color (hex code)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-text-color
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">#1a1a1a</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Text color in the modal (hex code)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-button-text
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">Send Feedback</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Text displayed on the floating button
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                        data-disable-recording
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">boolean</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1 font-mono text-xs">false</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Disable screen recording feature
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h4 className="mb-2 font-medium text-stone-700">Example with all options</h4>
              <CodeBlock
                code={`<script
  src="https://feedbackflow.cc/widget.js"
  data-widget-key="wk_your_widget_key"
  data-position="bottom-left"
  data-primary-color="#6B9AC4"
  data-background-color="#F7F5F0"
  data-text-color="#1a1a1a"
  data-button-text="Report Issue"
  async
></script>`}
              />
            </div>
          </div>
        </section>

        {/* JavaScript API */}
        <section id="javascript-api" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            JavaScript API
          </h2>

          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-3 mb-6">
              <Icon name="solar:programming-bold" size={20} className="mt-1 text-retro-lavender" />
              <p className="text-stone-600">
                After the widget loads, you can interact with it programmatically
                using the <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono">window.FeedbackFlow</code> object.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-stone-700">Open the widget</h4>
                <CodeBlock
                  code={`// Open the feedback modal
window.FeedbackFlow.open();

// Open with pre-selected type
window.FeedbackFlow.open({ type: 'bug' });
window.FeedbackFlow.open({ type: 'feature' });`}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">Close the widget</h4>
                <CodeBlock code={`window.FeedbackFlow.close();`} />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">Set user info</h4>
                <CodeBlock
                  code={`// Pre-fill submitter info (e.g., from your auth system)
window.FeedbackFlow.identify({
  email: 'user@example.com',
  name: 'John Doe',
});`}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">Destroy the widget</h4>
                <CodeBlock
                  code={`// Remove the widget completely
window.FeedbackFlow.destroy();`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Troubleshooting
          </h2>

          <div className="space-y-4">
            {/* Issue 1 */}
            <details className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <summary className="flex cursor-pointer items-center gap-3 p-4 font-medium text-retro-black">
                <Icon name="solar:danger-triangle-bold" size={20} className="text-retro-peach" />
                Widget doesn&apos;t appear on my site
                <Icon name="solar:alt-arrow-right-linear" size={20} className="ml-auto transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t-2 border-stone-200 p-4 text-sm text-stone-600">
                <ol className="list-inside list-decimal space-y-2">
                  <li>
                    <strong>Check the widget key</strong> - Make sure your{" "}
                    <code className="rounded bg-stone-100 px-1 font-mono">data-widget-key</code> matches
                    the key in your FeedbackFlow dashboard.
                  </li>
                  <li>
                    <strong>Check the browser console</strong> - Look for any JavaScript
                    errors that might indicate loading issues.
                  </li>
                  <li>
                    <strong>Check Content Security Policy</strong> - If you have a strict CSP,
                    add your FeedbackFlow domain to your allowed script sources.
                  </li>
                  <li>
                    <strong>Ensure the script is in the body</strong> - The script should be
                    placed before the closing{" "}
                    <code className="rounded bg-stone-100 px-1 font-mono">&lt;/body&gt;</code> tag.
                  </li>
                </ol>
              </div>
            </details>

            {/* Issue 2 */}
            <details className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <summary className="flex cursor-pointer items-center gap-3 p-4 font-medium text-retro-black">
                <Icon name="solar:danger-triangle-bold" size={20} className="text-retro-peach" />
                Screen recording permission denied
                <Icon name="solar:alt-arrow-right-linear" size={20} className="ml-auto transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t-2 border-stone-200 p-4 text-sm text-stone-600">
                <ol className="list-inside list-decimal space-y-2">
                  <li>
                    <strong>User must grant permission</strong> - Screen recording requires
                    explicit user permission via the browser&apos;s screen sharing dialog.
                  </li>
                  <li>
                    <strong>HTTPS required</strong> - Screen recording only works on HTTPS
                    sites (or localhost for development).
                  </li>
                  <li>
                    <strong>Browser support</strong> - Screen recording is supported in
                    Chrome, Edge, and Firefox. Safari has limited support.
                  </li>
                </ol>
              </div>
            </details>

            {/* Issue 3 */}
            <details className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <summary className="flex cursor-pointer items-center gap-3 p-4 font-medium text-retro-black">
                <Icon name="solar:danger-triangle-bold" size={20} className="text-retro-peach" />
                Screenshot looks different from the actual page
                <Icon name="solar:alt-arrow-right-linear" size={20} className="ml-auto transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t-2 border-stone-200 p-4 text-sm text-stone-600">
                <p className="mb-2">
                  The widget uses html2canvas for screenshots, which has some limitations:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    Cross-origin images may not render (images from other domains)
                  </li>
                  <li>
                    Some CSS properties like backdrop-filter may not be captured
                  </li>
                  <li>
                    Canvas and WebGL content may appear blank
                  </li>
                  <li>
                    iframes are not captured for security reasons
                  </li>
                </ul>
                <p className="mt-2">
                  For pixel-perfect captures, users can use screen recording instead.
                </p>
              </div>
            </details>

            {/* Issue 4 */}
            <details className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <summary className="flex cursor-pointer items-center gap-3 p-4 font-medium text-retro-black">
                <Icon name="solar:danger-triangle-bold" size={20} className="text-retro-peach" />
                Feedback submission failed
                <Icon name="solar:alt-arrow-right-linear" size={20} className="ml-auto transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t-2 border-stone-200 p-4 text-sm text-stone-600">
                <ol className="list-inside list-decimal space-y-2">
                  <li>
                    <strong>Check network connectivity</strong> - The widget queues submissions
                    offline and retries when connection is restored.
                  </li>
                  <li>
                    <strong>Rate limiting</strong> - There&apos;s a limit of 10 submissions per
                    minute per user and 100 per day per widget.
                  </li>
                  <li>
                    <strong>Widget key invalid</strong> - Verify your widget key hasn&apos;t been
                    regenerated in the dashboard.
                  </li>
                </ol>
              </div>
            </details>

            {/* Issue 5 */}
            <details className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <summary className="flex cursor-pointer items-center gap-3 p-4 font-medium text-retro-black">
                <Icon name="solar:danger-triangle-bold" size={20} className="text-retro-peach" />
                Widget conflicts with my site&apos;s styles
                <Icon name="solar:alt-arrow-right-linear" size={20} className="ml-auto transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t-2 border-stone-200 p-4 text-sm text-stone-600">
                <p className="mb-2">
                  The widget uses Shadow DOM to isolate its styles from your page.
                  However, if you&apos;re experiencing conflicts:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    The widget button has a z-index of 9999. If other elements overlap,
                    you may need to adjust their z-index.
                  </li>
                  <li>
                    Global CSS resets that target all elements (e.g.,{" "}
                    <code className="rounded bg-stone-100 px-1 font-mono">* {"{}"}</code>) should
                    not affect the widget.
                  </li>
                </ul>
              </div>
            </details>
          </div>
        </section>
    </DocsLayout>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded border-2 border-stone-800 bg-stone-900 p-4 font-mono text-sm text-stone-100">
      <code>{code}</code>
    </pre>
  );
}

interface CopyButtonProps {
  text: string;
  snippetId: string;
  copiedSnippet: string | null;
  onCopy: (text: string, snippetId: string) => void;
}

function CopyButton({ text, snippetId, copiedSnippet, onCopy }: CopyButtonProps) {
  const isCopied = copiedSnippet === snippetId;

  return (
    <button
      onClick={() => onCopy(text, snippetId)}
      className="flex items-center gap-1.5 rounded border-2 border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
    >
      {isCopied ? (
        <>
          <Icon name="solar:check-circle-bold" size={14} className="text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Icon name="solar:copy-linear" size={14} />
          Copy
        </>
      )}
    </button>
  );
}
