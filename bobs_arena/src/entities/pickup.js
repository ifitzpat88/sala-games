// ============================================================
//  pickup.js — Scrap pickup
// ============================================================
(function () {
  'use strict';

  var C   = window.BA.Config;
  var RNG = window.BA.RNG;

  function Scrap(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value || 1;
    this.alive = true;
    this.age = 0;
    this.bobAngle = RNG.rand(0, Math.PI * 2);
  }

  Scrap.prototype.update = function () {
    this.age++;
    this.bobAngle += 0.06;
    if (this.age > C.SCRAP_DESPAWN) this.alive = false;
    return this.alive;
  };

  Scrap.prototype.draw = function (ctx) {
    var bobY = Math.sin(this.bobAngle) * 3;
    // Blink when about to despawn
    if (this.age > C.SCRAP_BLINK_START && Math.floor(this.age / 6) % 2 === 0) return;

    var alpha = this.age > C.SCRAP_BLINK_START ? 0.7 : 1;
    ctx.globalAlpha = alpha;

    // Diamond
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 6 + bobY);
    ctx.lineTo(this.x + 5, this.y + bobY);
    ctx.lineTo(this.x, this.y + 6 + bobY);
    ctx.lineTo(this.x - 5, this.y + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y + bobY, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,170,0,0.1)';
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  window.BA = window.BA || {};
  window.BA.Scrap = Scrap;
})();
