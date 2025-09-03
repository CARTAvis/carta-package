/**
 * Command line argument processing utilities
 */

const minimist = require('minimist');

class ArgumentParser {
  /**
   * Parse command line arguments
   * @returns {object} Parsed arguments
   */
  static parseArguments() {
    return minimist(process.argv.slice(1));
  }

  /**
   * Generate extra arguments string for backend (excluding internal flags)
   * @param {object} args - Parsed arguments object
   * @returns {string} Formatted arguments string
   */
  static generateExtraArgs(args) {
    const newArgs = [];

    for (const argName in args) {
      if (
        args.hasOwnProperty(argName) &&
        argName !== '_' &&
        argName !== 'inspect'
      ) {
        const value = args[argName];
        if (value === true) {
          newArgs.push(`--${argName}`);
        } else if (value !== false) {
          newArgs.push(`--${argName}=${value}`);
        }
      }
    }
    return newArgs.join(' ');
  }

  /**
   * Get input path from arguments
   * @param {object} args - Parsed arguments object
   * @returns {string} Input path or empty string
   */
  static getInputPath(args) {
    return args._[0] || '';
  }

  /**
   * Check if help flag is present
   * @param {object} args - Parsed arguments object
   * @returns {boolean} True if help flag is present
   */
  static hasHelpFlag(args) {
    return !!args.help;
  }

  /**
   * Check if version flag is present
   * @param {object} args - Parsed arguments object
   * @returns {boolean} True if version flag is present
   */
  static hasVersionFlag(args) {
    return !!args.version;
  }

  /**
   * Check if inspect flag is present
   * @param {object} args - Parsed arguments object
   * @returns {boolean} True if inspect flag is present
   */
  static hasInspectFlag(args) {
    return !!args.inspect;
  }
}

module.exports = ArgumentParser;
