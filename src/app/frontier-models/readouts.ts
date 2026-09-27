import type { FrontierModel } from "@/types/frontierModels";

export interface FrontierReadouts {
  count: number;
  cheapest: FrontierModel | null;
  largestContext: FrontierModel | null;
}

/**
 * The three numbers the hero leads with. Cheapest ignores any model with no
 * listed input price and breaks a tie on name so the pick is deterministic.
 */
export function frontierReadouts(models: FrontierModel[]): FrontierReadouts {
  const priced = models.filter(
    (model): model is FrontierModel & { inputPricePerMTokens: number } =>
      model.inputPricePerMTokens !== null,
  );

  const cheapest =
    priced.length === 0
      ? null
      : priced.reduce((lead, model) => {
          if (model.inputPricePerMTokens < lead.inputPricePerMTokens) return model;
          if (
            model.inputPricePerMTokens === lead.inputPricePerMTokens &&
            model.name < lead.name
          ) {
            return model;
          }
          return lead;
        });

  const largestContext =
    models.length === 0
      ? null
      : models.reduce((lead, model) =>
          model.contextWindow > lead.contextWindow ? model : lead,
        );

  return { count: models.length, cheapest, largestContext };
}
