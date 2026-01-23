import { SignUp } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Manifesto/Brand */}
      <div className="flex flex-col justify-between border-r-2 border-retro-black bg-retro-black p-8 text-white md:p-12 lg:p-16">
        <div className="mb-12">
          <Link href="/" className="group flex items-center gap-2 text-white">
            <Icon name="solar:arrow-left-linear" size={20} className="transition-transform group-hover:-translate-x-1" />
            <span className="font-mono text-sm uppercase tracking-widest">Back to Home</span>
          </Link>
        </div>

        <div className="max-w-md">
          <div className="mb-8 inline-flex items-center gap-3 rounded border border-retro-yellow/30 bg-retro-yellow/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-retro-yellow">
            <Icon name="solar:stars-linear" size={14} />
            Join the Movement
          </div>
          <h1 className="mb-6 text-4xl font-medium leading-[1.1] tracking-tighter text-white md:text-5xl">
            Feedback should not require a meeting.
          </h1>
          <p className="mb-12 text-lg text-stone-400">
            Stop translating screenshots. Start receiving structured tickets your AI agents can actually understand.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-retro-blue bg-retro-blue/10 text-retro-blue">
                <Icon name="solar:camera-linear" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">Capture Context</h3>
                <p className="text-sm text-stone-400">We record the console logs, network errors, and DOM state automatically.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-retro-red bg-retro-red/10 text-retro-red">
                <Icon name="solar:magic-stick-3-linear" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">AI Translation</h3>
                <p className="text-sm text-stone-400">Our AI turns "it's broken" into reproduction steps and technical requirements.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-retro-peach bg-retro-peach/10 text-retro-peach">
                <Icon name="solar:ticket-linear" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-white">Structured Output</h3>
                <p className="text-sm text-stone-400">Direct integration with Linear, Notion, and your AI workflows.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4 text-sm text-stone-500">
          <div className="flex -space-x-2">
            {[
              "mdi:language-typescript",
              "mdi:language-python",
              "mdi:git",
              "mdi:console-line",
            ].map((icon, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-retro-black bg-retro-paper text-retro-black"
              >
                <Icon name={icon} size={14} />
              </div>
            ))}
          </div>
          <p>For serious ai-builders only</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center bg-retro-paper p-8 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-retro-black md:text-3xl">
              Start capturing context
            </h2>
            <p className="mt-2 text-stone-600">
              Create your account to get your widget key.
            </p>
          </div>
          
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
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
  );
}
