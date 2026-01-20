import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Video,
  Wand2,
  Ticket,
  ArrowRight,
  Github,
  Layers,
  Zap,
  MessageSquare,
  Settings,
  ExternalLink,
  FileJson,
  Check,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Navigation */}
      <nav className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-mono text-xl font-bold tracking-tight text-retro-black">
            FeedbackFlow
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-stone-600 transition-colors hover:text-retro-black"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-stone-600 transition-colors hover:text-retro-black"
            >
              Pricing
            </Link>
            <Link
              href="https://github.com/feedbackflow/feedbackflow"
              className="text-sm text-stone-600 transition-colors hover:text-retro-black"
            >
              GitHub
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="border-2 border-retro-black bg-white text-retro-black hover:bg-stone-50"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-6 border border-retro-yellow/30 bg-retro-yellow/10 text-retro-black">
              Open Source
            </Badge>
            <h1 className="mb-6 max-w-4xl text-4xl font-medium tracking-tighter text-retro-black md:text-6xl lg:text-7xl">
              Turn messy feedback into
              <span className="relative mx-2 inline-block">
                <span className="relative z-10">actionable tickets</span>
                <span className="absolute bottom-1 left-0 h-3 w-full bg-retro-yellow/50"></span>
              </span>
              automatically
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-stone-600 md:text-xl">
              Screenshot capture, screen recording with audio, and AI-powered triage. Export to
              Linear, Notion, or JSON for your AI workflows.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button className="border-2 border-retro-black bg-retro-black px-8 py-6 text-lg text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888]">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://github.com/feedbackflow/feedbackflow">
                <Button
                  variant="outline"
                  className="border-2 border-retro-black bg-white px-8 py-6 text-lg text-retro-black hover:bg-stone-50"
                >
                  <Github className="mr-2 h-5 w-5" />
                  Star on GitHub
                </Button>
              </Link>
            </div>
            <p className="mt-6 font-mono text-xs text-stone-400">
              Free tier: 1 seat, 25 feedback/month. Self-host for unlimited.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-retro-black md:text-4xl">
              We see everything. Even the bugs you hid.
            </h2>
            <p className="mx-auto max-w-2xl text-stone-600">
              Feedback comes in scattered across Slack, email, and support tickets. Context is lost.
              Screenshots are blurry. &ldquo;Can you record what happened?&rdquo; leads nowhere.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Context Gets Lost",
                description:
                  "Screenshots without URLs. Videos without narration. Hours wasted trying to reproduce.",
              },
              {
                title: "Manual Ticket Writing",
                description:
                  "Translate vague feedback into clear tickets. Over and over. Every single day.",
              },
              {
                title: "Scattered Feedback",
                description:
                  "Slack DMs, email threads, support tickets. Which one has that bug report from last week?",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border-2 border-retro-black bg-retro-paper p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
              >
                <h3 className="mb-2 text-lg font-medium text-retro-black">{item.title}</h3>
                <p className="text-sm text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
      <section className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-retro-black md:text-4xl">
              Everything you need to capture feedback
            </h2>
            <p className="mx-auto max-w-2xl text-stone-600">
              One widget. Complete context. AI-powered processing.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Screenshot Capture */}
            <div className="group border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-blue bg-retro-blue/20 text-retro-blue">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-retro-black">Screenshot Capture</h3>
              <p className="text-sm text-stone-600">
                Capture the visible viewport with one click. Annotate with pen, highlighter, and
                shapes.
              </p>
            </div>

            {/* Screen Recording */}
            <div className="group border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-red bg-retro-red/20 text-retro-red">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-retro-black">Screen Recording + Audio</h3>
              <p className="text-sm text-stone-600">
                Record your screen with voice narration. Show exactly what happened, in context.
              </p>
            </div>

            {/* AI Triage */}
            <div className="group border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-lavender bg-retro-lavender/20 text-retro-lavender">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-retro-black">AI Auto-Triage</h3>
              <p className="text-sm text-stone-600">
                Automatically categorize, prioritize, and suggest tags. Analyze screenshots with
                vision AI.
              </p>
            </div>

            {/* Ticket Drafting - Featured */}
            <div className="group border-2 border-retro-black bg-retro-yellow p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] md:col-span-2">
              <div className="flex items-start gap-6">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-black bg-white">
                  <Ticket className="h-8 w-8 text-retro-black" />
                </div>
                <div>
                  <Badge className="mb-2 bg-retro-black text-white">Priority Feature</Badge>
                  <h3 className="mb-2 text-xl font-medium text-retro-black">AI Ticket Drafting</h3>
                  <p className="text-stone-700">
                    Transform feedback into formatted tickets automatically. Clear title,
                    description, repro steps, acceptance criteria. Ready to export.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Conversation */}
            <div className="group border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-peach bg-retro-peach/20 text-retro-peach">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-retro-black">AI Conversation</h3>
              <p className="text-sm text-stone-600">
                Chat with AI about the issue. Explore deeper before deciding on action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-retro-black md:text-4xl">
              Feedback to ticket in minutes, not hours
            </h2>
            <p className="mx-auto max-w-2xl text-stone-600">Simple workflow. Powerful automation.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: 1, title: "Capture", description: "Screenshot or record with the widget" },
              { step: 2, title: "Process", description: "AI categorizes and suggests solutions" },
              { step: 3, title: "Draft", description: "Generate formatted ticket with one click" },
              { step: 4, title: "Export", description: "Send to Linear, Notion, or JSON" },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-retro-black bg-retro-paper font-mono text-2xl font-bold shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  {item.step}
                </div>
                <h3 className="mb-1 font-medium text-retro-black">{item.title}</h3>
                <p className="text-sm text-stone-600">{item.description}</p>
                {i < 3 && (
                  <div className="absolute right-0 top-8 hidden -translate-x-1/2 lg:block">
                    <ArrowRight className="h-6 w-6 text-stone-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exports Section */}
      <section className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-retro-black md:text-4xl">
              Export anywhere
            </h2>
            <p className="mx-auto max-w-2xl text-stone-600">
              Integrations for your existing workflow. Or use the API for custom solutions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <ExternalLink className="mb-4 h-8 w-8 text-retro-blue" />
              <h3 className="mb-2 font-medium text-retro-black">Linear</h3>
              <p className="text-sm text-stone-600">
                Create issues with labels. Attach media. Sync status back.
              </p>
            </div>
            <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <Layers className="mb-4 h-8 w-8 text-retro-lavender" />
              <h3 className="mb-2 font-medium text-retro-black">Notion</h3>
              <p className="text-sm text-stone-600">
                Create pages in your database. Map properties. Embed screenshots.
              </p>
            </div>
            <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
              <FileJson className="mb-4 h-8 w-8 text-retro-peach" />
              <h3 className="mb-2 font-medium text-retro-black">JSON (prd.json)</h3>
              <p className="text-sm text-stone-600">
                Export for AI dev workflows. Perfect for Ralph and similar tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Project Section */}
      <section className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-medium tracking-tight text-retro-black">
                One dashboard. Multiple projects.
              </h2>
              <p className="mb-6 text-stone-600">
                Create widgets for each project or site. Route feedback automatically. Keep
                everything organized.
              </p>
              <ul className="space-y-3">
                {[
                  "Unique widget keys for each project",
                  "Real-time feedback notifications",
                  "Team roles: Admin and Member",
                  "Usage tracking and limits",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-stone-600">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-retro-blue/20">
                      <Check className="h-3 w-3 text-retro-blue" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-retro-black bg-retro-paper p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
              <div className="mb-4 flex items-center gap-3">
                <Settings className="h-5 w-5 text-stone-400" />
                <span className="font-mono text-xs text-stone-400 uppercase">Widget Config</span>
              </div>
              <pre className="overflow-x-auto font-mono text-sm text-stone-600">
                {`<script
  src="cdn.feedbackflow.dev/widget.js"
  data-widget-key="wk_xxx"
  data-position="bottom-right"
></script>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="border-b-2 border-retro-black bg-retro-yellow">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <Github className="mb-6 h-16 w-16 text-retro-black" />
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-retro-black md:text-4xl">
              Open source. Self-host friendly.
            </h2>
            <p className="mb-8 max-w-2xl text-stone-700">
              No vendor lock-in. Run FeedbackFlow on your own infrastructure. No artificial limits,
              no phone-home. Your data stays yours.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="https://github.com/feedbackflow/feedbackflow">
                <Button className="border-2 border-retro-black bg-retro-black px-8 py-4 text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888]">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </Link>
              <Link href="/docs/self-host">
                <Button
                  variant="outline"
                  className="border-2 border-retro-black bg-white px-8 py-4 text-retro-black hover:bg-stone-50"
                >
                  Self-Hosting Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-retro-black">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-white md:text-4xl">
              Ready to stop chasing context?
            </h2>
            <p className="mb-8 max-w-xl text-stone-400">
              Start capturing feedback with full context today. Free tier available, or self-host
              for unlimited.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button className="border-2 border-retro-yellow bg-retro-yellow px-8 py-4 text-retro-black shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888]">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://github.com/feedbackflow/feedbackflow">
                <Button
                  variant="outline"
                  className="border-2 border-white bg-transparent px-8 py-4 text-white hover:bg-white/10"
                >
                  <Github className="mr-2 h-5 w-5" />
                  Star on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="border-t border-stone-800">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-6">
                <span className="font-mono text-sm text-stone-500">FeedbackFlow</span>
                <Link href="/docs" className="text-sm text-stone-500 hover:text-stone-300">
                  Docs
                </Link>
                <Link href="/pricing" className="text-sm text-stone-500 hover:text-stone-300">
                  Pricing
                </Link>
                <Link
                  href="https://github.com/feedbackflow/feedbackflow"
                  className="text-sm text-stone-500 hover:text-stone-300"
                >
                  GitHub
                </Link>
              </div>
              <p className="font-mono text-xs text-stone-600">
                Open source under MIT License
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
