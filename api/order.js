import { PRODUCTS, json, methodNotAllowed, createOrderId } from './_shared.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) return json(res, 503, { error: { code: 'PAYMENT_NOT_CONFIGURED', message: '決済設定を確認できません。時間をおいて再度お試しください。' } });

  const { productId, adultCount } = req.body || {};
  const product = PRODUCTS[productId];
  if (!product) return json(res, 400, { error: { code: 'INVALID_PRODUCT', message: '商品情報を確認できません。商品ページからやり直してください。' } });
  if (!Number.isInteger(adultCount) || adultCount < 1 || adultCount > 10) {
    return json(res, 400, { error: { code: 'INVALID_GUEST_COUNT', message: '大人のご参加人数を確認してください。' } });
  }

  return json(res, 200, {
    orderId: createOrderId(product, adultCount, secretKey),
    orderName: product.name,
    unitAmount: product.amount,
    adultCount,
    amount: product.amount * adultCount,
    currency: 'KRW',
  });
};
