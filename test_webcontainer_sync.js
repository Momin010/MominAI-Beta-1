// Test script to verify WebContainer filesystem sync functionality
console.log('Testing WebContainer filesystem sync...');

// Test 1: Check if fileSystemSync is available
try {
  const fileSystemSync = window.fileSystemSync;
  console.log('✅ fileSystemSync is available:', !!fileSystemSync);
} catch (error) {
  console.log('❌ fileSystemSync not available:', error.message);
}

// Test 2: Check if WebContainer is available
try {
  const webContainer = window.webContainer;
  console.log('✅ WebContainer is available:', !!webContainer);
} catch (error) {
  console.log('❌ WebContainer not available:', error.message);
}

// Test 3: Check if setWebContainer method exists
try {
  if (window.fileSystemSync && typeof window.fileSystemSync.setWebContainer === 'function') {
    console.log('✅ setWebContainer method exists');
  } else {
    console.log('❌ setWebContainer method not found');
  }
} catch (error) {
  console.log('❌ Error checking setWebContainer:', error.message);
}

// Test 4: Check if syncToWebContainer method exists
try {
  if (window.fileSystemSync && typeof window.fileSystemSync.syncToWebContainer === 'function') {
    console.log('✅ syncToWebContainer method exists');
  } else {
    console.log('❌ syncToWebContainer method not found');
  }
} catch (error) {
  console.log('❌ Error checking syncToWebContainer:', error.message);
}

// Test 5: Check sync status
try {
  if (window.fileSystemSync && typeof window.fileSystemSync.getSyncStatus === 'function') {
    const status = window.fileSystemSync.getSyncStatus();
    console.log('✅ Sync status:', status);
  } else {
    console.log('❌ getSyncStatus method not found');
  }
} catch (error) {
  console.log('❌ Error checking sync status:', error.message);
}

console.log('WebContainer sync test completed.');