import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function WorkflowSection() {
  return (
    <ScrollReveal>
      <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black lg:grid-cols-2 lg:divide-x-2 lg:divide-y-0">
        <div className="p-10 md:p-16">
          <h2 className="mb-10 text-2xl font-medium tracking-tight md:text-3xl">
            What Happens Next{" "}
            <span className="text-stone-400">(Without You Involved)</span>
          </h2>

          <div className="relative space-y-12 pl-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-stone-200">
            <div className="group relative">
              <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-retro-black transition-transform group-hover:scale-110"></span>
              <h4 className="text-base font-medium md:text-lg">
                User captures a screenshot
              </h4>
            </div>
            <div className="group relative">
              <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-stone-300 transition-colors group-hover:bg-retro-yellow"></span>
              <h4 className="text-base font-medium md:text-lg">
                AI asks annoying but useful questions
              </h4>
            </div>
            <div className="group relative">
              <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-stone-300 transition-colors group-hover:bg-retro-yellow"></span>
              <h4 className="text-base font-medium md:text-lg">
                The mess becomes structure
              </h4>
            </div>
            <div className="group relative">
              <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-retro-blue transition-transform group-hover:scale-110"></span>
              <h4 className="text-base font-medium md:text-lg">
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
            <div className="group relative">
              <span className="absolute -left-[39px] h-6 w-6 rounded-full border-4 border-white bg-retro-lavender transition-transform group-hover:scale-110"></span>
              <h4 className="text-base font-medium md:text-lg">
                Your AI agent can now read it
              </h4>
              <p className="mt-1 text-sm text-stone-500">
                Structured data that plugs directly into your AI development
                pipeline
              </p>
            </div>
          </div>

          <div className="mt-12 -rotate-1 transform border-2 border-retro-black bg-retro-lavender p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:rotate-0">
            <p className="text-center font-serif text-base font-medium italic md:text-lg">
              &ldquo;You never had to ask &apos;can you clarify this?&apos;
              again.&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-col bg-stone-100">
          <div className="border-b-2 border-retro-black bg-white p-10 md:p-16">
            <h3 className="mb-6 text-xl font-medium tracking-tight md:text-2xl">
              Built for People Who Ship Too Much
            </h3>
            <p className="mb-8 text-lg font-light text-stone-600 md:text-xl">
              This is not &ldquo;enterprise feedback software.&rdquo;
              It&apos;s for:
            </p>

            <ul className="space-y-5 text-base md:text-lg">
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
              <p className="text-xl font-medium tracking-tight md:text-2xl">
                If your roadmap lives in your head, this is for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
