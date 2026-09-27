/**
 * The server renders in UTC and each visitor's browser in its own zone and
 * locale, so any date formatter without a pinned `timeZone`, and any
 * formatter left on the browser's default locale, prints different text on
 * each side and breaks hydration. This walks every source file and fails on
 * such a call. A call that deliberately keeps the visitor's local zone (data
 * the visitor typed, rendered only in the browser) carries a
 * `// tz-local: <reason>` comment in the comment block directly above it.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SRC = path.join(__dirname, "..", "..");
const DATE_OPTION_KEYS = new Set([
  "dateStyle",
  "timeStyle",
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "dayPeriod",
  "hour",
  "minute",
  "second",
  "timeZoneName",
]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$|\.d\.ts$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function optionKeys(node: ts.Expression | undefined): Set<string> | null {
  if (!node || !ts.isObjectLiteralExpression(node)) return null;
  const keys = new Set<string>();
  for (const property of node.properties) {
    if (ts.isSpreadAssignment(property)) keys.add("...");
    else if (property.name) keys.add(property.name.getText().replace(/["']/g, ""));
  }
  return keys;
}

const isStringLocale = (node: ts.Expression | undefined) =>
  !!node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isArrayLiteralExpression(node));

function findViolations(): string[] {
  const violations: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, "utf8");
    if (!/DateTimeFormat|toLocale|Intl\./.test(text)) continue;
    const lines = text.split("\n");
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const report = (node: ts.Node, problem: string) => {
      const line = sf.getLineAndCharacterOfPosition(node.getStart()).line;
      // The exemption lives on the call's line or in the comment block directly above it.
      let first = line;
      while (first > 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[first - 1])) first -= 1;
      if (lines.slice(first, line + 1).join("\n").includes("tz-local:")) return;
      violations.push(`${path.relative(SRC, file)}:${line + 1} ${problem}`);
    };
    const visit = (node: ts.Node) => {
      if (ts.isNewExpression(node) && /^Intl\.(DateTimeFormat|NumberFormat|RelativeTimeFormat|PluralRules|ListFormat)$/.test(node.expression.getText())) {
        const [locale, options] = node.arguments ?? [];
        if (!isStringLocale(locale)) report(node, `${node.expression.getText()} without a literal locale`);
        if (node.expression.getText() === "Intl.DateTimeFormat" && !optionKeys(options)?.has("timeZone")) {
          report(node, "Intl.DateTimeFormat without a timeZone");
        }
      } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const name = node.expression.name.getText();
        if (name === "toLocaleDateString" || name === "toLocaleTimeString" || name === "toLocaleString") {
          const [locale, options] = node.arguments;
          if (!isStringLocale(locale)) report(node, `${name}() without a literal locale`);
          const keys = optionKeys(options);
          const formatsDate = name !== "toLocaleString" || [...(keys ?? [])].some((key) => DATE_OPTION_KEYS.has(key));
          if (formatsDate && !keys?.has("timeZone")) report(node, `${name}() on a date without a timeZone`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return violations;
}

describe("timezone and locale pinning", () => {
  it("pins a timeZone and a literal locale on every date and number formatter", () => {
    expect(findViolations()).toEqual([]);
  });
});
