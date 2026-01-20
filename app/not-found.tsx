import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
          <FileQuestion className="h-10 w-10 text-retro-peach" />
        </div>

        <h1 className="mb-2 text-6xl font-medium tracking-tighter text-retro-black">
          404
        </h1>

        <h2 className="mb-4 text-2xl font-medium tracking-tight text-retro-black">
          Page not found
        </h2>

        <p className="mb-8 text-stone-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or navigate back to the homepage.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="w-full border-2 border-retro-black bg-retro-black px-6 py-3 text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888] sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button
              variant="outline"
              className="w-full border-2 border-retro-black bg-white px-6 py-3 text-retro-black hover:bg-stone-50 sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        <p className="mt-8 font-mono text-xs text-stone-400">
          Lost? Try the{" "}
          <Link href="/docs" className="text-retro-blue hover:underline">
            documentation
          </Link>{" "}
          for help.
        </p>
      </div>
    </div>
  );
}
