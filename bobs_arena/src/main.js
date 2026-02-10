// ============================================================
//  main.js — Game orchestrator (boot + update + render)
// ============================================================
(function () {
  'use strict';

  var C             = window.BA.Config;
  var RNG           = window.BA.RNG;
  var InputManager  = window.BA.InputManager;
  var StateMachine  = window.BA.StateMachine;
  var GameLoop      = window.BA.GameLoop;
  var ParticleSystem= window.BA.ParticleSystem;
  var Collision     = window.BA.Collision;
  var Spawner       = window.BA.Spawner;
  var Player        = window.BA.Player;
  var Core          = window.BA.Core;
  var Enemy         = window.BA.Enemy;
  var Projectile    = window.BA.Projectile;
  var Scrap         = window.BA.Scrap;
  var HUD           = window.BA.HUD;
  var Menu          = window.BA.Menu;
  var BobSelect     = window.BA.BobSelect;
  var UpgradeCards  = window.BA.UpgradeCards;
  var ResultScreen  = window.BA.ResultScreen;
  var MessageBox    = window.BA.MessageBox;
  var Audio         = window.BA.Audio;
  var Debug         = window.BA.Debug;

  // ============================================================
  //  GAME
  // ============================================================
  function Game() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');

    // State machine
    this.sm = new StateMachine('MENU');

    // Input
    this.input = new InputManager(this.canvas);

    // Systems
    this.particles = new ParticleSystem(800);
    this.spawner   = new Spawner();

    // Entities
    this.player      = null;
    this.core        = new Core();
    this.enemies     = [];
    this.projectiles = [];
    this.scraps      = [];
    this.repairDrones = [];
    this.meteors     = [];

    // Run state
    this.wave       = 0;
    this.scrap      = 0;
    this.totalScrap = 0;
    this.kills      = 0;
    this.selectedBob = null;

    // Screen shake
    this.shakeX   = 0;
    this.shakeY   = 0;
    this.shakeMag = 0;

    // Parallax starfield (3 layers)
    this.starLayers = this._buildStarfield();

    // Persistence
    this.unlocks = this._loadUnlocks();
    this.bestWave = this._loadBestWave();
    this.lifetimeScrap = this._loadLifetimeScrap();

    // Audio
    Audio.loadSettings();

    // Init UI modules
    var self = this;
    HUD.init();
    Debug.init();

    Menu.init(
      function () { Audio.uiClick(); self._goSelect(); },
      function () { Audio.uiClick(); self._showOverlay('settings-screen'); self.sm.go('SETTINGS'); },
      function () { Audio.uiClick(); self._resetProgress(); }
    );
    BobSelect.init(function (id) { Audio.uiClick(); self._selectBob(id); });
    UpgradeCards.init(function (up) { Audio.uiClick(); self._pickUpgrade(up); });
    ResultScreen.init(
      function () { Audio.uiClick(); self._goSelect(); },
      function () { Audio.uiClick(); self._goMenu(); }
    );
    MessageBox.init(function () { Audio.uiClick(); self._startWave(); });

    // Settings screen buttons
    document.getElementById('btn-settings-back').addEventListener('click', function () {
      Audio.uiClick();
      self._showOverlay('title-screen');
      self.sm.go('MENU');
    });

    // Settings sliders
    var sfxSlider   = document.getElementById('sfx-volume');
    var musicSlider = document.getElementById('music-volume');
    var shakeCheck  = document.getElementById('shake-toggle');

    sfxSlider.value   = Audio.getSfxVol() * 100;
    musicSlider.value = Audio.getMusicVol() * 100;
    shakeCheck.checked = C.SHAKE_ENABLED;

    sfxSlider.addEventListener('input', function () { Audio.setSfxVol(this.value / 100); });
    musicSlider.addEventListener('input', function () { Audio.setMusicVol(this.value / 100); });
    shakeCheck.addEventListener('change', function () { C.SHAKE_ENABLED = this.checked; });

    // Pause overlay
    document.getElementById('btn-resume').addEventListener('click', function () { Audio.uiClick(); self._unpause(); });
    document.getElementById('btn-pause-menu').addEventListener('click', function () {
      Audio.uiClick();
      Audio.stopHum();
      self._goMenu();
    });

    // Game loop
    this.loop = new GameLoop(
      function (dt) { self.update(dt); },
      function ()   { self.render(); }
    );
    this.loop.start();

    // Show title
    this._showOverlay('title-screen');
  }

  // ============================================================
  //  SCREEN MANAGEMENT
  // ============================================================
  Game.prototype._showOverlay = function (id) {
    var all = ['title-screen', 'char-select', 'message-screen', 'upgrade-screen',
               'gameover-screen', 'victory-screen', 'settings-screen', 'pause-screen'];
    all.forEach(function (s) { document.getElementById(s).classList.remove('active'); });
    HUD.hide();
    if (id) document.getElementById(id).classList.add('active');
  };

  Game.prototype._goMenu = function () {
    this._showOverlay('title-screen');
    this.sm.go('MENU');
  };

  Game.prototype._goSelect = function () {
    BobSelect.show(this.unlocks);
    this._showOverlay('char-select');
    this.sm.go('SELECT');
  };

  Game.prototype._selectBob = function (id) {
    this.selectedBob = id;
    this._initRun();
    this.wave = 1;
    this._showPreWaveMessage();
  };

  Game.prototype._showPreWaveMessage = function () {
    MessageBox.showPreWave(this.wave, this.selectedBob);
    this._showOverlay('message-screen');
    this.sm.go('MESSAGE');
  };

  Game.prototype._startWave = function () {
    this.spawner.prepareWave(this.wave);
    HUD.setWave(this.wave, this.selectedBob);
    HUD.show();
    this._showOverlay(null); // hide all overlays
    HUD.show();
    Audio.startHum();
    this.sm.go('RUN');
  };

  Game.prototype._showUpgradeScreen = function () {
    var names = this.player ? this.player.upgrades : [];
    UpgradeCards.show(this.wave, names);
    this._showOverlay('upgrade-screen');
    this.sm.go('INTERMISSION');
  };

  Game.prototype._pickUpgrade = function (up) {
    if (this.player) {
      up.apply(this.player, this);
      this.player.upgrades.push(up.name);
    }
    Audio.pickup();
    this.wave++;
    if (this.wave > C.MAX_WAVES) {
      this._victory();
    } else {
      this._showPreWaveMessage();
    }
  };

  Game.prototype._pause = function () {
    if (!this.sm.is('RUN')) return;
    Audio.stopHum();
    this._showOverlay('pause-screen');
    HUD.show();
    this.sm.go('PAUSED');
  };

  Game.prototype._unpause = function () {
    this._showOverlay(null);
    HUD.show();
    Audio.startHum();
    this.sm.go('RUN');
  };

  // ============================================================
  //  RUN INIT / END
  // ============================================================
  Game.prototype._initRun = function () {
    var id = this.selectedBob;
    this.player = new Player(id);
    this.core.reset();

    this.scrap      = 0;
    this.totalScrap = 0;
    this.kills      = 0;

    this.enemies     = [];
    this.projectiles = [];
    this.scraps      = [];
    this.repairDrones = [];
    this.meteors     = [];
    this.particles.clear();
    this.spawner.active = false;

    this.shakeMag = 0;
  };

  Game.prototype._defeat = function (reason) {
    this.spawner.active = false;
    Audio.stopHum();
    Audio.defeat();

    // Persist best wave
    if (this.wave > this.bestWave) {
      this.bestWave = this.wave;
      this._saveBestWave();
    }
    this.lifetimeScrap += this.totalScrap;
    this._saveLifetimeScrap();

    var coreHpPct = this.core.maxHp > 0 ? Math.round((this.core.hp / this.core.maxHp) * 100) : 0;
    ResultScreen.showDefeat({
      reason: reason,
      wave: this.wave,
      kills: this.kills,
      totalScrap: this.totalScrap,
      coreHpPct: coreHpPct,
    });
    this._showOverlay('gameover-screen');
    this.sm.go('RESULT');
  };

  Game.prototype._victory = function () {
    this.spawner.active = false;
    Audio.stopHum();
    Audio.victory();

    this.bestWave = C.MAX_WAVES;
    this._saveBestWave();
    this.lifetimeScrap += this.totalScrap;
    this._saveLifetimeScrap();

    // Determine unlock
    var unlockId = null;
    if (!this.unlocks.ninja) {
      unlockId = 'ninja';
    } else if (!this.unlocks.sniper) {
      unlockId = 'sniper';
    }
    if (unlockId) {
      this.unlocks[unlockId] = true;
      this._saveUnlocks();
    }

    var coreHpPct = this.core.maxHp > 0 ? Math.round((this.core.hp / this.core.maxHp) * 100) : 0;
    ResultScreen.showVictory({
      kills: this.kills,
      totalScrap: this.totalScrap,
      coreHpPct: coreHpPct,
    }, unlockId);

    this._showOverlay('victory-screen');
    this.sm.go('RESULT');
  };

  // ============================================================
  //  PERSISTENCE
  // ============================================================
  Game.prototype._loadUnlocks = function () {
    try {
      var d = JSON.parse(localStorage.getItem('bobs_arena_unlocks'));
      if (d && typeof d === 'object') return d;
    } catch (e) {}
    return { pilot: true, wizard: true, mechanic: true, ninja: false, sniper: false };
  };
  Game.prototype._saveUnlocks = function () {
    localStorage.setItem('bobs_arena_unlocks', JSON.stringify(this.unlocks));
  };
  Game.prototype._loadBestWave = function () {
    return parseInt(localStorage.getItem('bobs_arena_best_wave')) || 0;
  };
  Game.prototype._saveBestWave = function () {
    localStorage.setItem('bobs_arena_best_wave', String(this.bestWave));
  };
  Game.prototype._loadLifetimeScrap = function () {
    return parseInt(localStorage.getItem('bobs_arena_lifetime_scrap')) || 0;
  };
  Game.prototype._saveLifetimeScrap = function () {
    localStorage.setItem('bobs_arena_lifetime_scrap', String(this.lifetimeScrap));
  };
  Game.prototype._resetProgress = function () {
    if (!confirm('Reset all progress? Unlocks, stats, and settings will be cleared.')) return;
    this.unlocks = { pilot: true, wizard: true, mechanic: true, ninja: false, sniper: false };
    this.bestWave = 0;
    this.lifetimeScrap = 0;
    this._saveUnlocks();
    this._saveBestWave();
    this._saveLifetimeScrap();
    localStorage.removeItem('bobs_arena_audio');
    Audio.loadSettings();
  };

  // ============================================================
  //  SCREEN SHAKE
  // ============================================================
  Game.prototype._addShake = function (mag) {
    if (!C.SHAKE_ENABLED) return;
    this.shakeMag = Math.max(this.shakeMag, mag);
  };

  // ============================================================
  //  PLAYER ACTIONS
  // ============================================================
  Game.prototype._playerShoot = function () {
    var p = this.player;
    if (!p) return;
    Audio.shoot();

    var def = C.BOBS[p.bobId];
    var isPiercing = !!(def && def.piercing);

    if (p.projCount === 1) {
      this.projectiles.push(new Projectile(
        p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18,
        Math.cos(p.angle) * p.projSpeed, Math.sin(p.angle) * p.projSpeed,
        p.damage, true, p.projColor, 3, isPiercing
      ));
    } else {
      var spread = 0.15;
      var half = (p.projCount - 1) / 2;
      for (var i = 0; i < p.projCount; i++) {
        var off = (i - half) * spread;
        var sa = p.angle + off;
        this.projectiles.push(new Projectile(
          p.x + Math.cos(sa) * 18, p.y + Math.sin(sa) * 18,
          Math.cos(sa) * p.projSpeed, Math.sin(sa) * p.projSpeed,
          p.damage, true, p.projColor, 3, isPiercing
        ));
      }
    }
  };

  Game.prototype._useAbility = function () {
    var p = this.player;
    if (!p || p.abilityCooldown > 0) return;

    Audio.ability();
    p.abilityCooldown = p.abilityCooldownMax;
    var self = this;

    switch (p.bobId) {
      case 'pilot':
        // Barrel Roll
        p.invincible = true;
        p.invincibleTimer = 40;
        p.vx += Math.cos(p.angle) * 8;
        p.vy += Math.sin(p.angle) * 8;
        break;

      case 'wizard':
        // Meteor at cursor
        this.meteors.push({
          x: this.input.mouse.x, y: this.input.mouse.y,
          radius: 0, maxRadius: 80, life: 30, maxLife: 30,
          damaged: {}
        });
        this._addShake(8);
        break;

      case 'mechanic':
        // Repair Drone
        this.repairDrones.push({
          x: p.x, y: p.y, life: 480, maxLife: 480,
          orbitAngle: 0, orbitRadius: 50, alive: true
        });
        break;

      case 'ninja':
        // Shadow Dash
        var tx = RNG.clamp(this.input.mouse.x, C.ARENA_PAD, C.W - C.ARENA_PAD);
        var ty = RNG.clamp(this.input.mouse.y, C.ARENA_PAD, C.H - C.ARENA_PAD);
        this.particles.burst(p.x, p.y, 20, 3, 20, '#ff4488', 3);
        p.x = tx; p.y = ty;
        // Damage nearby
        this.enemies.forEach(function (e) {
          if (e.alive && e.spawnTelegraph <= 0 && Collision.dist(p, e) < 80) {
            e.takeDamage(30, self.particles);
          }
        });
        this.particles.burst(p.x, p.y, 15, 4, 18, '#ff88aa', 3);
        this._addShake(5);
        break;

      case 'sniper':
        // Focus Beam — 2 second channel
        p.beamActive = true;
        p.beamTimer = 120; // frames
        p.beamAngle = p.angle;
        break;
    }
  };

  // ---- Chain lightning (Wizard passive) ----
  Game.prototype._chainLightning = function (from) {
    var best = null, bestD = 120;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.alive || e.spawnTelegraph > 0) continue;
      var d = Collision.dist(from, e);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      best.takeDamage(this.player.damage * 0.5, this.particles);
      // Visual line
      var steps = 6;
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        this.particles.spawn(
          RNG.lerp(from.x, best.x, t) + RNG.rand(-5, 5),
          RNG.lerp(from.y, best.y, t) + RNG.rand(-5, 5),
          RNG.rand(-0.5, 0.5), RNG.rand(-0.5, 0.5),
          RNG.randInt(5, 12), '#aaddff', RNG.rand(1, 3)
        );
      }
    }
  };

  // ============================================================
  //  UPDATE
  // ============================================================
  Game.prototype.update = function (dt) {
    this.input.update();

    // F3 debug toggle (all states)
    if (this.input.pressed('DEBUG')) {
      this.input.consume('DEBUG');
      Debug.toggle();
    }

    // ---- Pause toggle ----
    if (this.input.pressed('PAUSE')) {
      this.input.consume('PAUSE');
      if (this.sm.is('RUN'))    { this._pause(); return; }
      if (this.sm.is('PAUSED')) { this._unpause(); return; }
    }

    // ---- Restart shortcut on result screen ----
    if (this.sm.is('RESULT') && this.input.pressed('RESTART')) {
      this.input.consume('RESTART');
      this._goSelect();
      return;
    }

    // Only update gameplay during RUN
    if (!this.sm.is('RUN')) {
      Debug.update(this._debugInfo());
      return;
    }

    var p = this.player;
    if (!p) return;

    // ---- Player Movement ----
    var ax = 0, ay = 0;
    if (this.input.held('UP'))    ay -= 1;
    if (this.input.held('DOWN'))  ay += 1;
    if (this.input.held('LEFT'))  ax -= 1;
    if (this.input.held('RIGHT')) ax += 1;
    if (ax !== 0 && ay !== 0) { var len = Math.hypot(ax, ay); ax /= len; ay /= len; }

    var boosting = this.input.held('BOOST') && p.boostFuel > 0;
    var spdMul = boosting ? C.BOOST_SPEED_MUL : 1;
    if (boosting) {
      p.boostFuel = Math.max(0, p.boostFuel - C.BOOST_DRAIN);
    } else {
      p.boostFuel = Math.min(C.BOOST_FUEL_MAX, p.boostFuel + C.BOOST_FUEL_MAX / p.boostCooldownMax);
    }

    p.vx += ax * p.speed * C.PLAYER_ACCEL * spdMul;
    p.vy += ay * p.speed * C.PLAYER_ACCEL * spdMul;
    p.vx *= C.PLAYER_FRICTION;
    p.vy *= C.PLAYER_FRICTION;
    p.x += p.vx;
    p.y += p.vy;
    p.x = RNG.clamp(p.x, C.ARENA_PAD, C.W - C.ARENA_PAD);
    p.y = RNG.clamp(p.y, C.ARENA_PAD, C.H - C.ARENA_PAD);

    // Aim angle
    p.angle = Math.atan2(this.input.mouse.y - p.y, this.input.mouse.x - p.x);

    // Shield regen
    p.hp = Math.min(p.hp + p.shieldRegen, p.maxHp);

    // Timers
    if (p.invincibleTimer > 0) p.invincibleTimer--;
    if (p.invincibleTimer <= 0) p.invincible = false;
    if (p.abilityCooldown > 0) p.abilityCooldown--;
    if (p.damageFlash > 0) p.damageFlash--;

    // Ability input
    if (this.input.pressed('ABILITY')) {
      this.input.consume('ABILITY');
      this._useAbility();
    }

    // Mechanic passive: repair core when near
    if (p.bobId === 'mechanic' && Collision.dist(p, this.core) < 100) {
      this.core.hp = Math.min(this.core.hp + 0.08, this.core.maxHp);
    }

    // Sniper focus beam update
    if (p.beamActive && p.beamTimer > 0) {
      p.beamTimer--;
      p.beamAngle = p.angle; // track mouse
      // Damage enemies along beam every few frames
      if (p.beamTimer % 4 === 0) {
        var bLen = 500;
        var bx2 = p.x + Math.cos(p.beamAngle) * bLen;
        var by2 = p.y + Math.sin(p.beamAngle) * bLen;
        var self = this;
        this.enemies.forEach(function (e) {
          if (!e.alive || e.spawnTelegraph > 0) return;
          if (Collision.lineCircle(p.x, p.y, bx2, by2, e.x, e.y, 16)) {
            e.takeDamage(p.damage * 0.6, self.particles);
          }
        });
      }
      if (p.beamTimer <= 0) p.beamActive = false;
    }

    // ---- Shooting ----
    p.shootTimer = (p.shootTimer || 0) - dt * 1000;
    if ((this.input.mouseDown || this.input.held('SHOOT')) && p.shootTimer <= 0 && !p.beamActive) {
      this._playerShoot();
      p.shootTimer = p.fireRate;
    }

    // ---- Boost trail particles ----
    if (boosting) {
      for (var bt = 0; bt < 2; bt++) {
        this.particles.spawn(
          p.x - Math.cos(p.angle) * 15 + RNG.rand(-5, 5),
          p.y - Math.sin(p.angle) * 15 + RNG.rand(-5, 5),
          -Math.cos(p.angle) * RNG.rand(1, 3),
          -Math.sin(p.angle) * RNG.rand(1, 3),
          RNG.randInt(8, 15), p.color, RNG.rand(1, 3)
        );
      }
    }

    // ---- Wave spawning ----
    this.spawner.update(dt * 1000, this.enemies);

    // ---- Core ----
    this.core.update();

    // ---- Projectiles ----
    var self = this;
    this.projectiles = this.projectiles.filter(function (proj) {
      if (!proj.update()) return false;

      if (proj.friendly) {
        // Hit enemies
        for (var ei = 0; ei < self.enemies.length; ei++) {
          var e = self.enemies[ei];
          if (!e.alive || e.spawnTelegraph > 0) continue;
          if (proj.hitSet[e.id]) continue; // already hit (piercing)
          if (Collision.dist(proj, e) < 16) {
            // Crit check (Ninja/Sniper passive)
            var dmg = proj.damage;
            var def = C.BOBS[p.bobId];
            if (def && def.passive.indexOf('rit') !== -1 && Math.random() < 0.15) {
              dmg *= 1.5;
              self.particles.spawn(e.x, e.y - 12, 0, -1, 20, '#ffff00', 5); // crit flash
            }
            e.takeDamage(dmg, self.particles);
            Audio.hit();
            if (!e.alive) {
              self.kills++;
              for (var si = 0; si < e.scrapValue; si++) {
                self.scraps.push(new Scrap(e.x + RNG.rand(-10, 10), e.y + RNG.rand(-10, 10)));
              }
              self._addShake(3);
            }
            // Wizard chain lightning
            if (p.bobId === 'wizard' && Math.random() < 0.08) {
              self._chainLightning(e);
            }
            if (proj.piercing) {
              proj.hitSet[e.id] = true;
              proj.damage *= 0.7; // diminishing damage
            } else {
              proj.alive = false;
              return false;
            }
          }
        }
      } else {
        // Enemy projectile → player
        if (!p.invincible && Collision.dist(proj, p) < 14) {
          p.takeDamage(proj.damage);
          Audio.hit();
          self._addShake(5);
          self.particles.burst(p.x, p.y, 6, 3, 15, '#ff4444', 3);
          proj.alive = false;
          return false;
        }
        // Enemy projectile → core
        if (Collision.dist(proj, self.core) < C.CORE_RADIUS) {
          self.core.takeDamage(proj.damage);
          self._addShake(4);
          proj.alive = false;
          return false;
        }
      }
      return true;
    });

    // ---- Enemies ----
    this.enemies = this.enemies.filter(function (e) {
      if (!e.alive) return false;
      e.update(p, self.core, self.projectiles);

      // Skip collision during telegraph
      if (e.spawnTelegraph > 0) return true;

      // Contact with player
      if (!p.invincible && Collision.dist(e, p) < 18) {
        var dmg = e.type === 'kamikaze' ? 25 : 10;
        p.takeDamage(dmg);
        Audio.hit();
        self._addShake(6);
        self.particles.burst(p.x, p.y, 8, 3, 15, '#ff6633', 4);
        if (e.type === 'kamikaze') {
          e.alive = false;
          e.explode(self.particles);
          self.kills++;
          self.scraps.push(new Scrap(e.x, e.y));
          return false;
        }
      }

      // Contact with core
      if (Collision.dist(e, self.core) < C.CORE_RADIUS + 10) {
        var cdmg = e.type === 'kamikaze' ? 20 : e.type === 'enforcer' ? 15 : 8;
        self.core.takeDamage(cdmg);
        self._addShake(4);
        if (e.type === 'kamikaze' || e.type === 'drone') {
          e.alive = false;
          e.explode(self.particles);
          return false;
        }
      }

      return e.alive;
    });

    // ---- Particles ----
    this.particles.update();

    // ---- Scraps ----
    this.scraps = this.scraps.filter(function (s) {
      if (!s.update()) return false;
      if (Collision.dist(s, p) < p.pickupRadius) {
        self.scrap++;
        self.totalScrap++;
        Audio.pickup();
        return false;
      }
      return true;
    });

    // ---- Repair Drones ----
    this.repairDrones = this.repairDrones.filter(function (d) {
      d.life--;
      if (d.life <= 0) return false;
      d.orbitAngle += 0.04;
      d.x = p.x + Math.cos(d.orbitAngle) * d.orbitRadius;
      d.y = p.y + Math.sin(d.orbitAngle) * d.orbitRadius;
      if (d.life % 30 === 0) {
        p.hp = Math.min(p.hp + 3, p.maxHp);
        self.core.hp = Math.min(self.core.hp + 2, self.core.maxHp);
      }
      return true;
    });

    // ---- Meteors ----
    this.meteors = this.meteors.filter(function (m) {
      m.life--;
      m.radius = m.maxRadius * (1 - m.life / m.maxLife);
      if (m.life <= 0) return false;
      self.enemies.forEach(function (e) {
        if (!e.alive || e.spawnTelegraph > 0 || m.damaged[e.id]) return;
        if (Collision.dist(m, e) < m.radius) {
          e.takeDamage(45, self.particles);
          m.damaged[e.id] = true;
        }
      });
      for (var mi = 0; mi < 3; mi++) {
        var ma = RNG.rand(0, Math.PI * 2);
        var mr = RNG.rand(0, m.radius);
        self.particles.spawn(
          m.x + Math.cos(ma) * mr, m.y + Math.sin(ma) * mr,
          RNG.rand(-1, 1), RNG.rand(-1, 1),
          RNG.randInt(8, 15), Math.random() < 0.5 ? '#ff6600' : '#ffaa00', RNG.rand(2, 5)
        );
      }
      return true;
    });

    // ---- Screen shake decay ----
    if (this.shakeMag > 0) {
      this.shakeX = RNG.rand(-this.shakeMag, this.shakeMag);
      this.shakeY = RNG.rand(-this.shakeMag, this.shakeMag);
      this.shakeMag *= C.SHAKE_DECAY;
      if (this.shakeMag < C.SHAKE_MIN) this.shakeMag = 0;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // ---- Check wave complete ----
    var enemiesLeft = this.enemies.filter(function (e) { return e.alive; }).length + this.spawner.remaining();
    if (this.spawner.active && enemiesLeft === 0 && this.spawner.spawned > 0) {
      this.spawner.active = false;
      var waveDone = this.wave;
      if (waveDone >= C.MAX_WAVES) {
        var vSelf = this;
        setTimeout(function () { vSelf._victory(); }, 800);
      } else {
        var uSelf = this;
        setTimeout(function () { uSelf._showUpgradeScreen(); }, 600);
      }
    }

    // ---- Check death ----
    if (p.hp <= 0) {
      p.hp = 0;
      this._defeat('Your ship was destroyed!');
    }
    if (this.core.hp <= 0) {
      this.core.hp = 0;
      this._defeat('The Arena Core was destroyed!');
    }

    // ---- HUD ----
    var aliveEnemies = this.enemies.filter(function (e) { return e.alive; }).length;
    HUD.update(p, this.core, this.wave, this.scrap, aliveEnemies + this.spawner.remaining());

    // ---- Debug ----
    Debug.update(this._debugInfo());
  };

  // ============================================================
  //  RENDER
  // ============================================================
  Game.prototype.render = function () {
    var ctx = this.ctx;
    ctx.save();
    if (this.sm.is('RUN') || this.sm.is('PAUSED')) {
      ctx.translate(this.shakeX, this.shakeY);
    }

    // Clear
    ctx.fillStyle = '#050510';
    ctx.fillRect(-10, -10, C.W + 20, C.H + 20);

    // Parallax starfield
    this._drawStarfield(ctx);

    // Only draw game world during run/paused/result
    if (this.sm.is('RUN') || this.sm.is('PAUSED') || this.sm.is('RESULT') || this.sm.is('INTERMISSION')) {
      this._drawArena(ctx);
    }

    ctx.restore();
  };

  // ---- Starfield ----
  Game.prototype._buildStarfield = function () {
    var layers = [];
    var counts = [50, 35, 20]; // back → front
    for (var l = 0; l < 3; l++) {
      var stars = [];
      for (var i = 0; i < counts[l]; i++) {
        stars.push({
          x: RNG.rand(0, C.W),
          y: RNG.rand(0, C.H),
          size: RNG.rand(0.5 + l * 0.3, 1.2 + l * 0.6),
          brightness: RNG.rand(0.15 + l * 0.1, 0.4 + l * 0.2),
          speed: 0.05 + l * 0.08,
        });
      }
      layers.push(stars);
    }
    return layers;
  };

  Game.prototype._drawStarfield = function (ctx) {
    for (var l = 0; l < this.starLayers.length; l++) {
      var stars = this.starLayers[l];
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        // Slow parallax scroll
        s.y += s.speed;
        if (s.y > C.H) { s.y = 0; s.x = RNG.rand(0, C.W); }
        ctx.fillStyle = 'rgba(200,210,255,' + s.brightness + ')';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    }
  };

  // ---- Arena draw ----
  Game.prototype._drawArena = function (ctx) {
    var p = this.player;

    // Arena border
    ctx.strokeStyle = 'rgba(30,30,80,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(C.ARENA_PAD, C.ARENA_PAD, C.W - C.ARENA_PAD * 2, C.H - C.ARENA_PAD * 2);

    // Grid
    ctx.strokeStyle = 'rgba(20,20,60,0.15)';
    ctx.lineWidth = 1;
    for (var gx = C.ARENA_PAD; gx < C.W - C.ARENA_PAD; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, C.ARENA_PAD); ctx.lineTo(gx, C.H - C.ARENA_PAD); ctx.stroke();
    }
    for (var gy = C.ARENA_PAD; gy < C.H - C.ARENA_PAD; gy += 60) {
      ctx.beginPath(); ctx.moveTo(C.ARENA_PAD, gy); ctx.lineTo(C.W - C.ARENA_PAD, gy); ctx.stroke();
    }

    // Core
    this.core.draw(ctx);

    // Scraps
    for (var si = 0; si < this.scraps.length; si++) this.scraps[si].draw(ctx);

    // Enemies
    for (var ei = 0; ei < this.enemies.length; ei++) {
      if (this.enemies[ei].alive) this.enemies[ei].draw(ctx);
    }

    // Projectiles
    for (var pi = 0; pi < this.projectiles.length; pi++) this.projectiles[pi].draw(ctx);

    // Meteors
    for (var mi = 0; mi < this.meteors.length; mi++) {
      var m = this.meteors[mi];
      var mAlpha = m.life / m.maxLife;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,100,0,' + (mAlpha * 0.3) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,0,' + (mAlpha * 0.7) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,200,50,' + (mAlpha * 0.4) + ')';
      ctx.fill();
    }

    // Repair drones
    for (var di = 0; di < this.repairDrones.length; di++) {
      var d = this.repairDrones[di];
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.orbitAngle * 2);
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fillStyle = '#44ff88'; ctx.fill();
      ctx.strokeStyle = '#88ffbb'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(68,255,136,0.3)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    // Particles
    this.particles.draw(ctx);

    // Player
    if (p) {
      p.draw(ctx);

      // Crosshair
      var mx = this.input.mouse.x, my = this.input.mouse.y;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx - 16, my); ctx.lineTo(mx - 8, my);
      ctx.moveTo(mx + 8, my); ctx.lineTo(mx + 16, my);
      ctx.moveTo(mx, my - 16); ctx.lineTo(mx, my - 8);
      ctx.moveTo(mx, my + 8); ctx.lineTo(mx, my + 16);
      ctx.stroke();
    }
  };

  // ---- Debug info ----
  Game.prototype._debugInfo = function () {
    return {
      fps: this.loop.fps,
      state: this.sm.current,
      wave: this.wave,
      enemies: this.enemies.length,
      projectiles: this.projectiles.length,
      particles: this.particles.count,
      scraps: this.scraps.length,
      playerX: this.player ? this.player.x : 0,
      playerY: this.player ? this.player.y : 0,
      playerHp: this.player ? this.player.hp : 0,
      coreHp: this.core ? this.core.hp : 0,
    };
  };

  // ============================================================
  //  BOOT
  // ============================================================
  window.addEventListener('DOMContentLoaded', function () {
    window.BA.game = new Game();
  });
})();
