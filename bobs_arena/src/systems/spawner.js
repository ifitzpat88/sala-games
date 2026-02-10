// ============================================================
//  spawner.js — Wave-based enemy spawning
// ============================================================
(function () {
  'use strict';

  var C     = window.BA.Config;
  var RNG   = window.BA.RNG;
  var Enemy = window.BA.Enemy;

  function Spawner() {
    this.queue = [];
    this.timer = 0;
    this.interval = 1000;
    this.spawned = 0;
    this.totalForWave = 0;
    this.active = false;
  }

  /** Prepare spawn queue for a wave number (1-based). */
  Spawner.prototype.prepareWave = function (waveNum) {
    var cfg = C.WAVES[RNG.clamp(waveNum - 1, 0, C.WAVES.length - 1)];
    this.queue = [];

    var i;
    for (i = 0; i < cfg.drones; i++)    this.queue.push('drone');
    for (i = 0; i < cfg.kamikazes; i++) this.queue.push('kamikaze');
    for (i = 0; i < cfg.snipers; i++)   this.queue.push('sniper');
    for (i = 0; i < (cfg.enforcers || 0); i++) this.queue.push('enforcer');

    RNG.shuffle(this.queue);

    this.totalForWave = this.queue.length;
    this.spawned = 0;
    this.timer = 0;
    this.interval = cfg.spawnInterval;
    this.active = true;
    this._waveCfg = cfg;
  };

  /**
   * Call each frame. Pushes new Enemy instances into the provided array.
   * @param {number} dtMs — delta time in milliseconds
   * @param {Array} enemies — game's enemy array
   */
  Spawner.prototype.update = function (dtMs, enemies) {
    if (!this.active || this.queue.length === 0) return;

    this.timer += dtMs;
    if (this.timer >= this.interval) {
      this.timer -= this.interval;
      this._spawnNext(enemies);
    }
  };

  Spawner.prototype._spawnNext = function (enemies) {
    if (this.queue.length === 0) return;

    var type = this.queue.shift();
    var cfg = this._waveCfg;

    // Random edge position
    var x, y;
    var edge = RNG.randInt(0, 3);
    switch (edge) {
      case 0: x = RNG.rand(C.ARENA_PAD, C.W - C.ARENA_PAD); y = -20; break;
      case 1: x = C.W + 20; y = RNG.rand(C.ARENA_PAD, C.H - C.ARENA_PAD); break;
      case 2: x = RNG.rand(C.ARENA_PAD, C.W - C.ARENA_PAD); y = C.H + 20; break;
      default: x = -20; y = RNG.rand(C.ARENA_PAD, C.H - C.ARENA_PAD); break;
    }

    var hpMul  = { drone: 1, kamikaze: 0.5, sniper: 1.5, enforcer: 3.5 };
    var spdMul = { drone: 1, kamikaze: 1.3, sniper: 0.6, enforcer: 0.4 };

    var hp  = cfg.droneHp    * (hpMul[type]  || 1);
    var spd = cfg.droneSpeed * (spdMul[type] || 1);

    enemies.push(new Enemy(x, y, type, hp, spd));
    this.spawned++;
  };

  /** Number of enemies still to spawn. */
  Spawner.prototype.remaining = function () {
    return this.queue.length;
  };

  window.BA = window.BA || {};
  window.BA.Spawner = Spawner;
})();
