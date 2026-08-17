import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../lib/db';
import { normalizePhone } from '../lib/phone';

export const phoneRouter = Router();

async function checkPhoneNumber(phoneNumber: unknown, res: Response) {
  const result = normalizePhone(phoneNumber);
  if (!result.valid) {
    return res.status(400).json({ error: result.reason ?? 'Invalid phone number.' });
  }

  const { rows } = await pool.query(
    'SELECT 1 FROM users WHERE phone_number = $1 LIMIT 1',
    [result.normalized]
  );

  return res.status(200).json({
    exists: rows.length > 0,
    normalized: result.normalized,
    message: rows.length > 0 ? 'Phone number already exists' : 'Good to go',
  });
}

// Used by the React page (JSON body avoids any URL length/encoding limits).
phoneRouter.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.body ?? {};
    return await checkPhoneNumber(phoneNumber, res);
  } catch (err) {
    return next(err);
  }
});

// Used by the Zoho SalesIQ Zobot: Deluge's invokeUrl does not reliably send a
// JSON POST body, so the bot calls this with the number as a query param instead.
phoneRouter.get('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.query;
    return await checkPhoneNumber(phoneNumber, res);
  } catch (err) {
    return next(err);
  }
});
