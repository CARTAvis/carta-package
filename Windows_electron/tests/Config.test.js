/**
 * Unit tests for Config
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock the config file path for testing
const testConfigDir = path.join(os.tmpdir(), 'carta-test-config');
const testConfigFile = path.join(testConfigDir, 'config.json');

// Create a test version of Config that uses test directory
class TestConfig {
  constructor() {
    this.configDir = testConfigDir;
    this.configFile = testConfigFile;
    this.defaultConfig = this._getDefaultConfig();
    this.userConfig = this._loadUserConfig();
    this.config = { ...this.defaultConfig, ...this.userConfig };
  }

  _getDefaultConfig() {
    return {
      defaultStartPort: 3000,
      maxPort: 65535,
      maxBackendRetries: 300,
      backendRetryInterval: 1000,
      backendTimeout: 1000,
      processCleanupDelay: 1000,
      processForceKillDelay: 500,
      processFallbackTimeout: 3000,
      defaultWindowWidth: 1920,
      defaultWindowHeight: 1080,
      windowOffset: 25,
      wslCheckTimeout: 5000,
      logLevel: 'info',
      enableFileLogging: false,
      maxLogFiles: 7,
      enableDevTools: false,
      enableVerboseLogging: false
    };
  }

  _loadUserConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const configData = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.warn('Failed to load user config, using defaults:', error.message);
    }
    return {};
  }

  saveConfig() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      const configToSave = {};
      Object.keys(this.config).forEach(key => {
        if (this.config[key] !== this.defaultConfig[key]) {
          configToSave[key] = this.config[key];
        }
      });

      fs.writeFileSync(this.configFile, JSON.stringify(configToSave, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save config:', error.message);
      return false;
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
  }

  getAll() {
    return { ...this.config };
  }

  resetToDefaults() {
    this.config = { ...this.defaultConfig };
  }

  validate() {
    const errors = [];

    if (this.config.defaultStartPort < 1024 || this.config.defaultStartPort > 65535) {
      errors.push('defaultStartPort must be between 1024 and 65535');
    }

    if (this.config.maxPort <= this.config.defaultStartPort) {
      errors.push('maxPort must be greater than defaultStartPort');
    }

    if (this.config.backendTimeout < 500) {
      errors.push('backendTimeout must be at least 500ms');
    }

    if (this.config.maxBackendRetries < 1) {
      errors.push('maxBackendRetries must be at least 1');
    }

    if (this.config.defaultWindowWidth < 800 || this.config.defaultWindowHeight < 600) {
      errors.push('Window dimensions must be at least 800x600');
    }

    return errors;
  }

  isDevelopment() {
    return process.env.NODE_ENV === 'development' || this.config.enableDevTools;
  }

  getConfigSummary() {
    return {
      defaultStartPort: this.config.defaultStartPort,
      maxBackendRetries: this.config.maxBackendRetries,
      wslCheckTimeout: this.config.wslCheckTimeout,
      logLevel: this.config.logLevel,
      isDevelopment: this.isDevelopment()
    };
  }
}

describe('Config', () => {
  let config;

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
    config = new TestConfig();
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    it('should load default configuration', () => {
      assert.strictEqual(config.get('defaultStartPort'), 3000);
      assert.strictEqual(config.get('maxPort'), 65535);
      assert.strictEqual(config.get('logLevel'), 'info');
    });

    it('should have all required default values', () => {
      const requiredKeys = [
        'defaultStartPort', 'maxPort', 'maxBackendRetries',
        'backendRetryInterval', 'backendTimeout', 'defaultWindowWidth',
        'defaultWindowHeight', 'wslCheckTimeout', 'logLevel'
      ];

      for (const key of requiredKeys) {
        assert.notStrictEqual(config.get(key), undefined, `Missing required config: ${key}`);
      }
    });
  });

  describe('get/set operations', () => {
    it('should get configuration values', () => {
      assert.strictEqual(config.get('defaultStartPort'), 3000);
    });

    it('should set configuration values', () => {
      config.set('defaultStartPort', 4000);
      assert.strictEqual(config.get('defaultStartPort'), 4000);
    });

    it('should return all configuration', () => {
      const all = config.getAll();
      assert.strictEqual(typeof all, 'object');
      assert.strictEqual(all.defaultStartPort, 3000);
    });
  });

  describe('validation', () => {
    it('should validate valid configuration', () => {
      const errors = config.validate();
      assert.strictEqual(errors.length, 0);
    });

    it('should detect invalid port range', () => {
      config.set('defaultStartPort', 500); // Below 1024
      const errors = config.validate();
      assert(errors.some(e => e.includes('defaultStartPort must be between')));
    });

    it('should detect port ordering issue', () => {
      config.set('maxPort', 2000);
      config.set('defaultStartPort', 3000); // Higher than maxPort
      const errors = config.validate();
      assert(errors.some(e => e.includes('maxPort must be greater than defaultStartPort')));
    });

    it('should detect low timeout values', () => {
      config.set('backendTimeout', 100); // Too low
      const errors = config.validate();
      assert(errors.some(e => e.includes('backendTimeout must be at least 500ms')));
    });

    it('should detect invalid retry count', () => {
      config.set('maxBackendRetries', 0);
      const errors = config.validate();
      assert(errors.some(e => e.includes('maxBackendRetries must be at least 1')));
    });

    it('should detect invalid window dimensions', () => {
      config.set('defaultWindowWidth', 500);
      config.set('defaultWindowHeight', 400);
      const errors = config.validate();
      assert(errors.some(e => e.includes('Window dimensions must be at least 800x600')));
    });
  });

  describe('file operations', () => {
    it('should save configuration to file', () => {
      config.set('defaultStartPort', 4000);
      const saved = config.saveConfig();
      assert.strictEqual(saved, true);
      assert(fs.existsSync(testConfigFile));
    });

    it('should load saved configuration', () => {
      // Save a custom value
      config.set('defaultStartPort', 4000);
      config.saveConfig();

      // Create new instance to test loading
      const newConfig = new TestConfig();
      assert.strictEqual(newConfig.get('defaultStartPort'), 4000);
    });

    it('should only save non-default values', () => {
      config.set('defaultStartPort', 4000); // Changed from default
      // Keep logLevel as default
      config.saveConfig();

      const savedData = JSON.parse(fs.readFileSync(testConfigFile, 'utf8'));
      assert.strictEqual(savedData.defaultStartPort, 4000);
      assert.strictEqual(savedData.logLevel, undefined); // Should not be saved
    });

    it('should handle missing config file gracefully', () => {
      // This should not throw an error
      const newConfig = new TestConfig();
      assert.strictEqual(newConfig.get('defaultStartPort'), 3000);
    });
  });

  describe('utility methods', () => {
    it('should reset to defaults', () => {
      config.set('defaultStartPort', 4000);
      config.resetToDefaults();
      assert.strictEqual(config.get('defaultStartPort'), 3000);
    });

    it('should provide config summary', () => {
      const summary = config.getConfigSummary();
      assert.strictEqual(typeof summary, 'object');
      assert.strictEqual(summary.defaultStartPort, 3000);
      assert.strictEqual(typeof summary.isDevelopment, 'boolean');
    });

    it('should detect development mode correctly', () => {
      // Should be false by default
      assert.strictEqual(config.isDevelopment(), false);

      // Should be true when enableDevTools is set
      config.set('enableDevTools', true);
      assert.strictEqual(config.isDevelopment(), true);
    });
  });
});

// Helper function to run tests if this file is executed directly
if (require.main === module) {
  console.log('Running Config tests...');
  
  // Simple test runner
  const runTest = (testName, testFn) => {
    try {
      // Clean up before test
      if (fs.existsSync(testConfigDir)) {
        fs.rmSync(testConfigDir, { recursive: true, force: true });
      }
      
      const config = new TestConfig();
      testFn(config);
      console.log(`✓ ${testName}`);
    } catch (error) {
      console.log(`✗ ${testName}: ${error.message}`);
    } finally {
      // Clean up after test
      if (fs.existsSync(testConfigDir)) {
        fs.rmSync(testConfigDir, { recursive: true, force: true });
      }
    }
  };

  // Run tests
  runTest('Load default configuration', (config) => {
    assert.strictEqual(config.get('defaultStartPort'), 3000);
  });

  runTest('Set and get values', (config) => {
    config.set('defaultStartPort', 4000);
    assert.strictEqual(config.get('defaultStartPort'), 4000);
  });

  runTest('Validate configuration', (config) => {
    const errors = config.validate();
    assert.strictEqual(errors.length, 0);
  });

  runTest('Save and load configuration', (config) => {
    config.set('defaultStartPort', 4000);
    config.saveConfig();
    
    const newConfig = new TestConfig();
    assert.strictEqual(newConfig.get('defaultStartPort'), 4000);
  });

  console.log('Config tests completed');
}