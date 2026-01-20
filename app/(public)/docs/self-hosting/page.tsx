"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Book,
  Copy,
  Check,
  Server,
  Database,
  Key,
  Cloud,
  HardDrive,
  Users,
  Lock,
  ChevronRight,
  ExternalLink,
  Terminal,
  FileCode,
  Settings,
  Shield,
} from "lucide-react";

export default function SelfHostingDocsPage() {
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
            <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-retro-black bg-retro-peach shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-retro-black">
                Self-Hosting Guide
              </h1>
              <p className="text-xs text-stone-500">Run FeedbackFlow on your own infrastructure</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Quick Navigation */}
        <nav className="mb-8 rounded border-2 border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-stone-600">Jump to:</span>
            <a href="#overview" className="text-retro-blue hover:underline">
              Overview
            </a>
            <span className="text-stone-300">|</span>
            <a href="#quick-start" className="text-retro-blue hover:underline">
              Quick Start
            </a>
            <span className="text-stone-300">|</span>
            <a href="#docker" className="text-retro-blue hover:underline">
              Docker
            </a>
            <span className="text-stone-300">|</span>
            <a href="#environment" className="text-retro-blue hover:underline">
              Environment
            </a>
            <span className="text-stone-300">|</span>
            <a href="#convex" className="text-retro-blue hover:underline">
              Convex
            </a>
            <span className="text-stone-300">|</span>
            <a href="#auth" className="text-retro-blue hover:underline">
              Auth
            </a>
            <span className="text-stone-300">|</span>
            <a href="#storage" className="text-retro-blue hover:underline">
              Storage
            </a>
          </div>
        </nav>

        {/* Overview */}
        <section id="overview" className="mb-12">
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-retro-green/20">
                <Shield className="h-6 w-6 text-retro-green" />
              </div>
              <div>
                <h2 className="mb-2 text-xl font-semibold text-retro-black">
                  Self-Hosting Philosophy
                </h2>
                <p className="text-stone-600">
                  FeedbackFlow is designed to be truly self-hostable, like n8n. There are{" "}
                  <strong>no artificial limits</strong>, no phone-home telemetry, and no license
                  checks. You get the full application with all features.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded border border-stone-200 p-4">
                <Lock className="mb-2 h-5 w-5 text-retro-blue" />
                <h3 className="font-medium text-retro-black">Full Control</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Your data stays on your servers. No external dependencies required.
                </p>
              </div>
              <div className="rounded border border-stone-200 p-4">
                <Key className="mb-2 h-5 w-5 text-retro-yellow" />
                <h3 className="font-medium text-retro-black">No License Keys</h3>
                <p className="mt-1 text-sm text-stone-500">
                  No activation, no license servers. Just deploy and run.
                </p>
              </div>
              <div className="rounded border border-stone-200 p-4">
                <Settings className="mb-2 h-5 w-5 text-retro-peach" />
                <h3 className="font-medium text-retro-black">Fully Configurable</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Swap out providers for auth, storage, and more.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section id="quick-start" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Quick Start
          </h2>

          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-3 mb-6">
              <Terminal className="mt-1 h-5 w-5 text-retro-lavender" />
              <p className="text-stone-600">
                Get FeedbackFlow running locally in under 5 minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-stone-700">1. Clone the repository</h4>
                <CodeBlock
                  code="git clone https://github.com/feedbackflow/feedbackflow.git
cd feedbackflow"
                  snippetId="clone"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">2. Install dependencies</h4>
                <CodeBlock
                  code="npm install"
                  snippetId="install"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">3. Set up environment variables</h4>
                <CodeBlock
                  code="cp .env.example .env.local
# Edit .env.local with your configuration"
                  snippetId="env"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">4. Start Convex (separate terminal)</h4>
                <CodeBlock
                  code="npx convex dev"
                  snippetId="convex"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium text-stone-700">5. Start the development server</h4>
                <CodeBlock
                  code="npm run dev"
                  snippetId="dev"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>

              <div className="rounded border border-retro-green/30 bg-retro-green/5 p-4">
                <p className="text-sm text-stone-600">
                  <strong className="text-retro-green">Done!</strong> Open{" "}
                  <code className="rounded bg-stone-100 px-1">http://localhost:3000</code> in your browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Docker Compose */}
        <section id="docker" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Docker Compose Setup
          </h2>

          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-3 mb-6">
              <FileCode className="mt-1 h-5 w-5 text-retro-blue" />
              <p className="text-stone-600">
                For production deployments, we recommend using Docker Compose.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  docker-compose.yml
                </span>
                <CopyButton
                  text={`version: '3.8'

services:
  feedbackflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CONVEX_DEPLOYMENT=\${CONVEX_DEPLOYMENT}
      - NEXT_PUBLIC_CONVEX_URL=\${NEXT_PUBLIC_CONVEX_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=\${CLERK_SECRET_KEY}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=\${STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
      - RESEND_API_KEY=\${RESEND_API_KEY}
      - ENCRYPTION_KEY=\${ENCRYPTION_KEY}
    restart: unless-stopped

  # Optional: Run Convex locally (requires self-hosted Convex)
  # convex:
  #   image: convex/convex:latest
  #   ports:
  #     - "3210:3210"
  #   volumes:
  #     - convex_data:/data

# volumes:
#   convex_data:`}
                  snippetId="docker-compose"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>
              <CodeBlock
                code={`version: '3.8'

services:
  feedbackflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CONVEX_DEPLOYMENT=\${CONVEX_DEPLOYMENT}
      - NEXT_PUBLIC_CONVEX_URL=\${NEXT_PUBLIC_CONVEX_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=\${CLERK_SECRET_KEY}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=\${STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
      - RESEND_API_KEY=\${RESEND_API_KEY}
      - ENCRYPTION_KEY=\${ENCRYPTION_KEY}
    restart: unless-stopped

  # Optional: Run Convex locally (requires self-hosted Convex)
  # convex:
  #   image: convex/convex:latest
  #   ports:
  #     - "3210:3210"
  #   volumes:
  #     - convex_data:/data

# volumes:
#   convex_data:`}
                snippetId="docker-compose-display"
                copiedSnippet={copiedSnippet}
                onCopy={copyToClipboard}
                noButtons
              />
            </div>

            <div className="mt-4">
              <h4 className="mb-2 font-medium text-stone-700">Start with Docker Compose</h4>
              <CodeBlock
                code="docker-compose up -d"
                snippetId="docker-up"
                copiedSnippet={copiedSnippet}
                onCopy={copyToClipboard}
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Dockerfile
                </span>
                <CopyButton
                  text={`FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]`}
                  snippetId="dockerfile"
                  copiedSnippet={copiedSnippet}
                  onCopy={copyToClipboard}
                />
              </div>
              <CodeBlock
                code={`FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]`}
                snippetId="dockerfile-display"
                copiedSnippet={copiedSnippet}
                onCopy={copyToClipboard}
                noButtons
              />
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section id="environment" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Environment Variables
          </h2>

          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-3 mb-6">
              <Key className="mt-1 h-5 w-5 text-retro-yellow" />
              <p className="text-stone-600">
                All configuration is done through environment variables. Create a{" "}
                <code className="rounded bg-stone-100 px-1">.env.local</code> file or set them
                in your hosting platform.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-retro-black">
                    <th className="py-3 pr-4 text-left font-semibold text-retro-black">
                      Variable
                    </th>
                    <th className="py-3 pr-4 text-left font-semibold text-retro-black">
                      Required
                    </th>
                    <th className="py-3 text-left font-semibold text-retro-black">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Convex */}
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <td colSpan={3} className="py-2 px-2 font-medium text-stone-500">
                      Database (Convex)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        CONVEX_DEPLOYMENT
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-green-600">Yes</td>
                    <td className="py-3 text-stone-600">
                      Your Convex deployment name
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        NEXT_PUBLIC_CONVEX_URL
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-green-600">Yes</td>
                    <td className="py-3 text-stone-600">
                      Your Convex deployment URL
                    </td>
                  </tr>

                  {/* Auth */}
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <td colSpan={3} className="py-2 px-2 font-medium text-stone-500">
                      Authentication (Clerk)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-green-600">Yes</td>
                    <td className="py-3 text-stone-600">
                      Clerk publishable key (pk_...)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        CLERK_SECRET_KEY
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-green-600">Yes</td>
                    <td className="py-3 text-stone-600">
                      Clerk secret key (sk_...)
                    </td>
                  </tr>

                  {/* Payments */}
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <td colSpan={3} className="py-2 px-2 font-medium text-stone-500">
                      Payments (Stripe) - Optional for self-host
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        STRIPE_SECRET_KEY
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-400">No</td>
                    <td className="py-3 text-stone-600">
                      Stripe secret key (sk_test_... or sk_live_...)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        STRIPE_PUBLISHABLE_KEY
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-400">No</td>
                    <td className="py-3 text-stone-600">
                      Stripe publishable key
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        STRIPE_WEBHOOK_SECRET
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-400">No</td>
                    <td className="py-3 text-stone-600">
                      Stripe webhook signing secret (whsec_...)
                    </td>
                  </tr>

                  {/* Email */}
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <td colSpan={3} className="py-2 px-2 font-medium text-stone-500">
                      Email (Resend) - Optional
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        RESEND_API_KEY
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-stone-400">No</td>
                    <td className="py-3 text-stone-600">
                      Resend API key for transactional emails
                    </td>
                  </tr>

                  {/* Security */}
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <td colSpan={3} className="py-2 px-2 font-medium text-stone-500">
                      Security
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                        ENCRYPTION_KEY
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-green-600">Yes</td>
                    <td className="py-3 text-stone-600">
                      32-byte key for encrypting API keys (generate with{" "}
                      <code className="rounded bg-stone-100 px-1">openssl rand -hex 32</code>)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Convex Options */}
        <section id="convex" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Convex Database Options
          </h2>

          <div className="space-y-4">
            {/* Convex Cloud */}
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-retro-blue/20">
                  <Cloud className="h-5 w-5 text-retro-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-retro-black">
                    Convex Cloud (Recommended)
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    The easiest option. Convex offers a generous free tier and handles all
                    infrastructure for you.
                  </p>
                  <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-stone-600">
                    <li>
                      Sign up at{" "}
                      <a
                        href="https://convex.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-retro-blue hover:underline"
                      >
                        convex.dev
                      </a>
                    </li>
                    <li>
                      Run <code className="rounded bg-stone-100 px-1">npx convex dev</code> to
                      create a deployment
                    </li>
                    <li>Copy the deployment URL to your environment</li>
                  </ol>
                  <div className="mt-4 rounded border border-retro-blue/30 bg-retro-blue/5 p-3">
                    <p className="text-xs text-stone-600">
                      <strong className="text-retro-blue">Free tier includes:</strong> 1M function
                      calls/month, 1GB storage, real-time sync
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Self-hosted Convex */}
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-retro-peach/20">
                  <Server className="h-5 w-5 text-retro-peach" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-retro-black">
                    Self-Hosted Convex (Advanced)
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Convex is working on a self-hosted option. Check their documentation
                    for the latest status.
                  </p>
                  <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-700">
                      <strong>Note:</strong> Self-hosted Convex is not yet generally available.
                      For full self-hosting, you may need to wait for this feature or consider
                      adapting to a different backend.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Auth Options */}
        <section id="auth" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Authentication Options
          </h2>

          <div className="space-y-4">
            {/* Clerk */}
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-retro-lavender/20">
                  <Users className="h-5 w-5 text-retro-lavender" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-retro-black">
                    Clerk (Default)
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    FeedbackFlow uses Clerk for authentication out of the box. Clerk offers
                    a generous free tier (10,000 MAU).
                  </p>
                  <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-stone-600">
                    <li>
                      Sign up at{" "}
                      <a
                        href="https://clerk.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-retro-blue hover:underline"
                      >
                        clerk.com
                      </a>
                    </li>
                    <li>Create an application</li>
                    <li>Copy the API keys to your environment</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-100">
                  <Settings className="h-5 w-5 text-stone-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-retro-black">
                    Alternative Auth Providers
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    To use a different auth provider, you&apos;ll need to modify the codebase:
                  </p>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 text-stone-400" />
                      <div>
                        <strong className="text-retro-black">NextAuth.js</strong>
                        <span className="text-stone-600">
                          {" "}- Open source, supports many providers. Replace Clerk components with
                          NextAuth.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 text-stone-400" />
                      <div>
                        <strong className="text-retro-black">Supabase Auth</strong>
                        <span className="text-stone-600">
                          {" "}- Part of Supabase, can be self-hosted. Good option if already using
                          Supabase.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 text-stone-400" />
                      <div>
                        <strong className="text-retro-black">Keycloak</strong>
                        <span className="text-stone-600">
                          {" "}- Enterprise-grade, fully self-hosted identity management.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 text-stone-400" />
                      <div>
                        <strong className="text-retro-black">Convex Auth</strong>
                        <span className="text-stone-600">
                          {" "}- Native Convex authentication. Simpler setup, fewer moving parts.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Storage Options */}
        <section id="storage" className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Storage Configuration
          </h2>

          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-retro-peach/20">
                <HardDrive className="h-5 w-5 text-retro-peach" />
              </div>
              <div>
                <h3 className="font-semibold text-retro-black">
                  External Storage for Videos
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  FeedbackFlow stores screenshots in Convex storage. For video recordings,
                  you can configure external storage for better scalability.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded border border-stone-200 p-4">
                <h4 className="font-medium text-retro-black">Supported Providers</h4>
                <ul className="mt-2 space-y-2 text-sm text-stone-600">
                  <li>
                    <strong>Amazon S3</strong> - Standard S3 with region selection
                  </li>
                  <li>
                    <strong>Cloudflare R2</strong> - S3-compatible with zero egress fees
                  </li>
                  <li>
                    <strong>Google Cloud Storage</strong> - Service account authentication
                  </li>
                  <li>
                    <strong>MinIO</strong> - Self-hosted S3-compatible storage
                  </li>
                </ul>
              </div>

              <div className="rounded border border-stone-200 p-4">
                <h4 className="font-medium text-retro-black">Configuration</h4>
                <p className="mt-2 text-sm text-stone-600">
                  Configure external storage in Settings &rarr; Storage. Enter your
                  credentials and test the connection before enabling.
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  If no external storage is configured, FeedbackFlow falls back to
                  Convex storage (50MB file size limit).
                </p>
              </div>

              <div className="rounded border border-retro-blue/30 bg-retro-blue/5 p-4">
                <h4 className="font-medium text-retro-blue">Self-Hosted MinIO Example</h4>
                <p className="mt-2 text-sm text-stone-600">
                  For fully self-hosted storage, set up MinIO:
                </p>
                <div className="mt-3">
                  <CodeBlock
                    code={`# Add to docker-compose.yml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    - MINIO_ROOT_USER=minioadmin
    - MINIO_ROOT_PASSWORD=minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data

volumes:
  minio_data:`}
                    snippetId="minio"
                    copiedSnippet={copiedSnippet}
                    onCopy={copyToClipboard}
                  />
                </div>
                <p className="mt-3 text-sm text-stone-600">
                  Then configure with endpoint{" "}
                  <code className="rounded bg-stone-100 px-1">http://minio:9000</code> in
                  the storage settings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* No Phone Home */}
        <section id="privacy" className="mb-12">
          <div className="rounded border-2 border-retro-green bg-retro-green/5 p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 flex-shrink-0 text-retro-green" />
              <div>
                <h3 className="font-semibold text-retro-green">
                  No Telemetry, No Phone Home
                </h3>
                <p className="mt-2 text-sm text-stone-600">
                  FeedbackFlow does not:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-600">
                  <li>Send usage data to our servers</li>
                  <li>Require license keys or activation</li>
                  <li>Check for updates or validity</li>
                  <li>Limit features based on deployment type</li>
                </ul>
                <p className="mt-3 text-sm text-stone-600">
                  Your self-hosted instance is completely independent. The only external
                  calls are to services you explicitly configure (Clerk, Stripe, AI providers,
                  external storage).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Help Footer */}
        <div className="rounded border-2 border-stone-200 bg-white p-6 text-center">
          <p className="text-stone-600">
            Need help?{" "}
            <a
              href="https://github.com/feedbackflow/feedbackflow/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-retro-blue hover:underline"
            >
              Open an issue on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>{" "}
            or check the{" "}
            <Link href="/docs/installation" className="text-retro-blue hover:underline">
              widget installation docs
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  code,
  snippetId,
  copiedSnippet,
  onCopy,
  noButtons = false,
}: {
  code: string;
  snippetId: string;
  copiedSnippet: string | null;
  onCopy: (text: string, snippetId: string) => void;
  noButtons?: boolean;
}) {
  return (
    <div className="relative">
      {!noButtons && (
        <div className="absolute right-2 top-2">
          <CopyButton
            text={code}
            snippetId={snippetId}
            copiedSnippet={copiedSnippet}
            onCopy={onCopy}
          />
        </div>
      )}
      <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-900 p-4 text-sm text-stone-100">
        <code>{code}</code>
      </pre>
    </div>
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
      className="flex items-center gap-1 rounded border border-stone-600 bg-stone-800 px-2 py-1 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-700"
    >
      {isCopied ? (
        <>
          <Check className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Copied!</span>
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
