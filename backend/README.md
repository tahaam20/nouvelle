# بک‌اند گالری نوول (Nouvelle Gallery)

بک‌اند فروشگاه طلا و جواهر، ساخته‌شده با **Node.js + Express + MongoDB**. شامل احراز هویت کاربران، مدیریت محصولات با محاسبه خودکار قیمت، سبد خرید/سفارش، درگاه پرداخت **زرین‌پال**، و پنل مدیریت.

## پیش‌نیازها
- Node.js نسخه ۱۸ به بالا
- یک دیتابیس MongoDB (محلی، روی سرور خودتان، یا رایگان روی [MongoDB Atlas](https://www.mongodb.com/atlas))
- (اختیاری برای پرداخت واقعی) یک حساب درگاه [زرین‌پال](https://www.zarinpal.com) و مرچنت‌آیدی

## نصب و راه‌اندازی

```bash
cd nouvelle-backend
npm install
cp .env.example .env
# سپس فایل .env را باز کنید و مقادیر را با اطلاعات خودتان جایگزین کنید
```

مقادیر مهمی که حتما باید در `.env` تغییر دهید:
- `MONGO_URI` — آدرس اتصال به دیتابیس‌تان
- `JWT_SECRET` — یک رشته تصادفی طولانی و محرمانه
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — اطلاعات ورود مدیر
- `ZARINPAL_MERCHANT_ID` — مرچنت‌آیدی واقعی (تا زمانی که این مقدار پیش‌فرض بماند، سفارش‌ها بدون اتصال واقعی به درگاه ثبت می‌شوند و فقط برای تست مناسب‌اند)

ساخت کاربر مدیر و ثبت نرخ اولیه طلا:
```bash
npm run seed
```

اجرای سرور (حالت توسعه با ری‌استارت خودکار):
```bash
npm run dev
```
یا برای اجرای ساده:
```bash
npm start
```

سرور به‌صورت پیش‌فرض روی `http://localhost:4000` بالا می‌آید.

---

## ساختار پروژه
```
nouvelle-backend/
├── config/db.js          اتصال به MongoDB
├── models/                User, Product, Order, Setting
├── middleware/            auth.js (JWT), upload.js (آپلود عکس با multer)
├── routes/                auth, products, orders, admin, payment
├── utils/                 pricing.js (فرمول قیمت), zarinpal.js, seed.js
├── uploads/                محل ذخیره عکس محصولات
└── server.js               نقطه شروع برنامه
```

## فرمول قیمت‌گذاری (utils/pricing.js)
```
قیمت طلا = وزن × نرخ روز طلای ۱۸ عیار
سود      = ۷٪ از (قیمت طلا + اجرت)
مالیات   = ۱۰٪ از (اجرت + سود)
قیمت نهایی = قیمت طلا + اجرت + سود + مالیات
```
این محاسبه در لحظه‌ی ثبت یا ویرایش هر محصول در پنل مدیریت انجام و روی محصول ذخیره می‌شود. با تغییر نرخ طلا در پنل، می‌توانید از دکمه‌ی «بازمحاسبه همه محصولات» (`POST /api/admin/products/recalculate-all`) برای به‌روزرسانی قیمت محصولات موجود استفاده کنید.

---

## مستندات API

توکن JWT دریافتی از لاگین/ثبت‌نام باید در تمام درخواست‌های نیازمند احراز هویت، در هدر زیر ارسال شود:
```
Authorization: Bearer <token>
```

### احراز هویت کاربران
| متد | مسیر | توضیح | نیاز به توکن |
|---|---|---|---|
| POST | `/api/auth/register` | ثبت‌نام `{username, password, fullname, phone}` | خیر |
| POST | `/api/auth/login` | ورود `{username, password}` | خیر |
| GET  | `/api/auth/me` | دریافت اطلاعات کاربر لاگین‌شده | بله |
| PUT  | `/api/auth/me` | ویرایش پروفایل `{fullname, phone, address}` | بله |

### محصولات (عمومی)
| متد | مسیر | توضیح |
|---|---|---|
| GET | `/api/products` | لیست محصولات، با فیلتر `?category=women&subcategory=...` |
| GET | `/api/products/categories` | لیست ثابت دسته‌ها و زیرشاخه‌ها |
| GET | `/api/products/:id` | جزییات یک محصول |
| GET | `/api/products/meta/gold-price` | نرخ لحظه‌ای طلای ۱۸ عیار |

### سفارش‌ها (نیاز به لاگین)
| متد | مسیر | توضیح |
|---|---|---|
| POST | `/api/orders` | ثبت سفارش `{items:[{productId, qty}], fullname, phone, address}` → لینک پرداخت زرین‌پال برمی‌گرداند |
| GET  | `/api/orders/mine` | سفارش‌های من |
| GET  | `/api/orders/:id` | جزییات یک سفارش (فقط صاحب سفارش یا مدیر) |

### پرداخت
| متد | مسیر | توضیح |
|---|---|---|
| GET | `/api/payment/verify` | کال‌بک زرین‌پال؛ کاربر پس از پرداخت به این آدرس بازمی‌گردد و بعد به فرانت‌اند ریدایرکت می‌شود |

### پنل مدیریت (نیاز به توکن مدیر)
| متد | مسیر | توضیح |
|---|---|---|
| POST | `/api/admin/products` | افزودن محصول — `multipart/form-data`: `name, category, subcategory, weight, laborFee, image` |
| GET  | `/api/admin/products` | همه محصولات |
| PUT  | `/api/admin/products/:id` | ویرایش محصول |
| DELETE | `/api/admin/products/:id` | حذف محصول |
| POST | `/api/admin/products/recalculate-all` | بازمحاسبه قیمت همه محصولات با نرخ روز |
| GET  | `/api/admin/orders` | همه سفارش‌ها به‌همراه اطلاعات مشتری |
| PUT  | `/api/admin/orders/:id/status` | تغییر وضعیت `{status}` (`pending_payment/processing/shipped/done/canceled`) |
| PUT  | `/api/admin/gold-price` | تنظیم نرخ روز طلا `{price}` |
| GET  | `/api/admin/stats` | آمار کلی برای داشبورد |

---

## اتصال درگاه پرداخت زرین‌پال
۱. در [zarinpal.com](https://www.zarinpal.com) ثبت‌نام کرده و مرچنت‌آیدی بگیرید.
۲. مقدار `ZARINPAL_MERCHANT_ID` را در `.env` قرار دهید.
۳. تا زمان تایید نهایی کسب‌وکارتان، `ZARINPAL_SANDBOX=true` بگذارید تا در محیط تستی زرین‌پال تراکنش بزنید (بدون پول واقعی).
۴. وقتی آماده‌ی اجرای واقعی شدید، `ZARINPAL_SANDBOX=false` کنید.
۵. `ZARINPAL_CALLBACK_URL` باید یک آدرس عمومی و در دسترس باشد (بعد از دیپلوی سرورتان تنظیم کنید)، چون زرین‌پال کاربر را به همین آدرس برمی‌گرداند.

## اتصال فرانت‌اند
فایل HTML که قبلا ساختیم (نسخه‌ی نمایشی) در حال حاضر از یک دیتابیس شبیه‌سازی‌شده در خود مرورگر استفاده می‌کند. برای اتصال واقعی به این بک‌اند باید بخش‌های زیر در فرانت‌اند جایگزین شوند:
- توابع `sGet/sSet/sList` باید با `fetch()` به آدرس‌های بالا جایگزین شوند
- توکن JWT بعد از لاگین باید ذخیره و در هدر درخواست‌ها ارسال شود
- فرم پرداخت باید کاربر را به `payment.paymentUrl` که از `POST /api/orders` برمی‌گردد هدایت کند

اگر بخواهید، در قدم بعدی همین اتصال را هم برایتان انجام می‌دهم تا فرانت‌اند و بک‌اند کاملاً به هم وصل شوند.

## دیپلوی (وقتی آماده بودید)
گزینه‌های ساده و رایج برای این استک:
- **Railway** یا **Render** برای اجرای سرور Node.js (رایگان برای شروع)
- **MongoDB Atlas** برای دیتابیس ابری رایگان
- بعد از دیپلوی، مقدار `FRONTEND_URL` و `ZARINPAL_CALLBACK_URL` را با آدرس واقعی سرورتان به‌روزرسانی کنید
