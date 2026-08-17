import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found.' });
}
