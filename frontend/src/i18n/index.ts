import { createContext, useCallback, useContext } from "react";

import { readLocal, writeLocal } from "../lib/storage";

export type Lang = "kk" | "ru" | "en";

/** Текст на всех трёх языках. Строки интерфейса хранятся рядом с компонентом, который их показывает. */
export type Msg = Record<Lang, string>;

export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "kk", label: "ҚАЗ", name: "Қазақша" },
  { id: "ru", label: "РУС", name: "Русский" },
  { id: "en", label: "ENG", name: "English" },
];

// Числа и даты в казахском записываются так же, как в русском (9,810; 23.10.2026), а данных
// для kk-KZ во многих браузерах нет — тогда Intl откатывается к «9.810» и «2026-10-23».
const LOCALES: Record<Lang, string> = { kk: "ru-RU", ru: "ru-RU", en: "en-US" };

const TITLE: Msg = {
  kk: "Секундомер мен камера",
  ru: "Секундомер против камеры",
  en: "Stopwatch vs Camera",
};

function initialLang(): Lang {
  const stored = readLocal("lang", "");
  return LANGS.some((l) => l.id === stored) ? (stored as Lang) : "ru";
}

// Текущий язык нужен и вне компонентов (форматирование чисел, confirm в обработчиках).
let current: Lang = initialLang();

function applyToDocument(lang: Lang) {
  document.documentElement.lang = lang;
  document.title = TITLE[lang];
}

/** Язык для кода вне React: форматирование чисел и единиц. */
export function currentLang(): Lang {
  return current;
}

export function currentLocale(): string {
  return LOCALES[current];
}

/** Перевод без хука — для обработчиков событий и вспомогательных функций. */
export function tr(msg: Msg): string {
  return msg[current];
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const I18nContext = createContext<I18nValue>({ lang: current, setLang: () => {} });

/** Вызывается провайдером при смене языка. */
export function switchLang(next: Lang) {
  current = next;
  writeLocal("lang", next);
  applyToDocument(next);
}

export function initLang(): Lang {
  applyToDocument(current);
  return current;
}

export function useI18n() {
  const { lang, setLang } = useContext(I18nContext);
  const t = useCallback((msg: Msg) => msg[lang], [lang]);
  return { lang, setLang, t, locale: LOCALES[lang] };
}

export const APP_TITLE = TITLE;

/** Общие единицы измерения. */
export const UNITS = {
  cm: { kk: "см", ru: "см", en: "cm" },
  s: { kk: "с", ru: "с", en: "s" },
  ms: { kk: "мс", ru: "мс", en: "ms" },
  mps2: { kk: "м/с²", ru: "м/с²", en: "m/s²" },
  kb: { kk: "КБ", ru: "КБ", en: "KB" },
  mb: { kk: "МБ", ru: "МБ", en: "MB" },
  fps: { kk: "кадр/с", ru: "кадр/с", en: "fps" },
} satisfies Record<string, Msg>;

/**
 * Число с существительным: в русском три формы, в английском две,
 * в казахском после числа существительное не меняется.
 */
export function countMsg(
  n: number,
  forms: { kk: string; ru: [one: string, few: string, many: string]; en: [one: string, other: string] },
): Msg {
  return {
    kk: `${n} ${forms.kk}`,
    ru: `${n} ${ruPlural(n, ...forms.ru)}`,
    en: `${n} ${n === 1 ? forms.en[0] : forms.en[1]}`,
  };
}

export function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
