const { app } = require('electron');
const path = require('path');
const os = require('os');

/**
 * Path configuration for packaged vs development environments
 */
class PathConfig {
  /**
   * Get the appropriate path for Carta binary
   * @param {string} dirname - The __dirname from the calling module
   * @returns {string} Resolved path to carta_appimage
   */
  static getCartaBinaryPath(dirname) {
    return (app && app.isPackaged)
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'carta', 'carta_appimage')
      : path.join(dirname, 'carta', 'carta_appimage');
  }

  /**
   * Get the appropriate path for run.sh script
   * @param {string} dirname - The __dirname from the calling module
   * @returns {string} Resolved path to run.sh
   */
  static getRunShPath(dirname) {
    return (app && app.isPackaged)
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'carta', 'run.sh')
      : path.join(dirname, 'carta', 'run.sh');
  }

  /**
   * Get the appropriate path for application icon
   * @param {string} dirname - The __dirname from the calling module
   * @returns {string} Resolved path to icon
   */
  static getIconPath(dirname) {
    return (app && app.isPackaged)
      ? path.join(process.resourcesPath, 'icon.ico')
      : path.join(dirname, 'icon.ico');
  }

  /**
   * Get the appropriate base resource path
   * @returns {string} Base resource path
   */
  static getResourcesPath() {
    return (app && app.isPackaged)
      ? process.resourcesPath
      : os.homedir();
  }
}

module.exports = PathConfig;