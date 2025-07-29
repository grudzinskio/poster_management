// backend/scripts/createUser.js
// Run this script to create test users in your database

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
  port: process.env.DB_PORT || 3306,
  authPlugins: {
    mysql_native_password: () => () => Buffer.alloc(0)
  }
};

async function createUser(email, password, role = 'employee') {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert user into database
    const [result] = await connection.execute(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );
    
    console.log(`✅ User created successfully:`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
    console.log(`   User ID: ${result.insertId}`);
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error(`❌ User with email ${email} already exists`);
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Create some test users
async function createTestUsers() {
  console.log('Creating test users...');
  
  await createUser('employee@test.com', 'password123', 'employee');
  await createUser('client@test.com', 'password123', 'client');
  await createUser('contractor@test.com', 'password123', 'contractor');
  await createUser('admin@test.com', 'admin123', 'employee');
  
  console.log('\n✅ Test users creation completed!');
  console.log('You can now log in with:');
  console.log('- employee@test.com / password123');
  console.log('- client@test.com / password123');
  console.log('- contractor@test.com / password123');
  console.log('- admin@test.com / admin123');
}

// Run the script
if (require.main === module) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createUser };