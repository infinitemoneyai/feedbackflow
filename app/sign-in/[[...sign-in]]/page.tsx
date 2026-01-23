import { SignIn } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default function SignInPage() {
  const events = [
    { icon: "solar:bug-linear", text: "New Issue: Stripe checkout failed", time: "2m ago", color: "text-retro-red" },
    { icon: "solar:magic-stick-3-linear", text: "AI generated reproduction steps", time: "1m ago", color: "text-retro-yellow" },
    { icon: "solar:ticket-linear", text: "Synced to Linear PRO-129", time: "Just now", color: "text-retro-blue" },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Control Center Visual */}
      <div className="ff-scanline-noise relative hidden flex-col justify-between border-r-2 border-retro-black bg-retro-black p-4 text-white sm:p-6 md:p-12 lg:flex lg:p-16">
        <div className="relative z-10 flex items-start justify-between">
          <Link href="/" className="group flex items-center gap-2 text-white">
            <Icon name="solar:arrow-left-linear" size={20} className="transition-transform group-hover:-translate-x-1" />
            <span className="font-mono text-sm uppercase tracking-widest">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 rounded border border-retro-yellow/30 bg-retro-yellow/5 px-2 py-1 font-mono text-[10px] uppercase text-retro-yellow sm:text-xs">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-retro-yellow" />
            Restricted Access
          </div>
        </div>

        {/* Central Graphic - Activity Feed Terminal */}
        <div className="relative z-10 mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <Icon name="solar:server-square-linear" size={32} className="text-retro-blue" />
            <div>
              <h2 className="font-mono text-xl font-medium tracking-tight">System Activity</h2>
              <p className="text-sm text-stone-500">Live feed from feedback engine</p>
            </div>
          </div>

          <div className="overflow-hidden rounded border-2 border-stone-800 bg-stone-900/50 p-4 font-mono text-sm shadow-[4px_4px_0px_0px_#333]">
            <div className="mb-4 flex items-center justify-between border-b border-stone-800 pb-2 text-[10px] uppercase text-stone-500">
              <span>Status: Monitoring</span>
              <span>Uptime: 99.9%</span>
            </div>
            
            <div className="space-y-4">
              {events.map((event, i) => (
                <div key={i} className="animate-ff-fade-in flex items-start gap-3" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className={`mt-0.5 ${event.color}`}>
                    <Icon name={event.icon} size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-300">{event.text}</p>
                  </div>
                  <span className="text-[10px] text-stone-600">{event.time}</span>
                </div>
              ))}
              <div className="animate-pulse text-retro-blue">
                <span className="mr-2">_</span>
                <span className="text-stone-500">Waiting for authentication...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="relative z-10 flex items-center gap-8 border-t border-stone-800 pt-8 font-mono text-xs text-stone-500">
          <div>
            <span className="block text-white">2.4s</span>
            <span>Avg Response</span>
          </div>
          <div>
            <span className="block text-white">100%</span>
            <span>Data Privacy</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
             <Icon name="solar:shield-check-linear" size={14} className="text-retro-blue" />
             <span>Secure Connection</span>
          </div>
        </div>

        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center bg-retro-paper p-4 sm:p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Back Link */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="group flex items-center gap-2 text-stone-600">
              <Icon name="solar:arrow-left-linear" size={20} className="transition-transform group-hover:-translate-x-1" />
              <span className="font-mono text-sm uppercase tracking-widest">Back to Home</span>
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-retro-black md:text-3xl">
              Resume Session
            </h2>
            <p className="mt-2 text-stone-600">
              Enter credentials to access the dashboard.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-1 rounded bg-gradient-to-r from-retro-blue/20 to-retro-yellow/20 blur-sm" />
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full relative",
                  card: "border-2 border-retro-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] bg-white w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  formButtonPrimary:
                    "bg-retro-black border-2 border-retro-black hover:bg-stone-800 transition-colors shadow-none hover:shadow-none active:translate-y-0",
                  formFieldInput:
                    "border-2 border-stone-200 focus:border-retro-black transition-colors rounded-none",
                  footerActionLink: "text-retro-blue hover:text-retro-blue/80 font-medium",
                  identityPreviewEditButtonIcon: "text-retro-black",
                  formFieldLabel: "text-retro-black font-medium",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
