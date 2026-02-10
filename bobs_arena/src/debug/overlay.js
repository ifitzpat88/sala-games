// ============================================================
//  overlay.js — Debug overlay (F3 toggle)
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  var Debug = {};
  var _el = null;
  var _visible = false;

  Debug.init = function () {
    _el = document.getElementById('debug-overlay');
  };

  Debug.toggle = function () {
    _visible = !_visible;
    C.DEBUG = _visible;
    if (_el) _el.style.display = _visible ? 'block' : 'none';
  };

  Debug.update = function (info) {
    if (!_visible || !_el) return;

    var lines = [
      'FPS: ' + (info.fps || 0),
      'State: ' + (info.state || '?'),
      'Wave: ' + (info.wave || 0),
      'Enemies: ' + (info.enemies || 0),
      'Projectiles: ' + (info.projectiles || 0),
      'Particles: ' + (info.particles || 0),
      'Scraps: ' + (info.scraps || 0),
      'Player: ' + (info.playerX || 0).toFixed(0) + ', ' + (info.playerY || 0).toFixed(0),
      'Player HP: ' + (info.playerHp || 0).toFixed(1),
      'Core HP: ' + (info.coreHp || 0).toFixed(1),
      'Shake: ' + C.SHAKE_ENABLED,
    ];
    _el.textContent = lines.join('\n');
  };

  window.BA = window.BA || {};
  window.BA.Debug = Debug;
})();
