// Test script to verify admin login works with new RBAC system
const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:3001/api/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    const token = response.data.token;
    const user = response.data.user;
    
    console.log('\nUser roles:', user.roles);
    console.log('Has employee role:', user.roles.includes('employee'));
    console.log('Has client role:', user.roles.includes('client'));
    
    // Test accessing users endpoint (admin-only)
    console.log('\nTesting users endpoint access...');
    const usersResponse = await axios.get('http://localhost:3001/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Users endpoint accessible:', usersResponse.status === 200);
    console.log('Number of users:', usersResponse.data.users.length);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAdminLogin();
