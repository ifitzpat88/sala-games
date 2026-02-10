// ============================================================
//  audio.js — Lightweight synth audio + volume management
// ============================================================
(function () {
  'use strict';

  var AudioManager = {};
  var _ctx = null;
  var _masterGain = null;
  var _sfxVol = 0.5;
  var _musicVol = 0.3;
  var _humOsc = null;
  var _humGain = null;

  // ---- Persistence ----
  AudioManager.loadSettings = function () {
    try {
      var data = JSON.parse(localStorage.getItem('bobs_arena_audio'));
      if (data) {
        _sfxVol   = typeof data.sfx   === 'number' ? data.sfx   : 0.5;
        _musicVol = typeof data.music === 'number' ? data.music : 0.3;
      }
    } catch (e) {}
  };

  AudioManager.saveSettings = function () {
    localStorage.setItem('bobs_arena_audio', JSON.stringify({ sfx: _sfxVol, music: _musicVol }));
  };

  AudioManager.getSfxVol   = function () { return _sfxVol; };
  AudioManager.getMusicVol = function () { return _musicVol; };

  AudioManager.setSfxVol = function (v) {
    _sfxVol = Math.max(0, Math.min(1, v));
    AudioManager.saveSettings();
  };

  AudioManager.setMusicVol = function (v) {
    _musicVol = Math.max(0, Math.min(1, v));
    if (_humGain) _humGain.gain.value = _musicVol * 0.06;
    AudioManager.saveSettings();
  };

  // ---- Ensure context ----
  AudioManager.ensure = function () {
    if (!_ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      _ctx = new AC();
      _masterGain = _ctx.createGain();
      _masterGain.connect(_ctx.destination);
    }
    if (_ctx.state === 'suspended') _ctx.resume();
  };

  // ---- Play a synth tone ----
  function _tone(freq, dur, vol, type) {
    try {
      AudioManager.ensure();
      var o = _ctx.createOscillator();
      var g = _ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol * _sfxVol, _ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);
      o.connect(g).connect(_masterGain);
      o.start();
      o.stop(_ctx.currentTime + dur);
    } catch (e) {}
  }

  // ---- SFX library ----
  AudioManager.shoot    = function () { _tone(880,  0.08, 0.12, 'square');   };
  AudioManager.hit      = function () { _tone(220,  0.12, 0.15, 'sawtooth'); };
  AudioManager.explode  = function () { _tone(80,   0.25, 0.2,  'sawtooth'); };
  AudioManager.pickup   = function () { _tone(1200, 0.1,  0.1,  'sine');     };
  AudioManager.ability  = function () { _tone(440,  0.3,  0.18, 'triangle'); };
  AudioManager.boost    = function () { _tone(300,  0.15, 0.12, 'sawtooth'); };
  AudioManager.uiClick  = function () { _tone(660,  0.06, 0.08, 'sine');     };
  AudioManager.defeat   = function () { _tone(120,  0.6,  0.15, 'sawtooth'); };
  AudioManager.victory  = function () {
    _tone(523, 0.15, 0.12, 'sine');
    setTimeout(function () { _tone(659, 0.15, 0.12, 'sine'); }, 150);
    setTimeout(function () { _tone(784, 0.3,  0.12, 'sine'); }, 300);
  };

  // ---- Background hum ----
  AudioManager.startHum = function () {
    try {
      AudioManager.ensure();
      if (_humOsc) return;
      _humOsc  = _ctx.createOscillator();
      _humGain = _ctx.createGain();
      _humOsc.type = 'sine';
      _humOsc.frequency.value = 55;
      _humGain.gain.value = _musicVol * 0.06;
      _humOsc.connect(_humGain).connect(_masterGain);
      _humOsc.start();
    } catch (e) {}
  };

  AudioManager.stopHum = function () {
    try {
      if (_humOsc) { _humOsc.stop(); _humOsc = null; _humGain = null; }
    } catch (e) { _humOsc = null; _humGain = null; }
  };

  window.BA = window.BA || {};
  window.BA.Audio = AudioManager;
})();
