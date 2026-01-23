import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function ProblemSection() {
  return (
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

          <h2 className="relative z-10 mb-6 text-3xl font-medium tracking-tighter sm:text-4xl lg:text-5xl">
            The Real Problem
          </h2>
          <p className="relative z-10 text-lg font-light leading-relaxed opacity-90 md:text-2xl">
            Your AI agent can ship a feature in an afternoon. <br />
            <br />
            But it still needs you to manually translate &ldquo;this button is
            broken&rdquo; into a ticket it can understand.
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
                <p className="text-base font-medium md:text-lg">Screenshots in Slack.</p>
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
                <p className="text-base font-medium md:text-lg">Thoughts in DMs.</p>
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
                <p className="text-base font-medium md:text-lg">
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
            <p className="text-base font-medium tracking-tight md:text-lg">
              AI accelerated building. It didn&apos;t accelerate listening.
            </p>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
