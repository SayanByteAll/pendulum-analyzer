import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { useDeleteExperiment, useUpdateExperiment } from "../api/hooks";
import type { Experiment } from "../api/types";
import { countMsg, type Msg, UNITS, useI18n } from "../i18n";
import { num } from "../lib/format";
import { ErrorNotice } from "./Status";

const M = {
  actions: { kk: "Әрекеттер", ru: "Действия", en: "Actions" },
  rename: { kk: "Атауын өзгерту", ru: "Переименовать", en: "Rename" },
  delete: { kk: "Жою", ru: "Удалить", en: "Delete" },
  save: { kk: "Сақтау", ru: "Сохранить", en: "Save" },
  cancel: { kk: "Болдырмау", ru: "Отмена", en: "Cancel" },
  name: { kk: "Эксперимент атауы", ru: "Название эксперимента", en: "Experiment name" },
  confirmDelete: (name: string): Msg => ({
    kk: `«${name}» экспериментін біржола жою керек пе? Барлық ұзындықтар, өлшеулер мен бейнелер жойылады.`,
    ru: `Удалить эксперимент «${name}» безвозвратно? Удалятся все длины, замеры и видео.`,
    en: `Delete the experiment “${name}” permanently? All lengths, trials and videos will be removed.`,
  }),
  lengths: (n: number) => countMsg(n, { kk: "ұзындық", ru: ["длина", "длины", "длин"], en: ["length", "lengths"] }),
  trials: (n: number) => countMsg(n, { kk: "өлшем", ru: ["замер", "замера", "замеров"], en: ["trial", "trials"] }),
  videos: (n: number) => countMsg(n, { kk: "бейне", ru: ["видео", "видео", "видео"], en: ["video", "videos"] }),
};

export function ExperimentCard({ experiment: e }: { experiment: Experiment }) {
  const { t, locale } = useI18n();
  const update = useUpdateExperiment();
  const remove = useDeleteExperiment();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(e.name);
  const menuRef = useRef<HTMLDivElement>(null);

  // Меню закрывается кликом мимо него и клавишей Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const startRename = () => {
    setMenuOpen(false);
    setName(e.name);
    update.reset();
    setRenaming(true);
  };

  const submitRename = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === e.name) {
      setRenaming(false);
      return;
    }
    update.mutate({ id: e.id, patch: { name: trimmed } }, { onSuccess: () => setRenaming(false) });
  };

  const confirmDelete = () => {
    setMenuOpen(false);
    if (confirm(t(M.confirmDelete(e.name)))) remove.mutate(e.id);
  };

  return (
    <div className={`card exp-card${renaming ? "" : " card--link"}`}>
      {renaming ? (
        <form className="stack" onSubmit={submitRename} style={{ marginBottom: 12 }}>
          <input
            autoFocus
            aria-label={t(M.name)}
            value={name}
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setRenaming(false)}
          />
          <div className="row">
            <button className="primary small" type="submit" disabled={!name.trim() || update.isPending}>
              {t(M.save)}
            </button>
            <button className="small" type="button" onClick={() => setRenaming(false)}>
              {t(M.cancel)}
            </button>
          </div>
          {update.isError && <ErrorNotice error={update.error} />}
        </form>
      ) : (
        <div className="card__title">
          <h3>
            <Link to={`/experiments/${e.id}`} className="exp-card__link">
              {e.name}
            </Link>
          </h3>
          <div className="menu" ref={menuRef}>
            <button
              type="button"
              className="small ghost icon"
              title={t(M.actions)}
              aria-label={t(M.actions)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="menu__list" role="menu">
                <button type="button" role="menuitem" onClick={startRename}>
                  {t(M.rename)}
                </button>
                <button type="button" role="menuitem" className="danger" onClick={confirmDelete}>
                  {t(M.delete)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="secondary small">
        {t(M.lengths(e.series_count))} · {t(M.trials(e.trials_count))} · {t(M.videos(e.videos_count))}
      </div>
      <div className="muted small">
        g = {num(e.g_reference, 3)} {t(UNITS.mps2)} · N = {e.main_periods} ·{" "}
        {new Date(e.created_at).toLocaleDateString(locale)}
      </div>
      {remove.isError && <ErrorNotice error={remove.error} />}
    </div>
  );
}
