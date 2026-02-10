# Bob's Arena

A chaotic space arena shooter where you pilot weird alien Bobs and defend Bobspace from wave-based invaders.

## How to Run

Open `index.html` in any modern browser. No build step or server needed.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move ship |
| Mouse | Aim |
| Left Click / Space | Shoot |
| Shift | Boost (limited fuel, recharges) |
| E | Bob Ability (unique per character) |
| Esc | Pause |
| R | Restart (on result screen) |
| F3 | Debug overlay |

## Characters

- **Pilot Bob** -- Balanced starter. Ability: Barrel Roll (invincibility + speed burst)
- **Wizard Bob** -- Glass cannon. Ability: Meteor Spell (big AOE at cursor)
- **Mechanic Bob** -- Tank/support. Ability: Repair Drone (heals you + Core for 8s)
- **Ninja Bob** -- Unlockable assassin. Ability: Shadow Dash (teleport + AOE damage)
- **Sniper Bob** -- Unlockable marksman. Ability: Focus Beam (channeled high-DPS beam)

## Objective

Survive 5 waves of Not-Bob invaders while keeping the Arena Core alive. Pick upgrades between waves. Beat Wave 5 to unlock new Bobs.

## Project Structure

```
sala/bobs_arena/
  index.html
  styles.css
  src/
    main.js              -- Boot + game orchestrator
    config.js            -- All constants, Bob defs, wave data, upgrades
    engine/
      gameLoop.js        -- RAF loop with dt clamp
      stateMachine.js    -- Game state FSM
      input.js           -- Input manager (keyboard + mouse)
      rng.js             -- Random + math helpers
    systems/
      collision.js       -- Collision detection
      spawner.js         -- Wave-based enemy spawning
      particles.js       -- Particle system
    entities/
      player.js          -- Player ship (all Bob variants)
      core.js            -- Arena Core
      enemy.js           -- Drone, Kamikaze, Sniper, Enforcer
      projectile.js      -- Bullets / bolts
      pickup.js          -- Scrap pickups
    ui/
      hud.js             -- In-run HUD
      menu.js            -- Title screen
      bobSelect.js       -- Character selection
      upgradeCards.js     -- Between-wave upgrade picks
      resultScreen.js    -- Victory / defeat
      messageBox.js      -- Story dialogue overlay
    audio/
      audio.js           -- Synth SFX + volume controls
    debug/
      overlay.js         -- F3 debug overlay
```
