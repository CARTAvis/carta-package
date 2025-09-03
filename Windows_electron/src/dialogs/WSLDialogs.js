/**
 * WSL-related dialog boxes and user interactions
 */

const { dialog, shell, nativeImage, app } = require('electron');
const path = require('path');

class WSLDialogs {
  /**
   * Show WSL installation dialog
   */
  static showInstallationDialog() {
    const iconPath = require('../config/paths').getIconPath(__dirname);
    const iconImg =
      nativeImage && nativeImage.createFromPath
        ? nativeImage.createFromPath(iconPath)
        : undefined;

    const { URLS } = require('../config/constants');

    const options = {
      type: 'warning',
      buttons: ['📥 Install WSL', '📖 Quick Guide', 'Close'],
      defaultId: 0,
      cancelId: 2,
      title: 'CARTA setup — WSL required',
      message: 'CARTA needs Windows Subsystem for Linux (WSL) to run on Windows.',
      detail: `Why WSL?
Run CARTA's Linux-based backend seamlessly on Windows.

How to install:
• Click "Install WSL" to open the official guide
• Or in PowerShell window run:
  wsl --install

After installation:
1) Restart your computer
2) Launch CARTA again

This is a one-time setup.`,
      icon: iconImg,
      noLink: true,
    };

    dialog
      .showMessageBox(null, options)
      .then(({ response }) => {
        if (response === 0) {
          // Open WSL installation guide
          shell.openExternal(URLS.WSL_INSTALL_GUIDE);
        } else if (response === 1) {
          // Open detailed WSL documentation
          shell.openExternal(URLS.WSL_DOCUMENTATION);
        }
      })
      .finally(() => {
        app.quit();
      });
  }

  /**
   * Show WSL configuration error dialog
   */
  static showConfigurationError() {
    const { URLS } = require('../config/constants');
    
    dialog.showErrorBox(
      '🔧 WSL Configuration Issue',
      `🚨 WSL appears to be unavailable or disabled.

🔹 Please verify WSL installation:
  1. Open PowerShell as Administrator
  2. Run: wsl --version
  3. If error occurs, run: wsl --install
  4. Restart your computer
  5. Try launching CARTA again

💡 Need help? Visit: ${URLS.WSL_TROUBLESHOOTING}`
    );
  }

  /**
   * Show backend startup failure dialog
   */
  static showBackendStartupError() {
    dialog.showErrorBox(
      '🚨 CARTA Backend Startup Failed',
      `❌ CARTA backend could not be started.

🔹 Possible causes:
  • WSL not properly installed or configured
  • CARTA backend files missing or corrupted
  • Network port already in use
  • Insufficient system resources

🔹 Solutions to try:
  1. Verify WSL is working: wsl --version
  2. Restart the application
  3. Check Windows Firewall settings
  4. Close other applications using network ports

💡 For detailed troubleshooting, visit the CARTA documentation.`
    );
  }

  /**
   * Show WSL execution error dialog
   * @param {Error} error - The error that occurred
   */
  static showExecutionError(error) {
    const { URLS } = require('../config/constants');
    
    if (error.message.includes('wsl') || error.code === 'ENOENT') {
      dialog.showErrorBox(
        '🔧 WSL Execution Error',
        `🚨 Failed to execute WSL command.

🔹 Common causes:
  • WSL not installed (run "wsl --install")
  • WSL service not running
  • No WSL distribution installed
  • Windows features not enabled

🔹 Quick fixes:
  1. Open PowerShell as Administrator
  2. Run: wsl --install
  3. Restart your computer
  4. Launch CARTA again

💡 Documentation: ${URLS.WSL_INSTALL_GUIDE}`
      );
    } else {
      dialog.showErrorBox(
        '⚠️ Backend Execution Error',
        `🚨 CARTA backend encountered an execution error.

Error details: ${error.message}

🔹 Please try:
  • Restarting the application
  • Checking system resources
  • Contacting support if the issue persists`
      );
    }
  }
}

module.exports = WSLDialogs;
