// ============================================================
//  projectile.js — Bullet / energy bolt
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  function Projectile(x, y, vx, vy, damage, friendly, color, radius, piercing) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.friendly = friendly;
    this.color = color || '#fff';
    this.radius = radius || 3;
    this.piercing = !!piercing;    // passes through first enemy (Sniper Bob)
    this.hitSet = {};              // track IDs hit for piercing
    this.alive = true;
    this.age = 0;
  }

  Projectile.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    if (this.x < -30 || this.x > C.W + 30 || this.y < -30 || this.y > C.H + 30) {
      this.alive = false;
    }
    return this.alive;
  };

  Projectile.prototype.draw = function (ctx) {
    // Trail
    var tx = this.x - this.vx * 0.6;
    var ty = this.y - this.vy * 0.6;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius * 1.2;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  window.BA = window.BA || {};
  window.BA.Projectile = Projectile;
})();
