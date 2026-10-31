// All money is stored as integer paise (INR x 100).
const f = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (paise: number): string => f.format(paise / 100);
export const discountPercent = (price: number, original?: number): number => (original && original > price ? Math.round(100 - (price * 100) / original) : 0);
