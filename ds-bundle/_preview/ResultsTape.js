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

  // .design-sync/previews/ResultsTape.tsx
  var ResultsTape_exports = {};
  __export(ResultsTape_exports, {
    MatchdayLatest: () => MatchdayLatest,
    ResultsOnly: () => ResultsOnly,
    UpcomingOnly: () => UpcomingOnly
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

  // .design-sync/previews/ResultsTape.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var recentResults = [
    {
      id: "pl-371",
      utcDate: "2026-05-16T14:00:00Z",
      status: "FINISHED",
      homeTeam: { shortName: "Arsenal", tla: "ARS" },
      awayTeam: { shortName: "Liverpool", tla: "LIV" },
      score: { winner: "HOME_TEAM", home: 2, away: 1 }
    },
    {
      id: "pl-372",
      utcDate: "2026-05-16T16:30:00Z",
      status: "FINISHED",
      homeTeam: { shortName: "Tottenham", tla: "TOT" },
      awayTeam: { shortName: "Chelsea", tla: "CHE" },
      score: { winner: "DRAW", home: 2, away: 2 }
    },
    {
      id: "pl-373",
      utcDate: "2026-05-17T13:00:00Z",
      status: "FINISHED",
      homeTeam: { shortName: "Everton", tla: "EVE" },
      awayTeam: { shortName: "Man City", tla: "MCI" },
      score: { winner: "AWAY_TEAM", home: 0, away: 3 }
    }
  ];
  var upcomingFixtures = [
    {
      id: "pl-381",
      utcDate: "2026-05-24T14:00:00Z",
      status: "TIMED",
      homeTeam: { shortName: "Newcastle", tla: "NEW" },
      awayTeam: { shortName: "Aston Villa", tla: "AVL" },
      score: { winner: null, home: null, away: null }
    },
    {
      id: "pl-382",
      utcDate: "2026-05-24T14:00:00Z",
      status: "TIMED",
      homeTeam: { shortName: "Brighton", tla: "BHA" },
      awayTeam: { shortName: "West Ham", tla: "WHU" },
      score: { winner: null, home: null, away: null }
    }
  ];
  var tapeShell = {
    border: "1px solid var(--home-rule)",
    background: "var(--home-paper-alt)",
    borderRadius: 8,
    padding: "4px 16px"
  };
  var signalDot = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "span",
    {
      style: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "var(--home-signal)",
        flexShrink: 0
      }
    }
  );
  var MatchdayLatest = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: tapeShell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ResultsTape,
    {
      recentFixtures: recentResults,
      upcomingFixtures: upcomingFixtures.slice(0, 1),
      label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8 }, children: [
        signalDot,
        "Matchday 37 · latest"
      ] })
    }
  ) });
  var ResultsOnly = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: tapeShell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ResultsTape,
    {
      recentFixtures: recentResults,
      upcomingFixtures: [],
      label: "Full time"
    }
  ) });
  var UpcomingOnly = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: tapeShell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ResultsTape,
    {
      recentFixtures: [],
      upcomingFixtures,
      label: "Next kickoffs"
    }
  ) });
  return __toCommonJS(ResultsTape_exports);
})();
