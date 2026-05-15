import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../server.js';
import SystemSettings from '../models/SystemSettings.js';
import { jest } from '@jest/globals';

jest.setTimeout(60000);

let mongoServer;

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
  await SystemSettings.deleteMany({});
});

describe('System Routes', () => {
  it('should return public system configuration', async () => {
    // Create initial settings
    await SystemSettings.create({
      allowRegistrations: false,
      maintenanceMode: true,
      announcementMessage: 'Test Announcement',
    });

    const res = await request(app).get('/api/system/config');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Ensure it ONLY returns announcementMessage (no internal state leaked)
    expect(res.body.data).toHaveProperty('announcementMessage', 'Test Announcement');
    expect(res.body.data).not.toHaveProperty('allowRegistrations');
    expect(res.body.data).not.toHaveProperty('maintenanceMode');
  });

  it('should return empty announcement if no settings exist (creates defaults)', async () => {
    const res = await request(app).get('/api/system/config');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('announcementMessage', '');
  });
});
