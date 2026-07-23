import type { Options } from "@sentry/core";

function sampleRate(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.1;
}

export function sentryOptions(
  dsn: string | undefined,
  environment: string | undefined,
  traceRate: string | undefined,
): Options {
  return {
    dsn,
    enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
    environment: environment || process.env.NODE_ENV,
    tracesSampleRate: sampleRate(traceRate),
    maxBreadcrumbs: 0,
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: false,
        response: false,
      },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: {
        document: false,
        variables: false,
      },
      genAI: {
        inputs: false,
        outputs: false,
      },
      databaseQueryData: false,
      stackFrameVariables: false,
      frameContextLines: 3,
    },
    beforeSend(event) {
      delete event.user;
      if (event.request?.url) {
        event.request = { url: event.request.url.split("?")[0] };
      } else {
        delete event.request;
      }
      return event;
    },
  };
}
