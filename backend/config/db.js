const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ متغیر MONGO_URI در فایل .env تنظیم نشده است.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ اتصال به MongoDB برقرار شد');
  } catch (err) {
    console.error('❌ خطا در اتصال به MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
