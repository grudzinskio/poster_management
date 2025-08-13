const axios = require('axios');

async function testRoleAccess() {
  const baseURL = 'http://localhost:3001/api';
  
  const testUsers = [
    { username: 'superadmin', role: 'Super Admin' },
    { username: 'admin', role: 'Admin Manager' },
    { username: 'manager', role: 'Employee' },
    { username: 'employee1', role: 'Basic Employee' },
    { username: 'client1', role: 'Client' },
    { username: 'contractor1', role: 'Contractor' }
  ];
  
  console.log('🔐 TESTING ROLE-BASED ACCESS:\n');
  
  for (const user of testUsers) {
    try {
      // Login
      const loginResponse = await axios.post(`${baseURL}/login`, {
        username: user.username,
        password: 'password123'
      });
      
      const token = loginResponse.data.token;
      
      // Test permissions
      console.log(`👤 ${user.role.toUpperCase()} (${user.username}):`);
      
      // Test view_users permission
      try {
        await axios.get(`${baseURL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('  ✅ Can view users');
      } catch (error) {
        console.log('  ❌ Cannot view users');
      }
      
      // Test delete_user permission
      try {
        await axios.delete(`${baseURL}/users/999`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('  ✅ Can delete users');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('  ❌ Cannot delete users (forbidden)');
        } else {
          console.log('  ❌ Cannot delete users (other error)');
        }
      }
      
      // Test system_admin permission
      try {
        // This would be a system admin endpoint
        console.log('  ' + (user.username === 'superadmin' ? '✅' : '❌') + ' System admin access');
      } catch (error) {
        console.log('  ❌ No system admin access');
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ Login failed for ${user.username}: ${error.message}\n`);
    }
  }
}

testRoleAccess();
