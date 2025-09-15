import { useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { errorRecoveryService, RetryOptions } from '../services/errorRecoveryService';

export const useErrorRecovery = () => {
  const { addNotification } = useNotifications();

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>,
    showNotifications: boolean = true
  ): Promise<T> => {
    try {
      if (showNotifications) {
        addNotification({
          type: 'info',
          message: `Starting ${operationName}...`
        });
      }

      const result = await errorRecoveryService.retryFileOperation(
        operation,
        operationName,
        options
      );

      if (showNotifications) {
        addNotification({
          type: 'success',
          message: `${operationName} completed successfully`
        });
      }

      return result;
    } catch (error) {
      console.error(`${operationName} failed:`, error);

      if (showNotifications) {
        addNotification({
          type: 'error',
          message: `${operationName} failed: ${(error as Error).message}`
        });
      }

      throw error;
    }
  }, [addNotification]);

  const executeNetworkWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>,
    showNotifications: boolean = true
  ): Promise<T> => {
    try {
      const result = await errorRecoveryService.retryNetworkOperation(
        operation,
        operationName,
        options
      );

      if (showNotifications) {
        addNotification({
          type: 'success',
          message: `${operationName} completed`
        });
      }

      return result;
    } catch (error) {
      console.error(`${operationName} network operation failed:`, error);

      if (showNotifications) {
        addNotification({
          type: 'error',
          message: `${operationName} failed: ${(error as Error).message}`
        });
      }

      throw error;
    }
  }, [addNotification]);

  const executeAIWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>,
    showNotifications: boolean = false
  ): Promise<T> => {
    try {
      const result = await errorRecoveryService.retryAIService(
        operation,
        operationName,
        options
      );

      return result;
    } catch (error) {
      console.error(`${operationName} AI operation failed:`, error);

      if (showNotifications) {
        addNotification({
          type: 'error',
          message: `AI operation failed: ${(error as Error).message}`
        });
      }

      throw error;
    }
  }, [addNotification]);

  const executeWebContainerWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: Partial<RetryOptions>,
    showNotifications: boolean = true
  ): Promise<T> => {
    try {
      const result = await errorRecoveryService.retryWebContainer(
        operation,
        operationName,
        options
      );

      if (showNotifications) {
        addNotification({
          type: 'success',
          message: `${operationName} completed`
        });
      }

      return result;
    } catch (error) {
      console.error(`${operationName} WebContainer operation failed:`, error);

      // Try recovery actions
      try {
        await errorRecoveryService.executeRecovery(error as Error, 'webcontainer');
      } catch (recoveryError) {
        console.error('Recovery actions failed:', recoveryError);
      }

      if (showNotifications) {
        addNotification({
          type: 'error',
          message: `${operationName} failed: ${(error as Error).message}`
        });
      }

      throw error;
    }
  }, [addNotification]);

  const handleErrorWithRecovery = useCallback(async (
    error: Error,
    errorType: string,
    context?: string
  ) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    addNotification({
      type: 'error',
      message: `${context || 'Operation'} failed: ${error.message}`
    });

    // Execute recovery actions
    try {
      await errorRecoveryService.executeRecovery(error, errorType);
      addNotification({
        type: 'info',
        message: 'Attempted automatic recovery'
      });
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      addNotification({
        type: 'warning',
        message: 'Automatic recovery failed'
      });
    }
  }, [addNotification]);

  return {
    executeWithRetry,
    executeNetworkWithRetry,
    executeAIWithRetry,
    executeWebContainerWithRetry,
    handleErrorWithRecovery
  };
};