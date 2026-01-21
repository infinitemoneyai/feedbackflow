import Link from "next/link";
import { Icon, RubberDuckIcon } from "@/components/ui/icon";
import { PageLayout } from "@/components/layout";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black lg:grid-cols-12 lg:divide-x-2 lg:divide-y-0">
          {/* Hero Content */}
          <div className="flex flex-col justify-center gap-10 p-8 md:p-16 lg:col-span-8">
            <div className="animate-ff-fade-up inline-flex w-fit items-center gap-3 rounded border border-retro-red/30 bg-retro-red/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-retro-red">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-retro-red"></span>
              System Online v.01
            </div>

            <h1 className="animate-ff-fade-up -ml-1 text-5xl font-medium leading-[0.9] tracking-tighter md:text-7xl lg:text-8xl [animation-delay:60ms]">
              Your Users <br />
              <span className="text-stone-400">Are Talking.</span>
              <br />
              You&apos;re Just Not <br />
              Listening.
            </h1>

            <p className="animate-ff-fade-up max-w-2xl text-xl font-light leading-relaxed tracking-tight text-stone-600 md:text-2xl [animation-delay:120ms]">
              Turn screenshots into tickets. Automatically. <br />
              A feedback widget for people shipping faster than their attention
              span allows.
            </p>

            <div className="animate-ff-fade-up flex flex-col gap-4 pt-6 sm:flex-row [animation-delay:180ms]">
              <Link
                href="/sign-up"
                className="ff-cta-sheen group flex items-center justify-center gap-3 border-2 border-retro-black bg-retro-black px-8 py-4 text-lg font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-retro-blue hover:text-retro-black hover:shadow-[2px_2px_0px_0px_#000]"
              >
                <span>Install the Script</span>
                <Icon
                  name="solar:code-square-linear"
                  size={20}
                  className="transition-transform group-hover:rotate-90"
                />
              </Link>
              <Link
                href="/docs"
                className="flex items-center justify-center gap-3 border-2 border-retro-black bg-transparent px-8 py-4 text-lg font-medium text-retro-black transition-all hover:bg-stone-200"
              >
                <span>Read the README</span>
                <Icon name="solar:book-2-linear" size={20} />
              </Link>
            </div>
          </div>

          {/* Hero Graphic/Sidebar */}
          <div className="ff-scanline-noise relative flex flex-col justify-between overflow-hidden bg-retro-blue lg:col-span-4">
            {/* Abstract UI Representation */}
            <div className="relative z-10 flex h-full flex-col border-b-2 border-retro-black bg-white/20 p-8 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <span className="border border-retro-black bg-white px-2 py-1 font-mono text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  New Ticket #402
                </span>
                <Icon
                  name="solar:close-square-linear"
                  size={20}
                  className="cursor-pointer transition-transform hover:rotate-90"
                />
              </div>

              <div className="animate-ff-float will-change-transform">
                <div className="relative transform space-y-4 border-2 border-retro-black bg-white p-5 font-mono text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2 text-xs text-stone-500">
                    <Icon name="solar:user-circle-linear" size={14} />
                    <span>@user_209</span>
                    <span className="ml-auto text-[10px]">2m ago</span>
                  </div>
                  <p className="text-base font-semibold leading-snug tracking-tight">
                    &ldquo;The checkout button is broken on mobile&rdquo;
                  </p>

                  {/* Mock Screenshot */}
                  <div className="group relative aspect-video overflow-hidden border border-stone-300 bg-stone-100">
                    {/* Hover affordance */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50/70 opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon
                        name="solar:magnifer-zoom-in-linear"
                        size={24}
                        className="text-retro-black"
                      />
                    </div>

                    {/* “Screenshot-like” thumbnail (no binary assets in repo) */}
                    <div className="absolute inset-0 p-2">
                      <div className="h-full w-full overflow-hidden rounded-sm border border-stone-200 bg-white">
                        {/* Mobile browser top bar */}
                        <div className="flex items-center gap-1 border-b border-stone-100 bg-stone-50 px-2 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                          <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                          <div className="ml-2 h-2 flex-1 rounded bg-white" />
                        </div>

                        {/* Page content */}
                        <div className="grid h-[calc(100%-22px)] grid-cols-5 gap-2 p-2">
                          {/* Product image */}
                          <div className="col-span-2 rounded border border-stone-200 bg-stone-100" />

                          {/* Text + CTA */}
                          <div className="col-span-3 flex flex-col gap-1">
                            <div className="h-2 w-4/5 rounded bg-stone-200" />
                            <div className="h-2 w-3/5 rounded bg-stone-200" />
                            <div className="mt-1 h-2 w-2/5 rounded bg-stone-100" />

                            {/* Broken checkout button */}
                            <div className="mt-auto rounded border-2 border-retro-red bg-retro-red/10 px-2 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-retro-red">
                              Checkout
                            </div>
                            <div className="-mt-1 h-[3px] w-full bg-retro-red/30" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File label */}
                    <div className="absolute bottom-2 left-2 z-20 inline-flex items-center gap-2 rounded border border-stone-300 bg-white/90 px-2 py-1 font-mono text-[10px] uppercase text-stone-500">
                      <Icon name="solar:gallery-wide-linear" size={14} />
                      Screenshot.png
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2 pt-2">
                    <span className="border border-retro-red/30 bg-retro-red/10 px-2 py-1 text-[10px] font-bold uppercase text-retro-red">
                      High Priority
                    </span>
                    <span className="border border-stone-300 bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase text-stone-600">
                      Bug
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Processing Indicator */}
              <div className="animate-ff-fade-in mt-6 flex items-center gap-3 rounded border border-retro-black/20 bg-retro-black/10 p-3 font-mono text-xs [animation-delay:220ms]">
                <Icon
                  name="solar:magic-stick-3-linear"
                  size={16}
                  className="animate-spin-slow"
                />
                <span>AI Generating reproduction steps...</span>
              </div>
            </div>

            <div className="relative z-10 border-t-2 border-retro-black bg-retro-yellow/90 p-6 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="rounded-full border-2 border-retro-black bg-retro-black p-3 text-retro-yellow">
                  <Icon name="solar:eye-linear" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    We see everything.
                  </p>
                  <p className="text-xs opacity-70">Even the bugs you hid.</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </ScrollReveal>

        {/* The Problem Section */}
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          <div className="relative flex flex-col justify-center overflow-hidden bg-retro-red p-10 text-white md:p-16">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            <h2 className="relative z-10 mb-6 text-4xl font-medium tracking-tighter lg:text-5xl">
              The Real Problem
            </h2>
            <p className="relative z-10 text-xl font-light leading-relaxed opacity-90 md:text-2xl">
              You can ship a feature in an afternoon. <br />
              <br />
              Then you spend a week playing detective with vague user feedback.
            </p>
          </div>
          <div className="flex flex-col justify-center bg-white p-10 md:p-16">
            <div className="space-y-8">
              <div className="group flex items-start gap-5">
                <div className="rounded border border-stone-200 bg-stone-100 p-2 transition-colors group-hover:border-retro-black">
                  <Icon
                    name="solar:chat-round-dots-linear"
                    size={24}
                    className="text-stone-600"
                  />
                </div>
                <div>
                  <p className="text-lg font-medium">Screenshots in Slack.</p>
                  <p className="text-sm text-stone-500">
                    &ldquo;Hey, is this supposed to look like this?&rdquo;
                  </p>
                </div>
              </div>
              <div className="group flex items-start gap-5">
                <div className="rounded border border-stone-200 bg-stone-100 p-2 transition-colors group-hover:border-retro-black">
                  <Icon
                    name="solar:letter-linear"
                    size={24}
                    className="text-stone-600"
                  />
                </div>
                <div>
                  <p className="text-lg font-medium">Thoughts in DMs.</p>
                  <p className="text-sm text-stone-500">
                    Lost in the void of history.
                  </p>
                </div>
              </div>
              <div className="group flex items-start gap-5">
                <div className="rounded border border-stone-200 bg-stone-100 p-2 transition-colors group-hover:border-retro-black">
                  <Icon
                    name="solar:sleeping-linear"
                    size={24}
                    className="text-stone-600"
                  />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    Half-formed ideas at 2am.
                  </p>
                  <p className="text-sm text-stone-500">
                    You won&apos;t remember them tomorrow.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative mt-12 border border-stone-200 bg-stone-50 p-4 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 border border-stone-200 bg-white px-2 font-mono text-xs text-stone-400">
                DIAGNOSIS
              </div>
              <p className="text-lg font-medium tracking-tight">
                AI didn&apos;t break development. It broke the feedback loop.
              </p>
            </div>
          </div>
          </div>
        </ScrollReveal>

        {/* Features Grid (Bento Style) */}
        <ScrollReveal>
          <div className="border-b-2 border-retro-black bg-retro-paper">
          <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-retro-black p-8 md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="text-3xl font-medium tracking-tight">
                What This Actually Is
              </h2>
              <p className="mt-1 text-lg text-stone-500">
                A tiny script. A massive improvement.
              </p>
            </div>
            <div className="rounded-full bg-retro-black px-3 py-1 font-mono text-xs text-white">
              &lt;script src=&quot;...&quot;&gt;
            </div>
          </div>

          <div className="grid h-auto grid-cols-1 divide-y-2 divide-retro-black md:h-80 md:grid-cols-2 md:divide-x-2 md:divide-y-0 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="group flex cursor-default flex-col justify-between p-8 transition-colors hover:bg-stone-50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-blue bg-retro-blue/20 text-retro-blue transition-transform group-hover:scale-110">
                <Icon name="solar:camera-linear" size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-medium tracking-tight">
                  Screenshot DOM
                </h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  Capture the state, console logs, and network errors. Not just
                  pixels.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group flex cursor-default flex-col justify-between p-8 transition-colors hover:bg-stone-50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-red bg-retro-red/20 text-retro-red transition-transform group-hover:-rotate-12">
                <Icon name="solar:pen-new-square-linear" size={24} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-medium tracking-tight">
                  Scribble on it
                </h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  Like a maniac. Draw circles around the bugs so we can&apos;t
                  miss them.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group flex cursor-default flex-col justify-between p-8 transition-colors hover:bg-stone-50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-600 bg-retro-yellow/20 transition-transform group-hover:-translate-y-1">
                <RubberDuckIcon size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-medium tracking-tight">
                  AI Rubber Duck
                </h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  Talk to the agent before bothering a human. It usually solves
                  it.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative flex cursor-default flex-col justify-between overflow-hidden bg-stone-100 p-8">
              <div className="absolute right-0 top-0 p-2 opacity-10 transition-opacity group-hover:opacity-20">
                <Icon name="solar:ticket-linear" size={100} />
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-retro-black bg-retro-black text-white">
                <Icon name="solar:ticket-linear" size={24} />
              </div>
              <div className="relative z-10">
                <h3 className="mb-2 text-xl font-medium tracking-tight">
                  Real Tickets
                </h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  No meetings. No &ldquo;can you write this up?&rdquo;. Just
                  clean JSON.
                </p>
              </div>
            </div>
          </div>
          </div>
        </ScrollReveal>

        {/* Workflow Section */}
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black lg:grid-cols-2 lg:divide-x-2 lg:divide-y-0">
          <div className="p-10 md:p-16">
            <h2 className="mb-10 text-3xl font-medium tracking-tight">
              What Happens Next{" "}
              <span className="text-stone-400">(Without You Involved)</span>
            </h2>

            <div className="relative space-y-12 pl-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-stone-200">
              <div className="group relative">
                <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-retro-black transition-transform group-hover:scale-110"></span>
                <h4 className="text-lg font-medium">
                  User captures a screenshot
                </h4>
              </div>
              <div className="group relative">
                <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-stone-300 transition-colors group-hover:bg-retro-yellow"></span>
                <h4 className="text-lg font-medium">
                  AI asks annoying but useful questions
                </h4>
              </div>
              <div className="group relative">
                <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-stone-300 transition-colors group-hover:bg-retro-yellow"></span>
                <h4 className="text-lg font-medium">
                  The mess becomes structure
                </h4>
              </div>
              <div className="group relative">
                <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-retro-blue transition-transform group-hover:scale-110"></span>
                <h4 className="text-lg font-medium">
                  A ticket appears where you already work
                </h4>
                <div className="mt-3 flex gap-2">
                  <span className="rounded border border-stone-200 bg-stone-100 px-2 py-1 font-mono text-[10px] uppercase text-stone-500">
                    Linear
                  </span>
                  <span className="rounded border border-stone-200 bg-stone-100 px-2 py-1 font-mono text-[10px] uppercase text-stone-500">
                    Notion
                  </span>
                  <span className="rounded border border-stone-200 bg-stone-100 px-2 py-1 font-mono text-[10px] uppercase text-stone-500">
                    JSON
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-12 -rotate-1 transform border-2 border-retro-black bg-retro-lavender p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:rotate-0">
              <p className="text-center font-serif text-lg font-medium italic">
                &ldquo;You never had to ask &apos;can you clarify this?&apos;
                again.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex flex-col bg-stone-100">
            <div className="border-b-2 border-retro-black bg-white p-10 md:p-16">
              <h3 className="mb-6 text-2xl font-medium tracking-tight">
                Built for People Who Ship Too Much
              </h3>
              <p className="mb-8 text-xl font-light text-stone-600">
                This is not &ldquo;enterprise feedback software.&rdquo;
                It&apos;s for:
              </p>

              <ul className="space-y-5 text-lg">
                <li className="flex items-center gap-4">
                  <Icon
                    name="solar:check-square-linear"
                    size={24}
                    className="text-retro-blue"
                  />
                  Solo founders
                </li>
                <li className="flex items-center gap-4">
                  <Icon
                    name="solar:check-square-linear"
                    size={24}
                    className="text-retro-blue"
                  />
                  Small teams (2–10 humans, unlimited AI)
                </li>
                <li className="flex items-center gap-4">
                  <Icon
                    name="solar:check-square-linear"
                    size={24}
                    className="text-retro-blue"
                  />
                  People shipping to prod on vibes &amp; caffeine
                </li>
              </ul>
            </div>
            <div className="relative flex flex-grow items-center justify-center overflow-hidden p-10 md:p-16">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <Icon name="solar:target-linear" size={300} />
              </div>
              <div className="relative z-10 space-y-3 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
                  TARGET AUDIENCE
                </p>
                <p className="text-2xl font-medium tracking-tight">
                  If your roadmap lives in your head, this is for you.
                </p>
              </div>
            </div>
          </div>
          </div>
        </ScrollReveal>

        {/* Technical / Speed Section */}
        <ScrollReveal>
          <div className="border-b-2 border-retro-black bg-retro-yellow p-10 md:p-16">
          <div className="max-w-4xl">
            <h2 className="mb-8 text-4xl font-medium tracking-tight md:text-5xl">
              One Script. Many Projects. Mildly Concerning Speed.
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Icon
                  name="solar:graph-up-linear"
                  size={32}
                  className="mb-4"
                />
                <h4 className="mb-2 text-lg font-bold">Feedback Pipeline</h4>
                <p className="text-base text-stone-600">
                  Each project gets its own isolated stream. Don&apos;t cross
                  the streams.
                </p>
              </div>
              <div className="border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Icon
                  name="solar:server-square-linear"
                  size={32}
                  className="mb-4"
                />
                <h4 className="mb-2 text-lg font-bold">Central Hub</h4>
                <p className="text-base text-stone-600">
                  Feeds into one dashboard. Monitor multiple startups at once.
                </p>
              </div>
              <div className="border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Icon name="solar:routing-2-linear" size={32} className="mb-4" />
                <h4 className="mb-2 text-lg font-bold">Ticket Routing</h4>
                <p className="text-base text-stone-600">
                  Pipes tickets out wherever that specific project lives.
                </p>
              </div>
            </div>
            <p className="mt-10 text-xl font-medium tracking-tight">
              Yes, you can monitor multiple startups. No, we won&apos;t judge
              your lack of sleep.
            </p>
          </div>
          </div>
        </ScrollReveal>

        {/* Open Source / Trust */}
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          <div className="bg-retro-black p-10 text-white md:p-16">
            <h2 className="mb-8 text-3xl font-medium tracking-tight">
              Open Source Because Obviously
            </h2>
            <div className="space-y-4">
              <div className="group flex cursor-pointer items-center gap-3 text-lg transition-colors hover:text-retro-yellow">
                <Icon
                  name="solar:arrow-right-linear"
                  size={20}
                  className="text-retro-yellow"
                />
                Self-host it
              </div>
              <div className="group flex cursor-pointer items-center gap-3 text-lg transition-colors hover:text-retro-yellow">
                <Icon
                  name="solar:arrow-right-linear"
                  size={20}
                  className="text-retro-yellow"
                />
                Read the code
              </div>
              <div className="group flex cursor-pointer items-center gap-3 text-lg transition-colors hover:text-retro-yellow">
                <Icon
                  name="solar:arrow-right-linear"
                  size={20}
                  className="text-retro-yellow"
                />
                Fork it
              </div>
              <div className="group flex cursor-pointer items-center gap-3 text-lg transition-colors hover:text-retro-yellow">
                <Icon
                  name="solar:arrow-right-linear"
                  size={20}
                  className="text-retro-yellow"
                />
                Break it
              </div>
            </div>
            <p className="mt-10 text-lg leading-relaxed text-stone-400">
              Or don&apos;t think at all and use our hosted version.
              <br />
              Your data stays yours. Export everything. Walk away anytime.
              <br />
              <span className="text-white">
                We&apos;re not trying to trap you. That&apos;s weird.
              </span>
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex-grow bg-retro-paper p-10 md:p-16">
              <h3 className="mb-6 inline-block border-b-2 border-retro-black pb-2 text-xl font-bold uppercase tracking-wider">
                Why InfiniteMoney Built This
              </h3>
              <p className="mb-6 text-xl leading-relaxed">
                Because we kept shipping things that technically worked and
                emotionally did not.
              </p>
              <div className="rounded border border-retro-black/10 bg-white p-4">
                <p className="text-lg font-medium">
                  AI made building faster. This makes understanding what you
                  built faster.
                </p>
              </div>
              <p className="mt-6 text-sm text-stone-500">
                That&apos;s the whole thing.
              </p>
            </div>
            <div className="border-t-2 border-retro-black bg-stone-200 p-8">
              <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                Current Status
              </div>
              <ul className="space-y-2 font-mono text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <Icon name="solar:arrow-right-linear" size={12} /> Shipping
                  now
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="solar:arrow-right-linear" size={12} /> Actively
                  being used
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="solar:arrow-right-linear" size={12} /> Slightly
                  under-documented (on purpose)
                </li>
              </ul>
            </div>
          </div>
          </div>
        </ScrollReveal>

        {/* CTA / Footer */}
        <ScrollReveal>
          <div className="flex flex-col items-center gap-8 bg-white p-10 text-center md:p-24">
          <h2 className="text-6xl font-medium tracking-tighter md:text-9xl">
            Get It
          </h2>

          <div className="flex flex-col items-center justify-center gap-8 text-xl font-light text-stone-500 md:flex-row">
            <span className="flex items-center gap-2">
              <Icon name="solar:file-download-linear" size={20} /> Install
              script
            </span>
            <span className="hidden h-8 w-px bg-stone-300 md:block"></span>
            <span className="flex items-center gap-2">
              <Icon name="solar:book-bookmark-linear" size={20} /> Read README
            </span>
            <span className="hidden h-8 w-px bg-stone-300 md:block"></span>
            <span>Or just stare at the code and nod</span>
          </div>

          <div className="mt-8 flex w-full flex-col gap-4 md:w-auto md:flex-row">
            <Link
              href="/sign-up"
              className="border-2 border-retro-black bg-retro-black px-8 py-4 text-lg font-medium text-white shadow-[6px_6px_0px_0px_#F3C952] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-stone-800 hover:shadow-[3px_3px_0px_0px_#F3C952]"
            >
              [ Install Script ]
            </Link>
            <Link
              href="https://github.com/Mlock/feedbackflow"
              className="border-2 border-retro-black bg-white px-8 py-4 text-lg font-medium text-retro-black shadow-[6px_6px_0px_0px_#E85D52] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-stone-50 hover:shadow-[3px_3px_0px_0px_#E85D52]"
            >
              [ View GitHub ]
            </Link>
            <Link
              href="/sign-up"
              className="border-2 border-retro-black bg-white px-8 py-4 text-lg font-medium text-retro-black shadow-[6px_6px_0px_0px_#6B9AC4] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-stone-50 hover:shadow-[3px_3px_0px_0px_#6B9AC4]"
            >
              [ Use Hosted Version ]
            </Link>
          </div>
          </div>
        </ScrollReveal>

    </PageLayout>
  );
}
