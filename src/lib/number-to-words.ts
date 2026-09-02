const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(value: number): string {
  if (value < 20) return ONES[value];
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return TENS[tens] + (ones > 0 ? ` ${ONES[ones]}` : "");
}

function threeDigits(value: number): string {
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const parts: string[] = [];
  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} Hundred`);
  }
  if (remainder > 0) {
    parts.push(twoDigits(remainder));
  }
  return parts.join(" ");
}

/**
 * Converts a non-negative amount (in whole rupees) to words using the Indian
 * numbering system (lakhs, crores). Returns an empty string for amounts that
 * are too large to express.
 */
function rupeesToWords(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";

  const crore = Math.floor(value / 10_000_000);
  const lakh = Math.floor((value % 10_000_000) / 100_000);
  const thousand = Math.floor((value % 100_000) / 1_000);
  const rest = value % 1_000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest > 0) parts.push(threeDigits(rest));

  return parts.join(" ");
}

/**
 * Renders an amount as an invoice-ready phrase, e.g.
 * "One Thousand Two Hundred Thirty-Four Rupees and Fifty Paise Only".
 * Supports values up to 9,99,99,999.99 (below one billion rupees).
 */
export function amountInWords(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount) || amount < 0) return "";

  const rounded = Math.round(amount * 100);
  const rupees = Math.floor(rounded / 100);
  const paise = rounded % 100;

  if (rupees >= 1_000_000_000) return "";

  const rupeeWords = rupeesToWords(rupees);
  const rupeePart =
    rupeeWords.length > 0
      ? `${rupeeWords} ${rupees === 1 ? "Rupee" : "Rupees"}`
      : "Zero Rupees";

  const paisePart =
    paise > 0
      ? ` and ${twoDigits(paise)} ${paise === 1 ? "Paise" : "Paise"}`
      : "";

  return `${rupeePart}${paisePart} Only`;
}
