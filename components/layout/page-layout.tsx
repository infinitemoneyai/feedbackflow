import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-page p-2 md:p-6 lg:p-10">
      <main className="mx-auto max-w-7xl border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-shadow duration-300">
        <SiteHeader />
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
