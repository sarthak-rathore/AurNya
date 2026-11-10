/** An error whose message is safe to show to the owner. Anything else is treated as a bug and hidden behind a generic message. */
export class AdminError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'AdminError'; }
}

/** Looks through a database error (and its cause) for a rule name, so the owner gets a plain sentence instead of SQL. */
export function dbRule(e: unknown): string {
  const err = e as { message?: string; constraint?: string; cause?: { message?: string; constraint?: string } };
  return `${err?.constraint ?? ''} ${err?.message ?? ''} ${err?.cause?.constraint ?? ''} ${err?.cause?.message ?? ''}`;
}

const FRIENDLY: [string, string][] = [
  ['products_slug_unique', 'Another product already uses that web address name (slug). Please choose a different one.'],
  ['products_sku_unique', 'Another product already uses that SKU. SKUs must be unique.'],
  ['product_variants_sku_unique', 'One of the size SKUs is already used by another product.'],
  ['coupons_code_unique', 'A coupon with that code already exists.'],
  ['products_compare_above_price', 'The "was" price must be higher than the selling price.'],
  ['coupons_dates_ordered', 'The coupon end time must be after its start time.'],
  ['coupons_value_valid', 'The coupon value is not valid for its type.'],
];
/** Turns a known database rule failure into an AdminError; rethrows anything else untouched. */
export function friendlyDbError(e: unknown): never {
  if (e instanceof AdminError) throw e;
  const text = dbRule(e);
  for (const [rule, msg] of FRIENDLY) if (text.includes(rule)) throw new AdminError(409, msg);
  throw e;
}
