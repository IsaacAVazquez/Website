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

  // .design-sync/previews/ReadoutPanel.tsx
  var ReadoutPanel_exports = {};
  __export(ReadoutPanel_exports, {
    LiveIndex: () => LiveIndex,
    OnHeroPlate: () => OnHeroPlate,
    WithSparkline: () => WithSparkline
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

  // .design-sync/previews/ReadoutPanel.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var liveLabel = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 9 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        style: {
          width: 7,
          height: 7,
          borderRadius: 9999,
          background: "var(--home-signal)",
          flexShrink: 0
        }
      }
    ),
    "Live index"
  ] });
  var footerNote = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "p",
    {
      style: {
        margin: 0,
        padding: "11px 16px",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.7rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--home-ink-muted)"
      },
      children: "USGS · SpaceX · Stooq · refreshed by CI"
    }
  );
  var heroRows = [
    { label: "Latest quake", value: "M 4.6" },
    { label: "Next launch", value: "T− 02:14:36" },
    { label: "SPY day move", value: "+0.42%" }
  ];
  var LiveIndex = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ReadoutPanel,
    {
      label: liveLabel,
      stamp: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "12:00:04 UTC" }),
      rows: heroRows,
      footer: footerNote
    }
  ) });
  var sparkValues = [2.1, 3.4, 2.8, 4.6, 3.1, 2.2, 5, 3.7, 2.9, 4.1];
  var magnitudeSpark = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "14px 16px 6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      viewBox: "0 0 300 26",
      preserveAspectRatio: "none",
      style: { width: "100%", height: 26, display: "block" },
      "aria-hidden": "true",
      children: sparkValues.map((value, index) => {
        const barHeight = Math.max(2, value / 5 * 26);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "rect",
          {
            x: index * 30,
            y: 26 - barHeight,
            width: 27,
            height: barHeight,
            fill: index === sparkValues.length - 1 ? "var(--home-signal)" : "var(--home-rule)"
          },
          index
        );
      })
    }
  ) });
  var WithSparkline = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ReadoutPanel,
    {
      label: liveLabel,
      stamp: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Feed 3 min old" }),
      rows: [
        { label: "Latest quake", value: "M 4.6" },
        { label: "Depth", value: "11 km" }
      ],
      footer: footerNote,
      children: magnitudeSpark
    }
  ) });
  var plateVars = {
    "--hp-ink": "var(--home-paper-alt)",
    "--hp-paper": "var(--home-ink)",
    "--hp-muted": "color-mix(in srgb, var(--home-paper-alt) 60%, transparent)",
    "--hp-rule": "color-mix(in srgb, var(--home-paper-alt) 18%, transparent)",
    "--hp-rule-soft": "color-mix(in srgb, var(--home-paper-alt) 10%, transparent)",
    background: "var(--hp-ink)",
    color: "var(--hp-paper)",
    border: "1px solid var(--home-rule)",
    padding: "1.75rem 1.25rem"
  };
  var OnHeroPlate = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", style: plateVars, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ReadoutPanel,
    {
      label: liveLabel,
      stamp: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "12:00:04 UTC" }),
      rows: heroRows
    }
  ) });
  return __toCommonJS(ReadoutPanel_exports);
})();
