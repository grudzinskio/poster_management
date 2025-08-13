const knex = require('./config/knex');

async function checkRoles() {
  console.log('🎭 Checking current roles in database...\n');
  
  try {
    const roles = await knex('roles').select('*').orderBy('id');
    
    console.log('Roles found:', roles.length);
    roles.forEach(role => {
      console.log(`ID: ${role.id}, Name: "${role.name}", Description: ${role.description || 'null'}`);
    });
    
    console.log('\n🔍 Checking for empty or null role names...');
    const emptyRoles = roles.filter(r => !r.name || r.name.trim() === '');
    if (emptyRoles.length > 0) {
      console.log('❌ Found empty roles:', emptyRoles);
    } else {
      console.log('✅ No empty roles found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkRoles();
