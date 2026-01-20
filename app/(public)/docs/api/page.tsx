import Link from "next/link";
import { ArrowLeft, Key, Code, Book, Shield, Zap } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-retro-paper">
      {/* Header */}
      <header className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-retro-black bg-retro-peach shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <Book className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-retro-black">
                REST API Documentation
              </h1>
              <p className="text-xs text-stone-500">v1.0</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h2 className="mb-4 text-xl font-semibold text-retro-black">
              Introduction
            </h2>
            <p className="text-stone-600">
              The FeedbackFlow REST API allows you to programmatically access and
              manage your feedback data. Use it to build custom integrations,
              automate workflows, or sync feedback with other tools.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-retro-blue/10 p-2">
                  <Shield className="h-5 w-5 text-retro-blue" />
                </div>
                <div>
                  <h3 className="font-medium text-retro-black">Secure</h3>
                  <p className="text-sm text-stone-500">
                    Bearer token authentication
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-retro-yellow/20 p-2">
                  <Zap className="h-5 w-5 text-retro-yellow" />
                </div>
                <div>
                  <h3 className="font-medium text-retro-black">Fast</h3>
                  <p className="text-sm text-stone-500">
                    100 requests/min rate limit
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-retro-peach/20 p-2">
                  <Code className="h-5 w-5 text-retro-peach" />
                </div>
                <div>
                  <h3 className="font-medium text-retro-black">RESTful</h3>
                  <p className="text-sm text-stone-500">
                    JSON responses, standard HTTP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Authentication
          </h2>
          <div className="space-y-4">
            <div className="rounded border-2 border-stone-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <Key className="mt-1 h-5 w-5 text-retro-peach" />
                <div>
                  <h3 className="font-medium text-retro-black">API Keys</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Generate API keys in{" "}
                    <Link
                      href="/settings"
                      className="text-retro-blue hover:underline"
                    >
                      Settings &rarr; API Keys
                    </Link>
                    . Keys start with <code className="rounded bg-stone-100 px-1">ff_</code> and
                    include permission scopes.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded border-2 border-stone-200 bg-white p-6">
              <h3 className="mb-3 font-medium text-retro-black">
                Making Authenticated Requests
              </h3>
              <p className="mb-4 text-sm text-stone-600">
                Include your API key in the <code className="rounded bg-stone-100 px-1">Authorization</code> header
                with the <code className="rounded bg-stone-100 px-1">Bearer</code> prefix:
              </p>
              <CodeBlock
                language="bash"
                code={`curl -H "Authorization: Bearer ff_your_api_key_here" \\
  https://feedbackflow.dev/api/v1/feedback`}
              />
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Rate Limiting
          </h2>
          <div className="rounded border-2 border-stone-200 bg-white p-6">
            <p className="mb-4 text-stone-600">
              The API is rate limited to <strong>100 requests per minute</strong> per
              API key. Rate limit information is included in response headers:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="py-2 pr-4 text-left font-medium text-stone-700">
                      Header
                    </th>
                    <th className="py-2 text-left font-medium text-stone-700">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-stone-100 px-1">
                        X-RateLimit-Limit
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Maximum requests per minute
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-stone-100 px-1">
                        X-RateLimit-Remaining
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Remaining requests in current window
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="rounded bg-stone-100 px-1">
                        X-RateLimit-Reset
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Unix timestamp when the limit resets
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Endpoints
          </h2>

          {/* List Feedback */}
          <EndpointCard
            method="GET"
            path="/api/v1/feedback"
            description="List feedback for your team with optional filters"
            permission="read:feedback"
            parameters={[
              {
                name: "projectId",
                type: "string",
                required: false,
                description: "Filter by project ID",
              },
              {
                name: "status",
                type: "string",
                required: false,
                description: "Filter by status: new, triaging, drafted, exported, resolved",
              },
              {
                name: "type",
                type: "string",
                required: false,
                description: "Filter by type: bug, feature",
              },
              {
                name: "priority",
                type: "string",
                required: false,
                description: "Filter by priority: low, medium, high, critical",
              },
              {
                name: "limit",
                type: "number",
                required: false,
                description: "Number of results (default: 50, max: 100)",
              },
              {
                name: "offset",
                type: "number",
                required: false,
                description: "Pagination offset (default: 0)",
              },
            ]}
            responseExample={`{
  "data": [
    {
      "id": "abc123",
      "type": "bug",
      "title": "Login button not working",
      "description": "When I click the login button...",
      "status": "new",
      "priority": "high",
      "tags": ["auth", "ui"],
      "screenshotUrl": "https://...",
      "submitterEmail": "user@example.com",
      "projectId": "proj123",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}`}
          />

          {/* Get Single Feedback */}
          <EndpointCard
            method="GET"
            path="/api/v1/feedback/:id"
            description="Get a single feedback item by ID"
            permission="read:feedback"
            responseExample={`{
  "data": {
    "id": "abc123",
    "type": "bug",
    "title": "Login button not working",
    "description": "When I click the login button...",
    "status": "new",
    "priority": "high",
    "tags": ["auth", "ui"],
    "screenshotUrl": "https://...",
    "recordingUrl": null,
    "submitterEmail": "user@example.com",
    "submitterName": "John Doe",
    "assignee": {
      "id": "user456",
      "name": "Jane Smith",
      "email": "jane@team.com"
    },
    "projectId": "proj123",
    "widgetId": "widget789",
    "metadata": {
      "browser": "Chrome 120",
      "os": "macOS",
      "url": "https://app.example.com/login",
      "timestamp": 1704067200000
    },
    "createdAt": 1704067200000,
    "updatedAt": 1704067200000,
    "resolvedAt": null
  }
}`}
          />

          {/* Update Feedback */}
          <EndpointCard
            method="PATCH"
            path="/api/v1/feedback/:id"
            description="Update a feedback item's status, priority, or tags"
            permission="write:feedback"
            requestBody={`{
  "status": "triaging",    // optional
  "priority": "critical",  // optional
  "tags": ["urgent", "p0"] // optional
}`}
            responseExample={`{
  "data": { /* updated feedback object */ },
  "message": "Feedback updated successfully"
}`}
          />

          {/* Add Comment */}
          <EndpointCard
            method="POST"
            path="/api/v1/feedback/:id/comments"
            description="Add a comment to a feedback item"
            permission="write:feedback"
            requestBody={`{
  "content": "Thanks for reporting this. We're investigating.",
  "authorName": "Support Bot"  // optional
}`}
            responseExample={`{
  "data": {
    "commentId": "comment123",
    "content": "Thanks for reporting this...",
    "createdAt": 1704067200000
  },
  "message": "Comment added successfully"
}`}
          />

          {/* List Projects */}
          <EndpointCard
            method="GET"
            path="/api/v1/projects"
            description="List all projects for your team"
            permission="read:projects"
            responseExample={`{
  "data": [
    {
      "id": "proj123",
      "name": "Main Website",
      "description": "Production website feedback",
      "settings": {
        "defaultPriority": "medium",
        "autoTriage": true,
        "notifyOnNew": true
      },
      "feedbackCount": 42,
      "newFeedbackCount": 5,
      "createdAt": 1704067200000
    }
  ]
}`}
          />
        </section>

        {/* Error Handling */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Error Handling
          </h2>
          <div className="rounded border-2 border-stone-200 bg-white p-6">
            <p className="mb-4 text-stone-600">
              The API uses standard HTTP status codes. Errors return a JSON object
              with an <code className="rounded bg-stone-100 px-1">error</code> message:
            </p>
            <CodeBlock
              language="json"
              code={`{
  "error": "Invalid API key",
  "status": 401
}`}
            />
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="py-2 pr-4 text-left font-medium text-stone-700">
                      Status
                    </th>
                    <th className="py-2 text-left font-medium text-stone-700">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-green-100 px-2 text-green-700">
                        200
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">Success</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-green-100 px-2 text-green-700">
                        201
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">Created</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-yellow-100 px-2 text-yellow-700">
                        400
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">Bad Request</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-red-100 px-2 text-red-700">
                        401
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Unauthorized (invalid or missing API key)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-red-100 px-2 text-red-700">
                        403
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Forbidden (insufficient permissions)
                    </td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-red-100 px-2 text-red-700">
                        404
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">Not Found</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-orange-100 px-2 text-orange-700">
                        429
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Rate Limit Exceeded
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <code className="rounded bg-red-100 px-2 text-red-700">
                        500
                      </code>
                    </td>
                    <td className="py-2 text-stone-600">
                      Internal Server Error
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Example Integration */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-retro-black">
            Example: Node.js Integration
          </h2>
          <div className="rounded border-2 border-stone-200 bg-white p-6">
            <CodeBlock
              language="javascript"
              code={`const API_KEY = process.env.FEEDBACKFLOW_API_KEY;
const BASE_URL = 'https://feedbackflow.dev/api/v1';

async function listFeedback(options = {}) {
  const params = new URLSearchParams(options);
  const response = await fetch(\`\${BASE_URL}/feedback?\${params}\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Example: Get all high-priority bugs
const bugs = await listFeedback({
  type: 'bug',
  priority: 'high',
  status: 'new',
});

console.log(\`Found \${bugs.data.length} high-priority bugs\`);`}
            />
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-stone-200 pt-8 text-center text-sm text-stone-500">
          <p>
            Need help?{" "}
            <a
              href="https://github.com/feedbackflow/feedbackflow/issues"
              className="text-retro-blue hover:underline"
            >
              Open an issue on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-900 p-4 text-sm text-stone-100">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}

interface EndpointCardProps {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  description: string;
  permission: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: string;
  responseExample: string;
}

function EndpointCard({
  method,
  path,
  description,
  permission,
  parameters,
  requestBody,
  responseExample,
}: EndpointCardProps) {
  const methodColors = {
    GET: "bg-green-100 text-green-700 border-green-300",
    POST: "bg-blue-100 text-blue-700 border-blue-300",
    PATCH: "bg-yellow-100 text-yellow-700 border-yellow-300",
    PUT: "bg-orange-100 text-orange-700 border-orange-300",
    DELETE: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <div className="mb-6 rounded border-2 border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 p-4">
        <span
          className={`rounded border px-2 py-1 text-xs font-bold ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="text-sm font-medium text-retro-black">{path}</code>
        <span className="ml-auto flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
          <Shield className="h-3 w-3" />
          {permission}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm text-stone-600">{description}</p>

        {parameters && parameters.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Query Parameters
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="py-2 pr-4 text-left font-medium text-stone-700">
                      Parameter
                    </th>
                    <th className="py-2 pr-4 text-left font-medium text-stone-700">
                      Type
                    </th>
                    <th className="py-2 text-left font-medium text-stone-700">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param) => (
                    <tr key={param.name} className="border-b border-stone-100">
                      <td className="py-2 pr-4">
                        <code className="rounded bg-stone-100 px-1">
                          {param.name}
                        </code>
                        {param.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-stone-500">{param.type}</td>
                      <td className="py-2 text-stone-600">
                        {param.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {requestBody && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Request Body
            </h4>
            <CodeBlock language="json" code={requestBody} />
          </div>
        )}

        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Response
          </h4>
          <CodeBlock language="json" code={responseExample} />
        </div>
      </div>
    </div>
  );
}
