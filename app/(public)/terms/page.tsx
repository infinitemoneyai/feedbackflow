import { Icon } from "@/components/ui/icon";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | FeedbackFlow",
  description: "Terms and conditions for using FeedbackFlow",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-lg text-stone-600">
            Last updated: January 26, 2026
          </p>
        </div>

        <div className="prose prose-stone max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Agreement to Terms
            </h2>
            <p className="mb-4 text-stone-700">
              By accessing or using FeedbackFlow ("Service", "Platform", "we",
              "our", or "us"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree to these Terms, do not use the
              Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Description of Service
            </h2>
            <p className="mb-4 text-stone-700">
              FeedbackFlow is a feedback collection and management platform that:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                Provides embeddable widgets for collecting user feedback on
                websites and applications
              </li>
              <li>
                Captures screenshots, screen recordings, and technical metadata
              </li>
              <li>
                Uses AI to analyze feedback and generate structured tickets
              </li>
              <li>
                Integrates with project management tools (Linear, Notion)
              </li>
              <li>Manages feedback workflows and team collaboration</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Account Registration
            </h2>
            <p className="mb-4 text-stone-700">
              To use the Service, you must:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Be at least 13 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p className="mb-4 text-stone-700">
              You may not:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Share your account with others</li>
              <li>Create multiple accounts to evade restrictions</li>
              <li>Use false or misleading information</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Acceptable Use
            </h2>
            <p className="mb-4 text-stone-700">You agree NOT to:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                Use the Service for any illegal or unauthorized purpose
              </li>
              <li>
                Violate any laws, regulations, or third-party rights
              </li>
              <li>
                Upload malicious code, viruses, or harmful content
              </li>
              <li>
                Attempt to gain unauthorized access to our systems
              </li>
              <li>
                Reverse engineer, decompile, or disassemble the Service
              </li>
              <li>
                Use automated tools to scrape or extract data
              </li>
              <li>
                Interfere with or disrupt the Service or servers
              </li>
              <li>
                Collect or harvest user information without consent
              </li>
              <li>
                Use the Service to spam, harass, or abuse others
              </li>
              <li>
                Resell or redistribute the Service without authorization
              </li>
              <li>
                Remove or obscure any proprietary notices
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Widget Integration
            </h2>
            <p className="mb-4 text-stone-700">
              When embedding our widget on your website or application:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                You must have the legal right to embed third-party code
              </li>
              <li>
                You are responsible for obtaining user consent for data
                collection where required by law
              </li>
              <li>
                You must not modify the widget code in ways that circumvent
                security or usage limits
              </li>
              <li>
                You must comply with all applicable privacy laws (GDPR, CCPA,
                etc.)
              </li>
              <li>
                You are responsible for your own privacy policy and terms
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              User Content
            </h2>
            <p className="mb-4 text-stone-700">
              You retain ownership of all feedback, screenshots, and content
              submitted through the Service ("User Content"). By submitting User
              Content, you grant us:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                A worldwide, non-exclusive, royalty-free license to use, store,
                process, and display User Content
              </li>
              <li>
                The right to process User Content with AI for analysis and
                ticket generation
              </li>
              <li>
                The right to backup and replicate User Content for service
                reliability
              </li>
            </ul>
            <p className="mb-4 text-stone-700">You represent and warrant that:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>You own or have rights to all User Content you submit</li>
              <li>
                User Content does not violate any laws or third-party rights
              </li>
              <li>
                User Content does not contain viruses or malicious code
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Intellectual Property
            </h2>
            <p className="mb-4 text-stone-700">
              The Service, including all software, designs, text, graphics,
              logos, and other content (excluding User Content), is owned by
              FeedbackFlow and protected by copyright, trademark, and other
              intellectual property laws.
            </p>
            <p className="mb-4 text-stone-700">
              We grant you a limited, non-exclusive, non-transferable license to
              access and use the Service for its intended purpose. This license
              does not include:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Resale or commercial use of the Service</li>
              <li>Collection or use of product listings or descriptions</li>
              <li>Derivative works based on the Service</li>
              <li>Downloading or copying of account information</li>
              <li>Use of data mining or similar tools</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Payment and Billing
            </h2>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Subscription Plans
            </h3>
            <p className="mb-4 text-stone-700">
              We offer free and paid subscription plans. Paid plans are billed:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Monthly or annually, as selected</li>
              <li>In advance at the start of each billing period</li>
              <li>Automatically using your payment method on file</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Payment Terms
            </h3>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>All fees are in USD unless otherwise stated</li>
              <li>You must provide valid payment information</li>
              <li>You authorize us to charge your payment method</li>
              <li>Failed payments may result in service suspension</li>
              <li>You are responsible for all taxes and fees</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Refunds
            </h3>
            <p className="mb-4 text-stone-700">
              Refunds are handled on a case-by-case basis. Generally:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Monthly subscriptions: No refunds for partial months</li>
              <li>
                Annual subscriptions: Pro-rated refunds within 30 days of
                purchase
              </li>
              <li>
                Refunds for service issues will be considered on a case-by-case
                basis
              </li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Cancellation
            </h3>
            <p className="mb-4 text-stone-700">
              You may cancel your subscription at any time. Upon cancellation:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>You will retain access until the end of the billing period</li>
              <li>No refunds will be issued for the remaining period</li>
              <li>Your account will revert to the free plan</li>
              <li>Data will be retained according to our Privacy Policy</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-retro-black">
              Price Changes
            </h3>
            <p className="mb-4 text-stone-700">
              We may change our pricing with 30 days' notice. Price changes will
              not affect your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Service Availability
            </h2>
            <p className="mb-4 text-stone-700">
              We strive to provide reliable service but do not guarantee:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Uninterrupted or error-free operation</li>
              <li>That defects will be corrected immediately</li>
              <li>That the Service is free from viruses or harmful components</li>
              <li>Specific uptime percentages (except for Enterprise plans)</li>
            </ul>
            <p className="mb-4 text-stone-700">
              We reserve the right to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Modify or discontinue features with notice</li>
              <li>Perform scheduled maintenance</li>
              <li>Implement usage limits to ensure fair use</li>
              <li>Suspend service for security or legal reasons</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              API Usage
            </h2>
            <p className="mb-4 text-stone-700">
              If you use our API, you agree to:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Comply with rate limits and usage quotas</li>
              <li>Not abuse or overload our systems</li>
              <li>Keep your API keys secure and confidential</li>
              <li>Not share API keys with unauthorized parties</li>
              <li>Implement proper error handling and retries</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Third-Party Integrations
            </h2>
            <p className="mb-4 text-stone-700">
              Our Service integrates with third-party platforms (Linear, Notion,
              etc.). You acknowledge that:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                Third-party services have their own terms and privacy policies
              </li>
              <li>We are not responsible for third-party service availability</li>
              <li>
                Integration functionality may change based on third-party APIs
              </li>
              <li>You must comply with third-party terms when using integrations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Disclaimer of Warranties
            </h2>
            <p className="mb-4 text-stone-700">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Warranties of merchantability</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy or reliability of results</li>
              <li>Compatibility with your systems</li>
            </ul>
            <p className="mb-4 text-stone-700">
              WE DO NOT WARRANT THAT:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>The Service will meet your requirements</li>
              <li>The Service will be uninterrupted or error-free</li>
              <li>AI-generated content will be accurate or complete</li>
              <li>Defects will be corrected</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Limitation of Liability
            </h2>
            <p className="mb-4 text-stone-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FEEDBACKFLOW SHALL NOT BE
              LIABLE FOR:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                Indirect, incidental, special, consequential, or punitive damages
              </li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or data loss</li>
              <li>Third-party actions or content</li>
              <li>Unauthorized access to your account</li>
            </ul>
            <p className="mb-4 text-stone-700">
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE
              12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Indemnification
            </h2>
            <p className="mb-4 text-stone-700">
              You agree to indemnify and hold harmless FeedbackFlow, its
              affiliates, officers, directors, employees, and agents from any
              claims, damages, losses, liabilities, and expenses (including legal
              fees) arising from:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>User Content you submit</li>
              <li>Your widget integration and data collection practices</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Termination
            </h2>
            <p className="mb-4 text-stone-700">
              We may suspend or terminate your account if:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>You violate these Terms</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>Your account is inactive for an extended period</li>
              <li>We are required to do so by law</li>
              <li>Payment fails repeatedly</li>
            </ul>
            <p className="mb-4 text-stone-700">Upon termination:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Your access to the Service will be revoked</li>
              <li>You must cease using the Service and remove all widgets</li>
              <li>We may delete your data after a grace period</li>
              <li>You remain liable for any outstanding fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Data Backup and Loss
            </h2>
            <p className="mb-4 text-stone-700">
              While we implement backup procedures, you are responsible for:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Maintaining your own backups of critical data</li>
              <li>Exporting data regularly if needed</li>
              <li>Accepting that we cannot guarantee against data loss</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Dispute Resolution
            </h2>
            <p className="mb-4 text-stone-700">
              Any disputes arising from these Terms or the Service shall be
              resolved through:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>
                <strong>Informal negotiation:</strong> Contact us first to
                resolve the issue
              </li>
              <li>
                <strong>Binding arbitration:</strong> If negotiation fails,
                disputes will be resolved through binding arbitration
              </li>
              <li>
                <strong>Class action waiver:</strong> You agree not to
                participate in class actions against us
              </li>
            </ul>
            <p className="mb-4 text-stone-700">
              These Terms shall be governed by the laws of [Your Jurisdiction],
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Changes to Terms
            </h2>
            <p className="mb-4 text-stone-700">
              We may update these Terms from time to time. We will notify you of
              material changes by:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-stone-700">
              <li>Posting the updated Terms on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification for significant changes</li>
            </ul>
            <p className="mb-4 text-stone-700">
              Your continued use of the Service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Severability
            </h2>
            <p className="mb-4 text-stone-700">
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Entire Agreement
            </h2>
            <p className="mb-4 text-stone-700">
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and FeedbackFlow regarding the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-retro-black">
              Contact Us
            </h2>
            <p className="mb-4 text-stone-700">
              If you have questions about these Terms, contact us at:
            </p>
            <div className="rounded border-2 border-stone-200 bg-white p-4">
              <p className="mb-2 text-stone-700">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:legal@feedbackflow.cc"
                  className="font-medium text-retro-blue hover:underline"
                >
                  legal@feedbackflow.cc
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
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex items-center justify-center gap-6 border-t-2 border-stone-200 pt-8 text-sm">
          <Link
            href="/privacy"
            className="font-medium text-retro-blue hover:underline"
          >
            Privacy Policy
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
