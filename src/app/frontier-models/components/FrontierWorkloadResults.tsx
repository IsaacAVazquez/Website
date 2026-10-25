import {
  compareFrontierWorkload,
  type FrontierWorkloadInput,
} from "@/lib/frontierWorkload";
import { formatPriceUsd } from "@/lib/frontierModels";
import type { FrontierModel } from "@/types/frontierModels";

function money(value: number | null) {
  return value === null
    ? "Price unavailable"
    : value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
}

export function FrontierWorkloadResults({
  models,
  modelIds,
  input,
  onRemove,
}: {
  models: FrontierModel[];
  modelIds: string[];
  input: FrontierWorkloadInput;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="frm-workload-scroll"
      role="region"
      aria-label="Workload comparison"
      tabIndex={0}
    >
      <table className="frm-workload-table">
        <caption>Monthly text-token cost in USD</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">Total / month</th>
            <th scope="col">Input / month</th>
            <th scope="col">Output / month</th>
            <th scope="col">Requirement checks</th>
          </tr>
        </thead>
        <tbody>
          {modelIds.map((id) => {
            const model = models.find((item) => item.id === id);
            if (!model)
              return (
                <tr key={id}>
                  <th scope="row">
                    {id}
                    <button
                      className="frm-workload-link"
                      type="button"
                      onClick={() => onRemove(id)}
                      aria-label={`Remove model ${id}`}
                    >
                      Remove
                    </button>
                  </th>
                  <td colSpan={4}>
                    This model is no longer in the displayed dataset. Remove it
                    or choose a replacement.
                  </td>
                </tr>
              );
            const result = compareFrontierWorkload(model, input);
            const issues = [...result.unmet, ...result.unconfirmed];
            return (
              <tr key={id}>
                <th scope="row">
                  <span className="frm-workload-model">
                    {model.providerLabel} {model.name}
                  </span>
                  {model.docsUrl ? (
                    <a
                      className="frm-workload-link"
                      href={model.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Provider documentation
                      <span className="sr-only"> for {model.name}</span>
                    </a>
                  ) : null}
                  <button
                    className="frm-workload-link"
                    type="button"
                    onClick={() => onRemove(id)}
                    aria-label={`Remove model ${model.name}`}
                  >
                    Remove
                  </button>
                </th>
                <td className="frm-workload-total">
                  {money(result.totalCost)}
                </td>
                <td>
                  {money(result.inputCost)}
                  <span className="frm-workload-meta">
                    {formatPriceUsd(model.inputPricePerMTokens)} / million
                    tokens
                  </span>
                </td>
                <td>
                  {money(result.outputCost)}
                  <span className="frm-workload-meta">
                    {formatPriceUsd(model.outputPricePerMTokens)} / million
                    tokens
                  </span>
                </td>
                <td>
                  <span className="frm-workload-model">
                    {result.unmet.length
                      ? "Requirements unmet"
                      : result.unconfirmed.length
                        ? "Needs checking"
                        : "Listed requirements met"}
                  </span>
                  {issues.map((issue) => (
                    <p className="frm-workload-meta" key={issue}>
                      {issue}
                    </p>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
