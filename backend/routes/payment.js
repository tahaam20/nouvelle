const express = require('express');
const Order = require('../models/Order');
const { verifyPayment } = require('../utils/zarinpal');

const router = express.Router();

// GET /api/payment/verify?Authority=...&Status=OK|NOK&orderId=...
// این آدرس همان ZARINPAL_CALLBACK_URL است که کاربر بعد از پرداخت به آن هدایت می‌شود.
router.get('/verify', async (req, res) => {
  const { Authority, Status, orderId } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || '/';

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.redirect(`${frontendUrl}/#/checkout-result?status=error&reason=order-not-found`);

    if (Status !== 'OK') {
      order.status = 'canceled';
      await order.save();
      return res.redirect(`${frontendUrl}/#/checkout-result?status=canceled&orderId=${order._id}`);
    }

    const result = await verifyPayment({ amount: order.total, authority: Authority });
    if (!result.ok) {
      order.status = 'canceled';
      await order.save();
      return res.redirect(`${frontendUrl}/#/checkout-result?status=failed&orderId=${order._id}`);
    }

    order.payment.paid = true;
    order.payment.refId = result.refId;
    order.payment.paidAt = new Date();
    order.status = 'processing';
    await order.save();

    return res.redirect(`${frontendUrl}/#/checkout-result?status=success&orderId=${order._id}&refId=${result.refId}`);
  } catch (err) {
    return res.redirect(`${frontendUrl}/#/checkout-result?status=error`);
  }
});

module.exports = router;
