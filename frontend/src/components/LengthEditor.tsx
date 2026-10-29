import { type FormEvent, useState } from "react";

import type { Series, SeriesInput } from "../api/types";
import { UNITS, useI18n } from "../i18n";
import { num } from "../lib/format";

const M = {
  length: { kk: "Ұзындық, см", ru: "Длина, см", en: "Length, cm" },
  sigma: { kk: "Ұзындық қателігі, см", ru: "Погрешность длины, см", en: "Length uncertainty, cm" },
  save: { kk: "Ұзындықты сақтау", ru: "Сохранить длину", en: "Save length" },
  cancel: { kk: "Болдырмау", ru: "Отменить", en: "Cancel" },
};

interface Props {
  series: Series;
  busy: boolean;
  onSave: (patch: Partial<SeriesInput>) => void;
  onCancel: () => void;
}

const parse = (v: string) => Number(v.replace(",", "."));

/** Правка длины серии: участки и анализ пересчитываются на сервере. */
export function LengthEditor({ series, busy, onSave, onCancel }: Props) {
  const { t } = useI18n();
  const [length, setLength] = useState(num(series.length_cm, 1));
  const [sigma, setSigma] = useState(num(series.length_sigma_cm, 1));
  const valid = parse(length) > 0 && parse(sigma) >= 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) onSave({ length_cm: parse(length), length_sigma_cm: parse(sigma) });
  };

  return (
    <form className="row" style={{ gap: 4, flexWrap: "nowrap" }} onSubmit={submit}>
      <input
        aria-label={t(M.length)}
        inputMode="decimal"
        autoFocus
        style={{ width: 70 }}
        value={length}
        onChange={(e) => setLength(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      />
      <span className="muted small">±</span>
      <input
        aria-label={t(M.sigma)}
        inputMode="decimal"
        style={{ width: 52 }}
        value={sigma}
        onChange={(e) => setSigma(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      />
      <span className="muted small">{t(UNITS.cm)}</span>
      <button className="small primary" type="submit" disabled={!valid || busy} aria-label={t(M.save)}>
        ✓
      </button>
      <button className="small ghost" type="button" onClick={onCancel} aria-label={t(M.cancel)}>
        ✕
      </button>
    </form>
  );
}
