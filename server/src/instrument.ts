import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    'https://66ba6931892e1bdfb3a420010dfed5b2@o4511558504808448.ingest.us.sentry.io/4511558580240384',
  integrations: [nodeProfilingIntegration()],
  // Send structured logs to Sentry
  enableLogs: true,
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set sampling rate for profiling
  profileSessionSampleRate: 1.0,
  // Trace lifecycle automatically enables profiling during active traces
  profileLifecycle: 'trace',
});
