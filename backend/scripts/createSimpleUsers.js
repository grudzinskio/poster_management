// backend/scripts/createSimpleUsers.js
// Script to create users with plain text passwords (no hashing)

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
  port: process.env.DB_PORT || 3306,
  ssl: false
};

async function clearAndCreateUsers() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Clear all existing users
    console.log('\nClearing existing users...');
    await connection.execute('DELETE FROM users');
    console.log('✅ All existing users cleared');
    
    // Create new users with simple passwords
    console.log('\nCreating new users...');
    
    const users = [
      { username: 'employee1', password: 'pass123', role: 'employee' },
      { username: 'client1', password: 'pass123', role: 'client' },
      { username: 'contractor1', password: 'pass123', role: 'contractor' },
      { username: 'admin', password: 'admin', role: 'employee' },
      { username: 'john', password: 'john123', role: 'employee' },
      { username: 'test', password: 'test', role: 'client' }
    ];
    
    for (const user of users) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [user.username, user.password, user.role]
        );
        
        console.log(`✅ Created user: ${user.username} (${user.role}) - Password: ${user.password}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.username}:`, error.message);
      }
    }
    
    // Verify users were created
    console.log('\nVerifying created users...');
    const [allUsers] = await connection.execute('SELECT username, role FROM users ORDER BY id');
    
    console.log('\n📋 Users in database:');
    console.log('Username     | Role       | Password');
    console.log('-------------|------------|----------');
    
    for (const user of users) {
      const dbUser = allUsers.find(u => u.username === user.username);
      if (dbUser) {
        console.log(`${user.username.padEnd(12)} | ${user.role.padEnd(10)} | ${user.password}`);
      }
    }
    
    console.log('\n✅ Setup completed! You can now log in with any of the users above.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('\n💡 You may need to update your table structure. Run this SQL:');
      console.log('ALTER TABLE users CHANGE COLUMN password_hash password VARCHAR(255) NOT NULL;');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 Users table does not exist. Create it with:');
      console.log('CREATE TABLE users (');
      console.log('  id INT AUTO_INCREMENT PRIMARY KEY,');
      console.log('  username VARCHAR(255) NOT NULL UNIQUE,');
      console.log('  password VARCHAR(255) NOT NULL,');
      console.log('  role ENUM(\'employee\', \'client\', \'contractor\') NOT NULL');
      console.log(');');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed.');
    }
  }
}

clearAndCreateUsers();