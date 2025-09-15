/**
 * Test file for encryption functionality
 * This file can be run to verify that encryption/decryption works correctly
 */

import { encryptionService } from './encryptionService';

export async function testEncryption() {
  console.log('🧪 Testing Encryption Service...');

  try {
    // Initialize the service
    await encryptionService.initialize();
    console.log('✅ Encryption service initialized');

    // Test data
    const testData = {
      apiKey: 'sk-test1234567890abcdef',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
      userPreferences: {
        theme: 'dark',
        language: 'en',
        notifications: true
      }
    };

    const jsonString = JSON.stringify(testData);
    console.log('📝 Original data:', jsonString);

    // Test encryption
    const encrypted = await encryptionService.encrypt(jsonString);
    console.log('🔒 Encrypted data:', encrypted);

    // Test decryption
    const decrypted = await encryptionService.decrypt(encrypted);
    console.log('🔓 Decrypted data:', decrypted);

    // Verify data integrity
    const decryptedData = JSON.parse(decrypted);
    const isValid = JSON.stringify(decryptedData) === jsonString;

    if (isValid) {
      console.log('✅ Encryption/Decryption test PASSED');
    } else {
      console.log('❌ Encryption/Decryption test FAILED - Data mismatch');
    }

    // Test encryption detection
    const isEncrypted = encryptionService.isEncrypted(encrypted);
    const isNotEncrypted = encryptionService.isEncrypted(jsonString);

    if (isEncrypted && !isNotEncrypted) {
      console.log('✅ Encryption detection test PASSED');
    } else {
      console.log('❌ Encryption detection test FAILED');
    }

    // Test storage methods
    const stored = await encryptionService.encryptForStorage(testData);
    const retrieved = await encryptionService.decryptFromStorage(stored);

    if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
      console.log('✅ Storage methods test PASSED');
    } else {
      console.log('❌ Storage methods test FAILED');
    }

    console.log('🎉 All encryption tests completed!');

  } catch (error) {
    console.error('❌ Encryption test failed:', error);
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Run test after a short delay to ensure DOM is ready
  setTimeout(() => {
    testEncryption();
  }, 1000);
}