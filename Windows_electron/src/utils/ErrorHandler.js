/**
 * Centralized error handling and recovery utilities
 */

const logger = require('./Logger');
const { dialog } = require('electron');

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.maxRetryAttempts = 3;
    this.recoveryStrategies = new Map();
    
    // Setup default recovery strategies
    this._setupRecoveryStrategies();
  }

  /**
   * Setup default recovery strategies for common error types
   * @private
   */
  _setupRecoveryStrategies() {
    this.recoveryStrategies.set('WSL_NOT_AVAILABLE', {
      canRecover: true,
      strategy: this._recoverWSL.bind(this),
      userMessage: 'WSL is not available. Would you like to try installing it?'
    });

    this.recoveryStrategies.set('BACKEND_START_FAILED', {
      canRecover: true,
      strategy: this._recoverBackend.bind(this),
      userMessage: 'Backend failed to start. Would you like to try restarting it?'
    });

    this.recoveryStrategies.set('PORT_UNAVAILABLE', {
      canRecover: true,
      strategy: this._recoverPort.bind(this),
      userMessage: 'Default port is unavailable. Trying alternative ports...'
    });

    this.recoveryStrategies.set('FILE_NOT_FOUND', {
      canRecover: false,
      strategy: null,
      userMessage: 'Required files are missing. Please check your installation.'
    });
  }

  /**
   * Handle an error with potential recovery
   * @param {Error} error - The error to handle
   * @param {string} context - Context where the error occurred
   * @param {object} options - Additional options
   */
  async handleError(error, context, options = {}) {
    const errorKey = `${context}:${error.code || error.message}`;
    const errorCount = this.errorCounts.get(errorKey) || 0;
    
    logger.error(`Error in ${context}`, {
      error: error.message,
      stack: error.stack,
      count: errorCount + 1,
      options
    });

    this.errorCounts.set(errorKey, errorCount + 1);

    // Check if we should attempt recovery
    if (errorCount < this.maxRetryAttempts) {
      const recovery = this._getRecoveryStrategy(error);
      
      if (recovery && recovery.canRecover) {
        logger.info(`Attempting recovery for ${context}`, { strategy: recovery.constructor.name });
        
        try {
          const recovered = await recovery.strategy(error, context, options);
          if (recovered) {
            logger.info(`Successfully recovered from error in ${context}`);
            this.errorCounts.delete(errorKey); // Reset count on successful recovery
            return { recovered: true };
          }
        } catch (recoveryError) {
          logger.error(`Recovery failed for ${context}`, { 
            originalError: error.message,
            recoveryError: recoveryError.message 
          });
        }
      }
    }

    // If recovery failed or not available, handle as unrecoverable
    return this._handleUnrecoverableError(error, context, options);
  }

  /**
   * Get recovery strategy for an error
   * @private
   */
  _getRecoveryStrategy(error) {
    // Try to match error by code or message patterns
    for (const [pattern, strategy] of this.recoveryStrategies.entries()) {
      if (error.code === pattern || 
          error.message.includes(pattern) ||
          error.name === pattern) {
        return strategy;
      }
    }
    return null;
  }

  /**
   * WSL recovery strategy
   * @private
   */
  async _recoverWSL(error, context, options) {
    logger.info('Attempting WSL recovery');
    
    // Check if WSL is actually available but just slow
    const WSLManager = require('../managers/WSLManager');
    
    // Give WSL more time to respond
    try {
      const wslAvailable = await this._checkWSLWithExtendedTimeout();
      if (wslAvailable) {
        logger.info('WSL is available after extended check');
        return true;
      }
    } catch (checkError) {
      logger.warn('Extended WSL check failed', { error: checkError.message });
    }

    // If still not available, show user guidance
    const WSLDialogs = require('../dialogs/WSLDialogs');
    WSLDialogs.showInstallationDialog();
    return false;
  }

  /**
   * Backend recovery strategy
   * @private
   */
  async _recoverBackend(error, context, options) {
    logger.info('Attempting backend recovery');
    
    const BackendManager = require('../managers/BackendManager');
    
    // Kill any existing processes first
    try {
      const WSLManager = require('../managers/WSLManager');
      const collectedProcesses = new Set();

      if (options.backendProcess) {
        collectedProcesses.add(options.backendProcess);
      }

      if (Array.isArray(options.backendProcesses)) {
        for (const process of options.backendProcesses) {
          if (process) {
            collectedProcesses.add(process);
          }
        }
      }

      if (options.cleanupBackends && typeof options.cleanupBackends === 'function') {
        await options.cleanupBackends();
      } else {
        await WSLManager.killBackendProcesses(Array.from(collectedProcesses), {
          forceGlobalKill: options.forceGlobalKill === true,
        });
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true; // Signal that cleanup was successful, caller can retry
    } catch (cleanupError) {
      logger.error('Backend cleanup failed during recovery', { 
        error: cleanupError.message 
      });
      return false;
    }
  }

  /**
   * Port recovery strategy
   * @private
   */
  async _recoverPort(error, context, options) {
    logger.info('Attempting port recovery');
    
    const NetworkUtils = require('./NetworkUtils');
    
    // Try to find an alternative port
    try {
      const config = require('../config/Config');
      const startPort = config.get('defaultStartPort') + 100; // Try ports 100 higher
      const alternativePort = await NetworkUtils.findAvailablePort(startPort);
      
      logger.info(`Found alternative port: ${alternativePort}`);
      
      if (options.setPort && typeof options.setPort === 'function') {
        options.setPort(alternativePort);
      }
      
      return true;
    } catch (portError) {
      logger.error('Failed to find alternative port', { error: portError.message });
      return false;
    }
  }

  /**
   * Check WSL with extended timeout
   * @private
   */
  _checkWSLWithExtendedTimeout() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      
      // Use a longer timeout for WSL check
      exec('wsl.exe --version', { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          logger.debug('Extended WSL check failed', { error: error.message });
          resolve(false);
        } else {
          logger.debug('Extended WSL check succeeded');
          resolve(true);
        }
      });
    });
  }

  /**
   * Handle unrecoverable errors
   * @private
   */
  async _handleUnrecoverableError(error, context, options) {
    logger.error(`Unrecoverable error in ${context}`, {
      error: error.message,
      stack: error.stack
    });

    // Show user-friendly error dialog
    if (options.showDialog !== false) {
      const recovery = this._getRecoveryStrategy(error);
      const message = recovery ? recovery.userMessage : 
        `An error occurred in ${context}: ${error.message}`;

      try {
        await dialog.showErrorBox('CARTA Error', message);
      } catch (dialogError) {
        logger.error('Failed to show error dialog', { error: dialogError.message });
      }
    }

    return { 
      recovered: false, 
      error: error.message,
      context,
      shouldExit: options.shouldExit !== false
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {};
    for (const [key, count] of this.errorCounts.entries()) {
      stats[key] = count;
    }
    return stats;
  }

  /**
   * Clear error counts (useful for testing or manual reset)
   */
  clearErrorCounts() {
    this.errorCounts.clear();
    logger.info('Error counts cleared');
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(errorPattern, strategy) {
    this.recoveryStrategies.set(errorPattern, strategy);
    logger.debug(`Added recovery strategy for ${errorPattern}`);
  }

  /**
   * Create a safe wrapper for async functions with error handling
   */
  wrapAsync(fn, context) {
    return async (...args) => {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        const result = await this.handleError(error, context);
        if (result.shouldExit) {
          process.exit(1);
        }
        throw error;
      }
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler;