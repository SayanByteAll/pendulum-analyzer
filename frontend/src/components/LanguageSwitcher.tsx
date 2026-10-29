import { LANGS, useI18n } from "../i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label="Language / Тіл / Язык">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          className={l.id === lang ? "active" : undefined}
          aria-pressed={l.id === lang}
          title={l.name}
          onClick={() => setLang(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
