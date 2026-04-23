export interface FailureAnalysis {
  errorType: 'OPERATIONAL' | 'CONFIGURATION' | 'UNKNOWN';
  confidence: number;
  canAutoRetry: boolean;
  suggestedFix?: string;
  retryStrategy?: 'EXPONENTIAL_BACKOFF' | 'IMMEDIATE' | 'NONE';
}

/**
 * Analyzes a failure to determine if it's operational (transient) or configuration-based.
 * Suggests fixes or retry strategies.
 */
export function analyzeFailure(error: unknown): FailureAnalysis {
  const typedError = error as { message?: string };
  const message = (typedError?.message || '').toLowerCase();

  // Simulate classification heuristics
  if (message.includes('rate limit') || message.includes('timeout') || message.includes('network')) {
    return {
      errorType: 'OPERATIONAL',
      confidence: 0.95,
      canAutoRetry: true,
      retryStrategy: 'EXPONENTIAL_BACKOFF',
      suggestedFix: 'Transient operational error detected. Suggest enabling automatic exponential backoff retries.'
    };
  }

  if (message.includes('invalid credentials') || message.includes('not found') || message.includes('unauthorized')) {
    return {
      errorType: 'CONFIGURATION',
      confidence: 0.9,
      canAutoRetry: false,
      retryStrategy: 'NONE',
      suggestedFix: 'Configuration error detected. Check connector credentials and input parameters.'
    };
  }

  return {
    errorType: 'UNKNOWN',
    confidence: 0.5,
    canAutoRetry: false,
    retryStrategy: 'NONE'
  };
}
