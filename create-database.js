// create-database.js
// Script to create the database if it doesn't exist
require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');

async function createDatabase() {
  console.log('🔗 Connecting to MySQL server...');
  
  // Connect without specifying database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('📊 Creating database if it doesn\'t exist...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✅ Database '${process.env.DB_NAME}' created or already exists`);
    
    // Verify the database exists
    const [rows] = await connection.execute('SHOW DATABASES');
    const databases = rows.map(row => row.Database);
    
    if (databases.includes(process.env.DB_NAME)) {
      console.log(`✅ Confirmed: Database '${process.env.DB_NAME}' exists`);
    } else {
      console.log(`❌ Database '${process.env.DB_NAME}' was not created`);
    }
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createDatabase()
  .then(() => {
    console.log('🎉 Database creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database creation failed:', error);
    process.exit(1);
  });
