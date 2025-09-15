/**
 * Error Recovery and Retry Service
 * Provides robust error handling with automatic retries and recovery mechanisms
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RecoveryAction {
  id: string;
  description: string;
  action: () => Promise<void>;
  priority: 'low' | 'medium' | 'high';
}

export class ErrorRecoveryService {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and temporary failures
      return error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('temporary') ||
             error.message.includes('ECONNRESET') ||
             error.message.includes('ENOTFOUND');
    }
  };

  private recoveryActions: Map<string, RecoveryAction[]> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Generic retry function with exponential backoff
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    operationId?: string
  ): Promise<T> {
    const opts = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === opts.maxRetries) {
          break; // No more retries
        }

        // Check if we should retry this error
        if (opts.retryCondition && !opts.retryCondition(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelay
        );

        console.warn(`Operation ${operationId || 'unknown'} failed (attempt ${attempt + 1}/${opts.maxRetries + 1}):`, lastError.message);
        console.log(`Retrying in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Register recovery actions for specific error types
  registerRecoveryAction(errorType: string, action: RecoveryAction): void {
    if (!this.recoveryActions.has(errorType)) {
      this.recoveryActions.set(errorType, []);
    }
    this.recoveryActions.get(errorType)!.push(action);
  }

  // Execute recovery actions for an error
  async executeRecovery(error: Error, errorType: string): Promise<void> {
    const actions = this.recoveryActions.get(errorType) || [];

    if (actions.length === 0) {
      console.warn(`No recovery actions registered for error type: ${errorType}`);
      return;
    }

    // Sort by priority (high -> medium -> low)
    const sortedActions = actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log(`Executing ${sortedActions.length} recovery actions for ${errorType}`);

    for (const action of sortedActions) {
      try {
        console.log(`Executing recovery action: ${action.description}`);
        await action.action();
        console.log(`Recovery action completed: ${action.description}`);
      } catch (recoveryError) {
        console.error(`Recovery action failed: ${action.description}`, recoveryError);
      }
    }
  }

  // File system operation with retry
  async retryFileOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    return ErrorRecoveryService.withRetry(
      operation,
      {
        ...options,
        retryCondition: (error) => {
          return error.message.includes('EACCES') ||
                 error.message.includes('EBUSY') ||
                 error.message.includes('EMFILE') ||
                 error.message.includes('ENOSPC') ||
                 error.message.includes('network');
        }
      },
      operationName
    );
  }

  // Network operation with retry
  async retryNetworkOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    return ErrorRecoveryService.withRetry(
      operation,
      {
        ...options,
        retryCondition: (error) => {
          return error.message.includes('network') ||
                 error.message.includes('timeout') ||
                 error.message.includes('ECONNRESET') ||
                 error.message.includes('ENOTFOUND') ||
                 error.message.includes('ECONNREFUSED');
        }
      },
      operationName
    );
  }

  // AI service operation with retry
  async retryAIService<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    return ErrorRecoveryService.withRetry(
      operation,
      {
        ...options,
        maxRetries: 2, // AI services might have rate limits
        baseDelay: 2000,
        retryCondition: (error) => {
          return error.message.includes('rate limit') ||
                 error.message.includes('timeout') ||
                 error.message.includes('network') ||
                 error.message.includes('500') ||
                 error.message.includes('502') ||
                 error.message.includes('503') ||
                 error.message.includes('504');
        }
      },
      operationName
    );
  }

  // WebContainer operation with retry
  async retryWebContainer<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    return ErrorRecoveryService.withRetry(
      operation,
      {
        ...options,
        retryCondition: (error) => {
          return error.message.includes('WebContainer') ||
                 error.message.includes('timeout') ||
                 error.message.includes('connection') ||
                 error.message.includes('process');
        }
      },
      operationName
    );
  }

  // Cleanup timeouts
  cleanup(): void {
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();
  }
}

// Pre-configured recovery actions
export const createDefaultRecoveryActions = (errorRecovery: ErrorRecoveryService) => {
  // File system errors
  errorRecovery.registerRecoveryAction('filesystem', {
    id: 'clear-temp-files',
    description: 'Clear temporary files that might be causing conflicts',
    action: async () => {
      // Implementation would clear temp files
      console.log('Clearing temporary files...');
    },
    priority: 'medium'
  });

  // Network errors
  errorRecovery.registerRecoveryAction('network', {
    id: 'check-connection',
    description: 'Verify network connectivity',
    action: async () => {
      // Implementation would check network status
      console.log('Checking network connectivity...');
    },
    priority: 'high'
  });

  // WebContainer errors
  errorRecovery.registerRecoveryAction('webcontainer', {
    id: 'restart-container',
    description: 'Restart WebContainer instance',
    action: async () => {
      // Implementation would restart WebContainer
      console.log('Restarting WebContainer...');
    },
    priority: 'high'
  });

  // AI service errors
  errorRecovery.registerRecoveryAction('ai-service', {
    id: 'switch-provider',
    description: 'Switch to alternative AI provider if available',
    action: async () => {
      // Implementation would switch AI providers
      console.log('Switching AI provider...');
    },
    priority: 'medium'
  });
};

// Singleton instance
export const errorRecoveryService = new ErrorRecoveryService();
createDefaultRecoveryActions(errorRecoveryService);