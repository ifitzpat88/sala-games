// ============================================================
//  particles.js — Particle system manager
// ============================================================
(function () {
  'use strict';

  function ParticleSystem(maxParticles) {
    this._pool = [];
    this._active = [];
    this.max = maxParticles || 600;
  }

  ParticleSystem.prototype.spawn = function (x, y, vx, vy, life, color, size) {
    if (this._active.length >= this.max) return;

    var p;
    if (this._pool.length > 0) {
      p = this._pool.pop();
      p.x = x; p.y = y; p.vx = vx; p.vy = vy;
      p.life = life; p.maxLife = life;
      p.color = color; p.size = size;
    } else {
      p = { x: x, y: y, vx: vx, vy: vy, life: life, maxLife: life, color: color, size: size };
    }
    this._active.push(p);
  };

  /** Burst: emit N particles in a circle. */
  ParticleSystem.prototype.burst = function (x, y, count, speed, life, color, size) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = Math.random() * speed;
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, life + Math.random() * life * 0.5, color, size);
    }
  };

  ParticleSystem.prototype.update = function () {
    var i = this._active.length;
    while (i--) {
      var p = this._active[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life--;
      if (p.life <= 0) {
        this._pool.push(p);
        this._active.splice(i, 1);
      }
    }
  };

  ParticleSystem.prototype.draw = function (ctx) {
    for (var i = 0; i < this._active.length; i++) {
      var p = this._active[i];
      var alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  ParticleSystem.prototype.clear = function () {
    this._pool = this._pool.concat(this._active);
    this._active = [];
  };

  Object.defineProperty(ParticleSystem.prototype, 'count', {
    get: function () { return this._active.length; }
  });

  window.BA = window.BA || {};
  window.BA.ParticleSystem = ParticleSystem;
})();
