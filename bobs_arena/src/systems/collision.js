// ============================================================
//  collision.js — Collision detection helpers
// ============================================================
(function () {
  'use strict';

  var Collision = {};

  /** Circle-vs-circle overlap check. */
  Collision.circleCircle = function (ax, ay, ar, bx, by, br) {
    var dx = ax - bx, dy = ay - by;
    var distSq = dx * dx + dy * dy;
    var rSum = ar + br;
    return distSq < rSum * rSum;
  };

  /** Distance between two {x,y} objects. */
  Collision.dist = function (a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  /** Point-in-circle. */
  Collision.pointInCircle = function (px, py, cx, cy, r) {
    var dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy < r * r;
  };

  /**
   * Line-circle intersection test (for beam weapons).
   * Returns true if the line segment (x1,y1)→(x2,y2) passes within radius r of (cx,cy).
   */
  Collision.lineCircle = function (x1, y1, x2, y2, cx, cy, r) {
    var dx = x2 - x1, dy = y2 - y1;
    var fx = x1 - cx, fy = y1 - cy;
    var a = dx * dx + dy * dy;
    var b = 2 * (fx * dx + fy * dy);
    var c = fx * fx + fy * fy - r * r;
    var disc = b * b - 4 * a * c;
    if (disc < 0) return false;
    disc = Math.sqrt(disc);
    var t1 = (-b - disc) / (2 * a);
    var t2 = (-b + disc) / (2 * a);
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
  };

  window.BA = window.BA || {};
  window.BA.Collision = Collision;
})();
