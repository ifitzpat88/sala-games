// ============================================================
//  config.js — All tuning constants, definitions, wave data
// ============================================================
(function () {
  'use strict';

  const C = {};

  // ---- Canvas / Arena ----
  C.W = 1000;
  C.H = 700;
  C.CORE_X = C.W / 2;
  C.CORE_Y = C.H / 2;
  C.CORE_RADIUS = 36;
  C.ARENA_PAD = 40;
  C.MAX_WAVES = 5;

  // ---- Debug ----
  C.DEBUG = false;                 // toggled with F3

  // ---- Physics ----
  C.DT_CAP = 0.05;                // max dt per frame (50ms) — prevents physics explosions
  C.PLAYER_FRICTION = 0.90;
  C.PLAYER_ACCEL = 0.15;
  C.BOOST_SPEED_MUL = 1.8;
  C.BOOST_FUEL_MAX = 100;
  C.BOOST_DRAIN = 1;              // per frame while boosting
  C.BOOST_REFUEL_BASE = 180;      // frames from empty to full

  // ---- Pickup ----
  C.SCRAP_DESPAWN = 600;          // frames (~10s)
  C.SCRAP_BLINK_START = 500;      // start blinking

  // ---- Spawn telegraph ----
  C.SPAWN_TELEGRAPH_DUR = 48;     // frames (~0.8s) ring before enemy appears

  // ---- Screen shake ----
  C.SHAKE_DECAY = 0.85;
  C.SHAKE_MIN = 0.3;
  C.SHAKE_ENABLED = true;         // user-toggleable

  // ============================================================
  //  BOB DEFINITIONS
  // ============================================================
  C.BOBS = {
    pilot: {
      id: 'pilot',
      name: 'Pilot Bob',
      role: 'Balanced',
      color: '#4488ff',
      colorDark: '#2255aa',
      glowColor: 'rgba(68,136,255,0.25)',
      weapon: 'Standard Blaster',
      passive: '+10% shield regen',
      abilityName: 'Barrel Roll',
      abilityDesc: 'Brief invincibility + speed burst',
      abilityCooldown: 5,          // seconds
      hp: 100,
      speed: 3.5,
      fireRate: 200,               // ms between shots
      damage: 12,
      projSpeed: 8,
      projCount: 1,
      shieldRegen: 0.15,           // HP/frame
      projColor: '#66aaff',
      locked: false,
    },
    wizard: {
      id: 'wizard',
      name: 'Wizard Bob',
      role: 'Glass Cannon',
      color: '#aa44ff',
      colorDark: '#6622aa',
      glowColor: 'rgba(170,68,255,0.25)',
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
      projColor: '#cc88ff',
      locked: false,
    },
    mechanic: {
      id: 'mechanic',
      name: 'Mechanic Bob',
      role: 'Tank / Support',
      color: '#44ff88',
      colorDark: '#22aa55',
      glowColor: 'rgba(68,255,136,0.25)',
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
      projColor: '#88ffaa',
      locked: false,
    },
    ninja: {
      id: 'ninja',
      name: 'Ninja Bob',
      role: 'Assassin',
      color: '#ff4488',
      colorDark: '#aa2255',
      glowColor: 'rgba(255,68,136,0.25)',
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
      projColor: '#ff88aa',
      locked: true,
    },
    sniper: {
      id: 'sniper',
      name: 'Sniper Bob',
      role: 'Marksman',
      color: '#ffcc00',
      colorDark: '#aa8800',
      glowColor: 'rgba(255,204,0,0.25)',
      weapon: 'Piercing Lance',
      passive: '15% crit chance (1.5x dmg)',
      abilityName: 'Focus Beam',
      abilityDesc: 'Channeled beam — high DPS for 2s',
      abilityCooldown: 10,
      hp: 85,
      speed: 3.0,
      fireRate: 400,
      damage: 28,
      projSpeed: 12,
      projCount: 1,
      shieldRegen: 0.08,
      projColor: '#ffdd44',
      locked: true,
      piercing: true,
    },
  };

  // ============================================================
  //  WAVE CONFIGURATIONS
  // ============================================================
  C.WAVES = [
    { // Wave 1
      drones: 8, kamikazes: 0, snipers: 0, enforcers: 0,
      spawnInterval: 1200, droneHp: 20, droneSpeed: 1.2,
    },
    { // Wave 2
      drones: 10, kamikazes: 4, snipers: 0, enforcers: 0,
      spawnInterval: 1000, droneHp: 24, droneSpeed: 1.3,
    },
    { // Wave 3
      drones: 12, kamikazes: 6, snipers: 2, enforcers: 1,
      spawnInterval: 900, droneHp: 28, droneSpeed: 1.4,
    },
    { // Wave 4
      drones: 14, kamikazes: 8, snipers: 4, enforcers: 2,
      spawnInterval: 800, droneHp: 32, droneSpeed: 1.5,
    },
    { // Wave 5 — boss wave
      drones: 18, kamikazes: 10, snipers: 6, enforcers: 3,
      spawnInterval: 650, droneHp: 36, droneSpeed: 1.6,
    },
  ];

  // ============================================================
  //  UPGRADE POOL
  // ============================================================
  C.UPGRADES = [
    { id: 'fire_rate',    name: 'Overclock Blaster',  icon: '\u{1F525}', desc: '+15% fire rate',          apply: function (p)    { p.fireRate *= 0.85; } },
    { id: 'damage',       name: 'Hardened Rounds',     icon: '\u{1F4A5}', desc: '+20% damage',             apply: function (p)    { p.damage *= 1.2; } },
    { id: 'proj_count',   name: 'Split Shot',          icon: '\u{1F531}', desc: '+1 projectile',           apply: function (p)    { p.projCount += 1; } },
    { id: 'max_hp',       name: 'Hull Reinforcement',  icon: '\u{1F6E1}', desc: '+25 max HP & heal',       apply: function (p)    { p.maxHp += 25; p.hp = Math.min(p.hp + 25, p.maxHp); } },
    { id: 'shield_regen', name: 'Shield Patch',        icon: '\u{1F49A}', desc: '+50% shield regen',       apply: function (p)    { p.shieldRegen *= 1.5; } },
    { id: 'speed',        name: 'Thruster Boost',      icon: '\u{26A1}',  desc: '+12% move speed',         apply: function (p)    { p.speed *= 1.12; } },
    { id: 'boost_cd',     name: 'Boost Cooler',        icon: '\u{2744}',  desc: 'Boost recharge -25%',     apply: function (p)    { p.boostCooldownMax *= 0.75; } },
    { id: 'ability_cd',   name: 'Ability Accelerator', icon: '\u{23F1}',  desc: 'Ability cooldown -20%',   apply: function (p)    { p.abilityCooldownMax *= 0.80; } },
    { id: 'scrap_magnet', name: 'Scrap Magnet',        icon: '\u{1F9F2}', desc: '2x pickup radius',        apply: function (p)    { p.pickupRadius *= 2; } },
    { id: 'proj_speed',   name: 'Velocity Rounds',     icon: '\u{1F680}', desc: '+25% projectile speed',   apply: function (p)    { p.projSpeed *= 1.25; } },
    { id: 'core_armor',   name: 'Core Plating',        icon: '\u{1F3DB}', desc: 'Core gains +40 HP',       apply: function (p, g) { g.core.hp = Math.min(g.core.hp + 40, g.core.maxHp + 40); g.core.maxHp += 40; } },
  ];

  // ============================================================
  //  MESSAGE SCRIPTS
  // ============================================================
  C.getPreWaveMessages = function (wave, bobId) {
    var bobName = (C.BOBS[bobId] && C.BOBS[bobId].name) || 'Bob';
    var scripts = {
      1: [
        { speaker: 'ANNOUNCER',         cls: 'announcer', text: "Welcome to BOB'S ARENA! Please do not feed the Not-Bobs." },
        { speaker: 'ARENA CORE',        cls: 'core',      text: 'Warning: Unauthorized geometry detected.' },
        { speaker: bobName.toUpperCase(), cls: bobId,       text: 'Great\u2026 triangles again.' },
      ],
      2: [
        { speaker: 'SYSTEM',            cls: 'system',    text: 'The Not-Bobs are adapting. Stay sharp.' },
        { speaker: 'ANNOUNCER',         cls: 'announcer', text: 'Wave 2 incoming! They brought friends.' },
      ],
      3: [
        { speaker: 'ARENA CORE',        cls: 'core',      text: 'Geometric anomaly detected \u2014 new enemy signatures.' },
        { speaker: 'ANNOUNCER',         cls: 'announcer', text: "Snipers? Really? These guys don't play fair." },
        { speaker: bobName.toUpperCase(), cls: bobId,       text: "Nothing I can't handle." },
      ],
      4: [
        { speaker: 'SYSTEM',            cls: 'system',    text: 'Alert: Not-Bob fleet density increasing exponentially.' },
        { speaker: 'ANNOUNCER',         cls: 'announcer', text: "Viewers, if you're watching from home\u2026 maybe lock your doors." },
      ],
      5: [
        { speaker: 'ANNOUNCER',         cls: 'announcer', text: "Uh\u2026 viewers, we have a problem. That's not a wave. That's a shape." },
        { speaker: 'ARENA CORE',        cls: 'core',      text: 'CRITICAL: Core breach imminent. Final defense protocol engaged.' },
        { speaker: bobName.toUpperCase(), cls: bobId,       text: "Let's finish this." },
      ],
    };
    return scripts[wave] || scripts[1];
  };

  C.WAVE_COMPLETE_FLAVOR = [
    'Not bad for a warm-up. Pick an upgrade.',
    "Core holding steady. The Not-Bobs won't quit \u2014 neither will you.",
    "They're getting smarter. Time to get stronger.",
    'One more wave. Make it count.',
  ];

  C.DEFEAT_MESSAGES = [
    'The arena grows silent.',
    'The Not-Bobs have won this round.',
    'Even the announcer went quiet.',
  ];

  C.UNLOCK_MESSAGE = {
    ninja:  { speaker: 'SYSTEM', cls: 'system', text: 'New pilot clearance granted: NINJA BOB.' },
    sniper: { speaker: 'SYSTEM', cls: 'system', text: 'New pilot clearance granted: SNIPER BOB.' },
  };

  // ============================================================
  //  KEY MAPPINGS (remap-ready)
  // ============================================================
  C.KEYS = {
    UP:      ['w', 'arrowup'],
    DOWN:    ['s', 'arrowdown'],
    LEFT:    ['a', 'arrowleft'],
    RIGHT:   ['d', 'arrowright'],
    SHOOT:   [' '],                // space — mouse click handled separately
    BOOST:   ['shift'],
    ABILITY: ['e'],
    PAUSE:   ['escape'],
    RESTART: ['r'],
    DEBUG:   ['f3'],
  };

  // ---- Export ----
  window.BA = window.BA || {};
  window.BA.Config = C;
})();
