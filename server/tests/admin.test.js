import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../server.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js';
import SystemSettings from '../models/SystemSettings.js';
import { jest } from '@jest/globals';

jest.setTimeout(60000);

let mongoServer;
let adminCookie;
let userCookie;
let adminId;
let userId;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
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
  await Poll.deleteMany({});
  await SystemSettings.deleteMany({});

  // Create admin
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123'
  });
  adminCookie = adminRes.headers['set-cookie'].find(c => c.startsWith('pollvault_access_token='));
  adminId = adminRes.body.data.user._id;

  // Make them an admin directly in DB
  await User.findByIdAndUpdate(adminId, { role: 'admin' });

  // Create normal user
  const userRes = await request(app).post('/api/auth/register').send({
    name: 'Normal User',
    email: 'user@test.com',
    password: 'password123'
  });
  userCookie = userRes.headers['set-cookie'].find(c => c.startsWith('pollvault_access_token='));
  userId = userRes.body.data.user._id;
});

describe('Admin Routes', () => {
  it('should reject non-admin users from admin routes', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', userCookie);
      
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Not authorized as an admin/);
  });

  it('should allow admin to fetch stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', adminCookie);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalUsers');
    expect(res.body.data).toHaveProperty('totalPolls');
    expect(res.body.data).toHaveProperty('totalResponses');
  });

  it('should allow admin to change system settings', async () => {
    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Cookie', adminCookie)
      .send({
        allowRegistrations: false,
        announcementMessage: 'Admin Test Banner'
      });
      
    expect(res.status).toBe(200);
    expect(res.body.data.allowRegistrations).toBe(false);
    expect(res.body.data.announcementMessage).toBe('Admin Test Banner');
  });

  it('should validate announcement message length', async () => {
    const longMessage = 'A'.repeat(501);
    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Cookie', adminCookie)
      .send({ announcementMessage: longMessage });
      
    expect(res.status).toBe(400);
  });

  it('should allow admin to fetch all users and update roles', async () => {
    const getRes = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);
    
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.users.length).toBeGreaterThanOrEqual(2);

    const updateRes = await request(app)
      .patch(`/api/admin/users/${userId}/role`)
      .set('Cookie', adminCookie)
      .send({ role: 'admin' });
      
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.user.role).toBe('admin');
  });

  it('should allow admin to delete users', async () => {
    const deleteRes = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Cookie', adminCookie);
      
    expect(deleteRes.status).toBe(200);

    const checkUser = await User.findById(userId);
    expect(checkUser).toBeNull();
  });
});
