/**
 * Network utility functions for port management and connection checking
 */

const net = require('net');
const getPort = require('get-port');
const { DEFAULT_START_PORT } = require('../config/constants');
const logger = require('./Logger');

class NetworkUtils {
  /**
   * Find an available port starting from a given port number
   * @param {number} startPort - Starting port number
   * @returns {Promise<number>} Available port number
   * @throws {Error} If no available ports found
   */
  static async findAvailablePort(startPort = DEFAULT_START_PORT) {
    const { MAX_PORT, ERROR_MESSAGES } = require('../config/constants');

    if (startPort >= MAX_PORT) {
      throw new Error(ERROR_MESSAGES.NO_AVAILABLE_PORTS);
    }

    try {
      const portRange = getPort.makeRange(startPort, MAX_PORT);
      const port = await getPort({ port: portRange, host: '127.0.0.1' });

      logger.info('Selected available port', { port });
      return port;
    } catch (error) {
      const message = error && error.message ? error.message : String(error);

      if (message.includes('No available ports')) {
        throw new Error(ERROR_MESSAGES.NO_AVAILABLE_PORTS);
      }

      logger.error('Failed to acquire backend port', {
        startPort,
        maxPort: MAX_PORT,
        error: message,
      });

      throw error;
    }
  }

  /**
   * Check if backend is ready by attempting to connect to the port
   * @param {number} port - Port to check
   * @param {function} callback - Callback function with isReady boolean
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} currentRetry - Current retry count
   * @param {object} window - Electron window for progress updates
   */
  static checkBackendReady(port, callback, maxRetries = null, currentRetry = 0, window = null) {
    const { BACKEND_TIMEOUT, BACKEND_RETRY_INTERVAL, MAX_BACKEND_RETRIES } = require('../config/constants');
    // Use the constant if maxRetries is not provided
    maxRetries = maxRetries || MAX_BACKEND_RETRIES;
    const client = new net.Socket();

    client.setTimeout(BACKEND_TIMEOUT);

    client.on('connect', () => {
      logger.info(`Backend is ready on port ${port}`);

      if (window && window.webContents) {
        window.webContents
          .executeJavaScript(
            `
              (() => {
                const loadingText = document.querySelector('.loading-text');
                if (loadingText) {
                  loadingText.textContent = 'Backend ready. Loading CARTA UI.';
                }
              })();
            `
          )
          .catch(() => {});
      }

      if (window && window.retryTimeouts && window.retryTimeouts.length > 0) {
        window.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
        window.retryTimeouts = [];
      }

      client.destroy();
      callback(true);
    });

    client.on('timeout', () => {
      client.destroy();
      NetworkUtils._retryConnection(port, callback, maxRetries, currentRetry, window);
    });

    client.on('error', () => {
      NetworkUtils._retryConnection(port, callback, maxRetries, currentRetry, window);
    });

    client.connect(port, 'localhost');
  }

  /**
   * Private method to handle connection retries
   * @private
   */
  static _retryConnection(port, callback, maxRetries, currentRetry, window) {
    const { BACKEND_RETRY_INTERVAL, ERROR_MESSAGES } = require('../config/constants');

    if (currentRetry < maxRetries) {
      logger.info(
        `Backend not ready yet, retrying... (${currentRetry + 1}/${maxRetries})`
      );

      // Update the loading page with progress
      if (window && window.webContents) {
        window.webContents
          .executeJavaScript(
            `
              (() => {
                const loadingText = document.querySelector('.loading-text');
                if (loadingText) {
                  loadingText.textContent = 'Starting CARTA backend... (${currentRetry + 1}/${maxRetries})';
                }
              })();
            `
          )
          .catch(() => {}); // Ignore errors if page hasn't loaded yet
      }

      // Store timeout ID so it can be cleared if needed
      const retryTimeout = setTimeout(() => {
        NetworkUtils.checkBackendReady(port, callback, maxRetries, currentRetry + 1, window);
      }, BACKEND_RETRY_INTERVAL);

      // Store timeout reference on the window for cleanup
      if (window && !window.isDestroyed()) {
        if (!window.retryTimeouts) {
          window.retryTimeouts = [];
        }
        window.retryTimeouts.push(retryTimeout);
      }
    } else {
      logger.error(ERROR_MESSAGES.BACKEND_STARTUP_FAILED);
      
      if (window && window.webContents) {
        window.webContents
          .executeJavaScript(
            `
              (() => {
                const loadingText = document.querySelector('.loading-text');
                if (loadingText) {
                  loadingText.textContent = 'Backend startup failed';
                }
                const subText = document.querySelector('.sub-text');
                if (subText) {
                  subText.textContent = 'Please check WSL configuration or restart the application';
                }
              })();
            `
          )
          .catch(() => {});
      }

      // Check if WSL is still available when backend fails
      const WSLManager = require('../managers/WSLManager');
      WSLManager.checkAvailability().then((wslAvailable) => {
        if (!wslAvailable) {
          const WSLDialogs = require('../dialogs/WSLDialogs');
          setTimeout(() => {
            WSLDialogs.showConfigurationError();
            callback(false);
          }, 1000);
        } else {
          const { ERROR_MESSAGES } = require('../config/constants');
          logger.error(ERROR_MESSAGES.BACKEND_CONNECTION_FAILED);
          setTimeout(() => callback(false), 3000); // Show error for 3 seconds
        }
      });
    }
  }
}

module.exports = NetworkUtils;





