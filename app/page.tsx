import { PageLayout } from "@/components/layout";
import {
  HeroSection,
  ProblemSection,
  AIDevLoopSection,
  FeaturesGrid,
  WorkflowSection,
  TechnicalSection,
  OpenSourceSection,
  CTASection,
} from "@/components/landing";

export default function Home() {
  return (
    <PageLayout>
      <HeroSection />
      <ProblemSection />
      <AIDevLoopSection />
      <FeaturesGrid />
      <WorkflowSection />
      <TechnicalSection />
      <OpenSourceSection />
      <CTASection />
    </PageLayout>
  );
}
