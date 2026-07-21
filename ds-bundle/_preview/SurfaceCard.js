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

  // .design-sync/previews/SurfaceCard.tsx
  var SurfaceCard_exports = {};
  __export(SurfaceCard_exports, {
    BriefingPanel: () => BriefingPanel,
    WithRuledList: () => WithRuledList
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

  // .design-sync/previews/SurfaceCard.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var BriefingPanel = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.SurfaceCard, { className: "p-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "p",
      {
        className: "text-xs",
        style: {
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 600,
          color: "var(--home-ink-muted)"
        },
        children: "Matchday 37 briefing"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm", style: { marginTop: 10, fontWeight: 600, color: "var(--home-ink)" }, children: "Arsenal can clinch the title on Saturday" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm", style: { marginTop: 6, lineHeight: 1.6, color: "var(--home-ink-muted)" }, children: "A home draw against Liverpool is enough if Man City drop points at Brighton. I would not plan the parade around City dropping points." })
  ] }) });
  var raceRows = [
    { club: "Arsenal", points: "86 pts" },
    { club: "Man City", points: "83 pts" },
    { club: "Liverpool", points: "79 pts" }
  ];
  var WithRuledList = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.SurfaceCard, { className: "p-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm", style: { fontWeight: 600, color: "var(--home-ink)" }, children: "Title race" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-xs", style: { color: "var(--home-ink-muted)" }, children: "1 round left" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 12, borderTop: "1px solid var(--home-rule)" }, children: raceRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: "flex items-center justify-between text-sm",
        style: { padding: "10px 0", borderBottom: "1px solid var(--home-rule)" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-ink)" }, children: row.club }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-ink-muted)", fontVariantNumeric: "tabular-nums" }, children: row.points })
        ]
      },
      row.club
    )) })
  ] }) });
  return __toCommonJS(SurfaceCard_exports);
})();
