/**
 * WSL (Windows Subsystem for Linux) management utilities
 */

const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/Logger');

class WSLManager {
  /**
   * Check if WSL is installed and available
   * @returns {Promise<boolean>} Promise that resolves to WSL availability
   */
  static checkAvailability() {
    return new Promise((resolve) => {
      const { COMMANDS, WSL_CHECK_TIMEOUT } = require('../config/constants');

      // Try to execute a simple WSL command
      exec(
        COMMANDS.WSL_VERSION,
        { timeout: WSL_CHECK_TIMEOUT, encoding: 'utf8' },
        (error, stdout, stderr) => {
          if (error) {
            logger.error('WSL check failed', { error: error.message });
            resolve(false);
          } else {
            // Clean up the output and just show a simple confirmation
            logger.info('WSL is available and ready');
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Execute a command in WSL
   * @param {string} command - Command to execute in WSL
   * @param {object} options - Execution options
   * @returns {ChildProcess} Child process object
   */
  static executeCommand(command, options = {}) {
    const wslCommand = `wsl.exe ${command}`;
    return exec(wslCommand, options);
  }

  /**
   * Kill CARTA backend processes in WSL
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   */
  static async killBackendProcesses(processes = [], options = {}) {
    const trackedProcesses = Array.isArray(processes) ? processes.filter(Boolean) : [];

    if (trackedProcesses.length > 0) {
      const BackendManager = require('./BackendManager');

      for (const process of trackedProcesses) {
        try {
          await BackendManager.terminateProcess(process);
        } catch (error) {
          logger.error('Error terminating tracked backend process', {
            error: error.message,
            stack: error.stack,
          });
        }
      }

      return;
    }

    if (!options.forceGlobalKill) {
      logger.info('No backend processes supplied for cleanup; skipping global WSL termination.');
      return;
    }

    const { COMMANDS } = require('../config/constants');

    return new Promise((resolve) => {
      exec(COMMANDS.WSL_PKILL, (error) => {
        if (error) {
          logger.info('pkill failed, trying taskkill...');
          exec(COMMANDS.TASKKILL_WSL, (err) => {
            if (err) {
              logger.error('taskkill failed', { error: err.message });
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Handle WSL unavailable scenario with consistent error messaging
   * @private
   */
  static _handleWSLUnavailable() {
    const { ERROR_MESSAGES, URLS } = require('../config/constants');
    logger.error(`Error: ${ERROR_MESSAGES.WSL_NOT_AVAILABLE}`);
    logger.info(ERROR_MESSAGES.WSL_REQUIRED);
    logger.info('Please install WSL using: wsl --install');
    logger.info(`Or visit: ${URLS.WSL_INSTALL_GUIDE}`);
    process.exit(1);
  }

  /**
   * Show help information using WSL
   * @param {string} cartaPath - Path to CARTA binary
   */
  static showHelp(cartaPath) {
    const PathUtils = require('../utils/PathUtils');
    const PowerShellUtils = require('../utils/PowerShellUtils');
    const { app } = require('electron');
    
    // First check if the CARTA binary exists using PowerShell
    PowerShellUtils.checkFileExists(cartaPath).then((fileExists) => {
      if (!fileExists) {
        logger.error('CARTA binary not found', { path: cartaPath });
        logger.info('Please ensure the CARTA binary (AppRun) exists in carta/squashfs-root/.');
        process.exit(1);
        return;
      }

      // File exists, now check WSL availability
      this.checkAvailability().then((wslAvailable) => {
        if (!wslAvailable) {
          this._handleWSLUnavailable();
          return;
        }

        const wslPath = PathUtils.toWslPath(cartaPath);
        const run = exec(`wsl.exe ${wslPath} --help`);

        run.stdout.on('data', (data) => {
          logger.info(`${data}`);
          logger.info('Additional Electron version flag:');
          logger.info('      --inspect      Open the DevTools in the Electron window.');
        });

        run.on('error', (err) => {
          logger.error('Error showing help', { error: err.message, stack: err.stack });
        });

        run.on('exit', () => {
          process.exit();
        });
      });
      }).catch((err) => {
      logger.error('Error checking CARTA binary', { error: err.message, stack: err.stack });
      process.exit(1);
    });
  }

  /**
   * Show version information using WSL
   * @param {string} cartaPath - Path to CARTA binary
   */
  static showVersion(cartaPath) {
    const PathUtils = require('../utils/PathUtils');
    const PowerShellUtils = require('../utils/PowerShellUtils');
    const { app } = require('electron');
    
    // First check if the CARTA binary exists using PowerShell
    PowerShellUtils.checkFileExists(cartaPath).then((fileExists) => {
      if (!fileExists) {
        logger.error('CARTA binary not found', { path: cartaPath });
        logger.info('Please ensure the CARTA binary (AppRun) exists in carta/squashfs-root/.');
        process.exit(1);
        return;
      }

      // File exists, now check WSL availability
      this.checkAvailability().then((wslAvailable) => {
        if (!wslAvailable) {
          this._handleWSLUnavailable();
          return;
        }

        const wslPath = PathUtils.toWslPath(cartaPath);
        const run = exec(`wsl.exe ${wslPath} --version`);

        run.stdout.on('data', (data) => {
          logger.info(`${data}`);
        });

        run.on('error', (err) => {
          logger.error('Error showing version', { error: err.message, stack: err.stack });
        });

        run.on('exit', () => {
          process.exit();
        });
      });
      }).catch((err) => {
      logger.error('Error checking CARTA binary', { error: err.message, stack: err.stack });
      process.exit(1);
    });
  }
}

module.exports = WSLManager;
