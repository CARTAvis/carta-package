/**
 * Unit tests for PathUtils
 */

const assert = require('assert');
const PathUtils = require('../src/utils/PathUtils');

describe('PathUtils', () => {
  describe('toWslPath', () => {
    it('should convert Windows drive path to WSL format', () => {
      const result = PathUtils.toWslPath('C:\\Users\\test', { allowTraversal: false });
      assert.strictEqual(result, '/mnt/c/Users/test');
    });

    it('should convert Windows path with forward slashes', () => {
      const result = PathUtils.toWslPath('D:/data/files', { allowTraversal: false });
      assert.strictEqual(result, '/mnt/d/data/files');
    });

    it('should handle mixed slashes', () => {
      const result = PathUtils.toWslPath('E:\\data/mixed\\slashes', { allowTraversal: false });
      assert.strictEqual(result, '/mnt/e/data/mixed/slashes');
    });

    it('should throw error for null/undefined input', () => {
      assert.throws(() => PathUtils.toWslPath(null), /Path must be a non-empty string/);
      assert.throws(() => PathUtils.toWslPath(undefined), /Path must be a non-empty string/);
      assert.throws(() => PathUtils.toWslPath(''), /Path must be a non-empty string/);
    });

    it('should throw error for path traversal by default', () => {
      assert.throws(() => PathUtils.toWslPath('C:\\..\\danger'), /Path traversal detected/);
      assert.throws(() => PathUtils.toWslPath('C:\\data\\..\\..\\system'), /Path traversal detected/);
    });

    it('should allow path traversal when explicitly enabled', () => {
      const result = PathUtils.toWslPath('C:\\data\\..\\other', { allowTraversal: true });
      assert.strictEqual(result, '/mnt/c/other');
    });

    it('should throw error for dangerous characters', () => {
      assert.throws(() => PathUtils.toWslPath('C:\\data|pipe'), /dangerous character/);
      assert.throws(() => PathUtils.toWslPath('C:\\data&amp'), /dangerous character/);
      assert.throws(() => PathUtils.toWslPath('C:\\data;semicolon'), /dangerous character/);
    });

    it('should throw error for null bytes', () => {
      assert.throws(() => PathUtils.toWslPath('C:\\data\x00null'), /Null byte detected/);
    });

    it('should throw error for invalid drive letters', () => {
      assert.throws(() => PathUtils.toWslPath('1:\\invalid'), /Invalid drive letter/);
    });

    it('should throw error for reserved Windows names', () => {
      assert.throws(() => PathUtils.toWslPath('C:\\CON'), /Reserved Windows name/);
      assert.throws(() => PathUtils.toWslPath('C:\\data\\PRN.txt'), /Reserved Windows name/);
      assert.throws(() => PathUtils.toWslPath('D:\\LPT1'), /Reserved Windows name/);
    });

    it('should handle UNC paths', () => {
      const result = PathUtils.toWslPath('\\\\server\\share\\file', { allowTraversal: false });
      assert.strictEqual(result, '//server/share/file');
    });

    it('should throw error for invalid UNC paths', () => {
      assert.throws(() => PathUtils.toWslPath('\\\\'), /Invalid UNC path format/);
      assert.throws(() => PathUtils.toWslPath('\\\\server'), /Invalid UNC path format/);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove invalid characters', () => {
      const result = PathUtils.sanitizeFilename('test<file>name');
      assert.strictEqual(result, 'test_file_name');
    });

    it('should handle multiple invalid characters', () => {
      const result = PathUtils.sanitizeFilename('test|file*name?');
      assert.strictEqual(result, 'test_file_name_');
    });

    it('should trim whitespace and dots', () => {
      const result = PathUtils.sanitizeFilename('  test file  . . ');
      assert.strictEqual(result, 'test file');
    });

    it('should throw error for empty input', () => {
      assert.throws(() => PathUtils.sanitizeFilename(''), /non-empty string/);
      assert.throws(() => PathUtils.sanitizeFilename(null), /non-empty string/);
    });

    it('should throw error when filename becomes empty after sanitization', () => {
      assert.throws(() => PathUtils.sanitizeFilename('???'), /becomes empty/);
      assert.throws(() => PathUtils.sanitizeFilename('   . . . '), /becomes empty/);
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300);
      const result = PathUtils.sanitizeFilename(longName);
      assert.strictEqual(result.length, 255);
    });

    it('should handle control characters', () => {
      const result = PathUtils.sanitizeFilename('test\x01\x02file');
      assert.strictEqual(result, 'test__file');
    });
  });

  describe('safePathExists', async () => {
    it('should return false for non-existent paths', async () => {
      const result = await PathUtils.safePathExists('C:\\nonexistent\\path');
      assert.strictEqual(result, false);
    });

    it('should validate path security before checking existence', async () => {
      try {
        await PathUtils.safePathExists('C:\\dangerous|path');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.match(error.message, /dangerous character/);
      }
    });
  });
});

// Helper function to run tests if this file is executed directly
if (require.main === module) {
  console.log('Running PathUtils tests...');
  
  // Simple test runner
  const runTest = (testName, testFn) => {
    try {
      testFn();
      console.log(`✓ ${testName}`);
    } catch (error) {
      console.log(`✗ ${testName}: ${error.message}`);
    }
  };

  const runAsyncTest = async (testName, testFn) => {
    try {
      await testFn();
      console.log(`✓ ${testName}`);
    } catch (error) {
      console.log(`✗ ${testName}: ${error.message}`);
    }
  };

  // Run synchronous tests
  runTest('Convert Windows drive path', () => {
    const result = PathUtils.toWslPath('C:\\Users\\test', { allowTraversal: false });
    assert.strictEqual(result, '/mnt/c/Users/test');
  });

  runTest('Sanitize filename', () => {
    const result = PathUtils.sanitizeFilename('test<file>name');
    assert.strictEqual(result, 'test_file_name');
  });

  runTest('Path traversal detection', () => {
    assert.throws(() => PathUtils.toWslPath('C:\\..\\danger'), /Path traversal detected/);
  });

  // Run asynchronous test
  runAsyncTest('Non-existent path check', async () => {
    const result = await PathUtils.safePathExists('C:\\nonexistent\\path');
    assert.strictEqual(result, false);
  });

  console.log('PathUtils tests completed');
}