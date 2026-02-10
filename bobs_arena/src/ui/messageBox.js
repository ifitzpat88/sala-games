// ============================================================
//  messageBox.js — Story dialogue overlay
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  var MessageBox = {};
  var _onContinue = null;

  MessageBox.init = function (onContinue) {
    _onContinue = onContinue;
    document.getElementById('btn-continue').addEventListener('click', function () {
      if (_onContinue) _onContinue();
    });
  };

  /**
   * Show pre-wave messages.
   * @param {number} wave
   * @param {string} bobId
   */
  MessageBox.showPreWave = function (wave, bobId) {
    var lines = C.getPreWaveMessages(wave, bobId);
    MessageBox._render(lines);
  };

  /** Show an arbitrary set of message lines. */
  MessageBox.showCustom = function (lines) {
    MessageBox._render(lines);
  };

  MessageBox._render = function (lines) {
    var container = document.getElementById('message-lines');
    container.innerHTML = '';

    lines.forEach(function (line, i) {
      var div = document.createElement('div');
      div.className = 'message-line';
      div.style.animationDelay = (i * 0.4) + 's';
      div.innerHTML =
        '<span class="msg-speaker ' + (line.cls || '') + '">' + line.speaker + '</span>' +
        '"' + line.text + '"';
      container.appendChild(div);
    });
  };

  window.BA = window.BA || {};
  window.BA.MessageBox = MessageBox;
})();
