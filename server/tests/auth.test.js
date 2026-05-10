const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, server } = require('../server');
const User = require('../models/User');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  // Disconnect from the default DB connection initiated by server.js
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication & Token Flow', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should register a user and return both access and refresh cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
      
    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();
    
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toContain('pollvault_access_token=');
    expect(cookies).toContain('pollvault_refresh_token=');
  });

  it('should login and return both cookies, and allow access to /me', async () => {
    // 1. Register first
    await request(app).post('/api/auth/register').send(testUser);

    // 2. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.status).toBe(200);
    
    const cookies = loginRes.headers['set-cookie'];
    const accessTokenCookie = cookies.find(c => c.startsWith('pollvault_access_token='));
    
    // 3. Access /me using the access token cookie
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', accessTokenCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testUser.email);
  });

  it('should successfully refresh the access token', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const cookies = loginRes.headers['set-cookie'];
    const refreshTokenCookie = cookies.find(c => c.startsWith('pollvault_refresh_token='));

    // Call /refresh with the refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.headers['set-cookie'].join(';')).toContain('pollvault_access_token=');
  });

  it('should apply authLimiter ONLY to login/register, NOT /me', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    
    // Trigger authLimiter (100 requests in dev environment)
    for (let i = 0; i < 101; i++) {
      await request(app).post('/api/auth/login').send({ email: 'wrong@example.com', password: 'bad' });
    }
    
    // Next login should fail with 429
    const limitedRes = await request(app).post('/api/auth/login').send({ email: 'wrong@example.com', password: 'bad' });
    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.message).toMatch(/Too many attempts/);

    // But /me should STILL be accessible (returns 401 because no token, but NOT 429)
    const meRes = await request(app).get('/api/auth/me');
    expect(meRes.status).toBe(401);
  }, 15000);
});
