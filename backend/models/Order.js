const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // اسم را در لحظه سفارش هم ذخیره می‌کنیم تا اگر محصول بعدا حذف/ویرایش شد، تاریخچه سفارش خراب نشود
    image: { type: String, default: null },
    weight: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },

    fullname: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending_payment', 'processing', 'shipped', 'done', 'canceled'],
      default: 'pending_payment',
    },

    // اطلاعات مربوط به تراکنش زرین‌پال
    payment: {
      authority: { type: String, default: null },
      refId: { type: String, default: null },
      paid: { type: Boolean, default: false },
      paidAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
