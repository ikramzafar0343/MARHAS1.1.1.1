import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/users/user.model.js';
import { ROLES } from '../src/constants/roles.js';

describe('Auth API', () => {
  const app = createApp();

  it('registers a new customer', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@marhas.com',
      password: 'TestPass123',
      confirmPassword: 'TestPass123'
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@marhas.com');
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('logs in an existing customer', async () => {
    const passwordHash = await User.hashPassword('TestPass123');
    await User.create({
      name: 'Login User',
      email: 'login@marhas.com',
      passwordHash,
      role: ROLES.CUSTOMER,
      isEmailVerified: true
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'login@marhas.com',
      password: 'TestPass123'
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'missing@marhas.com',
      password: 'wrong'
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('registers and logs in with special characters in password', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Special User',
      email: 'special@marhas.com',
      password: 'Test&Pass<>1',
      confirmPassword: 'Test&Pass<>1'
    });

    expect(response.status).toBe(201);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'special@marhas.com',
      password: 'Test&Pass<>1'
    });

    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeDefined();
  });
});
