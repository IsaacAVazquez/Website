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

  // .design-sync/previews/DropdownMenu.tsx
  var DropdownMenu_exports = {};
  __export(DropdownMenu_exports, {
    OpenMenu: () => OpenMenu,
    TriggerClosed: () => TriggerClosed
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

  // .design-sync/previews/DropdownMenu.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var triggerStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: 9999,
    border: "1px solid var(--home-rule)",
    background: "var(--home-paper)",
    color: "var(--home-ink)",
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600
  };
  var Chevron = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m6 9 6 6 6-6" })
    }
  );
  var TriggerClosed = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenu, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: triggerStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        style: {
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--home-ink-muted)"
        },
        children: "Source"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All feeds" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chevron, {})
  ] }) }) });
  var OpenMenu = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { minHeight: 320 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.DropdownMenu, { open: true, modal: false, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: triggerStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Scoring format" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chevron, {})
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.DropdownMenuContent, { align: "start", sideOffset: 6, style: { minWidth: 220 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuLabel, { children: "Scoring format" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.DropdownMenuRadioGroup, { value: "half-ppr", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuRadioItem, { value: "ppr", children: "PPR" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuRadioItem, { value: "half-ppr", children: "Half PPR" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuRadioItem, { value: "standard", children: "Standard" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuSeparator, {}),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuCheckboxItem, { checked: true, children: "Show tier breaks" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ds_exports.DropdownMenuItem, { children: [
        "Export board",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.DropdownMenuShortcut, { children: "⌘E" })
      ] })
    ] })
  ] }) });
  return __toCommonJS(DropdownMenu_exports);
})();
