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
