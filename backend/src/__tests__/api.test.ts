import request from 'supertest';

const queryMock = jest.fn();

jest.mock('../lib/db', () => ({
  pool: { query: (...args: unknown[]) => queryMock(...args) },
}));

// Imported after the mock so createApp() picks up the mocked pool.
import { createApp } from '../app';

const app = createApp();

describe('POST /api/phone/check', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('returns exists:true and "Phone number already exists" when found', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const res = await request(app)
      .post('/api/phone/check')
      .send({ phoneNumber: '415-555-2671' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      exists: true,
      normalized: '+14155552671',
      message: 'Phone number already exists',
    });
    expect(queryMock).toHaveBeenCalledWith(expect.any(String), ['+14155552671']);
  });

  it('returns exists:false and "Good to go" when not found', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/phone/check')
      .send({ phoneNumber: '650-555-1212' });

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
    expect(res.body.message).toBe('Good to go');
  });

  it('normalizes differently formatted duplicate numbers to the same lookup value', async () => {
    queryMock.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const res1 = await request(app).post('/api/phone/check').send({ phoneNumber: '(415) 555-2671' });
    const res2 = await request(app).post('/api/phone/check').send({ phoneNumber: '+1 415 555 2671' });

    expect(res1.body.normalized).toBe(res2.body.normalized);
  });

  it('rejects empty phone number with 400', async () => {
    const res = await request(app).post('/api/phone/check').send({ phoneNumber: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects missing phone number with 400', async () => {
    const res = await request(app).post('/api/phone/check').send({});
    expect(res.status).toBe(400);
  });

  it('rejects invalid phone number with 400', async () => {
    const res = await request(app).post('/api/phone/check').send({ phoneNumber: 'not-a-phone' });
    expect(res.status).toBe(400);
  });

  it('returns 500 with a generic message when the database query fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));

    const res = await request(app).post('/api/phone/check').send({ phoneNumber: '415-555-2671' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error.' });
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('exposes a health check endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/phone/check (used by the Zoho SalesIQ bot)', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('returns exists:true for a query-param phone number that is found', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const res = await request(app).get('/api/phone/check').query({ phoneNumber: '415-555-2671' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      exists: true,
      normalized: '+14155552671',
      message: 'Phone number already exists',
    });
  });

  it('returns exists:false for a query-param phone number that is not found', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/phone/check').query({ phoneNumber: '650-555-1212' });

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
    expect(res.body.message).toBe('Good to go');
  });

  it('rejects a missing query param with 400', async () => {
    const res = await request(app).get('/api/phone/check');
    expect(res.status).toBe(400);
  });
});

describe('rate limiting', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it('returns 429 once the per-minute limit is exceeded', async () => {
    const limit = Number(process.env.RATE_LIMIT_PER_MINUTE);
    let lastStatus = 200;

    for (let i = 0; i < limit + 1; i++) {
      const res = await request(app).post('/api/phone/check').send({ phoneNumber: '415-555-2671' });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
