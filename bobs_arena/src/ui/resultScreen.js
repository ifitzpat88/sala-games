// ============================================================
//  resultScreen.js — Victory / Defeat
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  var ResultScreen = {};
  var _onRetry = null;
  var _onMenu  = null;

  ResultScreen.init = function (onRetry, onMenu) {
    _onRetry = onRetry;
    _onMenu  = onMenu;

    document.getElementById('btn-retry').addEventListener('click',        function () { if (_onRetry) _onRetry(); });
    document.getElementById('btn-menu').addEventListener('click',         function () { if (_onMenu)  _onMenu(); });
    document.getElementById('btn-play-again').addEventListener('click',   function () { if (_onRetry) _onRetry(); });
    document.getElementById('btn-victory-menu').addEventListener('click', function () { if (_onMenu)  _onMenu(); });
  };

  ResultScreen.showDefeat = function (stats) {
    document.getElementById('gameover-reason').textContent = stats.reason || 'The arena falls silent.';
    document.getElementById('gameover-stats').innerHTML =
      'Wave reached: <span>' + stats.wave + '</span><br>' +
      'Enemies destroyed: <span>' + stats.kills + '</span><br>' +
      'Scrap collected: <span>' + stats.totalScrap + '</span><br>' +
      'Core remaining: <span>' + stats.coreHpPct + '%</span>';
  };

  ResultScreen.showVictory = function (stats, unlockId) {
    document.getElementById('victory-stats').innerHTML =
      'All <span>5</span> waves defended!<br>' +
      'Enemies destroyed: <span>' + stats.kills + '</span><br>' +
      'Scrap collected: <span>' + stats.totalScrap + '</span><br>' +
      'Core remaining: <span>' + stats.coreHpPct + '%</span>';

    var unlockSection = document.getElementById('unlock-section');
    if (unlockId && C.BOBS[unlockId]) {
      var def = C.BOBS[unlockId];
      unlockSection.innerHTML =
        '<h3>NEW BOB UNLOCKED!</h3>' +
        '<p style="color:' + def.color + ';font-family:\'Orbitron\',sans-serif;font-weight:700;font-size:1.2rem;margin:8px 0;">' +
          def.name +
        '</p>' +
        '<p>' + def.role + ' \u2014 ' + def.abilityName + ': ' + def.abilityDesc + '</p>';
      unlockSection.style.display = 'block';
    } else {
      unlockSection.innerHTML = '<p style="color:#556;">All Bobs already unlocked!</p>';
      unlockSection.style.display = 'block';
    }
  };

  window.BA = window.BA || {};
  window.BA.ResultScreen = ResultScreen;
})();
