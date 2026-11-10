// Tiny CSV writer for the orders export. Cells that start with = + - @ are prefixed with an apostrophe so a spreadsheet never runs them as a formula.
export type Cell = string | number | null | undefined;
const cell = (v: Cell): string => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows: Cell[][]): string => `\uFEFF${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
