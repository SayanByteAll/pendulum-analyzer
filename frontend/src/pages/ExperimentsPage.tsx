import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";

import { useCreateExperiment, useExperiments } from "../api/hooks";
import { ExperimentCard } from "../components/ExperimentCard";
import { Empty, ErrorNotice, Loading } from "../components/Status";
import { useI18n } from "../i18n";

const M = {
  title: { kk: "Эксперименттер", ru: "Эксперименты", en: "Experiments" },
  lead: {
    kk: "Маятник периодын өлшеу дәлдігін салыстыру: қолмен секундомер және бейнетрекинг.",
    ru: "Сравнение точности измерения периода маятника: ручной секундомер против видеотрекинга.",
    en: "Comparing how accurately a pendulum's period is measured: a hand stopwatch versus video tracking.",
  },
  newExperiment: { kk: "Жаңа эксперимент", ru: "Новый эксперимент", en: "New experiment" },
  name: { kk: "Атауы", ru: "Название", en: "Name" },
  placeholder: {
    kk: "Мысалы: «Негізгі серия, 14 қазан»",
    ru: "Например: «Основная серия, 14 октября»",
    en: "For example: “Main series, 14 October”",
  },
  create: { kk: "Құру", ru: "Создать", en: "Create" },
  empty: {
    kk: "Әзірге бірде-бір эксперимент жоқ — алғашқысын құрыңыз.",
    ru: "Пока нет ни одного эксперимента — создайте первый.",
    en: "No experiments yet — create the first one.",
  },
};

export function ExperimentsPage() {
  const { t } = useI18n();
  const experiments = useExperiments();
  const create = useCreateExperiment();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim() }, { onSuccess: (e) => navigate(`/experiments/${e.id}`) });
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{t(M.title)}</h1>
          <p>{t(M.lead)}</p>
        </div>
      </div>

      <form className="card stack" onSubmit={submit} style={{ maxWidth: 640 }}>
        <h2>{t(M.newExperiment)}</h2>
        <label className="field">
          {t(M.name)}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(M.placeholder)}
            maxLength={200}
          />
        </label>
        <div className="row">
          <button className="primary" type="submit" disabled={!name.trim() || create.isPending}>
            {t(M.create)}
          </button>
        </div>
      </form>

      {create.isError && <ErrorNotice error={create.error} />}

      {experiments.isPending && <Loading />}
      {experiments.isError && <ErrorNotice error={experiments.error} />}
      {experiments.data?.length === 0 && <Empty>{t(M.empty)}</Empty>}
      {experiments.data && experiments.data.length > 0 && (
        <div className="grid-cards">
          {experiments.data.map((e) => (
            <ExperimentCard key={e.id} experiment={e} />
          ))}
        </div>
      )}
    </div>
  );
}
