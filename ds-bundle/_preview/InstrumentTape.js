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

  // .design-sync/previews/InstrumentTape.tsx
  var InstrumentTape_exports = {};
  __export(InstrumentTape_exports, {
    EmptyFallback: () => EmptyFallback,
    LaunchTape: () => LaunchTape,
    QuoteTape: () => QuoteTape
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

  // .design-sync/previews/InstrumentTape.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var shell = {
    border: "1px solid var(--home-rule)",
    borderRadius: 18,
    background: "color-mix(in srgb, var(--home-paper-alt) 62%, var(--home-paper))",
    overflow: "hidden",
    padding: "0 14px",
    maxWidth: 900
  };
  var subTag = {
    fontSize: "0.62rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--home-ink-muted)"
  };
  function outcome(ok) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: ok ? "var(--home-positive)" : "var(--home-negative)",
          fontWeight: 600,
          textTransform: "uppercase",
          fontSize: "0.62rem",
          letterSpacing: "0.08em"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              "aria-hidden": "true",
              style: { width: 6, height: 6, borderRadius: 9999, background: "currentColor" }
            }
          ),
          ok ? "OK" : "Fail"
        ]
      }
    );
  }
  var QuoteTape = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.InstrumentTape,
    {
      ariaLabel: "Holdings quote tape",
      label: "Snapshot · May 15",
      items: [
        {
          key: "VTI",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "VTI" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$262.41" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-positive)" }, children: "+0.8%" })
          ] })
        },
        {
          key: "VXUS",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "VXUS" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$64.87" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-negative)" }, children: "-0.4%" })
          ] })
        },
        {
          key: "BND",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "BND" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$73.12" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-positive)" }, children: "+0.1%" })
          ] })
        },
        {
          key: "QQQ",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "QQQ" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "$448.95" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-positive)" }, children: "+1.2%" })
          ] })
        }
      ]
    }
  ) });
  var LaunchTape = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.InstrumentTape,
    {
      ariaLabel: "Recent launch outcomes and upcoming launch windows",
      label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "span",
          {
            "aria-hidden": "true",
            style: { width: 6, height: 6, borderRadius: 9999, background: "var(--home-signal)" }
          }
        ),
        "Latest · Flight 412"
      ] }),
      items: [
        {
          key: "starlink-12-8",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 500 }, children: "Starlink 12-8" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: subTag, children: "F9" }),
            outcome(true)
          ] })
        },
        {
          key: "crs-33",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 500 }, children: "CRS-33" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: subTag, children: "F9" }),
            outcome(true)
          ] })
        },
        {
          key: "ift-11",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 500 }, children: "Flight 11" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: subTag, children: "SS" }),
            outcome(false)
          ] })
        },
        {
          key: "ussf-87",
          content: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--home-ink-muted)" }, children: "USSF-87" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: subTag, children: "FH" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "0.62rem", color: "var(--home-ink-muted)" }, children: "May 22, 02:05 PM" })
          ] })
        }
      ]
    }
  ) });
  var EmptyFallback = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.InstrumentTape,
    {
      ariaLabel: "Launch tape",
      items: [],
      emptyFallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "p",
        {
          className: "text-sm",
          style: { margin: 0, padding: "14px 4px", color: "var(--home-ink-muted)" },
          children: "No recent outcomes or upcoming windows are available from the current snapshot."
        }
      )
    }
  ) });
  return __toCommonJS(InstrumentTape_exports);
})();
