// ============================================================
//  menu.js — Title screen
// ============================================================
(function () {
  'use strict';

  var Menu = {};
  var _onStart = null;
  var _onSettings = null;
  var _onReset = null;

  Menu.init = function (onStart, onSettings, onReset) {
    _onStart    = onStart;
    _onSettings = onSettings;
    _onReset    = onReset;

    document.getElementById('btn-start').addEventListener('click', function () {
      if (_onStart) _onStart();
    });
    document.getElementById('btn-settings').addEventListener('click', function () {
      if (_onSettings) _onSettings();
    });
    document.getElementById('btn-reset-progress').addEventListener('click', function () {
      if (_onReset) _onReset();
    });
  };

  window.BA = window.BA || {};
  window.BA.Menu = Menu;
})();
