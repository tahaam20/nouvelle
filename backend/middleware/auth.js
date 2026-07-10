const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * کاربر باید لاگین کرده باشد (توکن معتبر در هدر Authorization: Bearer <token>)
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'ابتدا وارد حساب کاربری خود شوید.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'حساب کاربری یافت نشد.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'توکن نامعتبر یا منقضی شده است.' });
  }
}

/**
 * علاوه بر لاگین بودن، باید نقش مدیر (admin) داشته باشد
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'دسترسی فقط برای مدیر سایت مجاز است.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
