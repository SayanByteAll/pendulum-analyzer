import { currentLocale, tr, UNITS } from "../i18n";

const cache = new Map<string, Intl.NumberFormat>();

function formatter(digits: number): Intl.NumberFormat {
  const key = `${currentLocale()}:${digits}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(currentLocale(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    });
    cache.set(key, f);
  }
  return f;
}

export const DASH = "—";

export function num(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  return formatter(digits).format(value);
}

/** Сколько знаков после запятой нужно, чтобы показать погрешность двумя значащими цифрами. */
export function digitsForSigma(sigma: number): number {
  if (!(sigma > 0) || !Number.isFinite(sigma)) return 3;
  return Math.min(Math.max(1 - Math.floor(Math.log10(sigma)), 0), 6);
}

/** «1,4216 ± 0,0023» — значение округлено до той же точности, что и погрешность. */
export function pm(value: number | null | undefined, sigma: number | null | undefined, fallbackDigits = 4): string {
  if (value === null || value === undefined) return DASH;
  if (sigma === null || sigma === undefined || !(sigma > 0)) return num(value, fallbackDigits);
  const digits = digitsForSigma(sigma);
  return `${num(value, digits)} ± ${num(sigma, digits)}`;
}

export function ms(seconds: number | null | undefined, digits?: number): string {
  if (seconds === null || seconds === undefined) return DASH;
  const value = seconds * 1000;
  return `${num(value, digits ?? (value < 10 ? 2 : value < 100 ? 1 : 0))} ${tr(UNITS.ms)}`;
}

export function pct(value: number | null | undefined, digits = 2, signed = false): string {
  if (value === null || value === undefined) return DASH;
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${num(value, digits)} %`;
}

export function pValue(p: number | null | undefined): string {
  if (p === null || p === undefined) return DASH;
  return p < 0.001 ? `< ${num(0.001, 3)}` : num(p, 3);
}

/** Десятичный разделитель текущего языка: «,» или «.». */
export function decimalSeparator(): string {
  return num(1.5, 1).charAt(1);
}

/** Секундомер: 12,34 или 1:02,34 */
export function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  const hundredths = Math.floor((seconds - whole) * 100);
  const minutes = Math.floor(whole / 60);
  const secs = whole % 60;
  const tail = `${String(secs).padStart(minutes ? 2 : 1, "0")}${decimalSeparator()}${String(hundredths).padStart(2, "0")}`;
  return minutes ? `${minutes}:${tail}` : tail;
}

export function bytes(size: number): string {
  if (size < 1024 * 1024) return `${num(size / 1024, 0)} ${tr(UNITS.kb)}`;
  return `${num(size / 1024 / 1024, 1)} ${tr(UNITS.mb)}`;
}
