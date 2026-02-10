// ============================================================
//  rng.js — Random number utilities
// ============================================================
(function () {
  'use strict';

  var RNG = {};

  RNG.rand    = function (a, b) { return Math.random() * (b - a) + a; };
  RNG.randInt = function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };
  RNG.pick    = function (arr)  { return arr[RNG.randInt(0, arr.length - 1)]; };

  /** Fisher-Yates shuffle (in-place, returns arr). */
  RNG.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = RNG.randInt(0, i);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  };

  // ---- Math helpers ----
  RNG.clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  RNG.lerp  = function (a, b, t)   { return a + (b - a) * t; };
  RNG.dist  = function (a, b)      { return Math.hypot(a.x - b.x, a.y - b.y); };
  RNG.angle = function (from, to)  { return Math.atan2(to.y - from.y, to.x - from.x); };

  window.BA = window.BA || {};
  window.BA.RNG = RNG;
})();
