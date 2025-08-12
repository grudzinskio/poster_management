const knex = require('./config/knex');

async function updateUserTypes() {
  try {
    console.log('Updating user types based on roles...');
    
    // Set employee type for admin, manager, and employee users
    await knex('users').where('id', 20).update({ user_type: 'employee' }); // admin
    await knex('users').where('id', 21).update({ user_type: 'employee' }); // manager
    await knex('users').where('id', 22).update({ user_type: 'employee' }); // employee1
    
    // Set client type for client users
    await knex('users').whereIn('id', [23, 24]).update({ user_type: 'client' }); // client1, client2
    
    // Set contractor type for contractor users
    await knex('users').whereIn('id', [25, 26]).update({ user_type: 'contractor' }); // contractor1, contractor2
    
    console.log('User types updated successfully!');
    
    console.log('Checking updated users:');
    const users = await knex('users').select('id', 'username', 'user_type');
    console.log(users);
    
    await knex.destroy();
  } catch (error) {
    console.error('Error:', error);
    await knex.destroy();
  }
}

updateUserTypes();
