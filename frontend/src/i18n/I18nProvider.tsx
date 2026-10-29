import { type ReactNode, useCallback, useMemo, useState } from "react";

import { I18nContext, initLang, type Lang, switchLang } from ".";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initLang);
  const setLang = useCallback((next: Lang) => {
    switchLang(next);
    setLangState(next);
  }, []);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
