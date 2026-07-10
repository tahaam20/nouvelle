/**
 * فرمول قیمت‌گذاری گالری نوول:
 * قیمت طلا = وزن × نرخ روز طلای ۱۸ عیار
 * سود      = ۷٪ از (قیمت طلا + اجرت)
 * مالیات   = ۱۰٪ از (اجرت + سود)   [مطابق رویه معمول، مالیات فقط به اجرت و سود تعلق می‌گیرد]
 * قیمت نهایی = قیمت طلا + اجرت + سود + مالیات
 */
const PROFIT_RATE = 0.07;
const TAX_RATE = 0.1;

function calcPrice(weight, laborFee, goldPricePerGram) {
  const w = Number(weight) || 0;
  const labor = Number(laborFee) || 0;
  const goldPrice = Number(goldPricePerGram) || 0;

  const goldValue = goldPrice * w;
  const profit = (goldValue + labor) * PROFIT_RATE;
  const tax = (labor + profit) * TAX_RATE;
  const total = goldValue + labor + profit + tax;

  return {
    goldValue: Math.round(goldValue),
    laborFee: Math.round(labor),
    profit: Math.round(profit),
    tax: Math.round(tax),
    total: Math.round(total),
  };
}

module.exports = { calcPrice, PROFIT_RATE, TAX_RATE };
