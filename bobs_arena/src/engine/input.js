// ============================================================
//  input.js — Centralised Input Manager
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  function InputManager(canvas) {
    this.canvas = canvas;
    this.keys = {};            // raw key state
    this.justPressed = {};     // true only on the frame the key was first pressed
    this._prevKeys = {};

    this.mouse = { x: C.W / 2, y: C.H / 2 };
    this.mouseDown = false;
    this.mouseMovedRecently = false;
    this._mouseIdleTimer = 0;

    this._bind();
  }

  InputManager.prototype._bind = function () {
    var self = this;

    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      self.keys[k] = true;
      // Prevent space scroll and F3 default
      if (k === ' ' || k === 'f3') e.preventDefault();
    });

    window.addEventListener('keyup', function (e) {
      self.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', function (e) {
      var rect = self.canvas.getBoundingClientRect();
      self.mouse.x = (e.clientX - rect.left) * (C.W / rect.width);
      self.mouse.y = (e.clientY - rect.top)  * (C.H / rect.height);
      self.mouseMovedRecently = true;
      self._mouseIdleTimer = 60; // ~1s
    });

    this.canvas.addEventListener('mousedown', function (e) {
      if (e.button === 0) self.mouseDown = true;
    });
    this.canvas.addEventListener('mouseup', function (e) {
      if (e.button === 0) self.mouseDown = false;
    });
    this.canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Blur — release everything
    window.addEventListener('blur', function () {
      self.keys = {};
      self.mouseDown = false;
    });
  };

  /** Call once per frame BEFORE reading justPressed. */
  InputManager.prototype.update = function () {
    var self = this;
    // Build justPressed from diff
    this.justPressed = {};
    Object.keys(this.keys).forEach(function (k) {
      if (self.keys[k] && !self._prevKeys[k]) {
        self.justPressed[k] = true;
      }
    });
    this._prevKeys = {};
    Object.keys(this.keys).forEach(function (k) {
      self._prevKeys[k] = self.keys[k];
    });
    // Mouse idle
    if (this._mouseIdleTimer > 0) this._mouseIdleTimer--;
    if (this._mouseIdleTimer <= 0) this.mouseMovedRecently = false;
  };

  /** Check if ANY of the mapped keys for an action are held. */
  InputManager.prototype.held = function (action) {
    var binds = C.KEYS[action];
    if (!binds) return false;
    for (var i = 0; i < binds.length; i++) {
      if (this.keys[binds[i]]) return true;
    }
    return false;
  };

  /** Check if ANY of the mapped keys for an action were JUST pressed this frame. */
  InputManager.prototype.pressed = function (action) {
    var binds = C.KEYS[action];
    if (!binds) return false;
    for (var i = 0; i < binds.length; i++) {
      if (this.justPressed[binds[i]]) return true;
    }
    return false;
  };

  /** Consume a just-pressed so it doesn't fire again. */
  InputManager.prototype.consume = function (action) {
    var binds = C.KEYS[action];
    if (!binds) return;
    for (var i = 0; i < binds.length; i++) {
      delete this.justPressed[binds[i]];
    }
  };

  window.BA = window.BA || {};
  window.BA.InputManager = InputManager;
})();
