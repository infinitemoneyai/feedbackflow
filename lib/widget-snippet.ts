/**
 * Shared embed-snippet templates — the ONE place install snippets are built.
 *
 * ADR-0001: the dashboard is the source of truth for Widget Config and the
 * installed widget fetches it at load, so snippets carry only the widget key
 * and API URL. Never add appearance data-* attributes here — they'd freeze
 * settings at copy time, which is exactly what ADR-0001 removed.
 */

export interface WidgetSnippetInput {
  widgetKey: string;
  widgetUrl: string;
  apiUrl: string;
}

export function buildHtmlSnippet(input: WidgetSnippetInput): string {
  return `<script
  src="${input.widgetUrl}"
  data-widget-key="${input.widgetKey}"
  data-api-url="${input.apiUrl}"
  async
></script>`;
}

export function buildAgentInstallPrompt(input: WidgetSnippetInput): string {
  return `Install the FeedbackFlow feedback widget on this site.

1. Detect the framework this project uses (Next.js App Router or Pages Router, plain React, Vue, static HTML, etc.).

2. Add the widget script the idiomatic way for that framework:
   - Next.js: use next/script with strategy="lazyOnload" in the root layout
   - Plain React or other SPA frameworks: inject the script tag once at app mount
   - Static HTML: add the script tag just before </body>

3. This is the exact snippet — use these exact attribute values, do not invent or change any:

${buildHtmlSnippet(input)}

4. Do not add any other data-* attributes or configuration. The widget's appearance and behavior are controlled from the FeedbackFlow dashboard, not the embed code.

5. Verify: start the dev server, open the site, and confirm a floating feedback button appears in a corner of the page.

When done, tell me to click the feedback button and submit my first piece of feedback — it will appear in my FeedbackFlow Inbox.`;
}

export function buildNextjsSnippet(input: WidgetSnippetInput): string {
  return `// In your layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${input.widgetUrl}"
          data-widget-key="${input.widgetKey}"
          data-api-url="${input.apiUrl}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}`;
}

export function buildReactSnippet(input: WidgetSnippetInput): string {
  return `// In your App component
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${input.widgetUrl}';
    script.dataset.widgetKey = '${input.widgetKey}';
    script.dataset.apiUrl = '${input.apiUrl}';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    // Your app content
  );
}`;
}
