const mongoose = require('mongoose');

// دسته‌بندی‌ها و زیرشاخه‌های ثابت گالری نوول
const CATEGORY_MAP = {
  women: [
    'دستبند زنانه',
    'دستبند فانتزی زنانه',
    'پابند زنانه',
    'آویز زنانه',
    'آویز ساعت زنانه',
    'انگشتر زنانه',
    'گوشواره زنانه',
    'گردنبند زنانه',
    'زنجیر زنانه',
    'النگو زنانه',
  ],
  men: ['زنجیر مردانه', 'دستبند مردانه'],
  kids: [
    'آویز کودکانه',
    'انگشتر کودکانه',
    'دستبند کودکانه',
    'زنجیر کودکانه',
    'گردنبند کودکانه',
    'گوشواره کودکانه',
  ],
};

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: Object.keys(CATEGORY_MAP), required: true },
    subcategory: { type: String, required: true },
    weight: { type: Number, required: true, min: 0.01 }, // گرم
    laborFee: { type: Number, required: true, min: 0 }, // اجرت، تومان

    // این سه فیلد در لحظه ثبت محصول بر اساس نرخ روز طلا محاسبه و ذخیره می‌شوند
    goldPriceAtCreation: { type: Number, required: true },
    profit: { type: Number, required: true }, // ۷٪
    tax: { type: Number, required: true }, // ۱۰٪
    price: { type: Number, required: true }, // قیمت نهایی محاسبه‌شده

    image: { type: String, default: null }, // مسیر فایل روی سرور، مثل /uploads/xxx.jpg
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, subcategory: 1 });

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORY_MAP = CATEGORY_MAP;
