/**
 * Structured logging utility for CARTA application
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class Logger {
  constructor() {
    this.logLevel = process.env.CARTA_LOG_LEVEL || 'info';
    this.enableFileLogging = process.env.CARTA_FILE_LOGGING === 'true';
    this.logDir = path.join(os.homedir(), '.carta', 'logs');
    this.logFile = path.join(this.logDir, `carta-${new Date().toISOString().split('T')[0]}.log`);
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this._ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   * @private
   */
  _ensureLogDirectory() {
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create log directory:', error.message);
        this.enableFileLogging = false;
      }
    }
  }

  /**
   * Format log message with timestamp and context
   * @private
   */
  _formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  /**
   * Write log to file if file logging is enabled
   * @private
   */
  _writeToFile(formattedMessage) {
    if (this.enableFileLogging) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error.message);
      }
    }
  }

  /**
   * Log message at specified level
   * @private
   */
  _log(level, message, context = {}) {
    if (this.levels[level] <= this.levels[this.logLevel]) {
      const formattedMessage = this._formatMessage(level, message, context);
      
      // Console output with appropriate method
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }

      this._writeToFile(formattedMessage);
    }
  }

  /**
   * Log error message
   */
  error(message, context = {}) {
    this._log('error', message, context);
  }

  /**
   * Log warning message
   */
  warn(message, context = {}) {
    this._log('warn', message, context);
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    this._log('info', message, context);
  }

  /**
   * Log debug message
   */
  debug(message, context = {}) {
    this._log('debug', message, context);
  }

  /**
   * Log method entry for debugging
   */
  enter(methodName, params = {}) {
    this.debug(`Entering ${methodName}`, params);
  }

  /**
   * Log method exit for debugging
   */
  exit(methodName, result = {}) {
    this.debug(`Exiting ${methodName}`, result);
  }

  /**
   * Clean up old log files (keep last 7 days)
   */
  cleanupOldLogs() {
    if (!this.enableFileLogging || !fs.existsSync(this.logDir)) return;

    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      files.forEach(file => {
        if (file.startsWith('carta-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.info(`Cleaned up old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      this.error('Failed to cleanup old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;