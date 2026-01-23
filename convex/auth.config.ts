// Clerk authentication configuration for Convex
// The domain is automatically configured from your Clerk dashboard
// This should match your Clerk instance URL
export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};
