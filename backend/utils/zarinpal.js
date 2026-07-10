const axios = require('axios');

const isSandbox = () => String(process.env.ZARINPAL_SANDBOX).toLowerCase() === 'true';

function baseUrls() {
  if (isSandbox()) {
    return {
      request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      verify: 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
      startPay: 'https://sandbox.zarinpal.com/pg/StartPay/',
    };
  }
  return {
    request: 'https://api.zarinpal.com/pg/v4/payment/request.json',
    verify: 'https://api.zarinpal.com/pg/v4/payment/verify.json',
    startPay: 'https://www.zarinpal.com/pg/StartPay/',
  };
}

/**
 * ایجاد یک تراکنش پرداخت جدید در زرین‌پال
 * amount باید به تومان باشد؛ زرین‌پال داخلی به ریال تبدیل می‌کند
 */
async function requestPayment({ amount, description, mobile, email, orderId }) {
  const urls = baseUrls();
  const payload = {
    merchant_id: process.env.ZARINPAL_MERCHANT_ID,
    amount: Math.round(amount) * 10, // تومان -> ریال
    callback_url: `${process.env.ZARINPAL_CALLBACK_URL}?orderId=${orderId}`,
    description: description || 'خرید از گالری نوول',
    metadata: { mobile, email },
  };

  const { data } = await axios.post(urls.request, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (data?.data?.code === 100) {
    return {
      ok: true,
      authority: data.data.authority,
      paymentUrl: urls.startPay + data.data.authority,
    };
  }
  return { ok: false, error: data?.errors || 'خطای نامشخص از درگاه پرداخت' };
}

/**
 * تایید تراکنش بعد از بازگشت کاربر از درگاه
 */
async function verifyPayment({ amount, authority }) {
  const urls = baseUrls();
  const payload = {
    merchant_id: process.env.ZARINPAL_MERCHANT_ID,
    amount: Math.round(amount) * 10,
    authority,
  };

  const { data } = await axios.post(urls.verify, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // کد ۱۰۰ یعنی تایید موفق، کد ۱۰۱ یعنی قبلا تایید شده (idempotent)
  if (data?.data?.code === 100 || data?.data?.code === 101) {
    return { ok: true, refId: data.data.ref_id };
  }
  return { ok: false, error: data?.errors || 'پرداخت تایید نشد' };
}

module.exports = { requestPayment, verifyPayment, isSandbox };
