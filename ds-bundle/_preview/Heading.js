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
      function jsxs2(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsxs2;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs2 : jsx2)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // .design-sync/previews/Heading.tsx
  var Heading_exports = {};
  __export(Heading_exports, {
    CardHeadings: () => CardHeadings,
    LevelScale: () => LevelScale,
    PageTitle: () => PageTitle
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

  // .design-sync/previews/Heading.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var LevelScale = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-2xl space-y-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 1, children: "The draft board" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 2, children: "Tiers, then names" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 3, children: "Reaches, steals, and runs" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 4, children: "How ADP matching works" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 5, children: "Snapshot freshness rules" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 6, children: "Schema v6 field notes" })
  ] });
  var PageTitle = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-2xl space-y-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 1, children: "I build tools I actually use" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "p",
      {
        style: {
          color: "var(--home-ink-muted)",
          fontSize: "1.05rem",
          lineHeight: 1.65,
          maxWidth: "48ch"
        },
        children: "QA engineer turned MBA. Most of this site is me working through draft boards, retirement math, and match data in public, because I think the honest way to learn a system is to ship one."
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 1, background: "var(--home-rule)", maxWidth: "48ch" } })
  ] });
  var CardHeadings = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex max-w-2xl gap-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex-1 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 space-y-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 5, as: "h3", children: "Premier League form" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm", style: { color: "var(--home-ink-muted)" }, children: "Last five matchdays, weighted toward away results." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex-1 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 space-y-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 6, as: "h3", children: "Monte Carlo runs" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm", style: { color: "var(--home-ink-muted)" }, children: "1,000 seeded paths against the dated capital-market assumptions." })
    ] })
  ] });
  return __toCommonJS(Heading_exports);
})();
