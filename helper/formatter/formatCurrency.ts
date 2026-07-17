export function formatCurrency(value: number | null) {

  if(!value) return '₱ 0.00'

  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
} 