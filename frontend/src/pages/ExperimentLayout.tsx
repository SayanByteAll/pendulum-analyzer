import { Link, Outlet, useParams } from "react-router";

import { useExperiment } from "../api/hooks";
import { ErrorNotice, Loading } from "../components/Status";
import { useI18n } from "../i18n";
import type { ExperimentContext } from "./experimentContext";

const M = {
  experiments: { kk: "Эксперименттер", ru: "Эксперименты", en: "Experiments" },
};

export function ExperimentLayout() {
  const { t } = useI18n();
  const experimentId = Number(useParams().experimentId);
  const query = useExperiment(experimentId);

  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorNotice error={query.error} />;
  const experiment = query.data;

  return (
    <>
      <div className="breadcrumbs no-print">
        <Link to="/">{t(M.experiments)}</Link> /
      </div>
      <div className="page-head">
        <div>
          <h1>{experiment.name}</h1>
          {experiment.notes && <p>{experiment.notes}</p>}
        </div>
      </div>
      <Outlet context={{ experiment } satisfies ExperimentContext} />
    </>
  );
}
