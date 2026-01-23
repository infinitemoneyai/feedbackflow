import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function AIDevLoopSection() {
  return (
    <ScrollReveal>
      <div className="border-b-2 border-retro-black bg-white p-10 md:p-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-4xl font-medium tracking-tight md:text-5xl">
            Close the AI Development Loop
          </h2>

          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-5">
            {/* User */}
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-black bg-retro-blue">
                <Icon name="solar:user-circle-linear" size={32} />
              </div>
              <p className="font-mono text-sm uppercase text-stone-500">User</p>
              <p className="mt-1 text-xs text-stone-400">Reports bug</p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <Icon
                name="solar:arrow-right-linear"
                size={32}
                className="rotate-90 text-retro-black md:rotate-0"
              />
            </div>

            {/* FeedbackFlow */}
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-black bg-retro-yellow">
                <Icon name="solar:widget-5-linear" size={32} />
              </div>
              <p className="font-mono text-sm uppercase text-stone-500">
                FeedbackFlow
              </p>
              <p className="mt-1 text-xs text-stone-400">Structures it</p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <Icon
                name="solar:arrow-right-linear"
                size={32}
                className="rotate-90 text-retro-black md:rotate-0"
              />
            </div>

            {/* AI Agent */}
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-black bg-retro-red text-white">
                <Icon name="solar:cpu-linear" size={32} />
              </div>
              <p className="font-mono text-sm uppercase text-stone-500">
                AI Agent
              </p>
              <p className="mt-1 text-xs text-stone-400">Ships fix</p>
            </div>
          </div>

          <div className="mt-12 border-2 border-retro-black bg-retro-lavender/30 p-8 text-center">
            <p className="text-2xl font-medium tracking-tight">
              You&apos;re not collecting feedback. <br />
              You&apos;re feeding your AI development pipeline.
            </p>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
