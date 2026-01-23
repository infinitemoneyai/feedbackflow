import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageLayout } from "@/components/layout";

export const metadata = {
  title: "Manifesto - FeedbackFlow",
  description:
    "Why we built FeedbackFlow. A manifesto for people who ship fast and hate losing context.",
};

export default function ManifestoPage() {
  return (
    <PageLayout>
      {/* Hero */}
        <div className="border-b-2 border-retro-black bg-retro-paper p-8 md:p-16 lg:p-24">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded border border-retro-red/30 bg-retro-red/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-retro-red">
              <Icon name="solar:document-text-linear" size={14} />
              The Manifesto
            </div>
            <h1 className="mb-8 text-4xl font-medium leading-[1.1] tracking-tighter md:text-6xl lg:text-7xl">
              We Believe Feedback
              <br />
              <span className="text-stone-400">Should Not Require</span>
              <br />
              a Meeting.
            </h1>
            <p className="text-xl font-light leading-relaxed text-stone-600 md:text-2xl">
              This is why we built FeedbackFlow. Not because the world needed
              another tool. But because the tools we had were making us worse at
              understanding what we built.
            </p>
          </div>
        </div>

        {/* The Problem We Saw */}
        <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          <div className="bg-retro-black p-8 text-white md:p-12 lg:p-16">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-retro-yellow">
              Chapter 01
            </h2>
            <h3 className="mb-6 text-3xl font-medium tracking-tight md:text-4xl">
              The Feedback Gap
            </h3>
            <div className="space-y-6 text-lg leading-relaxed text-stone-300">
              <p>
                Something broke in the last few years. We got faster at
                building. Dramatically faster. AI writes code. Frameworks handle
                the boring stuff. You can ship a feature before lunch.
              </p>
              <p>
                But understanding what you shipped?{" "}
                <span className="text-white">That got slower.</span>
              </p>
              <p>
                Feedback still arrives the same way it did in 2015. Screenshots
                in Slack. Vague emails. &ldquo;It&apos;s broken&rdquo; with no
                context. You spend more time decoding what users meant than
                fixing what they found.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 lg:p-16">
            <div className="space-y-8">
              <div className="border-l-4 border-retro-red pl-6">
                <p className="text-xl font-medium text-retro-black">
                  &ldquo;Can you show me what you mean?&rdquo;
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  — Every developer, every day, losing 20 minutes
                </p>
              </div>
              <div className="border-l-4 border-retro-red pl-6">
                <p className="text-xl font-medium text-retro-black">
                  &ldquo;What browser were you using?&rdquo;
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  — The question that should never need to be asked
                </p>
              </div>
              <div className="border-l-4 border-retro-red pl-6">
                <p className="text-xl font-medium text-retro-black">
                  &ldquo;I can&apos;t reproduce this.&rdquo;
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  — The graveyard of valid bug reports
                </p>
              </div>
            </div>
            <div className="mt-12 rounded border border-stone-200 bg-stone-50 p-6">
              <p className="text-lg font-medium text-retro-black">
                The gap isn&apos;t between you and your users.
                <br />
                <span className="text-stone-400">
                  It&apos;s between what they saw and what you see.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* What We Believe - Grid */}
        <div className="border-b-2 border-retro-black bg-retro-paper">
          <div className="border-b-2 border-retro-black p-8 md:p-12">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-stone-500">
              Chapter 02
            </h2>
            <h3 className="text-3xl font-medium tracking-tight md:text-4xl">
              What We Believe
            </h3>
          </div>

          <div className="grid grid-cols-1 divide-y-2 divide-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
            <div className="p-8 md:p-12">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-retro-blue bg-retro-blue/10">
                <Icon
                  name="solar:camera-linear"
                  size={28}
                  className="text-retro-blue"
                />
              </div>
              <h4 className="mb-4 text-xl font-medium">
                Capture at the Source
              </h4>
              <p className="leading-relaxed text-stone-600">
                The moment a user sees a problem is the moment with the most
                context. Every second after that, details fade. We believe
                feedback tools should live where the problem happens—not in a
                separate app, not in email, not in a meeting scheduled for next
                week.
              </p>
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/10">
                <Icon
                  name="solar:magic-stick-3-linear"
                  size={28}
                  className="text-amber-600"
                />
              </div>
              <h4 className="mb-4 text-xl font-medium">AI Should Translate</h4>
              <p className="leading-relaxed text-stone-600">
                Users shouldn&apos;t need to write perfect bug reports.
                That&apos;s not their job. AI is finally good enough to look at
                a screenshot, understand the context, and ask the right
                follow-up questions. Let the machines do the translation work.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-t-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
            <div className="p-8 md:p-12">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-retro-lavender bg-retro-lavender/10">
                <Icon
                  name="solar:lock-keyhole-unlocked-linear"
                  size={28}
                  className="text-purple-600"
                />
              </div>
              <h4 className="mb-4 text-xl font-medium">Open by Default</h4>
              <p className="leading-relaxed text-stone-600">
                We don&apos;t believe in trapping your data. FeedbackFlow is
                open source because feedback belongs to you. Self-host it. Fork
                it. Read every line of code. Export everything. Walk away
                anytime. That&apos;s not a feature—it&apos;s a principle.
              </p>
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
                <Icon
                  name="solar:routing-2-linear"
                  size={28}
                  className="text-orange-600"
                />
              </div>
              <h4 className="mb-4 text-xl font-medium">
                Tickets, Not Conversations
              </h4>
              <p className="leading-relaxed text-stone-600">
                The goal of feedback isn&apos;t to create another thread to
                manage. It&apos;s to create a ticket you can act on. We believe
                in structured output: Linear issues, Notion pages, JSON for your
                AI workflows. Feedback should end up where work happens.
              </p>
            </div>
          </div>
        </div>

        {/* Who This Is For */}
        <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black lg:grid-cols-12 lg:divide-x-2 lg:divide-y-0">
          <div className="bg-retro-yellow p-8 md:p-12 lg:col-span-5 lg:p-16">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-retro-black/60">
              Chapter 03
            </h2>
            <h3 className="mb-6 text-3xl font-medium tracking-tight md:text-4xl">
              Who This Is For
            </h3>
            <p className="text-lg leading-relaxed text-stone-700">
              We didn&apos;t build this for enterprises with dedicated QA teams
              and 47-step bug reporting workflows. We built it for people like
              us.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 lg:col-span-7 lg:p-16">
            <div className="space-y-8">
              <div className="group flex items-start gap-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-black bg-retro-paper transition-colors group-hover:bg-retro-yellow">
                  <Icon name="solar:user-linear" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium">Solo Founders</h4>
                  <p className="mt-1 text-stone-600">
                    Who are customer support, product manager, and engineering
                    lead—all before 9am.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-black bg-retro-paper transition-colors group-hover:bg-retro-yellow">
                  <Icon name="solar:users-group-rounded-linear" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium">Small Teams</h4>
                  <p className="mt-1 text-stone-600">
                    Where everyone wears multiple hats and nobody has time for
                    &ldquo;can you clarify what you meant?&rdquo;
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-black bg-retro-paper transition-colors group-hover:bg-retro-yellow">
                  <Icon name="solar:rocket-2-linear" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium">Indie Hackers</h4>
                  <p className="mt-1 text-stone-600">
                    Building multiple projects, shipping constantly, and needing
                    feedback that doesn&apos;t require a Jira license.
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-black bg-retro-paper transition-colors group-hover:bg-retro-yellow">
                  <Icon name="solar:code-square-linear" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-medium">AI-First Builders</h4>
                  <p className="mt-1 text-stone-600">
                    Who want feedback in JSON format so it can flow directly
                    into their AI development workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Uncomfortable Truth */}
        <div className="border-b-2 border-retro-black bg-retro-red p-8 text-white md:p-12 lg:p-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-white/60">
              Chapter 04
            </h2>
            <h3 className="mb-8 text-3xl font-medium tracking-tight md:text-4xl">
              The Uncomfortable Truth
            </h3>
            <div className="space-y-6 text-lg leading-relaxed text-white/90">
              <p>
                Most feedback never gets acted on. Not because teams don&apos;t
                care. Because by the time feedback reaches someone who can fix
                it, it&apos;s been through so many translations that the
                original signal is gone.
              </p>
              <p>
                User tells support. Support writes a ticket. Ticket gets
                triaged. Developer reads it a week later. Developer asks for
                clarification. User has moved on.
              </p>
              <p className="text-white font-medium">
                We built FeedbackFlow to kill that chain. Screenshot to ticket.
                One step. Full context. No translations.
              </p>
            </div>
          </div>
        </div>

        {/* Why InfiniteMoney */}
        <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          <div className="bg-stone-100 p-8 md:p-12 lg:p-16">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-stone-500">
              Chapter 05
            </h2>
            <h3 className="mb-6 text-3xl font-medium tracking-tight md:text-4xl">
              Why We Built This
            </h3>
            <p className="text-lg leading-relaxed text-stone-600">
              InfiniteMoney ships a lot of projects. AI tools, internal apps,
              client work—things move fast. And we kept running into the same
              wall: we&apos;d build something that technically worked but
              emotionally didn&apos;t.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 lg:p-16">
            <div className="space-y-6 text-lg leading-relaxed text-stone-600">
              <p>
                Users would tell us something was wrong, but we couldn&apos;t
                see what they saw. We&apos;d ask for screenshots. They&apos;d
                send blurry photos. We&apos;d ask for steps to reproduce.
                They&apos;d say &ldquo;I just clicked the button.&rdquo;
              </p>
              <p>
                So we built a widget. Then we added AI to ask follow-up
                questions. Then we made it generate tickets automatically.
              </p>
              <p className="font-medium text-retro-black">
                Then we realized everyone else has this problem too.
              </p>
            </div>
          </div>
        </div>

        {/* A Note from Matt + InfiniteMoney */}
        <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          <div className="bg-retro-paper p-8 md:p-12 lg:p-16">
            <div className="mb-6 inline-flex items-center gap-3 rounded border border-retro-blue/30 bg-retro-blue/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-retro-blue">
              <Icon name="solar:pen-new-square-linear" size={14} />
              A Note from Matt
            </div>
            <h3 className="mb-6 text-3xl font-medium tracking-tight md:text-4xl">
              Why I built FeedbackFlow
              <br />
              <span className="text-stone-400">and what InfiniteMoney is</span>
            </h3>
            <p className="text-lg leading-relaxed text-stone-600">
              I build fast, ship often, and I hate losing context. FeedbackFlow
              started as a selfish tool: something I wanted for every product I
              touch—capture what the user saw, preserve the details, and turn it
              into work you can actually do.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 lg:p-16">
            <div className="space-y-6 text-lg leading-relaxed text-stone-600">
              <p>
                When feedback shows up as a screenshot in a random thread, the
                useful parts disappear: what page they were on, what they
                clicked, what broke, what they expected. This project is my
                answer to that: screenshot to ticket, with context attached by
                default.
              </p>
              <p>
                InfiniteMoney is a research company exploring what happens when
                you give agency to AI and let it lead. Humans stay in the loop
                to lend a hand—direction, taste, constraints—but the AI drives.
                If you&apos;re curious what that looks like in practice, follow
                along at{" "}
                <Link
                  href="https://infinitemoney.ai"
                  className="font-medium text-retro-blue underline underline-offset-4 hover:text-retro-black"
                >
                  infinitemoney.ai
                </Link>
                .
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs uppercase tracking-widest text-stone-500">
                <Icon name="solar:user-circle-linear" size={16} />
                Matt · InfiniteMoney
              </div>
            </div>
          </div>
        </div>

        {/* The Promise */}
        <div className="bg-retro-paper p-8 md:p-12 lg:p-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-stone-500">
              Our Promise
            </h2>
            <h3 className="mb-8 text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
              FeedbackFlow Will Stay:
            </h3>

            <div className="grid gap-6 text-left md:grid-cols-2">
              <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <Icon
                  name="solar:lock-keyhole-unlocked-linear"
                  size={24}
                  className="mb-3 text-retro-blue"
                />
                <h4 className="mb-2 font-medium">Open Source</h4>
                <p className="text-sm text-stone-600">
                  Forever. No bait-and-switch. The code is yours to read, run,
                  and modify.
                </p>
              </div>

              <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <Icon
                  name="solar:shield-check-linear"
                  size={24}
                  className="mb-3 text-retro-blue"
                />
                <h4 className="mb-2 font-medium">Privacy-First</h4>
                <p className="text-sm text-stone-600">
                  No tracking. No selling data. No &ldquo;anonymized
                  analytics&rdquo; that aren&apos;t anonymous.
                </p>
              </div>

              <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <Icon
                  name="solar:hand-money-linear"
                  size={24}
                  className="mb-3 text-retro-blue"
                />
                <h4 className="mb-2 font-medium">Fair Pricing</h4>
                <p className="text-sm text-stone-600">
                  Pay for seats, not for feedback volume. And self-hosting is
                  always free.
                </p>
              </div>

              <div className="border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                <Icon
                  name="solar:exit-linear"
                  size={24}
                  className="mb-3 text-retro-blue"
                />
                <h4 className="mb-2 font-medium">No Lock-In</h4>
                <p className="text-sm text-stone-600">
                  Export everything. Switch anytime. We&apos;ll even help you
                  migrate away if you want.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-8 border-t-2 border-retro-black bg-white p-10 text-center md:p-16">
          <h2 className="text-4xl font-medium tracking-tighter md:text-6xl">
            Join the Movement
          </h2>
          <p className="max-w-xl text-lg text-stone-500">
            Stop losing context. Start capturing feedback that actually helps
            you build better.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="flex items-center justify-center gap-2 border-2 border-retro-black bg-retro-black px-8 py-4 text-lg font-medium text-white shadow-[6px_6px_0px_0px_#F3C952] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#F3C952]"
            >
              <span>Get Started Free</span>
              <Icon name="solar:arrow-right-linear" size={20} />
            </Link>
            <Link
              href="https://github.com/infinitemoneyai/feedbackflow"
              className="flex items-center justify-center gap-2 border-2 border-retro-black bg-white px-8 py-4 text-lg font-medium text-retro-black shadow-[6px_6px_0px_0px_#E85D52] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#E85D52]"
            >
              <Icon name="mdi:github" size={20} />
              <span>Star on GitHub</span>
            </Link>
          </div>
        </div>

    </PageLayout>
  );
}
