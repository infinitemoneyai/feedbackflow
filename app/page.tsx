import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page">
      <main className="flex flex-col items-center gap-8 p-8">
        <div className="border-2 border-retro-black bg-retro-paper p-12 shadow-retro-lg">
          <h1 className="mb-4 text-4xl font-semibold tracking-tighter text-retro-black">
            FeedbackFlow
          </h1>
          <p className="mb-6 max-w-md text-stone-600">
            Feedback collection system with screenshot capture, screen recording, and AI-powered
            triage.
          </p>

          <div className="mb-6 flex gap-2">
            <Badge className="bg-retro-red/10 text-retro-red border border-retro-red/20">Bug</Badge>
            <Badge className="bg-retro-blue/10 text-retro-blue border border-retro-blue/20">
              Feature
            </Badge>
            <Badge className="bg-retro-yellow/10 text-retro-yellow border border-retro-yellow/20">
              Triaging
            </Badge>
          </div>

          <div className="flex gap-4">
            <Button className="border-2 border-retro-black bg-retro-black text-white shadow-retro transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm">
              Get Started
            </Button>
            <Button
              variant="outline"
              className="border-2 border-retro-black bg-white text-retro-black hover:bg-stone-50"
            >
              Documentation
            </Button>
          </div>
        </div>

        <p className="font-mono text-xs text-stone-400">Project foundation complete. FF-001</p>
      </main>
    </div>
  );
}
