/**
 * Window creation and management
 */

const { BrowserWindow, shell } = require('electron');
const WindowStateManager = require('electron-window-state');
const { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } = require('../config/constants');
const logger = require('../utils/Logger');

class WindowManager {
  constructor() {
    this.windows = new Set();
    this.backendProcesses = new Set();
    this.mainWindowState = WindowStateManager({
      defaultWidth: DEFAULT_WINDOW_WIDTH,
      defaultHeight: DEFAULT_WINDOW_HEIGHT,
    });
    this.cspConfigured = false;
  }

  /**
   * Create a new CARTA window
   * @param {object} options - Window creation options
   * @returns {BrowserWindow} The created window
   */
  createWindow(options = {}) {
    const { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT, WINDOW_OFFSET } = require('../config/constants');
    
    let x, y;
    x = this.mainWindowState.x;
    y = this.mainWindowState.y;

    const currentWindow = BrowserWindow.getFocusedWindow();

    if (currentWindow) {
      const [currentWindowX, currentWindowY] = currentWindow.getPosition();
      x = currentWindowX + WINDOW_OFFSET;
      y = currentWindowY + WINDOW_OFFSET;
    }

    const newWindow = new BrowserWindow({
      width: this.mainWindowState.width || DEFAULT_WINDOW_WIDTH,
      height: this.mainWindowState.height || DEFAULT_WINDOW_HEIGHT,
      x: x,
      y: y,
      show: false,
      icon: require('../config/paths').getIconPath(__dirname),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Add window to tracking set
    this.windows.add(newWindow);

    // Set up window event handlers
    this._setupWindowEventHandlers(newWindow);
    this._applyContentSecurityPolicy(newWindow.webContents.session);
    this._hardenNavigation(newWindow);

    return newWindow;
  }

  /**
   * Associate a backend process with a window so it can be managed centrally.
   * @param {BrowserWindow} window - The window instance to associate with the backend.
   * @param {ChildProcess} backendProcess - The backend process to track.
   */
  registerBackendProcess(window, backendProcess) {
    if (!window || !backendProcess) {
      return;
    }

    if (window.backendProcess && window.backendProcess !== backendProcess) {
      this.backendProcesses.delete(window.backendProcess);
    }

    window.backendProcess = backendProcess;
    this.backendProcesses.add(backendProcess);

    const cleanupProcessReference = () => {
      this.backendProcesses.delete(backendProcess);
      if (window.backendProcess === backendProcess) {
        window.backendProcess = null;
      }
    };

    if (typeof backendProcess.once === 'function') {
      backendProcess.once('exit', cleanupProcessReference);
      backendProcess.once('close', cleanupProcessReference);
    }
  }

  /**
   * Set up event handlers for a window
   * @private
   * @param {BrowserWindow} window - The window to set up handlers for
   */
  _setupWindowEventHandlers(window) {
    window.once('ready-to-show', () => {
      window.show();
    });

    window.on('close', (event) => {
      this._handleWindowClose(event, window);
    });
  }

  /**
   * Handle window close event
   * @private
   * @param {Event} event - The close event
   * @param {BrowserWindow} window - The window being closed
   */
  _handleWindowClose(event, window) {
    // Prevent the window from closing immediately to handle cleanup
    event.preventDefault();

    logger.info('Window closing...');

    // Hide the window immediately to prevent showing connection errors
    window.hide();

    // Remove from windows set immediately
    this.windows.delete(window);

    // Clear any pending retry timeouts
    if (window.retryTimeouts) {
      window.retryTimeouts.forEach(timeout => {
        clearTimeout(timeout);
      });
      window.retryTimeouts = [];
    }

    // Handle backend process cleanup
    this._cleanupBackendProcess(window);
  }

  /**
   * Apply a strict Content Security Policy to all renderer responses
   * @private
   * @param {Session} session - Browser session to secure
   */
  _applyContentSecurityPolicy(session) {
    if (this.cspConfigured || !session || typeof session.webRequest?.onHeadersReceived !== 'function') {
      return;
    }

    session.webRequest.onHeadersReceived(
      { urls: ['http://localhost:*/*', 'https://localhost:*/*', 'http://127.0.0.1:*/*', 'https://127.0.0.1:*/*'] },
      (details, callback) => {
        const responseHeaders = details.responseHeaders || {};
        const existingHeaderKey = Object.keys(responseHeaders).find(
          (key) => key.toLowerCase() === 'content-security-policy'
        );

        if (existingHeaderKey) {
          delete responseHeaders[existingHeaderKey];
        }

        responseHeaders['Content-Security-Policy'] = [
          "default-src 'self' https:; script-src 'self' 'unsafe-eval' https: blob:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https: wss:; worker-src 'self' blob:; media-src 'self' blob: https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
        ];

        callback({ responseHeaders });
      }
    );

    this.cspConfigured = true;
  }

  /**
   * Restrict navigation and external link handling for a window
   * @private
   * @param {BrowserWindow} window - The window to secure
   */
  _hardenNavigation(window) {
    if (!window || !window.webContents) {
      return;
    }

    window.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    window.webContents.on('will-navigate', (event, url) => {
      if (
        url.startsWith('http://localhost:') ||
        url.startsWith('https://localhost:') ||
        url.startsWith('http://127.0.0.1:') ||
        url.startsWith('https://127.0.0.1:')
      ) {
        return;
      }

      event.preventDefault();
      shell.openExternal(url);
    });
  }

  /**
   * Clean up backend process for a window
   * @private
   * @param {BrowserWindow} window - The window whose backend should be cleaned up
   */
  async _cleanupBackendProcess(window) {
    const backendProcess = window.backendProcess;

    if (backendProcess) {
      const BackendManager = require('./BackendManager');
      this.backendProcesses.delete(backendProcess);
      window.backendProcess = null;
      await BackendManager.terminateProcess(backendProcess);
    }

    // Now actually destroy the window
    window.destroy();
  }

  /**
   * Close all windows and clean up
   */
  async closeAllWindows() {
    logger.info('Closing all windows and cleaning up backend processes...');

    for (const window of Array.from(this.windows)) {
      if (window && !window.isDestroyed()) {
        await this._cleanupBackendProcess(window);
      }
      this.windows.delete(window);
    }

    await this.terminateAllBackendProcesses();
    this.windows.clear();
  }

  /**
   * Terminate any remaining backend processes that are still tracked.
   */
  async terminateAllBackendProcesses() {
    if (this.backendProcesses.size === 0) {
      return;
    }

    const BackendManager = require('./BackendManager');
    const processes = Array.from(this.backendProcesses);

    for (const process of processes) {
      try {
        await BackendManager.terminateProcess(process);
      } catch (error) {
        logger.error('Error terminating backend process during global cleanup', {
          error: error.message,
          stack: error.stack,
        });
      } finally {
        this.backendProcesses.delete(process);
      }
    }
  }

  /**  /**
   * Get all managed windows
   * @returns {Set<BrowserWindow>} Set of all windows
   */
  getAllWindows() {
    return this.windows;
  }

  /**
   * Get window count
   * @returns {number} Number of managed windows
   */
  getWindowCount() {
    return this.windows.size;
  }
}

module.exports = WindowManager;
