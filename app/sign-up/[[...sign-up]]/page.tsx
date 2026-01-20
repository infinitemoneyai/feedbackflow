import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-retro-paper">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-retro-black">
            FeedbackFlow
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Create an account to get started
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "border-2 border-retro-black shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] bg-white",
              headerTitle: "font-mono text-retro-black",
              headerSubtitle: "text-stone-600",
              formButtonPrimary:
                "bg-retro-black border-2 border-retro-black hover:bg-stone-800 transition-colors",
              formFieldInput:
                "border-2 border-stone-200 focus:border-retro-black transition-colors",
              footerActionLink: "text-retro-blue hover:text-retro-blue/80",
            },
          }}
        />
      </div>
    </div>
  );
}
