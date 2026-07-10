const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { requestPayment, verifyPayment } = require('../utils/zarinpal');

const router = express.Router();

// POST /api/orders — ثبت سفارش جدید از روی سبد خرید کاربر و شروع فرآیند پرداخت
// body: { items: [{ productId, qty }], fullname, phone, address }
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, fullname, phone, address } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'سبد خرید خالی است.' });
    if (!fullname || !phone || !address) {
      return res.status(400).json({ message: 'نام، شماره تماس و آدرس الزامی است.' });
    }

    const orderItems = [];
    let total = 0;
    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `محصول انتخابی موجود نیست.` });
      }
      const qty = Math.max(1, Number(it.qty) || 1);
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        weight: product.weight,
        unitPrice: product.price,
        qty,
      });
      total += product.price * qty;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
      fullname,
      phone,
      address,
      status: 'pending_payment',
    });

    // به‌روزرسانی پروفایل کاربر با آخرین آدرس/تلفن استفاده‌شده
    req.user.fullname = fullname;
    req.user.phone = phone;
    req.user.address = address;
    await req.user.save();

    // اگر مرچنت آیدی واقعی زرین‌پال تنظیم نشده، سفارش را بدون اتصال واقعی به درگاه برمی‌گردانیم
    // (برای تست بدون حساب زرین‌پال)
    const merchantConfigured =
      process.env.ZARINPAL_MERCHANT_ID && !process.env.ZARINPAL_MERCHANT_ID.startsWith('00000000');

    if (!merchantConfigured) {
      return res.status(201).json({
        order,
        payment: null,
        warning: 'مرچنت آیدی زرین‌پال تنظیم نشده است؛ این سفارش بدون پرداخت واقعی ثبت شد.',
      });
    }

    const payment = await requestPayment({
      amount: total,
      description: `پرداخت سفارش گالری نوول - ${order._id}`,
      mobile: phone,
      orderId: order._id.toString(),
    });

    if (!payment.ok) {
      return res.status(502).json({ message: 'اتصال به درگاه پرداخت با خطا مواجه شد.', error: payment.error, order });
    }

    order.payment.authority = payment.authority;
    await order.save();

    res.status(201).json({ order, payment: { paymentUrl: payment.paymentUrl } });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور در ثبت سفارش.', error: err.message });
  }
});

// GET /api/orders/mine — سفارش‌های کاربر لاگین‌شده
router.get('/mine', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

// GET /api/orders/:id — جزییات یک سفارش (فقط صاحب سفارش یا مدیر)
router.get('/:id', requireAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'دسترسی مجاز نیست.' });
  }
  res.json({ order });
});

module.exports = router;
