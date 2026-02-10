// ============================================================
//  hud.js — In-run HUD management
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  var HUD = {};

  var els = {};

  HUD.init = function () {
    els.hpBar      = document.getElementById('hp-bar');
    els.hpText     = document.getElementById('hp-text');
    els.coreBar    = document.getElementById('core-bar');
    els.coreText   = document.getElementById('core-text');
    els.abilityBar = document.getElementById('ability-bar');
    els.boostBar   = document.getElementById('boost-bar');
    els.scrapCount = document.getElementById('scrap-count');
    els.waveLabel  = document.getElementById('wave-label');
    els.enemiesLeft = document.getElementById('enemies-left');
    els.abilityLabel = document.getElementById('ability-label');
    els.hud        = document.getElementById('hud');
  };

  HUD.show = function () { els.hud.classList.add('active'); };
  HUD.hide = function () { els.hud.classList.remove('active'); };

  HUD.update = function (player, core, wave, scrap, enemiesRemaining) {
    var pctHp      = (player.hp / player.maxHp) * 100;
    var pctCore    = (core.hp / core.maxHp) * 100;
    var pctAbility = ((player.abilityCooldownMax - player.abilityCooldown) / player.abilityCooldownMax) * 100;
    var pctBoost   = player.boostFuel;

    els.hpBar.style.width  = pctHp + '%';
    els.hpText.textContent = Math.ceil(player.hp) + '/' + player.maxHp;

    els.coreBar.style.width  = pctCore + '%';
    els.coreText.textContent = Math.ceil(core.hp) + '/' + core.maxHp;

    els.abilityBar.style.width = pctAbility + '%';
    els.boostBar.style.width   = pctBoost + '%';

    els.scrapCount.textContent = scrap;
    els.waveLabel.textContent  = 'WAVE ' + wave;
    els.enemiesLeft.textContent = enemiesRemaining + ' enemies remaining';

    // Color-code HP bar
    if (pctHp > 60)      els.hpBar.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
    else if (pctHp > 30) els.hpBar.style.background = 'linear-gradient(90deg, #ffaa00, #cc8800)';
    else                 els.hpBar.style.background = 'linear-gradient(90deg, #ff3333, #cc1111)';

    // Color-code core bar
    if (pctCore > 60)      els.coreBar.style.background = 'linear-gradient(90deg, #00e5ff, #0088cc)';
    else if (pctCore > 30) els.coreBar.style.background = 'linear-gradient(90deg, #ffaa00, #cc8800)';
    else                   els.coreBar.style.background = 'linear-gradient(90deg, #ff3333, #cc1111)';
  };

  HUD.setWave = function (wave, bobId) {
    els.waveLabel.textContent  = 'WAVE ' + wave;
    var def = C.BOBS[bobId];
    if (def) els.abilityLabel.textContent = def.abilityName.toUpperCase();
  };

  window.BA = window.BA || {};
  window.BA.HUD = HUD;
})();
