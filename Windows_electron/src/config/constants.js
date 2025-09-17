/**
 * Application constants and configuration
 */

module.exports = {
  // Port configuration
  DEFAULT_START_PORT: 3000,  // Start from 3000, will automatically find next available if occupied
  MAX_PORT: 65535,

  // Backend configuration
  MAX_BACKEND_RETRIES: 300,
  BACKEND_RETRY_INTERVAL: 1000,
  BACKEND_TIMEOUT: 1000,
  PROCESS_CLEANUP_DELAY: 1000,
  PROCESS_FORCE_KILL_DELAY: 500,
  PROCESS_FALLBACK_TIMEOUT: 3000,

  // Window configuration
  DEFAULT_WINDOW_WIDTH: 1920,
  DEFAULT_WINDOW_HEIGHT: 1080,
  WINDOW_OFFSET: 25,

  // WSL configuration
  WSL_CHECK_TIMEOUT: 5000,

  // Process signals
  SIGNALS: {
    SIGTERM: 'SIGTERM',
    SIGKILL: 'SIGKILL',
    SIGINT: 'SIGINT'
  },

  // File modes
  FILE_MODES: {
    DIRECTORY: 0,
    FILE: 1
  },

  // URLs
  URLS: {
    WSL_INSTALL_GUIDE: 'https://learn.microsoft.com/en-us/windows/wsl/install',
    WSL_DOCUMENTATION: 'https://learn.microsoft.com/en-us/windows/wsl/',
    WSL_TROUBLESHOOTING: 'https://learn.microsoft.com/en-us/windows/wsl/troubleshooting'
  },

  // Commands
  COMMANDS: {
    WSL_VERSION: 'wsl.exe --version',
    WSL_PKILL: 'wsl.exe pkill -f carta_backend',
    TASKKILL_WSL: 'taskkill /F /IM wsl.exe'
  },

  // Error messages
  ERROR_MESSAGES: {
    WSL_NOT_AVAILABLE: 'WSL is not installed or not available.',
    WSL_REQUIRED: 'CARTA requires Windows Subsystem for Linux (WSL) to run.',
    BACKEND_STARTUP_FAILED: 'Backend failed to start after maximum retries. This may be due to WSL configuration issues or missing CARTA binary.',
    FILE_NOT_FOUND: 'Error: Requested file or directory does not exist',
    NO_AVAILABLE_PORTS: 'No available ports found in the range 3000-65535',
    BACKEND_CONNECTION_FAILED: 'Failed to connect to CARTA backend. Please ensure WSL is properly configured and the CARTA binary is accessible.',
    PROCESS_TERMINATION_FAILED: 'Failed to terminate backend process cleanly',
    PATH_CONVERSION_FAILED: 'Failed to convert Windows path to WSL format'
  }
};
