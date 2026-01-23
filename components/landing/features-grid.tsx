import { Icon, RubberDuckIcon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function FeaturesGrid() {
  return (
    <ScrollReveal>
      <div className="border-b-2 border-retro-black bg-retro-paper">
        <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-retro-black p-8 md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-3xl font-medium tracking-tight">
              Built for AI Development Pipelines
            </h2>
            <p className="mt-1 text-lg text-stone-500">
              The feedback layer your AI agents can actually consume.
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
                Machine-Readable Output
              </h3>
              <p className="text-sm leading-relaxed text-stone-600">
                Not just tickets for humans. Structured JSON your AI agents can
                parse and act on.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
