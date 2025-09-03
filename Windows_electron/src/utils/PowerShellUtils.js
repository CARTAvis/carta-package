/**
 * PowerShell utility functions for Windows file operations
 * Provides file existence checks and basic operations without requiring WSL
 */

const { exec } = require('child_process');
const path = require('path');
const logger = require('./Logger');

class PowerShellUtils {
  /**
   * Check if a file or directory exists using PowerShell
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} Promise that resolves to existence status
   */
  static checkFileExists(filePath) {
    return new Promise((resolve) => {
      const escapedPath = filePath.replace(/'/g, "''"); // Escape single quotes
      const command = `powershell.exe -NoProfile -Command "Test-Path -Path '${escapedPath}' -ErrorAction SilentlyContinue"`;
      
      exec(command, { timeout: 5000, encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          logger.error('PowerShell file check failed', { error: error.message });
          resolve(false);
        } else {
          const result = stdout.trim().toLowerCase();
          resolve(result === 'true');
        }
      });
    });
  }

  /**
   * Check if the CARTA AppImage exists using PowerShell
   * @param {string} dirname - Directory containing the application
   * @returns {Promise<boolean>} Promise that resolves to AppImage existence status
   */
  static async checkCartaAppImageExists(dirname) {
    const PathConfig = require('../config/paths');
    const appImagePath = PathConfig.getCartaBinaryPath(dirname);
    
    logger.info(`Checking for CARTA AppImage at: ${appImagePath}`);
    const exists = await this.checkFileExists(appImagePath);
    
    if (exists) {
      logger.info('CARTA AppImage found');
    } else {
      logger.info('CARTA AppImage not found');
    }
    
    return exists;
  }

  /**
   * Check if the run.sh script exists using PowerShell
   * @param {string} dirname - Directory containing the application
   * @returns {Promise<boolean>} Promise that resolves to script existence status
   */
  static async checkRunScriptExists(dirname) {
    const PathConfig = require('../config/paths');
    const scriptPath = PathConfig.getRunShPath(dirname);
    
    logger.info(`Checking for run.sh script at: ${scriptPath}`);
    const exists = await this.checkFileExists(scriptPath);
    
    if (exists) {
      logger.info('run.sh script found');
    } else {
      logger.info('run.sh script not found');
    }
    
    return exists;
  }

  /**
   * Get file information using PowerShell
   * @param {string} filePath - Path to the file
   * @returns {Promise<object>} Promise that resolves to file information
   */
  static getFileInfo(filePath) {
    return new Promise((resolve, reject) => {
      const escapedPath = filePath.replace(/'/g, "''");
      const command = `powershell.exe -NoProfile -Command "if (Test-Path -Path '${escapedPath}') { Get-Item -Path '${escapedPath}' | Select-Object Name, Length, LastWriteTime, Attributes | ConvertTo-Json } else { Write-Output 'null' }"`;
      
      exec(command, { timeout: 5000, encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          try {
            const result = stdout.trim();
            if (result === 'null') {
              resolve(null);
            } else {
              const fileInfo = JSON.parse(result);
              resolve(fileInfo);
            }
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });
  }

  /**
   * Check if PowerShell is available on the system
   * @returns {Promise<boolean>} Promise that resolves to PowerShell availability
   */
  static checkPowerShellAvailability() {
    return new Promise((resolve) => {
      exec('powershell.exe -NoProfile -Command "Write-Output $PSVersionTable.PSVersion.Major"', 
        { timeout: 3000, encoding: 'utf8' }, 
        (error, stdout, stderr) => {
          if (error) {
            logger.error('PowerShell check failed', { error: error.message });
            resolve(false);
          } else {
            const majorVersion = parseInt(stdout.trim());
            const isAvailable = majorVersion >= 3; // Require PowerShell 3.0+
            logger.info(`PowerShell ${majorVersion} detected: ${isAvailable ? 'available' : 'insufficient'}`);
            resolve(isAvailable);
          }
        }
      );
    });
  }

  /**
   * Validate required CARTA files exist before proceeding with WSL
   * @param {string} dirname - Directory containing the application  
   * @returns {Promise<object>} Promise that resolves to validation results
   */
  static async validateCartaFiles(dirname) {
    const config = require('../config/Config');
    
    logger.info('Validating CARTA files using PowerShell...');
    logger.info('Configuration', config.getConfigSummary());
    
    const results = {
      powerShellAvailable: await this.checkPowerShellAvailability(),
      appImageExists: false,
      runScriptExists: false,
      allFilesReady: false
    };

    if (!results.powerShellAvailable) {
      logger.error('PowerShell is not available or insufficient version');
      return results;
    }

    results.appImageExists = await this.checkCartaAppImageExists(dirname);
    results.runScriptExists = await this.checkRunScriptExists(dirname);
    results.allFilesReady = results.appImageExists && results.runScriptExists;

    if (results.allFilesReady) {
      logger.info('All required CARTA files are present');
    } else {
      logger.info('Some required CARTA files are missing:');
      if (!results.appImageExists) logger.info('  - CARTA AppImage (carta_appimage)');
      if (!results.runScriptExists) logger.info('  - Run script (run.sh)');
    }

    return results;
  }
}

module.exports = PowerShellUtils;
