import { Icon } from "@/components/ui/icon";

export function SiteFooter() {
  return (
    <div className="flex flex-col items-center justify-between gap-6 border-t-2 border-retro-black bg-retro-paper p-6 font-mono text-sm md:flex-row md:gap-4">
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <div className="flex items-center gap-2">
          <Icon name="solar:copyright-linear" size={14} />
          <span>2026 feedbackflow</span>
        </div>
        <div className="hidden h-4 w-px bg-retro-black/20 sm:block" />
        <div className="flex items-center gap-1">
          <span>made with</span>
          <span className="text-retro-red">&lt;3</span>
          <span>by</span>
          <a
            href="https://infinitemoney.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-retro-blue hover:underline"
          >
            infinitemoney
          </a>
        </div>
      </div>
      <div className="flex gap-6">
        <a href="#" className="hover:text-retro-blue hover:underline">
          Twitter
        </a>
        <a href="#" className="hover:text-retro-blue hover:underline">
          Discord
        </a>
        <a href="#" className="hover:text-retro-blue hover:underline">
          Email
        </a>
      </div>
    </div>
  );
}
