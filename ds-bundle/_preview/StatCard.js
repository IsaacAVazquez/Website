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

  // .design-sync/previews/StatCard.tsx
  var StatCard_exports = {};
  __export(StatCard_exports, {
    CompactGrid: () => CompactGrid,
    FullMetricOnly: () => FullMetricOnly,
    FullWithTitle: () => FullWithTitle
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

  // .design-sync/previews/StatCard.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var trophyIcon = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5" })
      ]
    }
  );
  var targetIcon = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "8" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "3" })
      ]
    }
  );
  var shieldIcon = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" })
    }
  );
  var calendarIcon = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "4", y: "5", width: "16", height: "16", rx: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 3v4M16 3v4M4 11h16" })
      ]
    }
  );
  var CompactGrid = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: "max-w-xl",
      style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.StatCard,
          {
            variant: "compact",
            eyebrow: "Leader",
            metric: "Arsenal · 86 pts",
            detail: "3 clear with one round to play",
            icon: trophyIcon
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.StatCard,
          {
            variant: "compact",
            eyebrow: "Top scorer",
            metric: "24 goals",
            detail: "Haaland, Man City",
            icon: targetIcon
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.StatCard,
          {
            variant: "compact",
            eyebrow: "Best defense",
            metric: "27 conceded",
            detail: "Arsenal, 17 clean sheets",
            icon: shieldIcon
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.StatCard,
          {
            variant: "compact",
            eyebrow: "Matchday",
            metric: "37 of 38",
            detail: "Final round Sunday 16:00",
            icon: calendarIcon
          }
        )
      ]
    }
  );
  var FullWithTitle = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.StatCard,
    {
      eyebrow: "Pichichi race",
      title: "Lewandowski holds the lead",
      metric: "27 goals",
      detail: "Three clear of Vinícius Júnior with four matchdays left in La Liga.",
      icon: targetIcon
    }
  ) });
  var FullMetricOnly = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.StatCard,
    {
      eyebrow: "Goals per match",
      metric: "2.84",
      detail: "Up from 2.69 across the same 37 matchdays last season.",
      icon: calendarIcon
    }
  ) });
  return __toCommonJS(StatCard_exports);
})();
