// ============================================================
//  bobSelect.js — Character selection screen
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;
  var Player = window.BA.Player;

  var BobSelect = {};
  var _onSelect = null;

  BobSelect.init = function (onSelect) {
    _onSelect = onSelect;
  };

  BobSelect.show = function (unlocks) {
    var container = document.getElementById('bob-cards');
    container.innerHTML = '';
    var ids = ['pilot', 'wizard', 'mechanic', 'ninja', 'sniper'];

    ids.forEach(function (id) {
      var def = C.BOBS[id];
      var unlocked = !!unlocks[id];

      var card = document.createElement('div');
      card.className = 'bob-card' + (unlocked ? '' : ' locked');

      // Ship preview canvas
      var preview = document.createElement('canvas');
      preview.width = 80;
      preview.height = 80;
      preview.className = 'bob-preview';
      var pctx = preview.getContext('2d');
      Player.drawShipFor(pctx, id, 40, 40, 0, unlocked ? def.color : '#555', 22);
      card.appendChild(preview);

      var nameDiv = document.createElement('div');
      nameDiv.className = 'bob-name';
      nameDiv.style.color = unlocked ? def.color : '#555';
      nameDiv.textContent = def.name;
      card.appendChild(nameDiv);

      var roleDiv = document.createElement('div');
      roleDiv.className = 'bob-role';
      roleDiv.textContent = def.role;
      card.appendChild(roleDiv);

      var wDiv = document.createElement('div');
      wDiv.className = 'bob-stat';
      wDiv.innerHTML = 'Weapon: <span>' + def.weapon + '</span>';
      card.appendChild(wDiv);

      var passDiv = document.createElement('div');
      passDiv.className = 'bob-stat';
      passDiv.innerHTML = 'Passive: <span>' + def.passive + '</span>';
      card.appendChild(passDiv);

      var abilDiv = document.createElement('div');
      abilDiv.className = 'bob-ability';
      abilDiv.textContent = '[E] ' + def.abilityName + ': ' + def.abilityDesc;
      card.appendChild(abilDiv);

      if (!unlocked) {
        var lockLabel = document.createElement('div');
        lockLabel.className = 'locked-label';
        lockLabel.textContent = '\uD83D\uDD12 LOCKED';
        card.appendChild(lockLabel);
      }

      if (unlocked) {
        card.addEventListener('click', function () {
          if (_onSelect) _onSelect(id);
        });
      }

      container.appendChild(card);
    });
  };

  window.BA = window.BA || {};
  window.BA.BobSelect = BobSelect;
})();
