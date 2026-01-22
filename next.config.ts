import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  silent: !process.env.CI,
  
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  
  // Source maps configuration
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  
  // Automatically instrument server functions
  automaticVercelMonitors: true,
});
