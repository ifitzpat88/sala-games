// ============================================================
//  gameLoop.js — requestAnimationFrame loop with dt clamp
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  /**
   * @param {Function} updateFn  — called with (dt) in seconds, clamped
   * @param {Function} renderFn  — called after update
   */
  function GameLoop(updateFn, renderFn) {
    this._update = updateFn;
    this._render = renderFn;
    this._lastTime = 0;
    this._running = false;
    this._rafId = null;

    // Perf tracking for debug
    this.fps = 60;
    this.frameMs = 0;
    this._fpsAccum = 0;
    this._fpsFrames = 0;
    this._fpsTimer = 0;
  }

  GameLoop.prototype.start = function () {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._tick = this._tick.bind(this);
    this._rafId = requestAnimationFrame(this._tick);
  };

  GameLoop.prototype.stop = function () {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  };

  GameLoop.prototype._tick = function (now) {
    if (!this._running) return;

    var rawDt = (now - this._lastTime) / 1000;
    // Clamp extreme dt (tab switch / lag)
    var dt = Math.min(rawDt, C.DT_CAP);
    this._lastTime = now;

    // FPS tracking
    this.frameMs = rawDt * 1000;
    this._fpsAccum += rawDt;
    this._fpsFrames++;
    if (this._fpsAccum >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsAccum = 0;
      this._fpsFrames = 0;
    }

    this._update(dt);
    this._render();

    this._rafId = requestAnimationFrame(this._tick);
  };

  window.BA = window.BA || {};
  window.BA.GameLoop = GameLoop;
})();
