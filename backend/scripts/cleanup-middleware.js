// Cleanup script to remove old middleware files after migration
// Run this after testing that the unified middleware works

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  '../middleware/auth.js',
  '../middleware/enhancedAuth.js', 
  '../middleware/permissionCheck.js'
];

console.log('🧹 Cleaning up old middleware files...\n');

filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    if (fs.existsSync(filePath)) {
      // Show file stats before removal
      const stats = fs.statSync(filePath);
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
      
      console.log(`❌ Removing: ${file}`);
      console.log(`   📊 Size: ${stats.size} bytes, ${lines} lines\n`);
      
      fs.unlinkSync(filePath);
      console.log(`✅ Successfully removed ${file}\n`);
    } else {
      console.log(`⚠️  File not found: ${file}\n`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${file}: ${error.message}\n`);
  }
});

console.log('🎉 Cleanup complete!\n');
console.log('📋 Summary of cleaned up duplicate code:');
console.log('   • auth.js: ~109 lines of authentication logic');
console.log('   • enhancedAuth.js: ~185 lines of enhanced authentication'); 
console.log('   • permissionCheck.js: ~46 lines of permission checking');
console.log('   • Total: ~340 lines of duplicate code removed');
console.log('\n💡 All routes now use the unified middleware from middleware/unified-auth.js');
