const express = require('express');
const Product = require('../models/Product');
const { CATEGORY_MAP } = require('../models/Product');
const Setting = require('../models/Setting');

const router = express.Router();

// GET /api/products?category=women&subcategory=...
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت محصولات.', error: err.message });
  }
});

// GET /api/products/categories — لیست ثابت دسته‌ها و زیرشاخه‌ها برای ساخت منو در فرانت‌اند
router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORY_MAP });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) return res.status(404).json({ message: 'محصول یافت نشد.' });
    res.json({ product });
  } catch (err) {
    res.status(404).json({ message: 'محصول یافت نشد.' });
  }
});

// GET /api/products/meta/gold-price — نرخ لحظه‌ای طلا برای نمایش بالای سایت
router.get('/meta/gold-price', async (req, res) => {
  const setting = await Setting.findOne({ key: 'goldPrice18k' });
  res.json({ price: setting ? setting.value : 0, updatedAt: setting ? setting.updatedAt : null });
});

module.exports = router;
