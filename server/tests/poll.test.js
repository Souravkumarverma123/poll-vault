import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../server.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js';
import Response from '../models/Response.js';
import { jest } from '@jest/globals';

jest.setTimeout(60000);

let mongoServer;
let creatorCookie;
let respondentCookie;
let creatorId;
let respondentId;

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
  await Response.deleteMany({});

  // Create creator
  const creatorRes = await request(app).post('/api/auth/register').send({
    name: 'Creator User', email: 'creator@test.com', password: 'password123'
  });
  creatorCookie = creatorRes.headers['set-cookie'].find(c => c.startsWith('pollvault_access_token='));
  creatorId = creatorRes.body.data.user._id;

  // Create respondent
  const respondentRes = await request(app).post('/api/auth/register').send({
    name: 'Respondent User', email: 'respondent@test.com', password: 'password123'
  });
  respondentCookie = respondentRes.headers['set-cookie'].find(c => c.startsWith('pollvault_access_token='));
  respondentId = respondentRes.body.data.user._id;
});

describe('Poll Routes', () => {
  const samplePoll = {
    title: 'Test Poll',
    description: 'A test poll',
    responseMode: 'anonymous',
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    questions: [
      {
        questionText: 'Favorite color?',
        questionType: 'single',
        options: ['Red', 'Blue', 'Green'],
        isRequired: true
      },
      {
        questionText: 'Any comments?',
        questionType: 'text',
        isRequired: false
      }
    ]
  };

  it('should create a poll and return the shareId', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Cookie', creatorCookie)
      .send(samplePoll);
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.poll.shareId).toBeDefined();
    expect(res.body.data.poll.title).toBe(samplePoll.title);
  });

  it('should validate poll creation payload', async () => {
    const invalidPoll = { ...samplePoll, title: '' }; // Missing title
    const res = await request(app)
      .post('/api/polls')
      .set('Cookie', creatorCookie)
      .send(invalidPoll);
      
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation failed/);
  });

  describe('Poll Lifecycle & Responses', () => {
    let pollId;
    let shareId;
    let q1Id;
    let q2Id;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/polls')
        .set('Cookie', creatorCookie)
        .send(samplePoll);
      pollId = res.body.data.poll._id;
      shareId = res.body.data.poll.shareId;
      q1Id = res.body.data.poll.questions[0]._id;
      q2Id = res.body.data.poll.questions[1]._id;
    });

    it('should submit a valid response to an active (unpublished) poll', async () => {
      // Don't publish it — publishing locks responses
      const res = await request(app)
        .post(`/api/polls/${pollId}/responses`)
        .set('Cookie', respondentCookie)
        .send({
          answers: [
            { questionId: q1Id, selectedOption: 'Blue' },
            { questionId: q2Id, textAnswer: 'Hello world' }
          ]
        });
        
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should prevent responding to a published poll (results locked)', async () => {
      await request(app).patch(`/api/polls/${pollId}/publish`).set('Cookie', creatorCookie);

      const res = await request(app)
        .post(`/api/polls/${pollId}/responses`)
        .set('Cookie', respondentCookie)
        .send({
          answers: [{ questionId: q1Id, selectedOption: 'Red' }]
        });
        
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/No more responses accepted/);
    });

    it('should prevent duplicate responses from the same user', async () => {
      await request(app)
        .post(`/api/polls/${pollId}/responses`)
        .set('Cookie', respondentCookie)
        .send({ answers: [{ questionId: q1Id, selectedOption: 'Blue' }] });

      const res2 = await request(app)
        .post(`/api/polls/${pollId}/responses`)
        .set('Cookie', respondentCookie)
        .send({ answers: [{ questionId: q1Id, selectedOption: 'Red' }] });
        
      expect(res2.status).toBe(409);
      expect(res2.body.message).toMatch(/already submitted a response/);
    });

    it('should fetch live analytics correctly', async () => {
      await request(app)
        .post(`/api/polls/${pollId}/responses`)
        .set('Cookie', respondentCookie)
        .send({ answers: [{ questionId: q1Id, selectedOption: 'Green' }] });

      const res = await request(app)
        .get(`/api/polls/${pollId}/analytics`)
        .set('Cookie', creatorCookie);
        
      expect(res.status).toBe(200);
      expect(res.body.data.totalResponses).toBe(1);
      const greenOption = res.body.data.questions[0].options.find(o => o.optionText === 'Green');
      expect(greenOption.count).toBe(1);
    });
  });
});
