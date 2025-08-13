const knex = require('./config/knex');

async function testRoles() {
  const roles = await knex('roles').select('*').orderBy('id');
  console.log('🎭 ROLE HIERARCHY:\n');
  
  for (const role of roles) {
    const permissions = await knex('role_permissions')
      .join('permissions', 'role_permissions.permission', 'permissions.id')
      .where('role_permissions.role', role.id)
      .select('permissions.permission')
      .orderBy('permissions.permission');
    
    console.log(`${role.name.toUpperCase().replace('_', ' ')} (${permissions.length} permissions):`);
    permissions.forEach(p => console.log(`  ✓ ${p.permission}`));
    console.log('');
  }
  
  process.exit(0);
}

testRoles();
