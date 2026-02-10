// ============================================================
//  stateMachine.js — Simple finite state machine
// ============================================================
(function () {
  'use strict';

  /** States: MENU, SETTINGS, SELECT, MESSAGE, RUN, PAUSED, INTERMISSION, RESULT */
  function StateMachine(initial) {
    this.current = initial || 'MENU';
    this.previous = null;
    this._listeners = {};
  }

  StateMachine.prototype.go = function (newState) {
    if (newState === this.current) return;
    this.previous = this.current;
    this.current = newState;
    var cbs = this._listeners[newState];
    if (cbs) {
      for (var i = 0; i < cbs.length; i++) cbs[i](this.previous);
    }
  };

  StateMachine.prototype.is = function (state) {
    return this.current === state;
  };

  StateMachine.prototype.on = function (state, fn) {
    if (!this._listeners[state]) this._listeners[state] = [];
    this._listeners[state].push(fn);
  };

  window.BA = window.BA || {};
  window.BA.StateMachine = StateMachine;
})();
