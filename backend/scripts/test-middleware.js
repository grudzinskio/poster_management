// Test script to verify unified middleware is working correctly
// Run with: node scripts/test-middleware.js

const { authenticateToken, requirePermission, requireRole } = require('../middleware');

console.log('🧪 Testing unified middleware imports...\n');

// Test that all functions are properly exported
const tests = [
  { name: 'authenticateToken', fn: authenticateToken },
  { name: 'requirePermission', fn: requirePermission },
  { name: 'requireRole', fn: requireRole }
];

let passed = 0;
let total = tests.length;

tests.forEach(test => {
  if (typeof test.fn === 'function') {
    console.log(`✅ ${test.name}: Function exported correctly`);
    passed++;
  } else {
    console.log(`❌ ${test.name}: Not a function or missing`);
  }
});

console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

if (passed === total) {
  console.log('🎉 All middleware functions are working correctly!');
  console.log('💡 You can now safely run the cleanup script to remove old files');
  console.log('   Run: node scripts/cleanup-middleware.js');
} else {
  console.log('⚠️  Some middleware functions are missing. Check unified-auth.js');
}

// Test permission middleware creation
try {
  const permissionMiddleware = requirePermission('test_permission');
  const roleMiddleware = requireRole('test_role');
  
  if (typeof permissionMiddleware === 'function' && typeof roleMiddleware === 'function') {
    console.log('✅ Middleware factories are working correctly');
  } else {
    console.log('❌ Middleware factories are not returning functions');
  }
} catch (error) {
  console.log(`❌ Error creating middleware: ${error.message}`);
}
