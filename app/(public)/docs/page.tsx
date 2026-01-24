import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageLayout } from "@/components/layout";

export default function DocsPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-retro-black">
            Documentation
          </h1>
          <p className="mt-3 text-lg text-stone-600">
            Everything you need to integrate FeedbackFlow
          </p>
        </div>

        {/* Quick Start Card */}
        <div className="mb-12 rounded border-2 border-retro-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-retro-yellow/20">
              <Icon name="solar:bolt-bold" size={32} className="text-retro-yellow" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-retro-black">
                Get Started in 2 Minutes
              </h2>
              <p className="mt-2 text-stone-600">
                Add feedback collection to your app with a single script tag.
                No build step, no dependencies.
              </p>
            </div>
            <Link
              href="/docs/installation"
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-yellow px-6 py-3 font-medium text-retro-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
            >
              Quick Start
              <Icon name="solar:arrow-right-linear" size={18} />
            </Link>
          </div>
        </div>

        {/* Documentation Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Installation */}
          <Link
            href="/docs/installation"
            className="group rounded border-2 border-retro-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-retro-black bg-retro-blue">
              <Icon name="solar:download-minimalistic-bold" size={24} className="text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-retro-black">
              Installation
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Add the widget to any website. HTML, React, Vue, and Next.js guides.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-retro-blue">
              Read guide
              <Icon name="solar:arrow-right-linear" size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* REST API */}
          <Link
            href="/docs/api"
            className="group rounded border-2 border-retro-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-retro-black bg-retro-peach">
              <Icon name="solar:code-square-bold" size={24} className="text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-retro-black">
              REST API
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Programmatic access to feedback data. Build custom integrations.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-retro-blue">
              View docs
              <Icon name="solar:arrow-right-linear" size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Self-Hosting */}
          <Link
            href="/docs/self-hosting"
            className="group rounded border-2 border-retro-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-retro-black bg-retro-lavender">
              <Icon name="solar:server-bold" size={24} className="text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-retro-black">
              Self-Hosting
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Run FeedbackFlow on your own infrastructure. Docker & compose guides.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-retro-blue">
              Learn more
              <Icon name="solar:arrow-right-linear" size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold text-retro-black">
            Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border-2 border-retro-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <Icon name="solar:camera-bold" size={24} className="flex-shrink-0 text-retro-yellow" />
                <div>
                  <h3 className="font-semibold text-retro-black">
                    Screenshot Capture
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Automatic page screenshots with annotation tools. Draw, highlight, and redact.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded border-2 border-retro-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <Icon name="solar:videocamera-record-bold" size={24} className="flex-shrink-0 text-retro-red" />
                <div>
                  <h3 className="font-semibold text-retro-black">
                    Screen Recording
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Record screen with audio narration. Perfect for complex bug reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded border-2 border-retro-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <Icon name="solar:cpu-bolt-bold" size={24} className="flex-shrink-0 text-retro-blue" />
                <div>
                  <h3 className="font-semibold text-retro-black">
                    AI-Powered Triage
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Automatic categorization, priority suggestions, and solution drafting.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded border-2 border-retro-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <Icon name="solar:share-bold" size={24} className="flex-shrink-0 text-retro-peach" />
                <div>
                  <h3 className="font-semibold text-retro-black">
                    Export Anywhere
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    One-click export to Linear, Notion, or JSON for AI workflows.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded border-2 border-retro-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <Icon name="solar:users-group-two-rounded-bold" size={24} className="flex-shrink-0 text-retro-lavender" />
                <div>
                  <h3 className="font-semibold text-retro-black">
                    Team Collaboration
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Assign, comment, and track feedback across your team.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded border-2 border-retro-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-start gap-4">
                <Icon name="solar:lock-keyhole-bold" size={24} className="flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="font-semibold text-retro-black">
                    Privacy First
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Self-host option, BYOK for AI, no telemetry, GDPR compliant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold text-retro-black">
            Resources
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href="https://github.com/infinitemoneyai/feedbackflow"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded border-2 border-stone-200 bg-white p-4 transition-colors hover:border-retro-black"
            >
              <Icon name="solar:github-bold" size={24} className="text-stone-600" />
              <div>
                <span className="font-medium text-retro-black">GitHub</span>
                <p className="text-xs text-stone-500">Source code & issues</p>
              </div>
              <Icon name="solar:arrow-right-up-linear" size={18} className="ml-auto text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <a
              href="https://discord.gg/2sTEE3wceB"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded border-2 border-stone-200 bg-white p-4 transition-colors hover:border-retro-black"
            >
              <Icon name="solar:chat-round-dots-bold" size={24} className="text-stone-600" />
              <div>
                <span className="font-medium text-retro-black">Discord</span>
                <p className="text-xs text-stone-500">Community & support</p>
              </div>
              <Icon name="solar:arrow-right-up-linear" size={18} className="ml-auto text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <Link
              href="/manifesto"
              className="group flex items-center gap-3 rounded border-2 border-stone-200 bg-white p-4 transition-colors hover:border-retro-black"
            >
              <Icon name="solar:document-text-bold" size={24} className="text-stone-600" />
              <div>
                <span className="font-medium text-retro-black">Manifesto</span>
                <p className="text-xs text-stone-500">Our philosophy</p>
              </div>
              <Icon name="solar:arrow-right-linear" size={18} className="ml-auto text-stone-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* Help Section */}
        <section className="mt-16 mb-8">
          <div className="rounded border-2 border-retro-blue bg-retro-blue/5 p-6 text-center">
            <h2 className="text-xl font-semibold text-retro-black">
              Need Help?
            </h2>
            <p className="mt-2 text-stone-600">
              Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/infinitemoneyai/feedbackflow/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium text-retro-black transition-colors hover:bg-stone-50"
              >
                <Icon name="solar:bug-bold" size={18} />
                Report an Issue
              </a>
              <a
                href="https://discord.gg/2sTEE3wceB"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              >
                <Icon name="solar:chat-round-dots-bold" size={18} />
                Join Discord
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
