"use strict";
var __dsPreview = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // ds-raw:__ds_raw__
  var require_ds_raw = __commonJS({
    "ds-raw:__ds_raw__"(exports, module) {
      init_define_import_meta_env();
      module.exports = window.WorkingInstrument;
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      var R = window.React;
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx2(t, p, k) {
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsxs;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs : jsx2)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // .design-sync/previews/PageSummary.tsx
  var PageSummary_exports = {};
  __export(PageSummary_exports, {
    Compact: () => Compact,
    Default: () => Default,
    Featured: () => Featured
  });
  init_define_import_meta_env();

  // ds-shim:ds
  var ds_exports = {};
  __export(ds_exports, {
    default: () => ds_default
  });
  init_define_import_meta_env();
  __reExport(ds_exports, __toESM(require_ds_raw()));
  var g = window.WorkingInstrument;
  var ds_default = "default" in g ? g.default : g;

  // .design-sync/previews/PageSummary.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var Featured = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-2xl", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.PageSummary,
    {
      variant: "featured",
      title: "Draft strategy, tested against real ADP",
      tldr: "Tier breaks matter more than pick order. I'd rather reach a round early for the last player in a tier than take the best name available after it snaps.",
      summary: "I rebuilt the draft board around tier gaps instead of overall rank. The rankings come from a FantasyPros consensus snapshot, and the ADP baseline comes from mock drafts, so every reach and steal is measured against what real drafters actually do.",
      context: "Numbers refresh weekly during the season. Treat the tiers as the signal and the exact ranks as noise."
    }
  ) });
  var Default = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-2xl", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.PageSummary,
    {
      title: "How the retirement planner thinks",
      summary: "The projection engine is deliberately boring: dated capital-market assumptions, a seeded Monte Carlo run, and no hidden levers. I think the honest move is showing the assumptions next to the output, so the page does exactly that."
    }
  ) });
  var Compact = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-2xl", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.PageSummary,
    {
      variant: "compact",
      title: "About this dashboard",
      summary: "Scores land as committed snapshots, not live API calls, so the page stays fast and the data stays auditable."
    }
  ) });
  return __toCommonJS(PageSummary_exports);
})();
