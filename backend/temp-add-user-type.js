const knex = require('./config/knex');

async function addUserType() {
  try {
    console.log('Adding user_type column to users table...');
    await knex.raw('ALTER TABLE users ADD COLUMN user_type ENUM(\'employee\', \'client\', \'contractor\') AFTER password');
    console.log('Column added successfully!');
    
    console.log('Adding index...');
    await knex.raw('ALTER TABLE users ADD INDEX idx_user_type (user_type)');
    console.log('Index added successfully!');
    
    await knex.destroy();
  } catch (error) {
    console.error('Error:', error);
    await knex.destroy();
  }
}

addUserType();
