/**
 * Configuration management for CARTA application
 * Uses environment variables and runtime configuration only
 */

const constants = require('./constants');

class Config {
  constructor() {
    this.defaultConfig = this._getDefaultConfig();
    this.config = { ...this.defaultConfig };
  }

  /**
   * Get default configuration
   * @private
   */
  _getDefaultConfig() {
    return {
      // Port configuration (use constants directly)
      defaultStartPort: constants.DEFAULT_START_PORT,
      maxPort: constants.MAX_PORT,
      
      // Backend configuration (use constants directly)
      maxBackendRetries: constants.MAX_BACKEND_RETRIES,
      backendRetryInterval: constants.BACKEND_RETRY_INTERVAL,
      backendTimeout: constants.BACKEND_TIMEOUT,
      
      // Process management (use constants directly)
      processCleanupDelay: constants.PROCESS_CLEANUP_DELAY,
      processForceKillDelay: constants.PROCESS_FORCE_KILL_DELAY,
      processFallbackTimeout: constants.PROCESS_FALLBACK_TIMEOUT,
      
      // Window configuration (use constants directly)
      defaultWindowWidth: constants.DEFAULT_WINDOW_WIDTH,
      defaultWindowHeight: constants.DEFAULT_WINDOW_HEIGHT,
      windowOffset: constants.WINDOW_OFFSET,
      
      // WSL configuration (use constants directly)
      wslCheckTimeout: constants.WSL_CHECK_TIMEOUT,
      
      // Logging configuration (minimal env vars for important settings)
      logLevel: process.env.CARTA_LOG_LEVEL || 'info',
      enableFileLogging: process.env.CARTA_FILE_LOGGING === 'true',
      maxLogFiles: 7,
      
      // Development features (keep env vars for dev/prod switching)
      enableDevTools: process.env.CARTA_DEV_TOOLS === 'true',
      enableVerboseLogging: process.env.CARTA_VERBOSE === 'true',
      
      // Validation configuration (keep env vars for feature toggles)
      skipFileValidation: process.env.CARTA_SKIP_FILE_VALIDATION === 'true' || process.env.NODE_ENV === 'production',
      skipWSLValidation: process.env.CARTA_SKIP_WSL_VALIDATION === 'true',
      fastStartup: process.env.CARTA_FAST_STARTUP === 'true'
    };
  }

  /**
   * Get configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Set configuration value (runtime only - not persisted)
   */
  set(key, value) {
    this.config[key] = value;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults() {
    this.config = { ...this.defaultConfig };
  }

  /**
   * Validate configuration values
   */
  validate() {
    const errors = [];

    // Validate port ranges
    if (this.config.defaultStartPort < 1024 || this.config.defaultStartPort > 65535) {
      errors.push('defaultStartPort must be between 1024 and 65535');
    }

    if (this.config.maxPort <= this.config.defaultStartPort) {
      errors.push('maxPort must be greater than defaultStartPort');
    }

    // Validate timeouts
    if (this.config.backendTimeout < 500) {
      errors.push('backendTimeout must be at least 500ms');
    }

    // Validate retry counts
    if (this.config.maxBackendRetries < 1) {
      errors.push('maxBackendRetries must be at least 1');
    }

    // Validate window dimensions
    if (this.config.defaultWindowWidth < 800 || this.config.defaultWindowHeight < 600) {
      errors.push('Window dimensions must be at least 800x600');
    }

    return errors;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment() {
    return process.env.NODE_ENV === 'development' || this.config.enableDevTools;
  }

  /**
   * Get configuration summary for logging
   */
  getConfigSummary() {
    return {
      defaultStartPort: this.config.defaultStartPort,
      maxBackendRetries: this.config.maxBackendRetries,
      wslCheckTimeout: this.config.wslCheckTimeout,
      logLevel: this.config.logLevel,
      isDevelopment: this.isDevelopment(),
      skipFileValidation: this.config.skipFileValidation,
      fastStartup: this.config.fastStartup
    };
  }

  /**
   * Check if file validation should be skipped
   */
  shouldSkipFileValidation() {
    return this.config.skipFileValidation || this.config.fastStartup;
  }

  /**
   * Check if WSL validation should be skipped
   */
  shouldSkipWSLValidation() {
    return this.config.skipWSLValidation || this.config.fastStartup;
  }
}

// Create singleton instance
const config = new Config();

module.exports = config;