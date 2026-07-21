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

  // .design-sync/previews/ClubDrawer.tsx
  var ClubDrawer_exports = {};
  __export(ClubDrawer_exports, {
    LoadingDetail: () => LoadingDetail,
    OpenClubDetail: () => OpenClubDetail
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

  // .design-sync/previews/ClubDrawer.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var noop = () => {
  };
  function Frame({ height, children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          position: "relative",
          height,
          overflow: "hidden",
          transform: "translateZ(0)",
          borderRadius: 12
        },
        children
      }
    );
  }
  var arsenal = {
    id: "57",
    name: "Arsenal",
    crest: null,
    accentColor: "#EF0107",
    position: 1,
    points: 82,
    played: 36,
    won: 25,
    draw: 7,
    lost: 4,
    goalsFor: 78,
    goalsAgainst: 28,
    goalDifference: 50,
    manager: "Mikel Arteta",
    venue: "Emirates Stadium"
  };
  var arsenalScorers = [
    { name: "Bukayo Saka", goals: 16, assists: 11 },
    { name: "Kai Havertz", goals: 14, assists: 5 }
  ];
  var arsenalRecent = [
    {
      id: "pl-361",
      utcDate: "2026-05-09T14:00:00Z",
      status: "FINISHED",
      matchday: 36,
      homeTeam: { id: "57", shortName: "Arsenal", crest: null },
      awayTeam: { id: "67", shortName: "Newcastle", crest: null },
      score: { winner: "HOME_TEAM", home: 3, away: 1 }
    },
    {
      id: "pl-343",
      utcDate: "2026-04-25T14:00:00Z",
      status: "FINISHED",
      matchday: 34,
      homeTeam: { id: "57", shortName: "Arsenal", crest: null },
      awayTeam: { id: "64", shortName: "Liverpool", crest: null },
      score: { winner: "DRAW", home: 2, away: 2 }
    }
  ];
  var arsenalUpcoming = [
    {
      id: "pl-374",
      utcDate: "2026-05-17T15:30:00Z",
      status: "TIMED",
      matchday: 37,
      homeTeam: { id: "62", shortName: "Everton", crest: null },
      awayTeam: { id: "57", shortName: "Arsenal", crest: null },
      score: { winner: null, home: null, away: null }
    }
  ];
  var OpenClubDetail = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { height: 700, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ClubDrawer,
    {
      club: arsenal,
      formSequence: ["W", "W", "D", "W", "L"],
      topScorers: arsenalScorers,
      recentFixtures: arsenalRecent,
      upcomingFixtures: arsenalUpcoming,
      onClose: noop
    }
  ) });
  var realBetis = {
    id: "90",
    name: "Real Betis",
    crest: null,
    accentColor: "#00954C",
    position: 6,
    points: 57,
    played: 35,
    won: 16,
    draw: 9,
    lost: 10,
    goalsFor: 52,
    goalsAgainst: 44,
    goalDifference: 8,
    manager: "Manuel Pellegrini",
    venue: "Estadio Benito Villamarín"
  };
  var LoadingDetail = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { height: 480, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ds_exports.ClubDrawer,
    {
      club: realBetis,
      formSequence: ["D", "W", "L", "W", "D"],
      topScorers: [],
      recentFixtures: [],
      upcomingFixtures: [],
      isLoadingDetail: true,
      onClose: noop
    }
  ) });
  return __toCommonJS(ClubDrawer_exports);
})();
