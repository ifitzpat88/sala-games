// ============================================================
//  upgradeCards.js — Between-wave upgrade selection
// ============================================================
(function () {
  'use strict';

  var C   = window.BA.Config;
  var RNG = window.BA.RNG;

  var UpgradeCards = {};
  var _onPick = null;

  UpgradeCards.init = function (onPick) {
    _onPick = onPick;
  };

  /**
   * Show 3 random upgrade cards.
   * @param {number} wave — just-completed wave
   * @param {Array} currentUpgrades — names of upgrades already taken
   */
  UpgradeCards.show = function (wave, currentUpgrades) {
    var title = document.getElementById('wave-complete-title');
    title.textContent = 'WAVE ' + wave + ' COMPLETE';

    var flavor = document.getElementById('upgrade-flavor');
    flavor.textContent = C.WAVE_COMPLETE_FLAVOR[RNG.clamp(wave - 1, 0, C.WAVE_COMPLETE_FLAVOR.length - 1)];

    // Show current upgrades list
    var listEl = document.getElementById('current-upgrades');
    if (listEl) {
      if (currentUpgrades.length > 0) {
        listEl.innerHTML = '<span class="upgrades-list-label">Current:</span> ' +
          currentUpgrades.map(function (n) { return '<span class="upgrade-tag">' + n + '</span>'; }).join(' ');
        listEl.style.display = 'block';
      } else {
        listEl.style.display = 'none';
      }
    }

    // Pick 3 random upgrades
    var shuffled = RNG.shuffle(C.UPGRADES.slice());
    var picks = shuffled.slice(0, 3);

    var container = document.getElementById('upgrade-cards');
    container.innerHTML = '';

    picks.forEach(function (up) {
      var card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML =
        '<div class="upgrade-icon">' + up.icon + '</div>' +
        '<div class="upgrade-name">' + up.name + '</div>' +
        '<div class="upgrade-desc">' + up.desc + '</div>';

      card.addEventListener('click', function () {
        if (_onPick) _onPick(up);
      });

      container.appendChild(card);
    });
  };

  window.BA = window.BA || {};
  window.BA.UpgradeCards = UpgradeCards;
})();
