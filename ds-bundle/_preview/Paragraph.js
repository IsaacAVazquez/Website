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

  // .design-sync/previews/Paragraph.tsx
  var Paragraph_exports = {};
  __export(Paragraph_exports, {
    Editorial: () => Editorial,
    LedeAndBody: () => LedeAndBody,
    UnderHeading: () => UnderHeading
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

  // .design-sync/previews/Paragraph.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var Editorial = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { children: "Most draft advice treats average draft position like a law of nature. I treat it like a market price, and markets get things wrong in ways you can measure. The mock-draft data updates weekly, so the gap between a player's consensus rank and where people actually take him is a real, observable number." }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { children: "That gap is where the edge lives. When a tier is about to snap, I'd rather reach half a round early than take the best remaining name after it does, because the dropoff between tiers is almost always bigger than the dropoff inside one." }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { children: "None of this is exotic. It is the same reasoning I used testing voter outreach tools at Civitech: find the assumption everyone stopped checking, then check it." })
  ] });
  var LedeAndBody = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { className: "text-base lg:text-lg text-[var(--home-ink)]", children: "The retirement planner is deliberately boring, and I think that is its best feature." }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { children: "Every projection starts from dated capital-market assumptions you can read on the page, runs through a seeded Monte Carlo engine, and lands with the caveats still attached. If the output looks confident, the assumptions page tells you exactly how confident you should actually be." })
  ] });
  var UnderHeading = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-2xl space-y-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Heading, { level: 3, as: "h2", children: "How the snapshots stay honest" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { children: "Every dashboard on this site reads from a committed snapshot, not a live API. A failed refresh keeps the previous data instead of wiping it, so the worst case is a page that is a day stale and says so." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.Paragraph, { children: "The tradeoff is real: you give up the last hour of freshness to get pages that never break at request time. I have taken that trade every time it has come up." })
    ] })
  ] });
  return __toCommonJS(Paragraph_exports);
})();
