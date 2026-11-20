import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const PRODUCTS = Object.freeze({
  gangneung: Object.freeze({ code: 'GN', name: 'ソウルから出発！大関嶺の山と江陵の海を巡る旅', amount: 10000 }),
  'jeonju-damyang': Object.freeze({ code: 'JD', name: '韓屋と竹林にときめく韓国旅 ～全州・潭陽～', amount: 10000 }),
  danyang: Object.freeze({ code: 'DN', name: '韓国の絶景・癒しの旅 ～丹陽～', amount: 10000 }),
});

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(data));
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return json(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'このリクエスト方法には対応していません。' } });
}

function createOrderId(product, adultCount, secretKey) {
  const nonce = randomBytes(12).toString('hex');
  const payload = `${product.code}:${adultCount}:${nonce}`;
  const signature = createHmac('sha256', secretKey).update(payload).digest('hex').slice(0, 24);
  return `${product.code}_${adultCount}_${nonce}_${signature}`;
}

function verifyOrderId(orderId, secretKey) {
  if (typeof orderId !== 'string' || !/^(GN|JD|DN)_([1-9]|10)_[a-f0-9]{24}_[a-f0-9]{24}$/.test(orderId)) return null;
  const [code, rawCount, nonce, signature] = orderId.split('_');
  const adultCount = Number(rawCount);
  const product = Object.values(PRODUCTS).find((item) => item.code === code);
  if (!product) return null;
  const expected = createHmac('sha256', secretKey).update(`${code}:${adultCount}:${nonce}`).digest('hex').slice(0, 24);
  const suppliedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  return { ...product, adultCount, amount: product.amount * adultCount };
}

export { PRODUCTS, json, methodNotAllowed, createOrderId, verifyOrderId };
