import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function HeroSection() {
  return (
    <ScrollReveal>
      <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black lg:grid-cols-12 lg:divide-x-2 lg:divide-y-0">
        {/* Hero Content */}
        <div className="flex flex-col justify-center gap-10 p-8 md:p-16 lg:col-span-8">
          <div className="animate-ff-fade-up inline-flex w-fit items-center gap-3 rounded border border-retro-red/30 bg-retro-red/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-retro-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-retro-red"></span>
            System Online v.01
          </div>

          <h1 className="animate-ff-fade-up -ml-1 text-5xl font-medium leading-[0.9] tracking-tighter md:text-7xl lg:text-8xl [animation-delay:60ms]">
            Your AI Agent <br />
            <span className="text-stone-400">Can Ship Fast.</span>
            <br />
            But What Should <br />
            It Build Next?
          </h1>

          <p className="animate-ff-fade-up max-w-2xl text-xl font-light leading-relaxed tracking-tight text-stone-600 md:text-2xl [animation-delay:120ms]">
            The missing piece in your AI development pipeline: structured
            feedback that goes straight from users to your AI agents.
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

                  {/* "Screenshot-like" thumbnail (no binary assets in repo) */}
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
  );
}
