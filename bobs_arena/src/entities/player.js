// ============================================================
//  player.js — Player ship (all Bob variants)
// ============================================================
(function () {
  'use strict';

  var C   = window.BA.Config;
  var RNG = window.BA.RNG;
  var Projectile = window.BA.Projectile;

  function Player(bobId) {
    var def = C.BOBS[bobId];
    if (!def) throw new Error('Unknown bob: ' + bobId);

    this.bobId = bobId;
    this.x = C.W / 2;
    this.y = C.H * 0.75;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;  // point up

    // Stats (mutable — upgrades modify these)
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.fireRate = def.fireRate;
    this.damage = def.damage;
    this.projSpeed = def.projSpeed;
    this.projCount = def.projCount;
    this.shieldRegen = def.shieldRegen;
    this.projColor = def.projColor || def.color;

    // Visuals
    this.color = def.color;
    this.colorDark = def.colorDark;

    // Ability
    this.abilityCooldown = 0;
    this.abilityCooldownMax = def.abilityCooldown * 60;
    this.abilityActive = false;
    this.abilityTimer = 0;

    // Boost
    this.boostFuel = C.BOOST_FUEL_MAX;
    this.boostCooldownMax = C.BOOST_REFUEL_BASE;

    // State
    this.invincible = false;
    this.invincibleTimer = 0;
    this.pickupRadius = 50;
    this.damageFlash = 0;
    this.shootTimer = 0;

    // Sniper focus beam state
    this.beamActive = false;
    this.beamTimer = 0;
    this.beamAngle = 0;

    // Collected upgrades (names, for display)
    this.upgrades = [];
  }

  // ---- Ship Drawing (per Bob type) ----
  Player.drawShipFor = function (ctx, bobId, x, y, ang, color, size) {
    switch (bobId) {
      case 'pilot':   Player._drawPilot(ctx, x, y, ang, color, size || 18); break;
      case 'wizard':  Player._drawWizard(ctx, x, y, ang, color, size || 18); break;
      case 'mechanic':Player._drawMechanic(ctx, x, y, ang, color, size || 20); break;
      case 'ninja':   Player._drawNinja(ctx, x, y, ang, color, size || 16); break;
      case 'sniper':  Player._drawSniper(ctx, x, y, ang, color, size || 18); break;
      default:        Player._drawPilot(ctx, x, y, ang, color, size || 18);
    }
  };

  Player._drawPilot = function (ctx, x, y, a, c, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.7, -s * 0.6);
    ctx.lineTo(-s * 0.4, 0);
    ctx.lineTo(-s * 0.7, s * 0.6);
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(-s * 0.5, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00ccff'; ctx.fill();
    ctx.restore();
  };

  Player._drawWizard = function (ctx, x, y, a, c, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    var pts = 5;
    ctx.beginPath();
    for (var i = 0; i < pts * 2; i++) {
      var r = i % 2 === 0 ? s : s * 0.45;
      var pa = (Math.PI * 2 / (pts * 2)) * i - Math.PI / 2;
      var px = Math.cos(pa) * r, py = Math.sin(pa) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = '#dda0ff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaaff'; ctx.fill();
    ctx.restore();
  };

  Player._drawMechanic = function (ctx, x, y, a, c, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var ha = (Math.PI * 2 / 6) * i - Math.PI / 6;
      var r = (i === 0 || i === 5) ? s * 1.1 : s * 0.85;
      var px = Math.cos(ha) * r, py = Math.sin(ha) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = '#88ffaa'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#225533'; ctx.fillRect(-4, -3, 8, 6);
    ctx.restore();
  };

  Player._drawNinja = function (ctx, x, y, a, c, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(s * 1.2, 0);
    ctx.lineTo(0, -s * 0.5);
    ctx.lineTo(-s * 0.8, 0);
    ctx.lineTo(0, s * 0.5);
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = '#ff88aa'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.2, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  };

  Player._drawSniper = function (ctx, x, y, a, c, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    // Long sleek shape
    ctx.beginPath();
    ctx.moveTo(s * 1.4, 0);
    ctx.lineTo(s * 0.2, -s * 0.35);
    ctx.lineTo(-s * 0.9, -s * 0.25);
    ctx.lineTo(-s * 0.7, 0);
    ctx.lineTo(-s * 0.9, s * 0.25);
    ctx.lineTo(s * 0.2, s * 0.35);
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = '#ffee88'; ctx.lineWidth = 1.5; ctx.stroke();
    // Scope
    ctx.beginPath(); ctx.arc(s * 0.6, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444'; ctx.fill();
    ctx.restore();
  };

  // ---- Draw (instance) ----
  Player.prototype.draw = function (ctx) {
    // Invincibility flash
    if (this.invincible && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
    // Damage flash
    if (this.damageFlash > 0) {
      ctx.globalAlpha = 0.6;
    }

    Player.drawShipFor(ctx, this.bobId, this.x, this.y, this.angle, this.color);

    ctx.globalAlpha = 1;

    // Focus beam visual (Sniper Bob)
    if (this.beamActive && this.beamTimer > 0) {
      var bLen = 500;
      var bx = this.x + Math.cos(this.beamAngle) * bLen;
      var by = this.y + Math.sin(this.beamAngle) * bLen;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = 'rgba(255,220,50,' + (0.5 + Math.random() * 0.3) + ')';
      ctx.lineWidth = 4 + Math.random() * 3;
      ctx.stroke();
      // Glow
      ctx.strokeStyle = 'rgba(255,255,100,0.15)';
      ctx.lineWidth = 14;
      ctx.stroke();
    }
  };

  // ---- Take damage ----
  Player.prototype.takeDamage = function (dmg) {
    if (this.invincible) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.damageFlash = 8;
  };

  window.BA = window.BA || {};
  window.BA.Player = Player;
})();
