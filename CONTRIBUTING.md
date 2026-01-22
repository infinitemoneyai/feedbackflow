# Contributing to FeedbackFlow

Thank you for your interest in contributing to FeedbackFlow! We welcome contributions from the community.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots, etc.)
- **Describe the behavior you observed and what you expected**
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. Fork the repository and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes (`npm run test`)
4. Ensure your code lints (`npm run lint`)
5. Ensure TypeScript compiles (`npm run typecheck`)
6. Update documentation as needed
7. Write a clear commit message

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- A Convex account (free tier available)
- A Clerk account (free tier available)
- A Stripe account (for billing features)

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/feedbackflow.git
cd feedbackflow
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) section below for details.

4. **Initialize Convex**

```bash
npx convex dev
```

This will create a new Convex project and push the schema.

5. **Run the development server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Environment Variables

See `.env.example` for a complete list of required environment variables. Key services:

- **Convex**: Backend and database
- **Clerk**: Authentication
- **Stripe**: Payments (optional for development)
- **Resend**: Emails (optional for development)

### Project Structure

```
feedbackflow/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authenticated routes
│   ├── (public)/          # Public routes
│   ├── api/               # API routes
│   └── onboarding/        # Onboarding flow
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── onboarding/        # Onboarding components
│   ├── settings/          # Settings components
│   └── ui/                # Base UI components
├── convex/                # Convex backend functions
├── lib/                   # Utility functions
│   ├── ai/                # AI integration utilities
│   ├── email/             # Email utilities
│   ├── exports/           # Export utilities
│   └── integrations/      # Third-party integrations
├── widget/                # Embeddable widget source
├── __tests__/             # Unit tests
└── e2e/                   # End-to-end tests
```

### Code Style

We follow these conventions:

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

Run `npm run lint` to check code style.

### Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Building

```bash
# Build the app
npm run build

# Build the widget
npm run widget:build

# Type check
npm run typecheck
```

## Commit Messages

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat: add AI-powered ticket drafting`

## Release Process

Releases are managed by maintainers. The process:

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Create a git tag
4. Push to GitHub
5. GitHub Actions handles deployment

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
