// Regenerate self-contained component prop contracts (cfg.dtsPropsFor) for the
// design-sync bundle. Run from the repo root BEFORE package-build on any sync
// where component prop APIs may have changed:
//
//   node .design-sync/gen-contracts.mjs
//
// Why this exists: this repo is a Next.js app, not a component library — it
// ships no built .d.ts tree and no package `main`/`module`, so the converter's
// own ts-morph extraction collapses every contract to `[key: string]: unknown`.
// This script recovers real, fully self-contained contracts:
//   1. emits declarations for the scoped component sources via the repo tsconfig
//      (resolves the `@/*` alias) into dist/types/ (gitignored),
//   2. writes an index.d.ts barrel at the repo root (gitignored) so the
//      converter enumerates exactly the scoped exports,
//   3. reads each component's props type from the emitted declarations and
//      serializes it with every non-React named type expanded to its structural
//      shape, so no contract references an undefined domain type,
//   4. writes the result into cfg.dtsPropsFor in .design-sync/config.json.
//
// Dependencies: ts-morph (installed into .ds-sync/node_modules by the sync
// setup) and the repo's own typescript (node_modules/.bin/tsc). Idempotent.

import { Project, ts } from '../.ds-sync/node_modules/ts-morph/dist/ts-morph.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CFG_PATH = '.design-sync/config.json';
const cfg = JSON.parse(readFileSync(CFG_PATH, 'utf8'));
const map = cfg.componentSrcMap;
const names = Object.keys(map);
const files = [...new Set(Object.values(map))];

// ── 1. Emit declarations for the component sources ────────────────────────
mkdirSync('.design-sync/.cache', { recursive: true });
writeFileSync(
  '.design-sync/.cache/css-shim.d.ts',
  'declare module "*.module.css" { const classes: Record<string, string>; export default classes; }\ndeclare module "*.css";\n',
);
writeFileSync('.design-sync/.cache/tsconfig.dts.json', JSON.stringify({
  extends: '../../tsconfig.json',
  compilerOptions: {
    declaration: true, emitDeclarationOnly: true, noEmit: false,
    noEmitOnError: false, incremental: false, skipLibCheck: true,
    types: [], rootDir: '../..', outDir: '../../dist/types',
  },
  include: files.map((f) => `../../${f}`).concat(['css-shim.d.ts']),
}, null, 2));
try {
  execFileSync('node_modules/.bin/tsc', ['-p', '.design-sync/.cache/tsconfig.dts.json'], { stdio: 'ignore' });
} catch { /* declaration emit is best-effort; type errors don't block emit */ }

// ── 2. Barrel: exactly the scoped exports, so discovery stays at N ─────────
writeFileSync('index.d.ts',
  names.map((n) => `export { ${n} } from "./dist/types/${map[n].replace(/\.tsx?$/, '')}";`).join('\n') + '\n');

// ── 3. Expand each component's props to a self-contained body ──────────────
const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true, strict: true,
  },
});
project.addSourceFilesAtPaths(['dist/types/**/*.d.ts', 'node_modules/@types/react/index.d.ts']);

const isLibType = (sym) => {
  const d = sym?.getDeclarations?.()[0];
  if (!d) return false;
  const fp = d.getSourceFile().getFilePath();
  return /\/node_modules\/@types\/react\//.test(fp) || /\/typescript\/lib\/lib\./.test(fp);
};
// Mirror the converter's prop filter: keep structural props by name, drop props
// inherited from React DOM/aria attribute bags so a component extending
// React.HTMLAttributes doesn't dump hundreds of aria-*/on* handlers.
const KEEP_PROP = /^(children|className|style|as|asChild|ref|id)$/;
const keepProp = (sym) => {
  if (KEEP_PROP.test(sym.getName())) return true;
  const d = sym.getDeclarations?.()[0];
  if (!d) return true;
  const fp = d.getSourceFile().getFilePath();
  return !(/\/node_modules\/@types\/react\//.test(fp) || /\/typescript\/lib\/lib\./.test(fp));
};
// Qualify a lib-declared type: @types/react → React.<Name> (JSX.Element stays
// React.JSX.Element); TS/DOM globals (Element, HTMLElement, Map, Date) stay bare.
const qualifyLib = (sym) => {
  const d = sym?.getDeclarations?.()[0];
  const fp = d?.getSourceFile().getFilePath() ?? '';
  const n = sym?.getName?.() ?? 'unknown';
  if (/\/node_modules\/@types\/react\//.test(fp)) {
    if (n === 'JSX' || (n === 'Element' && /JSX/.test(d.getParent?.()?.getText?.() ?? ''))) return 'React.JSX.Element';
    return `React.${n}`;
  }
  return n;
};

function serialize(type, node, seen, depth) {
  if (depth > 8) return 'unknown';
  if (type.isStringLiteral()) return JSON.stringify(type.getLiteralValue());
  if (type.isNumberLiteral()) return String(type.getLiteralValue());
  if (type.isBooleanLiteral()) return type.getText();
  if (type.isString()) return 'string';
  if (type.isNumber()) return 'number';
  if (type.isBoolean()) return 'boolean';
  if (type.isNull()) return 'null';
  if (type.isUndefined()) return 'undefined';
  if (type.isAny()) return 'any';
  if (type.isUnknown()) return 'unknown';
  if (type.isVoid()) return 'void';
  if (type.isNever()) return 'never';
  if (type.getText() === 'Date') return 'Date';
  const sym = type.getSymbol() ?? type.getAliasSymbol();
  if (isLibType(sym)) {
    const base = qualifyLib(sym);
    const args = type.getTypeArguments?.() ?? [];
    if (args.length) return `${base}<${args.map((a) => serialize(a, node, seen, depth + 1)).join(', ')}>`;
    return base;
  }
  if (type.isUnion()) {
    const parts = type.getUnionTypes().map((t) => serialize(t, node, seen, depth)).filter((p) => p !== 'undefined');
    let uniq = [...new Set(parts)];
    if (uniq.includes('true') && uniq.includes('false')) {
      uniq = [...new Set(uniq.filter((p) => p !== 'true' && p !== 'false').concat('boolean'))];
    }
    if (uniq.length === 0) return 'undefined';
    if (uniq.length === 1) return uniq[0];
    if (uniq.length > 24 && uniq.every((p) => /^"/.test(p))) return 'React.ElementType';
    return uniq.map((p) => (/=>/.test(p) ? `(${p})` : p)).join(' | ');
  }
  if (type.isIntersection()) {
    return type.getIntersectionTypes().map((t) => serialize(t, node, seen, depth)).join(' & ');
  }
  if (type.isArray()) {
    const s = serialize(type.getArrayElementTypeOrThrow(), node, seen, depth + 1);
    return /[ |&]/.test(s) ? `Array<${s}>` : `${s}[]`;
  }
  if (type.isTuple()) {
    return `[${type.getTupleElements().map((t) => serialize(t, node, seen, depth + 1)).join(', ')}]`;
  }
  const callSigs = type.getCallSignatures();
  if (callSigs.length && !type.getProperties().length) {
    const s = callSigs[0];
    const params = s.getParameters().map((p) => `${p.getName()}: ${serialize(p.getTypeAtLocation(node), node, seen, depth + 1)}`);
    return `(${params.join(', ')}) => ${serialize(s.getReturnType(), node, seen, depth + 1)}`;
  }
  if (type.isObject() || type.getProperties().length) {
    const key = sym?.getFullyQualifiedName?.() ?? type.getText();
    if (seen.has(key)) return sym?.getName?.() ?? 'unknown';
    const nextSeen = new Set(seen); if (sym) nextSeen.add(key);
    const props = type.getProperties().filter(keepProp);
    if (!props.length) return type.getText(node);
    const fields = props.map((p) => {
      const opt = p.hasFlags(ts.SymbolFlags.Optional) || (p.compilerSymbol.flags & ts.SymbolFlags.Optional);
      return `${p.getName()}${opt ? '?' : ''}: ${serialize(p.getTypeAtLocation(node), node, nextSeen, depth + 1)}`;
    });
    return `{ ${fields.join('; ')} }`;
  }
  return type.getText(node);
}

function findProps(name) {
  for (const sf of project.getSourceFiles()) {
    if (!sf.getFilePath().includes('/dist/types/')) continue;
    const iface = sf.getInterface(`${name}Props`) ?? sf.getTypeAlias(`${name}Props`);
    if (iface) return { type: iface.getType(), node: iface };
  }
  for (const sf of project.getSourceFiles()) {
    if (!sf.getFilePath().includes('/dist/types/')) continue;
    const decls = sf.getExportedDeclarations().get(name);
    if (!decls?.length) continue;
    for (const d of decls) {
      const sig = d.getType?.().getCallSignatures?.()[0];
      const p0 = sig?.getParameters()[0];
      if (p0) return { type: p0.getTypeAtLocation(d), node: d };
    }
  }
  return null;
}

const bodies = {};
for (const name of names) {
  const found = findProps(name);
  if (!found) { console.error(`no-props: ${name} (emitting empty contract)`); continue; }
  const props = found.type.getApparentType().getProperties().filter(keepProp);
  if (!props.length) { console.error(`no-props: ${name} (emitting empty contract)`); continue; }
  bodies[name] = props.map((p) => {
    const opt = p.hasFlags(ts.SymbolFlags.Optional) || (p.compilerSymbol.flags & ts.SymbolFlags.Optional);
    return `  ${p.getName()}${opt ? '?' : ''}: ${serialize(p.getTypeAtLocation(found.node), found.node, new Set(), 0)};`;
  }).join('\n');
}
// Props-less components get an honest empty-contract comment, not the degenerate
// `[key: string]: unknown` default.
for (const name of names) {
  if (!bodies[name]) bodies[name] = `  // ${name} takes no props.`;
}

// ── 4. Write into config ───────────────────────────────────────────────────
cfg.dtsPropsFor = bodies;
writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2) + '\n');
console.error(`✓ dtsPropsFor: ${Object.keys(bodies).length} self-contained contracts written to ${CFG_PATH}`);
