const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    fullname: user.fullname,
    phone: user.phone,
    address: user.address,
    role: user.role,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullname, phone } = req.body;
    if (!username || !password || !fullname || !phone) {
      return res.status(400).json({ message: 'تمام فیلدها الزامی هستند.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
    }

    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'این نام کاربری قبلا ثبت شده است.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase().trim(),
      passwordHash,
      fullname: fullname.trim(),
      phone: phone.trim(),
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور در ثبت‌نام.', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی است.' });

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'نام کاربری یا رمز عبور نادرست است.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'نام کاربری یا رمز عبور نادرست است.' });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور در ورود.', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/me — به‌روزرسانی نام، تلفن، آدرس
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { fullname, phone, address } = req.body;
    if (fullname) req.user.fullname = fullname.trim();
    if (phone) req.user.phone = phone.trim();
    if (typeof address === 'string') req.user.address = address.trim();
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور در به‌روزرسانی پروفایل.', error: err.message });
  }
});

module.exports = router;
