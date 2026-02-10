// ============================================================
//  enemy.js — All enemy types: Drone, Kamikaze, Sniper, Enforcer
// ============================================================
(function () {
  'use strict';

  var C   = window.BA.Config;
  var RNG = window.BA.RNG;
  var Projectile = window.BA.Projectile;

  var _nextId = 1;

  function Enemy(x, y, type, hp, speed) {
    this.id = _nextId++;
    this.x = x;
    this.y = y;
    this.type = type;           // 'drone' | 'kamikaze' | 'sniper' | 'enforcer'
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.alive = true;
    this.angle = 0;
    this.shootTimer = 0;
    this.flashTimer = 0;
    this.spawnTelegraph = C.SPAWN_TELEGRAPH_DUR; // countdown before active
    this.scrapValue = { drone: 2, kamikaze: 1, sniper: 3, enforcer: 5 }[type] || 2;
  }

  // ---- Update dispatcher ----
  Enemy.prototype.update = function (player, core, projectiles) {
    if (!this.alive) return false;

    // Telegraph phase: don't move or deal contact damage
    if (this.spawnTelegraph > 0) {
      this.spawnTelegraph--;
      return true;
    }

    switch (this.type) {
      case 'drone':     this._updateDrone(player, core); break;
      case 'kamikaze':  this._updateKamikaze(player); break;
      case 'sniper':    this._updateSniper(player, projectiles); break;
      case 'enforcer':  this._updateEnforcer(player, core, projectiles); break;
    }

    if (this.flashTimer > 0) this.flashTimer--;
    return this.alive;
  };

  // ---- Drone: chases player / core ----
  Enemy.prototype._updateDrone = function (player, core) {
    var target = Math.random() < 0.35 ? core : player;
    var a = RNG.angle(this, target);
    this.angle = a;
    this.x += Math.cos(a) * this.speed;
    this.y += Math.sin(a) * this.speed;
  };

  // ---- Kamikaze: fast rush at player ----
  Enemy.prototype._updateKamikaze = function (player) {
    var a = RNG.angle(this, player);
    this.angle = a;
    this.x += Math.cos(a) * this.speed * 1.8;
    this.y += Math.sin(a) * this.speed * 1.8;
  };

  // ---- Sniper: hold distance, shoot periodically ----
  Enemy.prototype._updateSniper = function (player, projectiles) {
    var d = RNG.dist(this, player);
    var a = RNG.angle(this, player);
    this.angle = a;

    if (d < 200) {
      this.x -= Math.cos(a) * this.speed * 0.5;
      this.y -= Math.sin(a) * this.speed * 0.5;
    } else if (d > 300) {
      this.x += Math.cos(a) * this.speed * 0.5;
      this.y += Math.sin(a) * this.speed * 0.5;
    }

    this.shootTimer++;
    if (this.shootTimer > 120) {
      this.shootTimer = 0;
      projectiles.push(new Projectile(
        this.x, this.y,
        Math.cos(a) * 4, Math.sin(a) * 4,
        18, false, '#ff4444', 4
      ));
    }
  };

  // ---- Enforcer (NEW): slow tank, spread shot, targets core sometimes ----
  Enemy.prototype._updateEnforcer = function (player, core, projectiles) {
    // Alternate between targeting player and core
    var target = Math.random() < 0.45 ? core : player;
    var a = RNG.angle(this, target);
    this.angle = a;
    var d = RNG.dist(this, target);

    // Move slowly
    if (d > 150) {
      this.x += Math.cos(a) * this.speed * 0.45;
      this.y += Math.sin(a) * this.speed * 0.45;
    }

    // Spread shot
    this.shootTimer++;
    if (this.shootTimer > 150) {
      this.shootTimer = 0;
      var pSpeed = 3.5;
      for (var i = -1; i <= 1; i++) {
        var sa = a + i * 0.25;
        projectiles.push(new Projectile(
          this.x, this.y,
          Math.cos(sa) * pSpeed, Math.sin(sa) * pSpeed,
          12, false, '#ff8844', 4
        ));
      }
    }
  };

  // ---- Take Damage ----
  Enemy.prototype.takeDamage = function (dmg, particles) {
    this.hp = Math.max(0, this.hp - dmg);
    this.flashTimer = 6;
    // Hit spark particles
    if (particles) {
      for (var i = 0; i < 5; i++) {
        particles.spawn(
          this.x, this.y,
          RNG.rand(-2, 2), RNG.rand(-2, 2),
          RNG.randInt(10, 20),
          this.type === 'kamikaze' ? '#ffaa00' : '#ff4444',
          RNG.rand(2, 4)
        );
      }
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.explode(particles);
    }
  };

  Enemy.prototype.explode = function (particles) {
    if (!particles) return;
    var colors = {
      drone:    ['#ff5533', '#ff8855'],
      kamikaze: ['#ffcc00', '#ff8800'],
      sniper:   ['#ff2222', '#ff6644'],
      enforcer: ['#ff8844', '#ffaa66', '#ffcc88'],
    };
    var cols = colors[this.type] || ['#ff5533'];
    var count = this.type === 'enforcer' ? 25 : 15;
    for (var i = 0; i < count; i++) {
      var a = RNG.rand(0, Math.PI * 2);
      var s = RNG.rand(1, this.type === 'enforcer' ? 5 : 4);
      particles.spawn(
        this.x, this.y,
        Math.cos(a) * s, Math.sin(a) * s,
        RNG.randInt(20, 45),
        RNG.pick(cols),
        RNG.rand(2, 6)
      );
    }
  };

  // ---- Draw ----
  Enemy.prototype.draw = function (ctx) {
    // Spawn telegraph ring
    if (this.spawnTelegraph > 0) {
      var tPct = this.spawnTelegraph / C.SPAWN_TELEGRAPH_DUR;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 30 * tPct + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,80,80,' + (0.6 * tPct) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Pulsing inner dot
      if (Math.floor(this.spawnTelegraph / 4) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,100,100,0.5)';
        ctx.fill();
      }
      return; // don't draw enemy body during telegraph
    }

    var flash = this.flashTimer > 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    switch (this.type) {
      case 'drone':
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(0, -8);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : '#cc2222';
        ctx.fill();
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;

      case 'kamikaze':
        var pulse = 1 + Math.sin(Date.now() * 0.012) * 0.15;
        ctx.scale(pulse, pulse);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-8, -7);
        ctx.lineTo(-8, 7);
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : '#ff8800';
        ctx.fill();
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'sniper':
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : '#881111';
        ctx.fill();
        ctx.strokeStyle = '#ff2222';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Scope dot
        ctx.beginPath();
        ctx.arc(6, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        break;

      case 'enforcer':
        // Pentagon shape — bigger, tougher look
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var ea = (Math.PI * 2 / 5) * i - Math.PI / 2;
          var ex = Math.cos(ea) * 18;
          var ey = Math.sin(ea) * 18;
          i === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
        }
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : '#884400';
        ctx.fill();
        ctx.strokeStyle = '#ff8844';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Inner eye
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa44';
        ctx.fill();
        break;
    }

    ctx.restore();

    // HP bar if damaged
    if (this.hp < this.maxHp && this.spawnTelegraph <= 0) {
      var bw = this.type === 'enforcer' ? 32 : 24;
      var bh = 3;
      var pct = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x - bw / 2, this.y - 20, bw, bh);
      ctx.fillStyle = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffaa00' : '#ff3333';
      ctx.fillRect(this.x - bw / 2, this.y - 20, bw * pct, bh);
    }
  };

  window.BA = window.BA || {};
  window.BA.Enemy = Enemy;
})();
