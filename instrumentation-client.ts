import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-config";

Sentry.init(
  sentryOptions(
    process.env.NEXT_PUBLIC_SENTRY_DSN,
    process.env.NEXT_PUBLIC_VERCEL_ENV,
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  ),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
