export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMessage?: string;
  timeoutMs?: number;
}

export const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

function createTimeoutError(timeoutMs: number, timeoutMessage?: string): Error {
  const error = new Error(
    timeoutMessage ?? `Request exceeded the ${timeoutMs}ms timeout budget.`
  );
  error.name = "FetchTimeoutError";
  return error;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: FetchWithTimeoutInit = {}
): Promise<Response> {
  const {
    signal,
    timeoutMessage,
    timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
    ...requestInit
  } = init;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timeoutError = createTimeoutError(timeoutMs, timeoutMessage);
  const relayAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort(signal?.reason ?? timeoutError);
    }
  };

  if (signal?.aborted) {
    relayAbort();
  } else if (signal) {
    signal.addEventListener("abort", relayAbort, { once: true });
  }

  const timer = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort(timeoutError);
    }
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...requestInit,
      signal: controller.signal
    });
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason === timeoutError) {
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", relayAbort);
  }
}
