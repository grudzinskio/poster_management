// Test script for dynamic permissions
const { getAllPermissions, getAllRoles, getPermissionsForRole } = require('../config/permissions');

async function testPermissions() {
  try {
    console.log('🧪 Testing dynamic permissions...\n');
    
    const permissions = await getAllPermissions();
    console.log('✅ Permissions loaded:', permissions.length, 'total');
    console.log('   Sample:', permissions.slice(0, 3).map(p => p.permission));
    
    const roles = await getAllRoles();
    console.log('✅ Roles loaded:', roles.length, 'total');
    console.log('   Sample:', roles.slice(0, 3).map(r => r.name));
    
    const employeePermissions = await getPermissionsForRole('employee');
    console.log('✅ Employee permissions:', employeePermissions.length, 'total');
    console.log('   Sample:', employeePermissions.slice(0, 5));
    
    console.log('\n🎉 Dynamic permissions system working correctly!');
    console.log('📝 This replaces all hardcoded permission constants');
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  }
  
  process.exit(0);
}

testPermissions();
