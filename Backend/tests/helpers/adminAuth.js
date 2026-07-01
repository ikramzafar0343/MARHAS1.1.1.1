import request from 'supertest';

export const loginAdmin = async (app, { email, password }) => {
  const login = await request(app).post('/api/v1/auth/admin/login').send({ email, password });

  expect(login.status).toBe(200);
  expect(login.body.data.requiresOtp).toBe(true);
  expect(login.body.data.challengeId).toBeDefined();
  expect(login.body.data.otp).toBeDefined();

  const verify = await request(app).post('/api/v1/auth/admin/login/verify-otp').send({
    challengeId: login.body.data.challengeId,
    otp: login.body.data.otp
  });

  expect(verify.status).toBe(200);
  expect(verify.body.data.accessToken).toBeDefined();

  return verify.body.data.accessToken;
};
