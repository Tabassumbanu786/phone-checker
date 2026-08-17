import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { phoneRouter } from './routes/phone';
import { checkRateLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api/phone', checkRateLimiter, phoneRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
