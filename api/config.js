import { json, methodNotAllowed } from './_shared.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const clientKey = process.env.TOSS_CLIENT_KEY;
  if (!clientKey) return json(res, 503, { error: { code: 'PAYMENT_NOT_CONFIGURED', message: '決済設定を確認できません。時間をおいて再度お試しください。' } });
  return json(res, 200, { clientKey, testMode: clientKey.startsWith('test_') });
};
