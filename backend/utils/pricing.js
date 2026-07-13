/**
 * فرمول قیمت‌گذاری گالری نوول:
 * قیمت طلا = وزن × نرخ روز طلای ۱۸ عیار
 * اجرت     = درصد اجرت (که مدیر وارد می‌کند) × قیمت طلا
 * سود      = ۷٪ از (قیمت طلا + اجرت)
 * مالیات   = ۱۰٪ از (اجرت + سود)   [مطابق رویه معمول، مالیات فقط به اجرت و سود تعلق می‌گیرد]
 * قیمت نهایی = قیمت طلا + اجرت + سود + مالیات
 */
const PROFIT_RATE = 0.07;
const TAX_RATE = 0.1;

function calcPrice(weight, laborPercent, goldPricePerGram) {
  const w = Number(weight) || 0;
  const laborPct = Number(laborPercent) || 0;
  const goldPrice = Number(goldPricePerGram) || 0;

  const goldValue = goldPrice * w;
  const laborFee = goldValue * (laborPct / 100);
  const profit = (goldValue + laborFee) * PROFIT_RATE;
  const tax = (laborFee + profit) * TAX_RATE;
  const total = goldValue + laborFee + profit + tax;

  return {
    goldValue: Math.round(goldValue),
    laborPercent: laborPct,
    laborFee: Math.round(laborFee),
    profit: Math.round(profit),
    tax: Math.round(tax),
    total: Math.round(total),
  };
}

module.exports = { calcPrice, PROFIT_RATE, TAX_RATE };
