/**
 * Network utility functions for port management and connection checking
 */

const net = require('net');
const { DEFAULT_START_PORT } = require('../config/constants');
const logger = require('./Logger');

class NetworkUtils {
  /**
   * Find an available port starting from a given port number
   * @param {number} startPort - Starting port number
   * @returns {Promise<number>} Available port number
   * @throws {Error} If no available ports found
   */
  static findAvailablePort(startPort = DEFAULT_START_PORT) {
    const { MAX_PORT, ERROR_MESSAGES } = require('../config/constants');
    let port = startPort;
    
    return new Promise((resolve, reject) => {
      const tryPort = (currentPort) => {
        if (currentPort >= MAX_PORT) {
          reject(new Error(ERROR_MESSAGES.NO_AVAILABLE_PORTS));
          return;
        }
        
        const server = net.createServer();
        server.unref();
        
        server.on('error', () => {
          server.close();
          tryPort(currentPort + 1);
        });
        
        server.listen(currentPort, 'localhost', () => {
          const actualPort = server.address().port;
          server.close(() => {
            resolve(actualPort);
          });
        });
      };
      
      tryPort(port);
    });
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
            document.querySelector('.loading-text').textContent = 'Starting CARTA backend... (${currentRetry + 1}/${maxRetries})';
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
            document.querySelector('.loading-text').textContent = 'Backend startup failed';
            document.querySelector('.sub-text').textContent = 'Please check WSL configuration or restart the application';
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
