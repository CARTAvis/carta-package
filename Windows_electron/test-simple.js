/**
 * Simple test runner for CARTA enhancements
 */

const assert = require('assert');
const PathUtils = require('./src/utils/PathUtils');

console.log('🧪 Testing CARTA enhancements...\n');

// Test counter
let testCount = 0;
let passCount = 0;

function runTest(name, testFn) {
  testCount++;
  try {
    testFn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runAsyncTest(name, testFn) {
  testCount++;
  try {
    await testFn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

console.log('📁 Testing PathUtils...');

// Test basic path conversion
runTest('Windows path to WSL conversion', () => {
  const result = PathUtils.toWslPath('C:\\Users\\test', { allowTraversal: false });
  assert.strictEqual(result, '/mnt/c/Users/test');
});

// Test forward slash handling
runTest('Forward slash handling', () => {
  const result = PathUtils.toWslPath('D:/data/files', { allowTraversal: false });
  assert.strictEqual(result, '/mnt/d/data/files');
});

// Test security validation
runTest('Path traversal detection', () => {
  try {
    const result = PathUtils.toWslPath('C:\\..\\danger', { allowTraversal: false });
    console.log('Unexpected result:', result);
    throw new Error('Should have detected path traversal');
  } catch (error) {
    if (error.message.includes('Path traversal detected')) {
      // This is the expected error, test passes
      return;
    }
    console.log('Actual error:', error.message);
    throw new Error(`Expected path traversal error, got: ${error.message}`);
  }
});

// Test dangerous character detection
runTest('Dangerous character detection', () => {
  try {
    PathUtils.toWslPath('C:\\data|pipe', { allowTraversal: false });
    throw new Error('Should have detected dangerous character');
  } catch (error) {
    if (!error.message.includes('dangerous character')) {
      throw error;
    }
  }
});

// Test filename sanitization
runTest('Filename sanitization', () => {
  const result = PathUtils.sanitizeFilename('test<file>name');
  assert.strictEqual(result, 'test_file_name');
});

// Test empty filename handling
runTest('Empty filename handling', () => {
  try {
    PathUtils.sanitizeFilename('???');
    throw new Error('Should have thrown error for empty result');
  } catch (error) {
    if (!error.message.includes('becomes empty')) {
      throw error;
    }
  }
});

// Test config loading
console.log('\n⚙️  Testing Config...');

try {
  const Config = require('./src/config/Config');
  
  runTest('Config initialization', () => {
    assert.strictEqual(Config.get('defaultStartPort'), 3000);
    assert.strictEqual(typeof Config.get('logLevel'), 'string');
  });

  runTest('Config validation', () => {
    const errors = Config.validate();
    assert.strictEqual(Array.isArray(errors), true);
    // Default config should be valid
    if (errors.length > 0) {
      throw new Error(`Config validation failed: ${errors.join(', ')}`);
    }
  });

  runTest('Config get/set', () => {
    const originalPort = Config.get('defaultStartPort');
    Config.set('defaultStartPort', 4000);
    assert.strictEqual(Config.get('defaultStartPort'), 4000);
    Config.set('defaultStartPort', originalPort); // Reset
  });

} catch (error) {
  console.log(`❌ Config loading failed: ${error.message}`);
}

// Test logger loading
console.log('\n📝 Testing Logger...');

try {
  const logger = require('./src/utils/Logger');
  
  runTest('Logger initialization', () => {
    assert.strictEqual(typeof logger.info, 'function');
    assert.strictEqual(typeof logger.error, 'function');
    assert.strictEqual(typeof logger.debug, 'function');
  });

  runTest('Logger basic operations', () => {
    logger.info('Test info message');
    logger.debug('Test debug message');
    logger.error('Test error message');
    // If we get here without throwing, it worked
    assert.strictEqual(true, true);
  });

} catch (error) {
  console.log(`❌ Logger loading failed: ${error.message}`);
}

// Test error handler loading
console.log('\n🚨 Testing ErrorHandler...');

try {
  const errorHandler = require('./src/utils/ErrorHandler');
  
  runTest('ErrorHandler initialization', () => {
    assert.strictEqual(typeof errorHandler.handleError, 'function');
    assert.strictEqual(typeof errorHandler.getErrorStats, 'function');
  });

  runAsyncTest('ErrorHandler basic functionality', async () => {
    const testError = new Error('Test error');
    const result = await errorHandler.handleError(testError, 'test-context', { showDialog: false });
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(typeof result.recovered, 'boolean');
  });

} catch (error) {
  console.log(`❌ ErrorHandler loading failed: ${error.message}`);
}

// Summary
setTimeout(() => {
  console.log('\n📊 Test Summary:');
  console.log(`   Passed: ${passCount}/${testCount}`);
  console.log(`   Success Rate: ${Math.round((passCount/testCount) * 100)}%`);
  
  if (passCount === testCount) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed - check output above');
  }
}, 100); // Small delay to ensure async tests complete