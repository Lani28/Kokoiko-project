import { json, methodNotAllowed, verifyOrderId } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) return json(res, 503, { error: { code: 'PAYMENT_NOT_CONFIGURED', message: '決済設定を確認できません。時間をおいて再度お試しください。' } });

  const { paymentKey, orderId, amount } = req.body || {};
  if (typeof paymentKey !== 'string' || !paymentKey.trim() || paymentKey.length > 200) {
    return json(res, 400, { error: { code: 'INVALID_PAYMENT_KEY', message: '決済情報を確認できません。' } });
  }
  const product = verifyOrderId(orderId, secretKey);
  if (!product) return json(res, 400, { error: { code: 'INVALID_ORDER', message: '注文情報を確認できません。もう一度お申し込みください。' } });
  if (!Number.isSafeInteger(amount) || amount !== product.amount) {
    return json(res, 400, { error: { code: 'AMOUNT_MISMATCH', message: 'お支払い金額が商品価格と一致しません。決済は承認されていません。' } });
  }

  let tossResponse;
  try {
    tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: product.amount }),
    });
  } catch {
    return json(res, 502, { error: { code: 'TOSS_UNAVAILABLE', message: '決済承認サーバーに接続できませんでした。決済状況を確認してから再度お試しください。' } });
  }

  const result = await tossResponse.json().catch(() => ({}));
  if (!tossResponse.ok) {
    return json(res, tossResponse.status, {
      error: {
        code: result.code || 'PAYMENT_CONFIRM_FAILED',
        message: result.message || '決済を完了できませんでした。決済状況を確認してください。',
      },
    });
  }

  return json(res, 200, {
    status: result.status,
    orderId: result.orderId,
    orderName: result.orderName,
    approvedAt: result.approvedAt,
    method: result.method,
  });
};
