import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function CTASection() {
  return (
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
  );
}
