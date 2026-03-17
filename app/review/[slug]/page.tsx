"use client";

import { useState, useEffect, use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReviewViewer } from "@/components/dashboard/site-review/review-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "@/convex/_generated/dataModel";

interface ReviewSession {
  siteUrl: string;
  projectId: Id<"projects">;
  teamId: Id<"teams">;
  reviewLinkId: Id<"reviewLinks">;
  sessionToken: string;
}

export default function ExternalReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): JSX.Element {
  const { slug } = use(params);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewLink = useQuery(api.reviewLinks.getReviewLink, { slug });

  // Check for existing session cookie
  useEffect(() => {
    const checkSession = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/review/session?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setSession(data);
          }
        }
      } catch {
        // No existing session
      }
    };
    checkSession();
  }, [slug]);

  const handleAccess = async (): Promise<void> => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/review/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Access denied");
        return;
      }

      const data = await res.json();
      setSession({
        siteUrl: data.siteUrl,
        projectId: data.projectId,
        teamId: data.teamId,
        reviewLinkId: data.reviewLinkId,
        sessionToken: data.sessionToken ?? "",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (reviewLink === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  // Not found or expired
  if (reviewLink === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Review link not found</h2>
          <p className="text-muted-foreground">
            This link may have expired or been deactivated.
          </p>
        </div>
      </div>
    );
  }

  // Has session — show viewer
  if (session) {
    return (
      <ReviewViewer
        projectId={session.projectId}
        teamId={session.teamId}
        initialUrl={session.siteUrl}
        reviewLinkId={session.reviewLinkId}
        reviewerEmail={email}
        sessionToken={session.sessionToken}
      />
    );
  }

  // Email gate
  return (
    <div className="flex items-center justify-center h-full bg-muted/50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-background rounded-lg border shadow-sm">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">
            You&apos;ve been invited to review
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to continue
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={(e) => e.key === "Enter" && handleAccess()}
            />
          </div>

          {reviewLink.hasPassword && (
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) => e.key === "Enter" && handleAccess()}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleAccess}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Verifying..." : "Start Reviewing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
