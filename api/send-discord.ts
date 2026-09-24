import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './stock-notifier';

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
