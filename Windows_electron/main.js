/**
 * CARTA Electron Application - Refactored Main Entry Point
 * This is the main process for the CARTA Electron application
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const uuid = require('uuid');

// Import refactored modules
const WindowManager = require('./src/managers/WindowManager');
const BackendManager = require('./src/managers/BackendManager');
const WSLManager = require('./src/managers/WSLManager');
const MenuManager = require('./src/managers/MenuManager');
const NetworkUtils = require('./src/utils/NetworkUtils');
const PathUtils = require('./src/utils/PathUtils');
const ArgumentParser = require('./src/utils/ArgumentParser');
const PowerShellUtils = require('./src/utils/PowerShellUtils');
const WSLDialogs = require('./src/dialogs/WSLDialogs');
const logger = require('./src/utils/Logger');
const config = require('./src/config/Config');
const errorHandler = require('./src/utils/ErrorHandler');

class CARTAApplication {
  constructor() {
    this.windowManager = new WindowManager();
    this.cartaAuthToken = uuid.v4();
    this.baseDirectory = null;
    this.fileMode = null;
    this.args = null;
    
    // Initialize logging and configuration
    this._initializeApplication();
    this.init();
  }

  /**
   * Initialize application with logging and configuration
   * @private
   */
  _initializeApplication() {
    // Clean up old logs on startup
    logger.cleanupOldLogs();
    
    // Log application startup
    logger.info('CARTA application starting', {
      version: require('./package.json').version,
      platform: process.platform,
      nodeVersion: process.version,
      electronVersion: process.versions.electron
    });
    
    // Validate and log configuration
    const configErrors = config.validate();
    if (configErrors.length > 0) {
      logger.warn('Configuration validation errors', { errors: configErrors });
    }
    
    logger.info('Configuration loaded', config.getConfigSummary());
    
    // Set up global error handling
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      errorHandler.handleError(error, 'uncaughtException', { shouldExit: true });
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      errorHandler.handleError(new Error(reason), 'unhandledRejection', { shouldExit: false });
    });
  }

  /**
   * Initialize the application
   */
  init() {
    // Parse command line arguments
    this.args = ArgumentParser.parseArguments();
    const inputPath = ArgumentParser.getInputPath(this.args);

    // Handle help and version flags
    if (ArgumentParser.hasHelpFlag(this.args)) {
      this.showHelp();
      return;
    }

    if (ArgumentParser.hasVersionFlag(this.args)) {
      this.showVersion();
      return;
    }

    // Resolve path information
    const pathInfo = PathUtils.resolvePathInfo(inputPath, fs, os.homedir());
    this.baseDirectory = pathInfo.baseDirectory;
    this.fileMode = pathInfo.fileMode;

    // Set up application event handlers
    this.setupAppEventHandlers();

    // Set up application menu
    MenuManager.setupApplicationMenu(() => this.createNewWindow());

    // Allow multiple instances of Electron
    app.releaseSingleInstanceLock();
  }

  /**
   * Set up application-level event handlers
   */
  setupAppEventHandlers() {
    app.on('ready', async () => {
      await this.onAppReady();
    });

    app.on('window-all-closed', async () => {
      await this.onWindowAllClosed();
    });

    app.on('before-quit', async () => {
      await this.onBeforeQuit();
    });

    app.on('activate', (event, hasVisibleWindows) => {
      if (!hasVisibleWindows) {
        this.createNewWindow();
      }
    });

    // Handle process termination signals
    this.setupProcessSignalHandlers();
  }

  /**
   * Set up process signal handlers for graceful shutdown
   */
  setupProcessSignalHandlers() {
    const { SIGNALS } = require('./src/config/constants');

    process.on(SIGNALS.SIGINT, () => {
      logger.info('Received SIGINT (Ctrl+C). Shutting down gracefully...');
      this.gracefulShutdown();
    });

    process.on(SIGNALS.SIGTERM, () => {
      logger.info('Received SIGTERM. Shutting down gracefully...');
      this.gracefulShutdown();
    });
  }

  /**
   * Handle application ready event with enhanced error handling
   */
  async onAppReady() {
    logger.info('Application ready, starting initialization');
    
    try {
      // Check if file validation should be skipped
      if (config.shouldSkipFileValidation()) {
        logger.info('File validation skipped (configured for fast startup)');
      } else {
        // First, validate required CARTA files using PowerShell
        const fileValidation = await PowerShellUtils.validateCartaFiles(__dirname);
        
        if (!fileValidation.powerShellAvailable) {
          const error = new Error('PowerShell is not available on this system');
          const result = await errorHandler.handleError(error, 'onAppReady:powerShell');
          if (!result.recovered) {
            logger.error('PowerShell validation failed, cannot continue');
            return;
          }
        }

        if (!fileValidation.allFilesReady) {
          const missingFiles = [];
          if (!fileValidation.binaryExists) missingFiles.push('CARTA binary (AppRun)');
          if (!fileValidation.runScriptExists) missingFiles.push('run.sh');

          const error = new Error(`Missing required files: ${missingFiles.join(', ')}`);
          error.code = 'FILE_NOT_FOUND';

          const result = await errorHandler.handleError(error, 'onAppReady:fileValidation');
          if (!result.recovered) {
            logger.error('Required files missing, cannot continue', { missingFiles });
            return;
          }
        }
      }

      // Check WSL availability (unless also skipped)
      if (config.shouldSkipWSLValidation()) {
        logger.info('WSL validation skipped (configured for fast startup)');
      } else {
        const wslAvailable = await WSLManager.checkAvailability();

        if (!wslAvailable) {
          const error = new Error('WSL is not available');
          error.code = 'WSL_NOT_AVAILABLE';
          
          const result = await errorHandler.handleError(error, 'onAppReady:wslCheck');
          if (!result.recovered) {
            logger.error('WSL not available, cannot continue');
            return;
          }
        }
      }

      logger.info('All validation checks passed, creating window');
      this.createNewWindow();
    } catch (error) {
      logger.error('Unexpected error during app ready', { error: error.message, stack: error.stack });
      await errorHandler.handleError(error, 'onAppReady:unexpected');
    }
  }

  /**
   * Handle window all closed event
   */
  async onWindowAllClosed() {
    await this.windowManager.closeAllWindows();

    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  /**
   * Handle before quit event
   */
  async onBeforeQuit() {
    logger.info('App quitting, final cleanup...');
    await WSLManager.killBackendProcesses();
  }

  /**
   * Create a new CARTA window
   */
  async createNewWindow() {
    try {
      // Create new window
      const newWindow = this.windowManager.createWindow();

      // Find available port for backend
      const backendPort = await NetworkUtils.findAvailablePort();

      // Open DevTools if inspect flag is set
      if (ArgumentParser.hasInspectFlag(this.args)) {
        newWindow.webContents.openDevTools();
      }

      // Generate extra arguments for backend
      const finalExtraArgs = ArgumentParser.generateExtraArgs(this.args);

      // Start backend process
      const backendProcess = BackendManager.startBackend({
        cartaAuthToken: this.cartaAuthToken,
        baseDirectory: this.baseDirectory,
        backendPort: backendPort,
        extraArgs: finalExtraArgs,
        dirname: __dirname,
      });

      // Store backend process reference on window
      newWindow.backendProcess = backendProcess;

      // Handle backend errors
      backendProcess.on('error', (err) => {
        BackendManager.handleBackendError(err, newWindow);
      });

      // Check when backend is ready and load URL
      NetworkUtils.checkBackendReady(backendPort, (isReady) => {
        if (isReady) {
          const url = BackendManager.generateBackendUrl({
            backendPort: backendPort,
            cartaAuthToken: this.cartaAuthToken,
            inputPath: ArgumentParser.getInputPath(this.args),
            fileMode: this.fileMode,
          });

          newWindow.loadURL(url);
        } else {
          // Show error dialog if backend fails to start
          WSLDialogs.showBackendStartupError();
          newWindow.close();
        }
      }, undefined, undefined, newWindow);

      return newWindow;
    } catch (error) {
      logger.error('Error creating new window', { error: error.message, stack: error.stack });
      WSLDialogs.showExecutionError(error);
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    const PathConfig = require('./src/config/paths');
    const cartaPath = PathConfig.getCartaBinaryPath(__dirname);
    WSLManager.showHelp(cartaPath);
  }

  /**
   * Show version information
   */
  showVersion() {
    const PathConfig = require('./src/config/paths');
    const cartaPath = PathConfig.getCartaBinaryPath(__dirname);
    WSLManager.showVersion(cartaPath);
  }

  /**
   * Perform graceful shutdown
   */
  async gracefulShutdown() {
    await this.windowManager.closeAllWindows();
    process.exit(0);
  }
}

// Create and start the application
new CARTAApplication();
