import type { BudgetCategorySummary } from "@/types/budget";
import { envelope } from "./envelopes";
import { formatDollars } from "@/lib/utils";

interface EnvelopesSignatureProps {
  categories: BudgetCategorySummary[];
}

/**
 * One envelope per category, filled by what was spent against what was
 * budgeted, drawn torn open once spending passes the budget. The fill bar
 * and the tear are decorative marks; the same reading is printed as text
 * underneath, so the graphic never becomes the only source of it.
 */
export function EnvelopesSignature({ categories }: EnvelopesSignatureProps) {
  if (categories.length === 0) {
    return (
      <div className="c97-envelope-grid">
        <div className="c97-envelope" data-torn="false">
          <div className="c97-envelope-flap" aria-hidden="true" />
          <div className="c97-envelope-body">
            <p className="c97-serif c97-envelope-name">Add a category below</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="c97-envelope-grid">
      {categories.map((category) => {
        const { fill, torn, overBy, spentLabel, budgetLabel } = envelope(
          category.spent,
          category.budgetedAmount
        );
        const displayName = category.name || "Untitled";

        return (
          <div key={category.id} className="c97-envelope" data-torn={torn ? "true" : "false"}>
            <div
              className="c97-envelope-fill"
              style={{ height: `${fill * 100}%` }}
              aria-hidden="true"
            />
            <div className="c97-envelope-flap" aria-hidden="true" />
            <div className="c97-envelope-body">
              <p className="c97-serif c97-envelope-name">{displayName}</p>
              {/* A first visit seeds seven categories with nothing budgeted or
                  spent, which printed "$0 of $0" seven times. */}
              {category.budgetedAmount === 0 && category.spent === 0 ? (
                <p className="c97-envelope-amount">Set a budget below</p>
              ) : (
                <p className="c97-mono c97-envelope-amount">
                  {spentLabel} of {budgetLabel}
                </p>
              )}
              {torn ? (
                <p className="c97-mono c97-envelope-over">Over by {formatDollars(overBy)}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
