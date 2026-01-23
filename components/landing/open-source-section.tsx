import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function OpenSourceSection() {
  return (
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
              Because we&apos;re building with AI agents, and they need
              structured feedback to know what to fix next.
              <br />
              <br />
              We kept shipping things that technically worked and emotionally
              did not—because the feedback loop was still manual.
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
  );
}
