require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Setting = require('../models/Setting');

async function seed() {
  await connectDB();

  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const existingAdmin = await User.findOne({ username: adminUsername });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await User.create({
      username: adminUsername,
      passwordHash,
      fullname: process.env.ADMIN_FULLNAME || 'مدیر گالری نوول',
      phone: '00000000000',
      role: 'admin',
    });
    console.log(`✅ کاربر مدیر ساخته شد (نام کاربری: ${adminUsername})`);
  } else {
    console.log('ℹ️ کاربر مدیر از قبل وجود دارد.');
  }

  const existingPrice = await Setting.findOne({ key: 'goldPrice18k' });
  if (!existingPrice) {
    const price = Number(process.env.INITIAL_GOLD_PRICE) || 3850000;
    await Setting.create({ key: 'goldPrice18k', value: price, updatedAt: new Date() });
    console.log(`✅ نرخ اولیه طلا ثبت شد: ${price} تومان`);
  } else {
    console.log('ℹ️ نرخ طلا از قبل تنظیم شده است.');
  }

  console.log('🌱 عملیات seed کامل شد.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ خطا در seed:', err);
  process.exit(1);
});
