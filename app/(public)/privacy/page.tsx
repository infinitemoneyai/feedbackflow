import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | FeedbackFlow",
  description: "How we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-retro-paper">
      {/* Header */}
      <div className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-stone-600 transition-colors hover:text-retro-black"
          >
            <Icon
              name="solar:arrow-left-linear"
              size={20}
              className="transition-transform group-hover:-translate-x-1"
            />
            <span className="font-mono text-sm uppercase tracking-widest">
              Back to Home
            </span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-retro-black md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-lg text-stone-600">
            Last updated: January 26, 2026
          </p>
        </div>

        <div className="prose prose-stone max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Introduction
            </h2>
            <p className="mb-4 text-stone-700">
              FeedbackFlow ("we", "our", or "us") is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our feedback
              collection and management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Information We Collect
            </h2>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Account Information
            </h3>
            <p className="mb-4 text-stone-700">
              When you create an account, we collect:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Profile picture (optional)</li>
              <li>Team/workspace information</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Feedback Data
            </h3>
            <p className="mb-4 text-stone-700">
              When feedback is submitted through your widget, we collect:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Feedback text and descriptions</li>
              <li>Screenshots and screen recordings</li>
              <li>Browser information (type, version)</li>
              <li>Operating system information</li>
              <li>Page URL where feedback was submitted</li>
              <li>Screen resolution</li>
              <li>User agent string</li>
              <li>Submitter email and name (if provided)</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Usage Data
            </h3>
            <p className="mb-4 text-stone-700">
              We automatically collect certain information when you use our
              service:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Log data (IP address, access times, pages viewed)</li>
              <li>Device information</li>
              <li>Feature usage analytics</li>
              <li>Performance metrics</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Payment Information
            </h3>
            <p className="mb-4 text-stone-700">
              Payment processing is handled by Stripe. We do not store your full
              credit card information. We receive and store:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Stripe customer ID</li>
              <li>Subscription status</li>
              <li>Billing email</li>
              <li>Last 4 digits of payment method (for display purposes)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              How We Use Your Information
            </h2>
            <p className="mb-4 text-stone-700">We use your information to:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Provide, maintain, and improve our service</li>
              <li>Process feedback submissions and generate AI analysis</li>
              <li>Send transactional emails (feedback notifications, status updates)</li>
              <li>Process payments and manage subscriptions</li>
              <li>Respond to support requests</li>
              <li>Monitor and analyze usage patterns to improve our service</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Third-Party Services
            </h2>
            <p className="mb-4 text-stone-700">
              We use the following third-party services that may collect and
              process your data:
            </p>

            <div className="mb-4 rounded border-2 border-stone-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-retro-black">
                Clerk (Authentication)
              </h4>
              <p className="text-sm text-stone-600">
                Manages user authentication and account data.
              </p>
            </div>

            <div className="mb-4 rounded border-2 border-stone-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-retro-black">
                Convex (Database)
              </h4>
              <p className="text-sm text-stone-600">
                Stores feedback data, user information, and application data.
              </p>
            </div>

            <div className="mb-4 rounded border-2 border-stone-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-retro-black">
                Stripe (Payments)
              </h4>
              <p className="text-sm text-stone-600">
                Processes subscription payments and manages billing.
              </p>
            </div>

            <div className="mb-4 rounded border-2 border-stone-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-retro-black">
                PostHog (Analytics)
              </h4>
              <p className="text-sm text-stone-600">
                Tracks product usage and feature adoption (anonymized).
              </p>
            </div>

            <div className="mb-4 rounded border-2 border-stone-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-retro-black">
                Resend (Email)
              </h4>
              <p className="text-sm text-stone-600">
                Sends transactional emails and notifications.
              </p>
            </div>

            <div className="mb-4 rounded border-2 border-stone-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-retro-black">
                OpenAI / Anthropic (AI Processing)
              </h4>
              <p className="text-sm text-stone-600">
                Processes feedback content for AI analysis and ticket generation.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Data Retention
            </h2>
            <p className="mb-4 text-stone-700">
              We retain your information for as long as your account is active or
              as needed to provide services. You may request deletion of your
              data at any time by contacting us.
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                <strong>Account data:</strong> Retained until account deletion
              </li>
              <li>
                <strong>Feedback data:</strong> Retained until project deletion
                or account deletion
              </li>
              <li>
                <strong>Usage logs:</strong> Retained for 90 days
              </li>
              <li>
                <strong>Billing records:</strong> Retained for 7 years for tax
                compliance
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Your Rights
            </h2>
            <p className="mb-4 text-stone-700">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct your information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your data
              </li>
              <li>
                <strong>Export:</strong> Receive your data in a portable format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing emails
              </li>
              <li>
                <strong>Restriction:</strong> Request limitation of data
                processing
              </li>
            </ul>
            <p className="mb-4 text-stone-700">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@feedbackflow.cc"
                className="font-medium text-retro-blue hover:underline"
              >
                privacy@feedbackflow.cc
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Data Security
            </h2>
            <p className="mb-4 text-stone-700">
              We implement industry-standard security measures to protect your
              data:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Encryption in transit (TLS/SSL)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Secure API key storage (AES-256 encryption)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Cookies and Tracking
            </h2>
            <p className="mb-4 text-stone-700">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage (via PostHog)</li>
            </ul>
            <p className="mb-4 text-stone-700">
              You can control cookies through your browser settings. Disabling
              cookies may limit functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              International Data Transfers
            </h2>
            <p className="mb-4 text-stone-700">
              Your data may be transferred to and processed in countries other
              than your own. We ensure appropriate safeguards are in place for
              international transfers, including:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Standard contractual clauses</li>
              <li>Data processing agreements with third parties</li>
              <li>Compliance with GDPR and CCPA requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Children's Privacy
            </h2>
            <p className="mb-4 text-stone-700">
              Our service is not intended for users under 13 years of age. We do
              not knowingly collect personal information from children under 13.
              If we discover we have collected such information, we will delete
              it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Changes to This Policy
            </h2>
            <p className="mb-4 text-stone-700">
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification for significant changes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Contact Us
            </h2>
            <p className="mb-4 text-stone-700">
              If you have questions about this Privacy Policy or our data
              practices, contact us at:
            </p>
            <div className="rounded border-2 border-stone-200 bg-white p-4">
              <p className="mb-2 text-stone-700">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@feedbackflow.cc"
                  className="font-medium text-retro-blue hover:underline"
                >
                  privacy@feedbackflow.cc
                </a>
              </p>
              <p className="text-stone-700">
                <strong>Support:</strong>{" "}
                <a
                  href="mailto:support@feedbackflow.cc"
                  className="font-medium text-retro-blue hover:underline"
                >
                  support@feedbackflow.cc
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              GDPR Compliance (EU Users)
            </h2>
            <p className="mb-4 text-stone-700">
              If you are located in the European Economic Area (EEA), you have
              additional rights under GDPR:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Right to be informed about data processing</li>
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Rights related to automated decision-making</li>
            </ul>
            <p className="mb-4 text-stone-700">
              Our legal basis for processing your data includes:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                <strong>Contract:</strong> Processing necessary to provide our
                service
              </li>
              <li>
                <strong>Consent:</strong> You have given explicit consent
              </li>
              <li>
                <strong>Legitimate interests:</strong> Improving our service and
                preventing fraud
              </li>
              <li>
                <strong>Legal obligation:</strong> Compliance with applicable
                laws
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              CCPA Compliance (California Users)
            </h2>
            <p className="mb-4 text-stone-700">
              If you are a California resident, you have rights under the
              California Consumer Privacy Act (CCPA):
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
            <p className="mb-4 text-stone-700">
              <strong>We do not sell your personal information.</strong>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex items-center justify-center gap-6 border-t-2 border-stone-200 pt-8 text-sm">
          <Link
            href="/terms"
            className="font-medium text-retro-blue hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/"
            className="font-medium text-stone-600 hover:text-retro-black"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
