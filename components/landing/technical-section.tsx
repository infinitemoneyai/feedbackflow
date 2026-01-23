import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function TechnicalSection() {
  return (
    <ScrollReveal>
      <div className="border-b-2 border-retro-black bg-retro-yellow p-10 md:p-16">
        <div className="max-w-4xl">
          <h2 className="mb-8 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            One Feedback Layer. Multiple AI Development Pipelines. Mildly
            Concerning Speed.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Icon
                name="solar:graph-up-linear"
                size={32}
                className="mb-4"
              />
              <h4 className="mb-2 text-base font-bold md:text-lg">AI Feedback Pipeline</h4>
              <p className="text-sm text-stone-600 md:text-base">
                Each project gets its own isolated stream that feeds directly
                into your AI development workflow.
              </p>
            </div>
            <div className="border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Icon
                name="solar:server-square-linear"
                size={32}
                className="mb-4"
              />
              <h4 className="mb-2 text-base font-bold md:text-lg">Central Hub</h4>
              <p className="text-sm text-stone-600 md:text-base">
                Feeds into one dashboard. Monitor multiple startups at once.
              </p>
            </div>
            <div className="border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="solar:routing-2-linear" size={32} className="mb-4" />
              <h4 className="mb-2 text-base font-bold md:text-lg">Ticket Routing</h4>
              <p className="text-sm text-stone-600 md:text-base">
                Pipes tickets out wherever that specific project lives.
              </p>
            </div>
          </div>
          <p className="mt-10 text-lg font-medium tracking-tight md:text-xl">
            Yes, you can monitor multiple startups. No, we won&apos;t judge
            your lack of sleep.
          </p>
        </div>
      </div>
    </ScrollReveal>
  );
}
