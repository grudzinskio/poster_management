const knex = require('./config/knex');

async function debugPermissions() {
  console.log('Testing permissions query...');
  
  try {
    const permissions = await knex('permissions')
      .select('id', 'permission', 'description')
      .orderBy('permission');
    
    console.log('Permissions found:', permissions.length);
    console.log('Sample:', permissions.slice(0, 3));
  } catch (error) {
    console.error('Database error:', error);
  }
  
  process.exit(0);
}

debugPermissions();
