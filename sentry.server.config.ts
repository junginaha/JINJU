import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-config";

Sentry.init(
  sentryOptions(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    process.env.VERCEL_ENV,
    process.env.SENTRY_TRACES_SAMPLE_RATE,
  ),
);
