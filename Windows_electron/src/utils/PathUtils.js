/**
 * Path utility functions for Windows and WSL path conversions
 */

const path = require('path');
const fs = require('fs');
const logger = require('./Logger');

class PathUtils {
  /**
   * Convert Windows path to WSL path format with enhanced validation
   * @param {string} winPath - Windows path to convert
   * @param {object} options - Validation options
   * @returns {string} WSL-compatible path
   * @throws {Error} If path contains invalid characters or format
   */
  static toWslPath(winPath, options = {}) {
    logger.debug('Converting Windows path to WSL', { winPath, options });

    // Input validation
    if (!winPath || typeof winPath !== 'string') {
      throw new Error('Path must be a non-empty string');
    }

    // Enhanced security validation BEFORE normalization to catch traversal attempts
    this._validatePathSecurity(winPath, options);
    
    // Normalize the path after validation
    const normalizedPath = path.normalize(winPath);
    
    // Format validation
    this._validatePathFormat(normalizedPath);
    
    // Convert to WSL format
    const wslPath = normalizedPath
      .replace(/^([A-Z]):/i, (match, drive) => {
        // Additional drive letter validation
        if (!drive.match(/^[A-Z]$/i)) {
          throw new Error(`Invalid drive letter: ${drive}`);
        }
        return `/mnt/${drive.toLowerCase()}`;
      })
      .replace(/\\/g, '/');

    logger.debug('Path conversion successful', { winPath, wslPath });
    return wslPath;
  }

  /**
   * Enhanced security validation for paths
   * @private
   */
  static _validatePathSecurity(pathToValidate, options = {}) {
    const { allowRelative = false, allowTraversal = false } = options;

    // Check for path traversal attempts
    if (!allowTraversal && (pathToValidate.includes('..\\') || pathToValidate.includes('../') || pathToValidate.includes('..'))) {
      throw new Error('Path traversal detected: .. not allowed in path');
    }

    // Check for potentially dangerous characters
    const dangerousChars = ['|', '&', ';', '`', '$', '(', ')', '{', '}', '[', ']'];
    for (const char of dangerousChars) {
      if (pathToValidate.includes(char)) {
        throw new Error(`Potentially dangerous character '${char}' found in path`);
      }
    }

    // Check for null bytes (path injection attempt)
    if (pathToValidate.includes('\0')) {
      throw new Error('Null byte detected in path');
    }

    // Check for relative paths if not allowed
    if (!allowRelative && !path.isAbsolute(pathToValidate)) {
      throw new Error('Relative paths not allowed');
    }

    // Check path length (Windows MAX_PATH limitation)
    if (pathToValidate.length > 260) {
      logger.warn('Path exceeds Windows MAX_PATH limit', { 
        pathLength: pathToValidate.length,
        path: pathToValidate.substring(0, 50) + '...' 
      });
    }

    // Check for reserved Windows names
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 
                          'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 
                          'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 
                          'LPT7', 'LPT8', 'LPT9'];
    
    const pathParts = pathToValidate.split(/[\\\/]/);
    for (const part of pathParts) {
      const baseName = part.split('.')[0].toUpperCase();
      if (reservedNames.includes(baseName)) {
        throw new Error(`Reserved Windows name '${baseName}' found in path`);
      }
    }
  }

  /**
   * Validate Windows path format
   * @private
   */
  static _validatePathFormat(pathToValidate) {
    // Check for proper Windows path format
    const windowsPathRegex = /^([A-Z]:[\\\/]|[\\\/]{1,2}[^\\\/]+|\.)/i;
    
    if (!windowsPathRegex.test(pathToValidate)) {
      throw new Error(`Invalid Windows path format: ${pathToValidate}`);
    }

    // Additional UNC path validation
    if (pathToValidate.startsWith('\\\\')) {
      if (pathToValidate.length < 5 || !pathToValidate.substring(2).includes('\\')) {
        throw new Error('Invalid UNC path format');
      }
    }
  }

  /**
   * Safe path existence check
   * @param {string} pathToCheck - Path to check
   * @returns {Promise<boolean>} Whether path exists
   */
  static async safePathExists(pathToCheck) {
    try {
      // Validate path first
      this._validatePathSecurity(pathToCheck);
      
      // Use fs.promises for async operation
      await fs.promises.access(pathToCheck);
      return true;
    } catch (error) {
      logger.debug('Path existence check failed', { 
        path: pathToCheck, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Sanitize filename by removing invalid characters
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename must be a non-empty string');
    }

    // Remove invalid characters for both Windows and Linux
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
    const sanitized = filename.replace(invalidChars, '_');

    // Trim whitespace and dots from the end
    const trimmed = sanitized.replace(/[\s.]+$/g, '');

    // Ensure it's not empty after sanitization
    if (trimmed.length === 0 || trimmed === '_'.repeat(trimmed.length)) {
      throw new Error('Filename becomes empty after sanitization');
    }

    // Ensure it doesn't exceed reasonable length
    return trimmed.substring(0, 255);
  }

  /**
   * Resolve file path and determine base directory and file mode
   * @param {string} inputPath - Input path from command line
   * @param {object} fs - File system module
   * @param {string} homedir - Home directory path
   * @returns {object} Object containing baseDirectory and fileMode
   */
  static resolvePathInfo(inputPath, fs, homedir) {
    const { FILE_MODES } = require('../config/constants');
    let baseDirectory;
    let fileMode;

    try {
      let fileStatus = null;

      if (inputPath !== '' && inputPath !== '.') {
        fileStatus = fs.statSync(inputPath);
      }

      if (inputPath === '' || inputPath === '.') {
        // If launched by app icon (GUI), use home directory
        // If launched from command line, use current working directory
        fileMode = FILE_MODES.DIRECTORY; // Set default file mode for directory browsing
        if (process.cwd() === path.dirname(process.execPath) || 
            process.cwd() === process.env.USERPROFILE ||
            process.cwd().endsWith('\\Windows\\System32')) {
          baseDirectory = homedir; // Launched by app icon or from system directory
        } else {
          baseDirectory = process.cwd(); // Launched from command line with specific working directory
        }
      } else if (fileStatus.isFile()) {
        fileMode = FILE_MODES.FILE;
        baseDirectory = path.dirname(inputPath); // Using command line to directly open an image
      } else if (fileStatus.isDirectory()) {
        fileMode = FILE_MODES.DIRECTORY;
        baseDirectory = inputPath; // When using command line with a folder argument, set Filebrowser to specified folder
      }

      return { baseDirectory, fileMode };
    } catch (err) {
      if (err.code === 'ENOENT') {
        const { ERROR_MESSAGES } = require('../config/constants');
        logger.info(ERROR_MESSAGES.FILE_NOT_FOUND);
        process.exit();
      } else {
        logger.info('An unexpected error occurred', { err });
        process.exit();
      }
    }
  }
}

module.exports = PathUtils;
