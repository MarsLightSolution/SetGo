/**
 * Global Error Handlers
 *
 * React's <ErrorBoundary> only catches errors thrown during render, inside
 * the component tree. It does NOT catch errors thrown in event handlers
 * (onPress callbacks), timers, or unhandled promise rejections — those
 * currently crash (or silently fail) with zero report to errorReporter.
 *
 * This installs two process-wide hooks so those are captured too:
 *  1. ErrorUtils.setGlobalHandler — catches fatal/uncaught JS exceptions
 *     that bypass React entirely.
 *  2. Hermes' promise rejection tracker — catches unhandled promise
 *     rejections (an `await` inside an async function with no try/catch,
 *     whose caller also never awaited/caught it).
 *
 * Call setupGlobalErrorHandlers() once, at module scope, before the app
 * renders (see app/_layout.jsx).
 */
import { captureException } from '../services/errorReporter';
import logger from './logger';

const log = logger.create('GlobalError');

let installed = false;

export function setupGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  // 1. Fatal / uncaught JS exceptions outside the React tree
  if (typeof ErrorUtils !== 'undefined') {
    const defaultHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      log.error(isFatal ? 'Fatal JS error:' : 'Uncaught JS error:', error);
      captureException(error, { type: isFatal ? 'fatal' : 'uncaught' });
      // Preserve RN's default behavior (dev red screen / prod restart) —
      // we're only adding reporting, not swallowing the crash.
      defaultHandler?.(error, isFatal);
    });
  }

  // 2. Unhandled promise rejections (Hermes-specific hook)
  if (global.HermesInternal?.enablePromiseRejectionTracker) {
    global.HermesInternal.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (id, rejection) => {
        log.error('Unhandled promise rejection:', rejection);
        captureException(rejection, { type: 'unhandledRejection' });
      },
      onHandled: () => {},
    });
  }
}
