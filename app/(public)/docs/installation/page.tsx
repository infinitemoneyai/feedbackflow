"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Book,
  Copy,
  Check,
  Code,
  Puzzle,
  Settings,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

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
    <div className="min-h-screen bg-retro-paper">
      {/* Header */}
      <header className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-retro-black bg-retro-blue shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <Book className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-retro-black">
                Widget Installation Guide
              </h1>
              <p className="text-xs text-stone-500">Simple as adding Google Analytics</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Quick Navigation */}
        <nav className="mb-8 rounded border-2 border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-retro-yellow/20">
                <Code className="h-6 w-6 text-retro-yellow" />
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold text-retro-black">
                  Quick Start
                </h2>
                <p className="text-stone-600">
                  Add the FeedbackFlow widget to your website in under a minute.
                  Just copy and paste the script tag before your closing{" "}
                  <code className="rounded bg-stone-100 px-1 text-sm">&lt;/body&gt;</code> tag.
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
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
                  snippetId="quick-start"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>
              <CodeBlock
                language="html"
                code={`<script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>`}
              />
              <p className="mt-3 text-sm text-stone-500">
                Replace <code className="rounded bg-stone-100 px-1">YOUR_WIDGET_KEY</code> with
                your actual widget key from the{" "}
                <Link href="/settings" className="text-retro-blue hover:underline">
                  Settings page
                </Link>
                .
              </p>
            </div>

            <div className="mt-6 rounded border border-retro-blue/30 bg-retro-blue/5 p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-retro-blue/20">
                    <ChevronRight className="h-4 w-4 text-retro-blue" />
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
                    <code className="rounded bg-stone-100 px-1">wk_</code>.
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
                { id: "html", label: "HTML / Vanilla JS", icon: "🌐" },
                { id: "react", label: "React", icon: "⚛️" },
                { id: "vue", label: "Vue.js", icon: "💚" },
                { id: "nextjs", label: "Next.js", icon: "▲" },
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
                <span>{fw.icon}</span>
                {fw.label}
              </button>
            ))}
          </div>

          {/* HTML / Vanilla JS */}
          {selectedFramework === "html" && (
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-retro-black">
                <span className="text-2xl">🌐</span> HTML / Vanilla JavaScript
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
  src="https://cdn.feedbackflow.dev/widget.js"
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
                    language="html"
                    code={`<!-- FeedbackFlow Widget -->
<script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
  data-position="bottom-right"
  async
></script>`}
                  />
                </div>

                <div className="rounded border border-stone-200 bg-stone-50 p-4">
                  <h4 className="mb-2 font-medium text-stone-700">Full Example</h4>
                  <CodeBlock
                    language="html"
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
    src="https://cdn.feedbackflow.dev/widget.js"
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
                <span className="text-2xl">⚛️</span> React
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
    script.src = 'https://cdn.feedbackflow.dev/widget.js';
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
                    language="typescript"
                    code={`import { useEffect } from 'react';

export function useFeedbackFlow(widgetKey: string) {
  useEffect(() => {
    // Don't load in development if you prefer
    // if (process.env.NODE_ENV === 'development') return;

    const script = document.createElement('script');
    script.src = 'https://cdn.feedbackflow.dev/widget.js';
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
                    language="typescript"
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
                <div className="rounded border border-stone-200 bg-stone-50 p-4">
                  <h4 className="mb-2 font-medium text-stone-700">
                    Method 2: Script Component
                  </h4>
                  <CodeBlock
                    language="typescript"
                    code={`// Add to your index.html or use react-helmet
<script
  src="https://cdn.feedbackflow.dev/widget.js"
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
                <span className="text-2xl">💚</span> Vue.js
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
    script.src = 'https://cdn.feedbackflow.dev/widget.js';
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
                    language="typescript"
                    code={`import { onMounted, onUnmounted } from 'vue';

export function useFeedbackFlow(widgetKey: string) {
  let script: HTMLScriptElement | null = null;

  onMounted(() => {
    script = document.createElement('script');
    script.src = 'https://cdn.feedbackflow.dev/widget.js';
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
                    language="vue"
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
                <span className="text-2xl">▲</span> Next.js
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
          src="https://cdn.feedbackflow.dev/widget.js"
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
                    language="typescript"
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
          src="https://cdn.feedbackflow.dev/widget.js"
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
                <div className="rounded border border-stone-200 bg-stone-50 p-4">
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
        src="https://cdn.feedbackflow.dev/widget.js"
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
                    language="typescript"
                    code={`import Script from 'next/script';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />

      <Script
        src="https://cdn.feedbackflow.dev/widget.js"
        data-widget-key="wk_your_widget_key"
        strategy="lazyOnload"
      />
    </>
  );
}`}
                  />
                </div>

                {/* Environment variable tip */}
                <div className="rounded border border-retro-blue/30 bg-retro-blue/5 p-4">
                  <p className="text-sm text-stone-600">
                    <strong className="text-retro-blue">Pro tip:</strong> Store your widget key in an
                    environment variable:
                  </p>
                  <code className="mt-2 block rounded bg-stone-100 p-2 text-sm">
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
              <Settings className="mt-1 h-5 w-5 text-retro-peach" />
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
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-widget-key
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4 text-stone-500">—</td>
                    <td className="py-3 text-stone-600">
                      <strong>Required.</strong> Your unique widget key (starts with{" "}
                      <code className="rounded bg-stone-100 px-1">wk_</code>)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-position
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1">bottom-right</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Widget position:{" "}
                      <code className="rounded bg-stone-100 px-1">bottom-right</code>,{" "}
                      <code className="rounded bg-stone-100 px-1">bottom-left</code>,{" "}
                      <code className="rounded bg-stone-100 px-1">top-right</code>,{" "}
                      <code className="rounded bg-stone-100 px-1">top-left</code>
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-primary-color
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1">#1a1a1a</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Primary button/accent color (hex code)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-background-color
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1">#ffffff</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Modal background color (hex code)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-text-color
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1">#1a1a1a</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Text color in the modal (hex code)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-button-text
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">string</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1">Send Feedback</code>
                    </td>
                    <td className="py-3 text-stone-600">
                      Text displayed on the floating button
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5">
                        data-disable-recording
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-500">boolean</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1">false</code>
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
                language="html"
                code={`<script
  src="https://cdn.feedbackflow.dev/widget.js"
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
              <Puzzle className="mt-1 h-5 w-5 text-retro-lavender" />
              <p className="text-stone-600">
                After the widget loads, you can interact with it programmatically
                using the <code className="rounded bg-stone-100 px-1">window.FeedbackFlow</code> object.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-stone-700">Open the widget</h4>
                <CodeBlock
                  language="javascript"
                  code={`// Open the feedback modal
window.FeedbackFlow.open();

// Open with pre-selected type
window.FeedbackFlow.open({ type: 'bug' });
window.FeedbackFlow.open({ type: 'feature' });`}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">Close the widget</h4>
                <CodeBlock
                  language="javascript"
                  code={`window.FeedbackFlow.close();`}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">Set user info</h4>
                <CodeBlock
                  language="javascript"
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
                  language="javascript"
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
                <AlertTriangle className="h-5 w-5 text-retro-peach" />
                Widget doesn&apos;t appear on my site
                <ChevronRight className="ml-auto h-5 w-5 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-stone-200 p-4 text-sm text-stone-600">
                <ol className="list-inside list-decimal space-y-2">
                  <li>
                    <strong>Check the widget key</strong> - Make sure your{" "}
                    <code className="rounded bg-stone-100 px-1">data-widget-key</code> matches
                    the key in your FeedbackFlow dashboard.
                  </li>
                  <li>
                    <strong>Check the browser console</strong> - Look for any JavaScript
                    errors that might indicate loading issues.
                  </li>
                  <li>
                    <strong>Check Content Security Policy</strong> - If you have a strict CSP,
                    add <code className="rounded bg-stone-100 px-1">cdn.feedbackflow.dev</code> to
                    your allowed script sources.
                  </li>
                  <li>
                    <strong>Ensure the script is in the body</strong> - The script should be
                    placed before the closing{" "}
                    <code className="rounded bg-stone-100 px-1">&lt;/body&gt;</code> tag.
                  </li>
                </ol>
              </div>
            </details>

            {/* Issue 2 */}
            <details className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <summary className="flex cursor-pointer items-center gap-3 p-4 font-medium text-retro-black">
                <AlertTriangle className="h-5 w-5 text-retro-peach" />
                Screen recording permission denied
                <ChevronRight className="ml-auto h-5 w-5 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-stone-200 p-4 text-sm text-stone-600">
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
                <AlertTriangle className="h-5 w-5 text-retro-peach" />
                Screenshot looks different from the actual page
                <ChevronRight className="ml-auto h-5 w-5 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-stone-200 p-4 text-sm text-stone-600">
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
                <AlertTriangle className="h-5 w-5 text-retro-peach" />
                Feedback submission failed
                <ChevronRight className="ml-auto h-5 w-5 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-stone-200 p-4 text-sm text-stone-600">
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
                <AlertTriangle className="h-5 w-5 text-retro-peach" />
                Widget conflicts with my site&apos;s styles
                <ChevronRight className="ml-auto h-5 w-5 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-stone-200 p-4 text-sm text-stone-600">
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
                    <code className="rounded bg-stone-100 px-1">* {"{}"}</code>) should
                    not affect the widget.
                  </li>
                </ul>
              </div>
            </details>
          </div>
        </section>

        {/* Help Footer */}
        <div className="rounded border-2 border-stone-200 bg-white p-6 text-center">
          <p className="text-stone-600">
            Still having issues?{" "}
            <a
              href="https://github.com/feedbackflow/feedbackflow/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-retro-blue hover:underline"
            >
              Open an issue on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>{" "}
            or check out the{" "}
            <Link href="/docs/api" className="text-retro-blue hover:underline">
              REST API documentation
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-900 p-4 text-sm text-stone-100">
      <code className={`language-${language}`}>{code}</code>
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
      className="flex items-center gap-1 rounded border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
    >
      {isCopied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}
