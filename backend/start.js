// start.js
// Separate server startup file for production and development
require('dotenv').config({ path: '../.env' });
const app = require('./server');
const { testDatabaseConnection, testKnexConnection } = require('./config/database');

const PORT = 3001;

async function startServer() {
  try {
    await testDatabaseConnection();
    await testKnexConnection();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server or connect to DB:', error);
    process.exit(1);
  }
}

startServer();
