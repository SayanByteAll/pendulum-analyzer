import type { ReactNode } from "react";

import { useI18n } from "../i18n";
import { translateServerMessage } from "../i18n/serverMessages";

const LOADING = { kk: "Жүктелуде…", ru: "Загрузка…", en: "Loading…" };

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n();
  return <div className="empty muted">{label ?? t(LOADING)}</div>;
}

export function ErrorNotice({ error }: { error: unknown }) {
  const { lang } = useI18n();
  const message = error instanceof Error ? error.message : String(error);
  return <div className="notice notice--critical">{translateServerMessage(message, lang)}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
