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

  // .design-sync/previews/FixtureLedgerSection.tsx
  var FixtureLedgerSection_exports = {};
  __export(FixtureLedgerSection_exports, {
    RecentResults: () => RecentResults,
    UpcomingSlate: () => UpcomingSlate
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

  // .design-sync/previews/FixtureLedgerSection.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var recentFixtures = [
    {
      id: "pl-361",
      utcDate: "2026-05-09T14:00:00Z",
      status: "FINISHED",
      matchday: 36,
      homeTeam: { id: "t-ars", shortName: "Arsenal", crest: null },
      awayTeam: { id: "t-new", shortName: "Newcastle", crest: null },
      score: { winner: "HOME_TEAM", home: 3, away: 1 }
    },
    {
      id: "pl-362",
      utcDate: "2026-05-09T16:30:00Z",
      status: "FINISHED",
      matchday: 36,
      homeTeam: { id: "t-tot", shortName: "Tottenham", crest: null },
      awayTeam: { id: "t-che", shortName: "Chelsea", crest: null },
      score: { winner: "DRAW", home: 2, away: 2 }
    },
    {
      id: "pl-371",
      utcDate: "2026-05-16T14:00:00Z",
      status: "FINISHED",
      matchday: 37,
      homeTeam: { id: "t-eve", shortName: "Everton", crest: null },
      awayTeam: { id: "t-mci", shortName: "Man City", crest: null },
      score: { winner: "AWAY_TEAM", home: 0, away: 3 }
    },
    {
      id: "pl-372",
      utcDate: "2026-05-16T16:30:00Z",
      status: "FINISHED",
      matchday: 37,
      homeTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
      awayTeam: { id: "t-bha", shortName: "Brighton", crest: null },
      score: { winner: "HOME_TEAM", home: 4, away: 2 }
    }
  ];
  var RecentResults = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-xl", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureLedgerSection, { groups: (0, ds_exports.groupFixturesByMatchday)(recentFixtures) }) });
  var upcomingFixtures = [
    {
      id: "pl-381",
      utcDate: "2026-05-24T14:00:00Z",
      status: "TIMED",
      matchday: 38,
      homeTeam: { id: "t-new", shortName: "Newcastle", crest: null },
      awayTeam: { id: "t-avl", shortName: "Aston Villa", crest: null },
      score: { winner: null, home: null, away: null }
    },
    {
      id: "pl-382",
      utcDate: "2026-05-24T14:00:00Z",
      status: "TIMED",
      matchday: 38,
      homeTeam: { id: "t-bha", shortName: "Brighton", crest: null },
      awayTeam: { id: "t-whu", shortName: "West Ham", crest: null },
      score: { winner: null, home: null, away: null }
    },
    {
      id: "pl-383",
      utcDate: "2026-05-24T14:00:00Z",
      status: "TIMED",
      matchday: 38,
      homeTeam: { id: "t-ful", shortName: "Fulham", crest: null },
      awayTeam: { id: "t-cry", shortName: "Crystal Palace", crest: null },
      score: { winner: null, home: null, away: null }
    },
    {
      id: "pl-399",
      utcDate: "2026-05-27T18:45:00Z",
      status: "TIMED",
      matchday: null,
      homeTeam: { id: "t-bou", shortName: "Bournemouth", crest: null },
      awayTeam: { id: "t-wol", shortName: "Wolves", crest: null },
      score: { winner: null, home: null, away: null }
    }
  ];
  var UpcomingSlate = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-xl", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.FixtureLedgerSection,
    {
      groups: (0, ds_exports.groupFixturesByMatchday)(upcomingFixtures, {
        suffix: "upcoming",
        fallbackLabel: "Rearranged"
      })
    }
  ) });
  return __toCommonJS(FixtureLedgerSection_exports);
})();
