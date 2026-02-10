// ============================================================
//  BOB'S ARENA  —  Complete Game Engine
// ============================================================

// ---------- CONSTANTS ----------
const W = 1000, H = 700;
const CORE_X = W / 2, CORE_Y = H / 2, CORE_RADIUS = 36;
const ARENA_PAD = 40;
const MAX_WAVES = 5;

// ---------- HELPERS ----------
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;
const angle = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);

// ---------- AUDIO (minimal synth bleeps) ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}
function playTone(freq, dur, vol = 0.1, type = 'square') {
  try {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio not available */ }
}
function sfxShoot()    { playTone(880, 0.08, 0.06, 'square'); }
function sfxHit()      { playTone(220, 0.12, 0.08, 'sawtooth'); }
function sfxExplode()  { playTone(80, 0.25, 0.12, 'sawtooth'); }
function sfxPickup()   { playTone(1200, 0.1, 0.05, 'sine'); }
function sfxAbility()  { playTone(440, 0.3, 0.1, 'triangle'); }
function sfxBoost()    { playTone(300, 0.15, 0.07, 'sawtooth'); }

// ---------- BOB DEFINITIONS ----------
const BOB_DEFS = {
  pilot: {
    id: 'pilot',
    name: 'Pilot Bob',
    role: 'Balanced',
    color: '#4488ff',
    colorDark: '#2255aa',
    weapon: 'Standard Blaster',
    passive: '+10% shield regen',
    abilityName: 'Barrel Roll',
    abilityDesc: 'Brief invincibility + speed burst',
    abilityCooldown: 5,
    hp: 100,
    speed: 3.5,
    fireRate: 200,      // ms between shots
    damage: 12,
    projSpeed: 8,
    projCount: 1,
    shieldRegen: 0.15,  // HP/frame
    locked: false,
    drawShip: drawPilotShip,
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard Bob',
    role: 'Glass Cannon',
    color: '#aa44ff',
    colorDark: '#6622aa',
    weapon: 'Arc Bolts',
    passive: '8% chain lightning chance',
    abilityName: 'Meteor Spell',
    abilityDesc: 'Big AOE blast at cursor',
    abilityCooldown: 8,
    hp: 70,
    speed: 3.2,
    fireRate: 320,
    damage: 22,
    projSpeed: 7,
    projCount: 1,
    shieldRegen: 0.05,
    locked: false,
    drawShip: drawWizardShip,
  },
  mechanic: {
    id: 'mechanic',
    name: 'Mechanic Bob',
    role: 'Tank / Support',
    color: '#44ff88',
    colorDark: '#22aa55',
    weapon: 'Rivet Gun',
    passive: 'Repairs Core when nearby',
    abilityName: 'Repair Drone',
    abilityDesc: 'Drone heals you & Core for 8s',
    abilityCooldown: 12,
    hp: 140,
    speed: 2.8,
    fireRate: 260,
    damage: 10,
    projSpeed: 6.5,
    projCount: 1,
    shieldRegen: 0.08,
    locked: false,
    drawShip: drawMechanicShip,
  },
  ninja: {
    id: 'ninja',
    name: 'Ninja Bob',
    role: 'Assassin',
    color: '#ff4488',
    colorDark: '#aa2255',
    weapon: 'Shuriken Burst',
    passive: 'Crit chance +15%',
    abilityName: 'Shadow Dash',
    abilityDesc: 'Teleport to cursor, damage nearby',
    abilityCooldown: 6,
    hp: 80,
    speed: 4.2,
    fireRate: 180,
    damage: 14,
    projSpeed: 9,
    projCount: 3,
    shieldRegen: 0.1,
    locked: true,
    drawShip: drawNinjaShip,
  },
};

// ---------- SHIP DRAW FUNCTIONS ----------
function drawPilotShip(ctx, x, y, angle, color, size = 18) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Main body — arrow shape
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, -size * 0.6);
  ctx.lineTo(-size * 0.4, 0);
  ctx.lineTo(-size * 0.7, size * 0.6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Engine glow
  ctx.beginPath();
  ctx.arc(-size * 0.5, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#00ccff';
  ctx.fill();
  ctx.restore();
}

function drawWizardShip(ctx, x, y, ang, color, size = 18) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // Star shape
  const pts = 5;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? size : size * 0.45;
    const a = (Math.PI * 2 / (pts * 2)) * i - Math.PI / 2;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#dda0ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Center orb
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffaaff';
  ctx.fill();
  ctx.restore();
}

function drawMechanicShip(ctx, x, y, ang, color, size = 20) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // Hexagonal chunky shape
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 / 6) * i - Math.PI / 6;
    const r = i === 0 || i === 5 ? size * 1.1 : size * 0.85;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#88ffaa';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Wrench emblem
  ctx.fillStyle = '#225533';
  ctx.fillRect(-4, -3, 8, 6);
  ctx.restore();
}

function drawNinjaShip(ctx, x, y, ang, color, size = 16) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // Sleek diamond
  ctx.beginPath();
  ctx.moveTo(size * 1.2, 0);
  ctx.lineTo(0, -size * 0.5);
  ctx.lineTo(-size * 0.8, 0);
  ctx.lineTo(0, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ff88aa';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Eye
  ctx.beginPath();
  ctx.arc(size * 0.2, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
}

// ---------- UPGRADE POOL ----------
const UPGRADE_POOL = [
  { id: 'fire_rate',     name: 'Overclock Blaster',   icon: '🔥', desc: '+15% fire rate',            apply: (p) => { p.fireRate *= 0.85; } },
  { id: 'damage',        name: 'Hardened Rounds',      icon: '💥', desc: '+20% damage',               apply: (p) => { p.damage *= 1.2; } },
  { id: 'proj_count',    name: 'Split Shot',           icon: '🔱', desc: '+1 projectile',             apply: (p) => { p.projCount += 1; } },
  { id: 'max_hp',        name: 'Hull Reinforcement',   icon: '🛡️', desc: '+25 max HP',               apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.hp + 25, p.maxHp); } },
  { id: 'shield_regen',  name: 'Shield Patch',         icon: '💚', desc: '+50% shield regen',         apply: (p) => { p.shieldRegen *= 1.5; } },
  { id: 'speed',         name: 'Thruster Boost',       icon: '⚡', desc: '+12% move speed',            apply: (p) => { p.speed *= 1.12; } },
  { id: 'boost_cd',      name: 'Boost Cooler',         icon: '❄️', desc: 'Boost cooldown -25%',       apply: (p) => { p.boostCooldownMax *= 0.75; } },
  { id: 'ability_cd',    name: 'Ability Accelerator',  icon: '⏱️', desc: 'Ability cooldown -20%',     apply: (p) => { p.abilityCooldownMax *= 0.80; } },
  { id: 'scrap_magnet',  name: 'Scrap Magnet',         icon: '🧲', desc: '2× pickup radius',          apply: (p) => { p.pickupRadius *= 2; } },
  { id: 'proj_speed',    name: 'Velocity Rounds',      icon: '🚀', desc: '+25% projectile speed',     apply: (p) => { p.projSpeed *= 1.25; } },
  { id: 'core_armor',    name: 'Core Plating',         icon: '🏛️', desc: 'Core gains +40 HP',         apply: (p, g) => { g.core.maxHp += 40; g.core.hp = Math.min(g.core.hp + 40, g.core.maxHp); } },
];

// ---------- WAVE CONFIGS ----------
function getWaveConfig(wave) {
  const configs = [
    { // Wave 1
      drones: 8, kamikazes: 0, snipers: 0,
      spawnInterval: 1200, droneHp: 20, droneSpeed: 1.2,
    },
    { // Wave 2
      drones: 10, kamikazes: 4, snipers: 0,
      spawnInterval: 1000, droneHp: 24, droneSpeed: 1.3,
    },
    { // Wave 3
      drones: 12, kamikazes: 6, snipers: 2,
      spawnInterval: 900, droneHp: 28, droneSpeed: 1.4,
    },
    { // Wave 4
      drones: 14, kamikazes: 8, snipers: 4,
      spawnInterval: 800, droneHp: 32, droneSpeed: 1.5,
    },
    { // Wave 5 — boss wave
      drones: 18, kamikazes: 10, snipers: 6,
      spawnInterval: 650, droneHp: 36, droneSpeed: 1.6,
    },
  ];
  return configs[clamp(wave - 1, 0, 4)];
}

// ---------- MESSAGE SCRIPTS ----------
function getPreWaveMessages(wave, bobId) {
  const bobName = BOB_DEFS[bobId]?.name || 'Bob';
  const scripts = {
    1: [
      { speaker: 'ANNOUNCER', cls: 'announcer', text: 'Welcome to BOB\'S ARENA! Please do not feed the Not-Bobs.' },
      { speaker: 'ARENA CORE', cls: 'core', text: 'Warning: Unauthorized geometry detected.' },
      { speaker: bobName.toUpperCase(), cls: bobId, text: 'Great… triangles again.' },
    ],
    2: [
      { speaker: 'SYSTEM', cls: 'system', text: `Core Stability: ${game ? Math.round((game.core.hp / game.core.maxHp) * 100) : 100}% — The Not-Bobs are adapting.` },
      { speaker: 'ANNOUNCER', cls: 'announcer', text: 'Wave 2 incoming! They brought friends.' },
    ],
    3: [
      { speaker: 'ARENA CORE', cls: 'core', text: 'Geometric anomaly detected — new enemy signatures.' },
      { speaker: 'ANNOUNCER', cls: 'announcer', text: 'Snipers? Really? These guys don\'t play fair.' },
      { speaker: bobName.toUpperCase(), cls: bobId, text: 'Nothing I can\'t handle.' },
    ],
    4: [
      { speaker: 'SYSTEM', cls: 'system', text: 'Alert: Not-Bob fleet density increasing exponentially.' },
      { speaker: 'ANNOUNCER', cls: 'announcer', text: 'Viewers, if you\'re watching from home... maybe lock your doors.' },
    ],
    5: [
      { speaker: 'ANNOUNCER', cls: 'announcer', text: 'Uh… viewers, we have a problem. That\'s not a wave. That\'s a shape.' },
      { speaker: 'ARENA CORE', cls: 'core', text: 'CRITICAL: Core breach imminent. Final defense protocol engaged.' },
      { speaker: bobName.toUpperCase(), cls: bobId, text: 'Let\'s finish this.' },
    ],
  };
  return scripts[wave] || scripts[1];
}

function getWaveCompleteFlavorText(wave) {
  const texts = [
    'Not bad for a warm-up. Pick an upgrade.',
    'Core holding steady. The Not-Bobs won\'t quit — neither will you.',
    'They\'re getting smarter. Time to get stronger.',
    'One more wave. Make it count.',
  ];
  return texts[clamp(wave - 1, 0, 3)];
}

// ---------- PARTICLE SYSTEM ----------
class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color; this.size = size;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life--;
    return this.life > 0;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------- PROJECTILE ----------
class Projectile {
  constructor(x, y, vx, vy, damage, friendly, color = '#fff', radius = 3) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.damage = damage;
    this.friendly = friendly;
    this.color = color;
    this.radius = radius;
    this.alive = true;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
      this.alive = false;
    }
    return this.alive;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    // Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace(')', ', 0.15)').replace('rgb', 'rgba');
    // fallback for hex colors
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------- SCRAP PICKUP ----------
class Scrap {
  constructor(x, y, value = 1) {
    this.x = x; this.y = y;
    this.value = value;
    this.alive = true;
    this.age = 0;
    this.bobAngle = rand(0, Math.PI * 2);
  }
  update() {
    this.age++;
    this.bobAngle += 0.05;
    if (this.age > 600) this.alive = false; // despawn after 10s
    return this.alive;
  }
  draw(ctx) {
    const bobY = Math.sin(this.bobAngle) * 3;
    const alpha = this.age > 500 ? (600 - this.age) / 100 : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    // Diamond shape
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
    ctx.arc(this.x, this.y + bobY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 170, 0, 0.08)';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------- ENEMIES ----------
class Enemy {
  constructor(x, y, type, hp, speed) {
    this.x = x; this.y = y;
    this.type = type;
    this.hp = hp; this.maxHp = hp;
    this.speed = speed;
    this.alive = true;
    this.angle = 0;
    this.shootTimer = 0;
    this.flashTimer = 0;
    this.scrapValue = type === 'kamikaze' ? 1 : type === 'sniper' ? 3 : 2;
  }

  update(player, core, projectiles, particles) {
    if (!this.alive) return false;

    if (this.type === 'drone') {
      this.updateDrone(player, core);
    } else if (this.type === 'kamikaze') {
      this.updateKamikaze(player);
    } else if (this.type === 'sniper') {
      this.updateSniper(player, projectiles);
    }

    if (this.flashTimer > 0) this.flashTimer--;
    return this.alive;
  }

  updateDrone(player, core) {
    // Drones alternate between targeting player and core
    const target = Math.random() < 0.4 ? { x: core.x, y: core.y } : player;
    const a = angle(this, target);
    this.angle = a;
    this.x += Math.cos(a) * this.speed;
    this.y += Math.sin(a) * this.speed;
  }

  updateKamikaze(player) {
    const a = angle(this, player);
    this.angle = a;
    this.x += Math.cos(a) * this.speed * 1.8;
    this.y += Math.sin(a) * this.speed * 1.8;
  }

  updateSniper(player, projectiles) {
    // Hold distance ~250px from player, shoot periodically
    const d = dist(this, player);
    const a = angle(this, player);
    this.angle = a;

    if (d < 200) {
      // Back away
      this.x -= Math.cos(a) * this.speed * 0.5;
      this.y -= Math.sin(a) * this.speed * 0.5;
    } else if (d > 300) {
      // Get closer
      this.x += Math.cos(a) * this.speed * 0.5;
      this.y += Math.sin(a) * this.speed * 0.5;
    }

    // Shoot
    this.shootTimer++;
    if (this.shootTimer > 120) { // every 2 seconds
      this.shootTimer = 0;
      const pSpeed = 4;
      projectiles.push(new Projectile(
        this.x, this.y,
        Math.cos(a) * pSpeed, Math.sin(a) * pSpeed,
        18, false, '#ff4444', 4
      ));
    }
  }

  takeDamage(dmg, particles) {
    this.hp -= dmg;
    this.flashTimer = 6;
    // Hit particles
    for (let i = 0; i < 4; i++) {
      particles.push(new Particle(
        this.x, this.y,
        rand(-2, 2), rand(-2, 2),
        randInt(10, 20),
        this.type === 'drone' ? '#ff4444' : this.type === 'kamikaze' ? '#ffaa00' : '#ff2222',
        rand(2, 4)
      ));
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.explode(particles);
    }
  }

  explode(particles) {
    sfxExplode();
    for (let i = 0; i < 15; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(1, 4);
      particles.push(new Particle(
        this.x, this.y,
        Math.cos(a) * s, Math.sin(a) * s,
        randInt(20, 40),
        this.type === 'kamikaze' ? '#ffcc00' : '#ff5533',
        rand(2, 6)
      ));
    }
  }

  draw(ctx) {
    const flash = this.flashTimer > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'drone') {
      // Red diamond
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
    } else if (this.type === 'kamikaze') {
      // Orange triangle, pulsing
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
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
    } else if (this.type === 'sniper') {
      // Larger dark triangle
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
    }

    ctx.restore();

    // HP bar (if damaged)
    if (this.hp < this.maxHp) {
      const bw = 24, bh = 3;
      const pct = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x - bw / 2, this.y - 18, bw, bh);
      ctx.fillStyle = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffaa00' : '#ff3333';
      ctx.fillRect(this.x - bw / 2, this.y - 18, bw * pct, bh);
    }
  }
}

// ---------- REPAIR DRONE (Mechanic ability) ----------
class RepairDrone {
  constructor(x, y, duration) {
    this.x = x; this.y = y;
    this.life = duration;
    this.maxLife = duration;
    this.angle = 0;
    this.orbitRadius = 50;
    this.orbitAngle = 0;
    this.alive = true;
  }
  update(player, core) {
    this.life--;
    if (this.life <= 0) { this.alive = false; return false; }
    this.orbitAngle += 0.04;
    this.x = player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.y = player.y + Math.sin(this.orbitAngle) * this.orbitRadius;
    // Heal player and core
    if (this.life % 30 === 0) {
      player.hp = Math.min(player.hp + 3, player.maxHp);
      core.hp = Math.min(core.hp + 2, core.maxHp);
    }
    return this.alive;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.orbitAngle * 2);
    // Small green diamond
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fillStyle = '#44ff88';
    ctx.fill();
    ctx.strokeStyle = '#88ffbb';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Heal ring
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(68, 255, 136, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// ---------- METEOR (Wizard ability) ----------
class Meteor {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.radius = 0;
    this.maxRadius = 80;
    this.life = 30;
    this.maxLife = 30;
    this.damaged = new Set();
    this.alive = true;
  }
  update(enemies, particles) {
    this.life--;
    this.radius = this.maxRadius * (1 - this.life / this.maxLife);
    if (this.life <= 0) { this.alive = false; return false; }
    // Damage enemies in radius
    for (const e of enemies) {
      if (!e.alive || this.damaged.has(e)) continue;
      if (dist(this, e) < this.radius) {
        e.takeDamage(45, particles);
        this.damaged.add(e);
      }
    }
    // Particles
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(0, this.radius);
      particles.push(new Particle(
        this.x + Math.cos(a) * r,
        this.y + Math.sin(a) * r,
        rand(-1, 1), rand(-1, 1),
        randInt(8, 15),
        Math.random() < 0.5 ? '#ff6600' : '#ffaa00',
        rand(2, 5)
      ));
    }
    return this.alive;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 170, 0, ${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.4})`;
    ctx.fill();
  }
}

// ============================================================
//  MAIN GAME CLASS
// ============================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // State
    this.state = 'title'; // title, select, message, playing, upgrading, gameover, victory
    this.selectedBob = null;
    this.wave = 0;
    this.scrap = 0;
    this.totalScrap = 0;
    this.kills = 0;
    this.runTime = 0;

    // Player
    this.player = null;
    // Core
    this.core = { x: CORE_X, y: CORE_Y, hp: 200, maxHp: 200, pulseAngle: 0 };

    // Entities
    this.projectiles = [];
    this.enemies = [];
    this.particles = [];
    this.scraps = [];
    this.repairDrones = [];
    this.meteors = [];

    // Wave spawning
    this.waveConfig = null;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.enemiesAlive = 0;
    this.enemiesSpawned = 0;
    this.totalEnemies = 0;
    this.waveActive = false;

    // Input
    this.keys = {};
    this.mouse = { x: W / 2, y: H / 2 };
    this.mouseDown = false;
    this.shootTimer = 0;

    // Screen shake
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeMag = 0;

    // Stars (background)
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: rand(0, W), y: rand(0, H),
        size: rand(0.5, 2), brightness: rand(0.2, 0.7)
      });
    }

    // Unlocks (persisted in localStorage)
    this.unlocks = this.loadUnlocks();

    // Bind events
    this.bindEvents();

    // Start loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // ---- Persistence ----
  loadUnlocks() {
    try {
      const data = JSON.parse(localStorage.getItem('bobs_arena_unlocks'));
      if (data && typeof data === 'object') return data;
    } catch (e) {}
    return { pilot: true, wizard: true, mechanic: true, ninja: false };
  }
  saveUnlocks() {
    localStorage.setItem('bobs_arena_unlocks', JSON.stringify(this.unlocks));
  }

  // ---- Events ----
  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (W / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (H / rect.height);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
      ensureAudio();
    });
    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // UI Buttons
    document.getElementById('btn-start').addEventListener('click', () => {
      ensureAudio();
      this.showCharacterSelect();
    });
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.startWave();
    });
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.showCharacterSelect();
    });
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.showScreen('title');
    });
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.showCharacterSelect();
    });
    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      this.showScreen('title');
    });
  }

  // ---- Screen Management ----
  showScreen(name) {
    const screens = ['title-screen', 'char-select', 'message-screen', 'upgrade-screen', 'gameover-screen', 'victory-screen'];
    screens.forEach(s => document.getElementById(s).classList.remove('active'));
    const hud = document.getElementById('hud');
    hud.classList.remove('active');

    const map = {
      'title': 'title-screen',
      'select': 'char-select',
      'message': 'message-screen',
      'upgrading': 'upgrade-screen',
      'gameover': 'gameover-screen',
      'victory': 'victory-screen',
    };
    if (map[name]) {
      document.getElementById(map[name]).classList.add('active');
    }
    if (name === 'playing') {
      hud.classList.add('active');
    }
    this.state = name;
  }

  // ---- Character Select ----
  showCharacterSelect() {
    const container = document.getElementById('bob-cards');
    container.innerHTML = '';
    const bobIds = ['pilot', 'wizard', 'mechanic', 'ninja'];

    for (const id of bobIds) {
      const def = BOB_DEFS[id];
      const unlocked = this.unlocks[id];
      const card = document.createElement('div');
      card.className = 'bob-card' + (unlocked ? '' : ' locked');

      // Mini canvas for ship preview
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 80;
      previewCanvas.height = 80;
      previewCanvas.className = 'bob-preview';
      const pctx = previewCanvas.getContext('2d');
      pctx.clearRect(0, 0, 80, 80);
      def.drawShip(pctx, 40, 40, 0, def.color, 22);

      card.appendChild(previewCanvas);

      card.innerHTML += `
        <div class="bob-name" style="color: ${def.color}">${def.name}</div>
        <div class="bob-role">${def.role}</div>
        <div class="bob-stat">Weapon: <span>${def.weapon}</span></div>
        <div class="bob-stat">Passive: <span>${def.passive}</span></div>
        <div class="bob-ability">[E] ${def.abilityName}: ${def.abilityDesc}</div>
        ${unlocked ? '' : '<div class="locked-label">🔒 LOCKED</div>'}
      `;

      // Re-insert the preview canvas at the top
      const nameEl = card.querySelector('.bob-name');
      card.insertBefore(previewCanvas, nameEl);

      if (unlocked) {
        card.addEventListener('click', () => this.selectBob(id));
      }

      container.appendChild(card);
    }

    this.showScreen('select');
  }

  selectBob(id) {
    this.selectedBob = id;
    this.initRun();
    this.wave = 1;
    this.showPreWaveMessage();
  }

  // ---- Init Run ----
  initRun() {
    const def = BOB_DEFS[this.selectedBob];
    this.player = {
      x: W / 2,
      y: H * 0.75,
      vx: 0, vy: 0,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      fireRate: def.fireRate,
      damage: def.damage,
      projSpeed: def.projSpeed,
      projCount: def.projCount,
      shieldRegen: def.shieldRegen,
      angle: 0,
      bobId: def.id,
      color: def.color,
      colorDark: def.colorDark,
      drawShip: def.drawShip,
      // Ability
      abilityCooldown: 0,
      abilityCooldownMax: def.abilityCooldown * 60, // in frames
      abilityActive: false,
      abilityTimer: 0,
      // Boost
      boostFuel: 100,
      boostCooldownMax: 180, // 3s to refuel from empty
      boosting: false,
      // Barrel roll (pilot)
      invincible: false,
      invincibleTimer: 0,
      // Pickup radius
      pickupRadius: 50,
    };

    this.core = { x: CORE_X, y: CORE_Y, hp: 200, maxHp: 200, pulseAngle: 0 };
    this.scrap = 0;
    this.totalScrap = 0;
    this.kills = 0;
    this.runTime = 0;
    this.projectiles = [];
    this.enemies = [];
    this.particles = [];
    this.scraps = [];
    this.repairDrones = [];
    this.meteors = [];
    this.waveActive = false;
  }

  // ---- Pre-Wave Message ----
  showPreWaveMessage() {
    const lines = getPreWaveMessages(this.wave, this.selectedBob);
    const container = document.getElementById('message-lines');
    container.innerHTML = '';

    lines.forEach((line, i) => {
      const div = document.createElement('div');
      div.className = 'message-line';
      div.style.animationDelay = `${i * 0.4}s`;
      div.innerHTML = `
        <span class="msg-speaker ${line.cls}">${line.speaker}</span>
        "${line.text}"
      `;
      container.appendChild(div);
    });

    this.showScreen('message');
  }

  // ---- Start Wave ----
  startWave() {
    this.waveConfig = getWaveConfig(this.wave);
    const cfg = this.waveConfig;

    // Build spawn queue
    this.spawnQueue = [];
    for (let i = 0; i < cfg.drones; i++) this.spawnQueue.push('drone');
    for (let i = 0; i < cfg.kamikazes; i++) this.spawnQueue.push('kamikaze');
    for (let i = 0; i < cfg.snipers; i++) this.spawnQueue.push('sniper');
    // Shuffle
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }

    this.totalEnemies = this.spawnQueue.length;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.waveActive = true;

    // Update HUD
    document.getElementById('wave-label').textContent = `WAVE ${this.wave}`;
    document.getElementById('ability-label').textContent = BOB_DEFS[this.selectedBob].abilityName.toUpperCase();

    this.showScreen('playing');
  }

  // ---- Upgrade Phase ----
  showUpgradeScreen() {
    // Pick 3 random upgrades
    const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, 3);

    document.getElementById('wave-complete-title').textContent = `WAVE ${this.wave} COMPLETE`;
    document.getElementById('upgrade-flavor').textContent = getWaveCompleteFlavorText(this.wave);

    const container = document.getElementById('upgrade-cards');
    container.innerHTML = '';

    picks.forEach((up) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-icon">${up.icon}</div>
        <div class="upgrade-name">${up.name}</div>
        <div class="upgrade-desc">${up.desc}</div>
      `;
      card.addEventListener('click', () => {
        up.apply(this.player, this);
        sfxPickup();
        this.wave++;
        if (this.wave > MAX_WAVES) {
          this.victory();
        } else {
          this.showPreWaveMessage();
        }
      });
      container.appendChild(card);
    });

    this.showScreen('upgrading');
  }

  // ---- Game Over ----
  gameOver(reason) {
    this.waveActive = false;
    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('gameover-stats').innerHTML = `
      Waves survived: <span>${this.wave - 1}</span><br>
      Enemies destroyed: <span>${this.kills}</span><br>
      Scrap collected: <span>${this.totalScrap}</span>
    `;
    this.showScreen('gameover');
  }

  // ---- Victory ----
  victory() {
    this.waveActive = false;
    document.getElementById('victory-stats').innerHTML = `
      All <span>5</span> waves defended!<br>
      Enemies destroyed: <span>${this.kills}</span><br>
      Scrap collected: <span>${this.totalScrap}</span>
    `;

    const unlockSection = document.getElementById('unlock-section');
    if (!this.unlocks.ninja) {
      this.unlocks.ninja = true;
      this.saveUnlocks();
      unlockSection.innerHTML = `
        <h3>NEW BOB UNLOCKED!</h3>
        <p style="color: ${BOB_DEFS.ninja.color}; font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 1.2rem; margin: 8px 0;">
          ${BOB_DEFS.ninja.name}
        </p>
        <p>${BOB_DEFS.ninja.role} — ${BOB_DEFS.ninja.abilityName}: ${BOB_DEFS.ninja.abilityDesc}</p>
      `;
      unlockSection.style.display = 'block';
    } else {
      unlockSection.innerHTML = '<p style="color: #556;">All Bobs already unlocked!</p>';
      unlockSection.style.display = 'block';
    }

    this.showScreen('victory');
  }

  // ---- Spawn Enemy ----
  spawnEnemy(type) {
    const cfg = this.waveConfig;
    // Spawn from random edge
    let x, y;
    const edge = randInt(0, 3);
    switch (edge) {
      case 0: x = rand(0, W); y = -20; break;           // top
      case 1: x = W + 20; y = rand(0, H); break;        // right
      case 2: x = rand(0, W); y = H + 20; break;        // bottom
      case 3: x = -20; y = rand(0, H); break;            // left
    }
    const hp = type === 'kamikaze' ? cfg.droneHp * 0.5
             : type === 'sniper' ? cfg.droneHp * 1.5
             : cfg.droneHp;
    const spd = type === 'kamikaze' ? cfg.droneSpeed * 1.3
              : type === 'sniper' ? cfg.droneSpeed * 0.6
              : cfg.droneSpeed;
    this.enemies.push(new Enemy(x, y, type, hp, spd));
    this.enemiesSpawned++;
  }

  // ---- Player Shoot ----
  playerShoot() {
    const p = this.player;
    const a = p.angle;
    sfxShoot();

    if (p.projCount === 1) {
      this.projectiles.push(new Projectile(
        p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18,
        Math.cos(a) * p.projSpeed, Math.sin(a) * p.projSpeed,
        p.damage, true, p.color, 3
      ));
    } else {
      const spread = 0.15; // radians
      const half = (p.projCount - 1) / 2;
      for (let i = 0; i < p.projCount; i++) {
        const off = (i - half) * spread;
        const sa = a + off;
        this.projectiles.push(new Projectile(
          p.x + Math.cos(sa) * 18, p.y + Math.sin(sa) * 18,
          Math.cos(sa) * p.projSpeed, Math.sin(sa) * p.projSpeed,
          p.damage, true, p.color, 3
        ));
      }
    }
  }

  // ---- Use Ability ----
  useAbility() {
    const p = this.player;
    if (p.abilityCooldown > 0) return;

    sfxAbility();
    p.abilityCooldown = p.abilityCooldownMax;

    if (p.bobId === 'pilot') {
      // Barrel Roll: invincibility + speed burst
      p.invincible = true;
      p.invincibleTimer = 40; // ~0.67s
      p.vx += Math.cos(p.angle) * 8;
      p.vy += Math.sin(p.angle) * 8;
    } else if (p.bobId === 'wizard') {
      // Meteor Spell at cursor
      this.meteors.push(new Meteor(this.mouse.x, this.mouse.y));
      this.addShake(8);
    } else if (p.bobId === 'mechanic') {
      // Repair Drone
      this.repairDrones.push(new RepairDrone(p.x, p.y, 480)); // 8 seconds
    } else if (p.bobId === 'ninja') {
      // Shadow Dash: teleport to cursor, damage nearby
      const tx = clamp(this.mouse.x, ARENA_PAD, W - ARENA_PAD);
      const ty = clamp(this.mouse.y, ARENA_PAD, H - ARENA_PAD);
      // Trail particles from old position
      for (let i = 0; i < 20; i++) {
        this.particles.push(new Particle(
          p.x, p.y,
          rand(-3, 3), rand(-3, 3),
          randInt(15, 30), '#ff4488', rand(2, 5)
        ));
      }
      p.x = tx; p.y = ty;
      // Damage enemies near landing
      for (const e of this.enemies) {
        if (e.alive && dist(p, e) < 80) {
          e.takeDamage(30, this.particles);
        }
      }
      // Arrival particles
      for (let i = 0; i < 15; i++) {
        this.particles.push(new Particle(
          p.x, p.y,
          rand(-4, 4), rand(-4, 4),
          randInt(10, 25), '#ff88aa', rand(2, 4)
        ));
      }
      this.addShake(5);
    }
  }

  // ---- Screen Shake ----
  addShake(mag) {
    this.shakeMag = Math.max(this.shakeMag, mag);
  }

  // ---- Chain Lightning (Wizard passive) ----
  chainLightning(from, excludeEnemy) {
    // Find nearest enemy within range
    let best = null, bestD = 120;
    for (const e of this.enemies) {
      if (!e.alive || e === excludeEnemy) continue;
      const d = dist(from, e);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      best.takeDamage(this.player.damage * 0.5, this.particles);
      // Visual: line of particles
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        this.particles.push(new Particle(
          lerp(from.x, best.x, t) + rand(-5, 5),
          lerp(from.y, best.y, t) + rand(-5, 5),
          rand(-0.5, 0.5), rand(-0.5, 0.5),
          randInt(5, 12), '#aaddff', rand(1, 3)
        ));
      }
    }
  }

  // ============================================================
  //  MAIN UPDATE
  // ============================================================
  update(dt) {
    if (this.state !== 'playing') return;

    const p = this.player;
    this.runTime += dt;

    // ---- Player Movement ----
    let ax = 0, ay = 0;
    if (this.keys['w'] || this.keys['arrowup'])    ay -= 1;
    if (this.keys['s'] || this.keys['arrowdown'])  ay += 1;
    if (this.keys['a'] || this.keys['arrowleft'])  ax -= 1;
    if (this.keys['d'] || this.keys['arrowright']) ax += 1;

    // Normalize diagonal
    if (ax !== 0 && ay !== 0) {
      const len = Math.hypot(ax, ay);
      ax /= len; ay /= len;
    }

    // Boost
    const boosting = (this.keys['shift'] || this.keys['shiftleft']) && p.boostFuel > 0;
    const speedMul = boosting ? 1.8 : 1;
    if (boosting) {
      p.boostFuel = Math.max(0, p.boostFuel - 1);
      if (p.boostFuel <= 0) sfxBoost();
    } else {
      p.boostFuel = Math.min(100, p.boostFuel + 100 / p.boostCooldownMax);
    }

    p.vx += ax * p.speed * 0.15 * speedMul;
    p.vy += ay * p.speed * 0.15 * speedMul;
    p.vx *= 0.9;
    p.vy *= 0.9;
    p.x += p.vx;
    p.y += p.vy;
    p.x = clamp(p.x, ARENA_PAD, W - ARENA_PAD);
    p.y = clamp(p.y, ARENA_PAD, H - ARENA_PAD);

    // Aim angle
    p.angle = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);

    // Shield regen
    p.hp = Math.min(p.hp + p.shieldRegen, p.maxHp);

    // Invincibility timer (Pilot barrel roll)
    if (p.invincibleTimer > 0) p.invincibleTimer--;
    if (p.invincibleTimer <= 0) p.invincible = false;

    // Ability cooldown
    if (p.abilityCooldown > 0) p.abilityCooldown--;

    // Ability input
    if (this.keys['e']) {
      this.keys['e'] = false; // consume
      this.useAbility();
    }

    // Mechanic passive: repair core when near it
    if (p.bobId === 'mechanic') {
      if (dist(p, this.core) < 100) {
        this.core.hp = Math.min(this.core.hp + 0.08, this.core.maxHp);
      }
    }

    // ---- Shooting ----
    this.shootTimer -= dt * 1000;
    if ((this.mouseDown || this.keys[' ']) && this.shootTimer <= 0) {
      this.playerShoot();
      this.shootTimer = p.fireRate;
    }

    // ---- Wave Spawning ----
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnTimer += dt * 1000;
      if (this.spawnTimer >= this.waveConfig.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnEnemy(this.spawnQueue.shift());
      }
    }

    // ---- Update Entities ----
    // Projectiles
    this.projectiles = this.projectiles.filter(proj => {
      if (!proj.update()) return false;

      if (proj.friendly) {
        // Hit enemies
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (dist(proj, e) < 16) {
            e.takeDamage(proj.damage, this.particles);
            sfxHit();
            if (!e.alive) {
              this.kills++;
              // Drop scrap
              for (let i = 0; i < e.scrapValue; i++) {
                this.scraps.push(new Scrap(
                  e.x + rand(-10, 10), e.y + rand(-10, 10)
                ));
              }
              this.addShake(3);
            }
            // Wizard chain lightning
            if (p.bobId === 'wizard' && Math.random() < 0.08) {
              this.chainLightning(e, e);
            }
            proj.alive = false;
            return false;
          }
        }
      } else {
        // Enemy projectile hits player
        if (!p.invincible && dist(proj, p) < 14) {
          p.hp -= proj.damage;
          sfxHit();
          this.addShake(5);
          // Hit particles
          for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(
              p.x, p.y, rand(-3, 3), rand(-3, 3),
              randInt(10, 20), '#ff4444', rand(2, 4)
            ));
          }
          proj.alive = false;
          return false;
        }
        // Enemy projectile hits core
        if (dist(proj, this.core) < CORE_RADIUS) {
          this.core.hp -= proj.damage;
          this.addShake(4);
          proj.alive = false;
          return false;
        }
      }
      return true;
    });

    // Enemies
    this.enemies = this.enemies.filter(e => {
      if (!e.alive) return false;
      e.update(p, this.core, this.projectiles, this.particles);

      // Collision with player (kamikaze or contact damage)
      if (!p.invincible && dist(e, p) < 18) {
        const dmg = e.type === 'kamikaze' ? 25 : 10;
        p.hp -= dmg;
        sfxHit();
        this.addShake(6);
        for (let i = 0; i < 8; i++) {
          this.particles.push(new Particle(
            p.x, p.y, rand(-3, 3), rand(-3, 3),
            randInt(10, 20), '#ff6633', rand(2, 5)
          ));
        }
        if (e.type === 'kamikaze') {
          e.alive = false;
          e.explode(this.particles);
          this.kills++;
          this.scraps.push(new Scrap(e.x, e.y));
          return false;
        }
      }

      // Collision with core
      if (dist(e, this.core) < CORE_RADIUS + 10) {
        const dmg = e.type === 'kamikaze' ? 20 : 8;
        this.core.hp -= dmg;
        this.addShake(4);
        if (e.type === 'kamikaze' || e.type === 'drone') {
          e.alive = false;
          e.explode(this.particles);
          return false;
        }
      }

      return e.alive;
    });

    // Particles
    this.particles = this.particles.filter(pt => pt.update());

    // Scraps
    this.scraps = this.scraps.filter(s => {
      if (!s.update()) return false;
      // Check pickup
      if (dist(s, p) < p.pickupRadius) {
        this.scrap++;
        this.totalScrap++;
        sfxPickup();
        return false;
      }
      return true;
    });

    // Repair drones
    this.repairDrones = this.repairDrones.filter(d => d.update(p, this.core));

    // Meteors
    this.meteors = this.meteors.filter(m => m.update(this.enemies, this.particles));

    // ---- Core pulse ----
    this.core.pulseAngle += 0.03;

    // ---- Screen Shake decay ----
    if (this.shakeMag > 0) {
      this.shakeX = rand(-this.shakeMag, this.shakeMag);
      this.shakeY = rand(-this.shakeMag, this.shakeMag);
      this.shakeMag *= 0.85;
      if (this.shakeMag < 0.3) this.shakeMag = 0;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // ---- Check wave complete ----
    const enemiesLeft = this.enemies.filter(e => e.alive).length + this.spawnQueue.length;
    if (this.waveActive && enemiesLeft === 0 && this.enemiesSpawned > 0) {
      this.waveActive = false;
      if (this.wave >= MAX_WAVES) {
        // Delay victory a moment
        setTimeout(() => this.victory(), 800);
      } else {
        setTimeout(() => this.showUpgradeScreen(), 600);
      }
    }

    // ---- Check death ----
    if (p.hp <= 0) {
      p.hp = 0;
      this.gameOver('Your ship was destroyed!');
    }
    if (this.core.hp <= 0) {
      this.core.hp = 0;
      this.gameOver('The Arena Core was destroyed!');
    }

    // ---- Update HUD ----
    this.updateHUD();
  }

  updateHUD() {
    const p = this.player;
    const pctHp = (p.hp / p.maxHp) * 100;
    const pctCore = (this.core.hp / this.core.maxHp) * 100;
    const pctAbility = ((p.abilityCooldownMax - p.abilityCooldown) / p.abilityCooldownMax) * 100;
    const pctBoost = p.boostFuel;

    document.getElementById('hp-bar').style.width = pctHp + '%';
    document.getElementById('hp-text').textContent = Math.ceil(p.hp) + '/' + p.maxHp;
    document.getElementById('core-bar').style.width = pctCore + '%';
    document.getElementById('core-text').textContent = Math.ceil(this.core.hp) + '/' + this.core.maxHp;
    document.getElementById('ability-bar').style.width = pctAbility + '%';
    document.getElementById('boost-bar').style.width = pctBoost + '%';
    document.getElementById('scrap-count').textContent = this.scrap;

    const enemiesLeft = this.enemies.filter(e => e.alive).length + this.spawnQueue.length;
    document.getElementById('enemies-left').textContent = `${enemiesLeft} enemies remaining`;

    // Color HP bar based on percentage
    const hpBar = document.getElementById('hp-bar');
    if (pctHp > 60) hpBar.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
    else if (pctHp > 30) hpBar.style.background = 'linear-gradient(90deg, #ffaa00, #cc8800)';
    else hpBar.style.background = 'linear-gradient(90deg, #ff3333, #cc1111)';

    const coreBar = document.getElementById('core-bar');
    if (pctCore > 60) coreBar.style.background = 'linear-gradient(90deg, #00e5ff, #0088cc)';
    else if (pctCore > 30) coreBar.style.background = 'linear-gradient(90deg, #ffaa00, #cc8800)';
    else coreBar.style.background = 'linear-gradient(90deg, #ff3333, #cc1111)';
  }

  // ============================================================
  //  MAIN RENDER
  // ============================================================
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Clear
    ctx.fillStyle = '#050510';
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Stars
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(200, 210, 255, ${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    if (this.state === 'playing' || this.state === 'gameover' || this.state === 'victory') {
      this.renderGame(ctx);
    }

    ctx.restore();
  }

  renderGame(ctx) {
    const p = this.player;

    // Arena border
    ctx.strokeStyle = 'rgba(30, 30, 80, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA_PAD, ARENA_PAD, W - ARENA_PAD * 2, H - ARENA_PAD * 2);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(20, 20, 60, 0.2)';
    ctx.lineWidth = 1;
    for (let x = ARENA_PAD; x < W - ARENA_PAD; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, ARENA_PAD); ctx.lineTo(x, H - ARENA_PAD); ctx.stroke();
    }
    for (let y = ARENA_PAD; y < H - ARENA_PAD; y += 60) {
      ctx.beginPath(); ctx.moveTo(ARENA_PAD, y); ctx.lineTo(W - ARENA_PAD, y); ctx.stroke();
    }

    // ---- Core ----
    const core = this.core;
    const corePulse = 1 + Math.sin(core.pulseAngle) * 0.1;
    const coreAlpha = core.hp / core.maxHp;

    // Outer glow
    const grad = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, CORE_RADIUS * 3 * corePulse);
    grad.addColorStop(0, `rgba(0, 229, 255, ${0.15 * coreAlpha})`);
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(core.x, core.y, CORE_RADIUS * 3 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Core body
    ctx.beginPath();
    ctx.arc(core.x, core.y, CORE_RADIUS * corePulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 180, 220, ${0.3 + 0.3 * coreAlpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 + 0.3 * coreAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Core inner
    ctx.beginPath();
    ctx.arc(core.x, core.y, CORE_RADIUS * 0.5 * corePulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 230, 255, ${0.4 + 0.3 * coreAlpha})`;
    ctx.fill();

    // "CORE" label
    ctx.font = '10px "Orbitron", sans-serif';
    ctx.fillStyle = `rgba(0, 229, 255, 0.4)`;
    ctx.textAlign = 'center';
    ctx.fillText('CORE', core.x, core.y + CORE_RADIUS + 16);

    // ---- Scraps ----
    for (const s of this.scraps) s.draw(ctx);

    // ---- Enemies ----
    for (const e of this.enemies) if (e.alive) e.draw(ctx);

    // ---- Projectiles ----
    for (const proj of this.projectiles) proj.draw(ctx);

    // ---- Meteors ----
    for (const m of this.meteors) m.draw(ctx);

    // ---- Repair Drones ----
    for (const d of this.repairDrones) d.draw(ctx);

    // ---- Particles ----
    for (const pt of this.particles) pt.draw(ctx);

    // ---- Player ----
    if (p) {
      // Invincibility flash
      if (p.invincible && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Boost trail
      if ((this.keys['shift'] || this.keys['shiftleft']) && p.boostFuel > 0) {
        for (let i = 0; i < 3; i++) {
          this.particles.push(new Particle(
            p.x - Math.cos(p.angle) * 15 + rand(-5, 5),
            p.y - Math.sin(p.angle) * 15 + rand(-5, 5),
            -Math.cos(p.angle) * rand(1, 3),
            -Math.sin(p.angle) * rand(1, 3),
            randInt(8, 15),
            p.color,
            rand(1, 3)
          ));
        }
      }

      p.drawShip(ctx, p.x, p.y, p.angle, p.color);
      ctx.globalAlpha = 1;

      // Crosshair at mouse
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.mouse.x - 16, this.mouse.y);
      ctx.lineTo(this.mouse.x - 8, this.mouse.y);
      ctx.moveTo(this.mouse.x + 8, this.mouse.y);
      ctx.lineTo(this.mouse.x + 16, this.mouse.y);
      ctx.moveTo(this.mouse.x, this.mouse.y - 16);
      ctx.lineTo(this.mouse.x, this.mouse.y - 8);
      ctx.moveTo(this.mouse.x, this.mouse.y + 8);
      ctx.lineTo(this.mouse.x, this.mouse.y + 16);
      ctx.stroke();
    }
  }

  // ============================================================
  //  GAME LOOP
  // ============================================================
  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }
}

// ============================================================
//  BOOT
// ============================================================
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
});
