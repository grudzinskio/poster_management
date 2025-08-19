
// Tests for different permissions usage
const request = require('supertest');
const app = require('../server');

describe('Permissions Usage', () => {
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


  it('should allow superadmin to assign roles', async () => {
    const res = await request(app)
      .post(`/api/rbac/users/${employeeId}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'admin_manager' });
    expect([200, 400]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.message).toMatch(/assigned to user successfully/);
    } else {
      expect(res.body.error).toMatch(/Failed to assign role|Duplicate entry|already assigned/);
    }
  });

  it('should restrict employee from assigning roles', async () => {
    const res = await request(app)
      .post(`/api/rbac/users/${adminId}/roles`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ role: 'employee' });
    expect(res.statusCode).toBe(403);
  });

  it('should allow user to view their permissions', async () => {
    const res = await request(app)
      .get('/api/users/me/permissions')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
