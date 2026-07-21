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

  // .design-sync/previews/FixtureCard.tsx
  var FixtureCard_exports = {};
  __export(FixtureCard_exports, {
    CompactWithTeamContext: () => CompactWithTeamContext,
    Finished: () => Finished,
    ShootoutDecided: () => ShootoutDecided,
    Upcoming: () => Upcoming
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

  // .design-sync/previews/FixtureCard.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var finished = {
    id: "pl-431",
    utcDate: "2026-05-17T14:00:00Z",
    status: "FINISHED",
    matchday: 37,
    homeTeam: { id: "t-ars", shortName: "Arsenal", crest: null },
    awayTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
    score: { winner: "HOME_TEAM", home: 2, away: 1 }
  };
  var upcoming = {
    id: "pl-440",
    utcDate: "2026-05-24T15:30:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-mci", shortName: "Man City", crest: null },
    awayTeam: { id: "t-che", shortName: "Chelsea", crest: null },
    score: { winner: null, home: null, away: null }
  };
  var shootout = {
    id: "wc-r16-3",
    utcDate: "2026-07-06T19:00:00Z",
    status: "FINISHED",
    matchday: null,
    homeTeam: { id: "t-ned", shortName: "Netherlands", crest: null },
    awayTeam: { id: "t-arg", shortName: "Argentina", crest: null },
    score: {
      winner: "AWAY_TEAM",
      home: 2,
      away: 2,
      shootoutHome: 3,
      shootoutAway: 4
    }
  };
  var Finished = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureCard, { fixture: finished }) });
  var Upcoming = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureCard, { fixture: upcoming }) });
  var finishedDraw = {
    id: "pl-433",
    utcDate: "2026-05-10T14:00:00Z",
    status: "FINISHED",
    matchday: 36,
    homeTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
    awayTeam: { id: "t-tot", shortName: "Tottenham", crest: null },
    score: { winner: "DRAW", home: 1, away: 1 }
  };
  var CompactWithTeamContext = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-w-md space-y-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureCard, { fixture: finished, compact: true, contextTeamId: "t-ars" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureCard, { fixture: finishedDraw, compact: true, contextTeamId: "t-liv" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureCard, { fixture: finished, compact: true, contextTeamId: "t-liv" })
  ] });
  var ShootoutDecided = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-w-md", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.FixtureCard, { fixture: shootout, periodLabel: "Round of 16", fallbackLabel: "Knockout tie" }) });
  return __toCommonJS(FixtureCard_exports);
})();
