import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health API', () => {
  const app = createApp();

  it('GET /health returns healthy status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('GET /health/ready returns database status', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.data.database.status).toBe('connected');
  });
});
