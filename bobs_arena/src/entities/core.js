// ============================================================
//  core.js — Arena Core entity
// ============================================================
(function () {
  'use strict';

  var C = window.BA.Config;

  function Core() {
    this.x = C.CORE_X;
    this.y = C.CORE_Y;
    this.hp = 200;
    this.maxHp = 200;
    this.pulseAngle = 0;
    this.damageFlash = 0;
  }

  Core.prototype.reset = function () {
    this.hp = 200;
    this.maxHp = 200;
    this.pulseAngle = 0;
    this.damageFlash = 0;
  };

  Core.prototype.takeDamage = function (dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    this.damageFlash = 8;
  };

  Core.prototype.update = function () {
    this.pulseAngle += 0.03;
    if (this.damageFlash > 0) this.damageFlash--;
  };

  Core.prototype.draw = function (ctx) {
    var pulse = 1 + Math.sin(this.pulseAngle) * 0.1;
    var healthPct = this.hp / this.maxHp;
    var flash = this.damageFlash > 0;

    // Outer glow ring
    var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, C.CORE_RADIUS * 3 * pulse);
    grad.addColorStop(0, 'rgba(0,229,255,' + (0.15 * healthPct) + ')');
    grad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, C.CORE_RADIUS * 3 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, C.CORE_RADIUS * pulse, 0, Math.PI * 2);
    ctx.fillStyle = flash
      ? 'rgba(255,100,100,0.6)'
      : 'rgba(0,180,220,' + (0.3 + 0.3 * healthPct) + ')';
    ctx.fill();
    ctx.strokeStyle = flash
      ? 'rgba(255,150,150,0.8)'
      : 'rgba(0,229,255,' + (0.5 + 0.3 * healthPct) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner orb
    ctx.beginPath();
    ctx.arc(this.x, this.y, C.CORE_RADIUS * 0.45 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,230,255,' + (0.4 + 0.3 * healthPct) + ')';
    ctx.fill();

    // Rotating arcs (visual interest)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.pulseAngle * 0.5);
    ctx.strokeStyle = 'rgba(0,229,255,' + (0.15 * healthPct) + ')';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, C.CORE_RADIUS * (1.3 + i * 0.4) * pulse, i * 2.09, i * 2.09 + 1.2);
      ctx.stroke();
    }
    ctx.restore();

    // Label
    ctx.font = '10px "Orbitron", sans-serif';
    ctx.fillStyle = 'rgba(0,229,255,0.35)';
    ctx.textAlign = 'center';
    ctx.fillText('CORE', this.x, this.y + C.CORE_RADIUS + 16);
  };

  window.BA = window.BA || {};
  window.BA.Core = Core;
})();
