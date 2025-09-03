/**
 * CARTA backend process management
 */

const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/Logger');

class BackendManager {
  /**
   * Start the CARTA backend process
   * @param {object} options - Backend startup options
   * @param {string} options.cartaAuthToken - Authentication token
   * @param {string} options.baseDirectory - Base directory for file browser
   * @param {number} options.backendPort - Port for backend server
   * @param {string} options.extraArgs - Additional command line arguments
   * @param {string} options.dirname - Directory containing the application
   * @returns {ChildProcess} The backend process
   */
  static startBackend(options) {
    const { cartaAuthToken, baseDirectory, backendPort, extraArgs, dirname } = options;
    const PathUtils = require('../utils/PathUtils');
    // const { app } = require('electron');

    const runShPath = require('../config/paths').getRunShPath(dirname);

    const wslRunShPath = PathUtils.toWslPath(runShPath);
    const wslBaseDirectory = PathUtils.toWslPath(baseDirectory);
    
    const command = `wsl.exe ${wslRunShPath} ${cartaAuthToken} ${wslBaseDirectory} ${backendPort} ${extraArgs}`;
    
    logger.info('Starting backend with command', { command });
    const run = exec(command);

    // Set up standard output logging
    if (run.stdout && typeof run.stdout.on === 'function') {
      run.stdout.on('data', (data) => {
        logger.info(`${data}`);
      });
    }

    return run;
  }

  /**
   * Handle backend process errors
   * @param {Error} error - The error that occurred
   * @param {BrowserWindow} window - The associated window
   */
  static handleBackendError(error, window) {
    logger.error('Backend execution error', { error: error.message, stack: error.stack });

    const WSLDialogs = require('../dialogs/WSLDialogs');
    WSLDialogs.showExecutionError(error);

    if (window && !window.isDestroyed()) {
      window.close();
    }
  }

  /**
   * Terminate a backend process
   * @param {ChildProcess} process - The process to terminate
   * @returns {Promise<void>} Promise that resolves when process is terminated
   */
  static async terminateProcess(process) {
    if (!process) return;

    const { SIGNALS, PROCESS_CLEANUP_DELAY } = require('../config/constants');

    return new Promise((resolve) => {
      let isResolved = false;

      const cleanup = () => {
        if (!isResolved) {
          isResolved = true;
          logger.info('Backend process terminated');
          resolve();
        }
      };

      try {
        logger.info('Terminating backend process...');

        // Listen for process exit
        process.once('exit', cleanup);
        process.once('close', cleanup);

        // For WSL processes, we need to kill the process tree
        // First try graceful termination
        if (!process.killed) {
          process.kill(SIGNALS.SIGTERM);
        }

        // Wait a bit and force kill if still running
        setTimeout(() => {
          if (process && !process.killed) {
            try {
              process.kill(SIGNALS.SIGKILL);
            } catch (e) {
              logger.error('Force kill failed', { error: e.message, stack: e.stack });
            }
          }
          // Ensure cleanup is called even if process events don't fire
          const { PROCESS_FORCE_KILL_DELAY } = require('../config/constants');
          setTimeout(cleanup, PROCESS_FORCE_KILL_DELAY);
        }, PROCESS_CLEANUP_DELAY);

        // Fallback timeout to prevent hanging
        const { PROCESS_FALLBACK_TIMEOUT } = require('../config/constants');
        setTimeout(cleanup, PROCESS_FALLBACK_TIMEOUT);
      } catch (err) {
        logger.error('Error stopping backend process', { error: err.message, stack: err.stack });
        cleanup();
      }
    });
  }

  /**
   * Generate the URL for connecting to the backend
   * @param {object} options - URL generation options
   * @param {number} options.backendPort - Backend port
   * @param {string} options.cartaAuthToken - Authentication token
   * @param {string} options.inputPath - Input file path (optional)
   * @param {number} options.fileMode - File mode (optional)
   * @returns {string} The backend URL
   */
  static generateBackendUrl(options) {
    const { backendPort, cartaAuthToken, inputPath = '', fileMode } = options;
    const { FILE_MODES } = require('../config/constants');
    const PathUtils = require('../utils/PathUtils');

    if (inputPath === '') {
      return `http://localhost:${backendPort}/?token=${encodeURIComponent(cartaAuthToken)}`;
    } else {
      if (fileMode === FILE_MODES.FILE) {
        const inputFile = PathUtils.toWslPath(inputPath);
        return `http://localhost:${backendPort}/?token=${encodeURIComponent(cartaAuthToken)}&file=${encodeURIComponent(inputFile)}`;
      } else if (fileMode === FILE_MODES.DIRECTORY) {
        return `http://localhost:${backendPort}/?token=${encodeURIComponent(cartaAuthToken)}`;
      }
    }
  }
}

module.exports = BackendManager;
