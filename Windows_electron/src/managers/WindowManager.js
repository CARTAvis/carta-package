/**
 * Window creation and management
 */

const { BrowserWindow } = require('electron');
const WindowStateManager = require('electron-window-state');
const path = require('path');
const { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } = require('../config/constants');
const logger = require('../utils/Logger');

class WindowManager {
  constructor() {
    this.windows = new Set();
    this.mainWindowState = WindowStateManager({
      defaultWidth: DEFAULT_WINDOW_WIDTH,
      defaultHeight: DEFAULT_WINDOW_HEIGHT,
    });
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
    });

    // Add window to tracking set
    this.windows.add(newWindow);

    // Set up window event handlers
    this._setupWindowEventHandlers(newWindow);

    return newWindow;
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
   * Clean up backend process for a window
   * @private
   * @param {BrowserWindow} window - The window whose backend should be cleaned up
   */
  async _cleanupBackendProcess(window) {
    if (window.backendProcess) {
      const BackendManager = require('./BackendManager');
      await BackendManager.terminateProcess(window.backendProcess);
    }

    // Now actually destroy the window
    window.destroy();
  }

  /**
   * Close all windows and clean up
   */
  async closeAllWindows() {
    logger.info('Closing all windows and cleaning up backend processes...');

    const WSLManager = require('./WSLManager');
    await WSLManager.killBackendProcesses();

    // Close all windows
    for (const window of this.windows) {
      if (window && !window.isDestroyed()) {
        await this._cleanupBackendProcess(window);
      }
    }

    this.windows.clear();
  }

  /**
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
