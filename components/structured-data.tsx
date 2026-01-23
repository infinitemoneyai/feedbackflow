/**
 * Structured Data (LD+JSON) for AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization)
 *
 * This component provides rich structured data that helps AI systems (ChatGPT, Perplexity, Claude, Gemini)
 * and traditional search engines understand and cite FeedbackFlow accurately.
 */

export function StructuredData() {
  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FeedbackFlow",
    alternateName: "InfiniteMoney FeedbackFlow",
    url: "https://feedbackflow.cc",
    logo: "https://feedbackflow.cc/logo.png",
    description:
      "AI feedback pipeline infrastructure for development teams building with AI agents",
    foundingDate: "2025",
    founder: {
      "@type": "Organization",
      name: "InfiniteMoney",
    },
    sameAs: [
      "https://github.com/Mlock/feedbackflow",
      "https://twitter.com/infinitemoney_ai",
    ],
  };

  // SoftwareApplication Schema
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FeedbackFlow",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Open source with hosted option available",
    },
    description:
      "AI-powered feedback pipeline that transforms user screenshots and reports into structured, machine-readable tickets for AI development workflows. Captures DOM state, console logs, and network errors automatically.",
    featureList: [
      "Screenshot DOM capture with state preservation",
      "AI-powered feedback triage and structuring",
      "Machine-readable JSON output for AI agents",
      "Integration with Linear, Notion, and custom webhooks",
      "Automated ticket generation from user reports",
      "Screen recording with audio capture",
      "Console log and network error tracking",
    ],
    softwareVersion: "1.0",
    releaseNotes: "Initial release with AI feedback pipeline capabilities",
    screenshot: "https://feedbackflow.cc/og-image.jpg",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "1",
    },
  };

  // Product Schema (for better e-commerce understanding)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "FeedbackFlow - AI Feedback Pipeline",
    description:
      "Feedback layer for AI development pipelines. Turns user reports into structured data that AI agents can parse and act on.",
    brand: {
      "@type": "Brand",
      name: "FeedbackFlow",
    },
    category: "Developer Tools",
    offers: {
      "@type": "Offer",
      url: "https://feedbackflow.cc",
      priceCurrency: "USD",
      price: "0",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2026-12-31",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "1",
    },
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FeedbackFlow",
    url: "https://feedbackflow.cc",
    description:
      "AI feedback pipeline infrastructure for development teams",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://feedbackflow.cc/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  // FAQPage Schema for AEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an AI feedback pipeline?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An AI feedback pipeline is infrastructure that transforms unstructured user feedback (screenshots, bug reports, feature requests) into structured, machine-readable data that AI agents can parse and act on. FeedbackFlow captures user feedback with full context (DOM state, console logs, network errors) and uses AI to structure it into actionable tickets.",
        },
      },
      {
        "@type": "Question",
        name: "How does FeedbackFlow work with AI development workflows?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "FeedbackFlow sits between users and AI agents in your development pipeline. When a user reports a bug or requests a feature, FeedbackFlow captures the full context, uses AI to ask clarifying questions, then outputs structured JSON that AI agents can consume. This eliminates manual translation of user feedback into tickets.",
        },
      },
      {
        "@type": "Question",
        name: "What is product feedback automation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Product feedback automation is the process of automatically collecting, structuring, and routing user feedback without manual intervention. FeedbackFlow automates the entire flow from user screenshot to actionable ticket, including context capture, AI triage, and integration with tools like Linear and Notion.",
        },
      },
      {
        "@type": "Question",
        name: "Can AI agents read FeedbackFlow output?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. FeedbackFlow outputs structured JSON with all feedback context, making it machine-readable for AI agents. The output includes the user report, screenshots, DOM state, console logs, network errors, and AI-generated reproduction steps—everything an AI agent needs to understand and fix the issue.",
        },
      },
      {
        "@type": "Question",
        name: "What is AI-assisted development infrastructure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AI-assisted development infrastructure refers to tools and systems that enable AI agents to participate in the software development lifecycle. This includes feedback pipelines (like FeedbackFlow), code generation tools, automated testing systems, and deployment automation—all designed to be consumed and acted upon by AI agents, not just humans.",
        },
      },
    ],
  };

  // HowTo Schema for implementation guidance
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to set up an AI feedback pipeline with FeedbackFlow",
    description:
      "Step-by-step guide to implementing FeedbackFlow in your AI development workflow",
    step: [
      {
        "@type": "HowToStep",
        name: "Install the script",
        text: "Add the FeedbackFlow script tag to your application. The widget will automatically appear for users to submit feedback.",
        url: "https://feedbackflow.cc/docs/installation",
      },
      {
        "@type": "HowToStep",
        name: "Configure integrations",
        text: "Connect FeedbackFlow to your project management tools (Linear, Notion) or set up webhook endpoints for custom AI agent integration.",
        url: "https://feedbackflow.cc/docs/integrations",
      },
      {
        "@type": "HowToStep",
        name: "Enable AI triage",
        text: "Configure AI-powered triage to automatically categorize, prioritize, and route feedback to the appropriate team or AI agent.",
        url: "https://feedbackflow.cc/docs/ai-triage",
      },
      {
        "@type": "HowToStep",
        name: "Connect to AI agents",
        text: "Use the structured JSON output to feed feedback directly into your AI development pipeline for automated issue resolution.",
        url: "https://feedbackflow.cc/docs/ai-agents",
      },
    ],
  };

  // TechArticle Schema for better content understanding
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "AI Feedback Pipeline: The Missing Layer in AI Development",
    description:
      "How FeedbackFlow bridges the gap between user feedback and AI agents in modern development workflows",
    author: {
      "@type": "Organization",
      name: "InfiniteMoney",
    },
    publisher: {
      "@type": "Organization",
      name: "FeedbackFlow",
      logo: {
        "@type": "ImageObject",
        url: "https://feedbackflow.cc/logo.png",
      },
    },
    datePublished: "2025-01-23",
    dateModified: "2025-01-23",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://feedbackflow.cc",
    },
    articleBody:
      "AI agents can ship features in hours, but they still need humans to manually translate user feedback into actionable tickets. FeedbackFlow solves this by providing an AI feedback pipeline that captures user reports with full context (screenshots, DOM state, console logs) and transforms them into structured, machine-readable data that AI agents can consume. This closes the loop in AI-assisted development workflows.",
    keywords: [
      "ai development pipeline",
      "ai feedback pipeline",
      "product feedback automation",
      "ai agent development",
      "ai dev workflow",
      "structured feedback",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </>
  );
}
