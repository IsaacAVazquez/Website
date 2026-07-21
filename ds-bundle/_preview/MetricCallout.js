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

  // .design-sync/previews/MetricCallout.tsx
  var MetricCallout_exports = {};
  __export(MetricCallout_exports, {
    ProjectImpactGrid: () => ProjectImpactGrid,
    Sizes: () => Sizes,
    Variants: () => Variants,
    WithIconAndImprovement: () => WithIconAndImprovement
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

  // .design-sync/previews/MetricCallout.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var TrendIcon = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: "20",
      height: "20",
      viewBox: "0 0 20 20",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2 14l5-5 3 3 8-8" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M13 4h5v5" })
      ]
    }
  );
  var Variants = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: "max-w-2xl",
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.MetricCallout,
          {
            value: "42",
            label: "Data sources tracked",
            variant: "default",
            animateValue: false
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.MetricCallout,
          {
            value: "99.2%",
            label: "Snapshot refresh success",
            variant: "success",
            animateValue: false
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.MetricCallout,
          {
            value: "215",
            label: "Players ranked this week",
            variant: "primary",
            animateValue: false
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.MetricCallout,
          {
            value: "6",
            label: "Feeds flagged stale",
            variant: "warning",
            animateValue: false
          }
        )
      ]
    }
  );
  var Sizes = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex max-w-2xl flex-wrap gap-3", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "$1.2M",
        label: "Median outcome, sm",
        size: "sm",
        animateValue: false
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "$1.2M",
        label: "Median outcome, md",
        size: "md",
        animateValue: false
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "$1.2M",
        label: "Median outcome, lg",
        size: "lg",
        animateValue: false
      }
    )
  ] });
  var WithIconAndImprovement = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: "max-w-xl",
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.MetricCallout,
          {
            value: "96%",
            label: "ADP match rate",
            improvement: "4 pts since the v6 schema",
            icon: TrendIcon,
            variant: "primary",
            animateValue: false
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ds_exports.MetricCallout,
          {
            value: "1,240",
            label: "Mock drafts parsed",
            improvement: "310 added this cycle",
            variant: "success",
            animateValue: false
          }
        )
      ]
    }
  );
  var ProjectImpactGrid = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-2xl", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.MetricGrid, { columns: 2, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "60%",
        label: "Regression suite runtime cut",
        improvement: "From 50 min to 20 min",
        variant: "primary",
        animateValue: false
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "1,800+",
        label: "Automated checks per release",
        animateValue: false
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "12",
        label: "Release blockers caught pre-prod",
        improvement: "Zero escaped to users",
        animateValue: false
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.MetricCallout,
      {
        value: "3x",
        label: "Faster triage on flaky tests",
        animateValue: false
      }
    )
  ] }) });
  return __toCommonJS(MetricCallout_exports);
})();
