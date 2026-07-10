// ─── Tax ──────────────────────────────────────────────────────────────────────

import { multiplyMoney, roundMoney, subtractMoney } from "@/lib/money";

const TAX_RATE = 0.12;

export function computeTax(totalPrice: string) {
  const total = parseFloat(totalPrice) || 0;
  if (total <= 0) return { taxable: 0, tax: 0, total: 0 };
  const taxable = multiplyMoney(total, 1 / (1 + TAX_RATE));
  const tax = subtractMoney(total, taxable);
  return {
    taxable: roundMoney(taxable),
    tax: roundMoney(tax),
    total: roundMoney(total),
  };
}
