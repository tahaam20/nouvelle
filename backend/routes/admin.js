const express = require('express');
const Product = require('../models/Product');
const { CATEGORY_MAP } = require('../models/Product');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { calcPrice } = require('../utils/pricing');

const router = express.Router();

// همه‌ی route های این فایل فقط برای مدیر لاگین‌شده در دسترس هستند
router.use(requireAuth, requireAdmin);

async function getGoldPrice() {
  const setting = await Setting.findOne({ key: 'goldPrice18k' });
  return setting ? setting.value : 0;
}

/* ---------------- محصولات ---------------- */

// POST /api/admin/products — افزودن محصول جدید (multipart/form-data با فیلد image)
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { name, category, subcategory, weight, laborFee } = req.body;
    if (!name || !category || !subcategory || !weight) {
      return res.status(400).json({ message: 'نام، دسته‌بندی، زیرشاخه و وزن الزامی است.' });
    }
    if (!CATEGORY_MAP[category] || !CATEGORY_MAP[category].includes(subcategory)) {
      return res.status(400).json({ message: 'دسته‌بندی یا زیرشاخه نامعتبر است.' });
    }

    const goldPrice = await getGoldPrice();
    const breakdown = calcPrice(weight, laborFee || 0, goldPrice);

    const product = await Product.create({
      name,
      category,
      subcategory,
      weight,
      laborFee: Number(laborFee) || 0,
      goldPriceAtCreation: goldPrice,
      profit: breakdown.profit,
      tax: breakdown.tax,
      price: breakdown.total,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    res.status(201).json({ product, breakdown });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت محصول.', error: err.message });
  }
});

// GET /api/admin/products — همه محصولات (شامل غیرفعال‌ها)
router.get('/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ products });
});

// PUT /api/admin/products/:id — ویرایش محصول (قیمت مجددا محاسبه می‌شود)
router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'محصول یافت نشد.' });

    const { name, category, subcategory, weight, laborFee, isActive } = req.body;
    if (name) product.name = name;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (weight) product.weight = weight;
    if (laborFee !== undefined) product.laborFee = Number(laborFee);
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    const goldPrice = await getGoldPrice();
    const breakdown = calcPrice(product.weight, product.laborFee, goldPrice);
    product.goldPriceAtCreation = goldPrice;
    product.profit = breakdown.profit;
    product.tax = breakdown.tax;
    product.price = breakdown.total;

    await product.save();
    res.json({ product, breakdown });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ویرایش محصول.', error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'محصول یافت نشد.' });
  res.json({ message: 'محصول حذف شد.' });
});

// POST /api/admin/products/recalculate-all — بازمحاسبه قیمت همه محصولات با نرخ روز جدید طلا
router.post('/products/recalculate-all', async (req, res) => {
  const goldPrice = await getGoldPrice();
  const products = await Product.find();
  for (const product of products) {
    const breakdown = calcPrice(product.weight, product.laborFee, goldPrice);
    product.goldPriceAtCreation = goldPrice;
    product.profit = breakdown.profit;
    product.tax = breakdown.tax;
    product.price = breakdown.total;
    await product.save();
  }
  res.json({ message: `قیمت ${products.length} محصول بازمحاسبه شد.` });
});

/* ---------------- سفارش‌ها ---------------- */

// GET /api/admin/orders — لیست همه سفارش‌ها با اطلاعات مشتری
router.get('/orders', async (req, res) => {
  const orders = await Order.find().populate('user', 'username fullname phone').sort({ createdAt: -1 });
  res.json({ orders });
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending_payment', 'processing', 'shipped', 'done', 'canceled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'وضعیت نامعتبر است.' });

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });
  res.json({ order });
});

/* ---------------- نرخ طلا ---------------- */

// PUT /api/admin/gold-price   body: { price: number }
router.put('/gold-price', async (req, res) => {
  const { price } = req.body;
  if (!price || price <= 0) return res.status(400).json({ message: 'نرخ طلا نامعتبر است.' });

  await Setting.findOneAndUpdate(
    { key: 'goldPrice18k' },
    { value: Number(price), updatedAt: new Date() },
    { upsert: true }
  );
  res.json({ price: Number(price) });
});

/* ---------------- آمار داشبورد ---------------- */

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [orderCount, pendingCount, revenueAgg, productCount] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending_payment' }),
    Order.aggregate([{ $match: { 'payment.paid': true } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
    Product.countDocuments(),
  ]);
  res.json({
    orderCount,
    pendingCount,
    productCount,
    totalRevenue: revenueAgg[0]?.sum || 0,
  });
});

module.exports = router;
