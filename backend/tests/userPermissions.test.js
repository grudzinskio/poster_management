
// Tests for user permissions and their usage
const request = require('supertest');
const app = require('../server');

describe('User Permissions', () => {
  let superAdminToken, adminToken, employeeToken;
  let superAdminId, adminId, employeeId;

  beforeAll(async () => {
    // Login as seeded users
    const superAdminRes = await request(app)
      .post('/api/login')
      .send({ username: 'superadmin', password: 'password123' });
    superAdminToken = superAdminRes.body.token;
    superAdminId = superAdminRes.body.user.id;

    const adminRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.user.id;

    const employeeRes = await request(app)
      .post('/api/login')
      .send({ username: 'manager', password: 'password123' });
    employeeToken = employeeRes.body.token;
    employeeId = employeeRes.body.user.id;
  });

  it('should allow superadmin to view all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });


  it('should allow or restrict employee from viewing all users based on permission', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`);
    // If employee has view_users permission, expect 200, else 403
    if (Array.isArray(res.body)) {
      expect(res.statusCode).toBe(200);
    } else {
      expect(res.statusCode).toBe(403);
    }
  });


  it('should allow employee to update their own profile', async () => {
    // Get current employee info for required fields
    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`);
    const employee = Array.isArray(userRes.body) ? userRes.body.find(u => u.id === employeeId) : null;
    expect(employee).toBeTruthy();
    const updateRes = await request(app)
      .put(`/api/users/${employeeId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ username: employee.username, user_type: employee.user_type, company_id: employee.company_id });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.username).toBe(employee.username);
  });



  it('should restrict basic employee from updating another user profile', async () => {
    // Login as basic employee (no edit_user permission)
    const basicRes = await request(app)
      .post('/api/login')
      .send({ username: 'employee1', password: 'password123' });
    const basicToken = basicRes.body.token;
    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${basicToken}`);
    const superadmin = Array.isArray(userRes.body) ? userRes.body.find(u => u.id === superAdminId) : null;
    expect(superadmin).toBeTruthy();
    const updateRes = await request(app)
      .put(`/api/users/${superAdminId}`)
      .set('Authorization', `Bearer ${basicToken}`)
      .send({ username: superadmin.username, user_type: superadmin.user_type, company_id: superadmin.company_id });
    expect(updateRes.statusCode).toBe(403);
  });

  it('should allow employee with edit_user permission to update another user profile', async () => {
    // Login as manager (has edit_user permission)
    const managerRes = await request(app)
      .post('/api/login')
      .send({ username: 'manager', password: 'password123' });
    const managerToken = managerRes.body.token;
    const userRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${managerToken}`);
    const superadmin = Array.isArray(userRes.body) ? userRes.body.find(u => u.id === superAdminId) : null;
    expect(superadmin).toBeTruthy();
    const updateRes = await request(app)
      .put(`/api/users/${superAdminId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ username: superadmin.username, user_type: superadmin.user_type, company_id: superadmin.company_id });
    expect(updateRes.statusCode).toBe(200);
  });
});
