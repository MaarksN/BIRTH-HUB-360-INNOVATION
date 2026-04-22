export class ConnectorExecutionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable = false,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ConnectorExecutionError";
  }
}

export function normalizeUnknownError(
  error: unknown,
  fallbackCode: string,
): ConnectorExecutionError {
  if (error instanceof ConnectorExecutionError) {
    return error;
  }

  if (error instanceof Error) {
    return new ConnectorExecutionError(fallbackCode, error.message, false);
  }

  return new ConnectorExecutionError(
    fallbackCode,
    "Unknown connector error",
    false,
    { error },
  );
}
