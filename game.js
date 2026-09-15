/**
 * Sentry Bug Quest - Dungeon RPG & Error Simulation Engine
 */

class RetroAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playBeep(freq = 440, type = 'square', duration = 0.1, gainVal = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }
  playErrorGlitch() {
    try {
      this.init();
      if (!this.ctx) return;
      const freqs = [120, 95, 70, 45];
      freqs.forEach((f, i) => {
        setTimeout(() => this.playBeep(f, 'sawtooth', 0.15, 0.2), i * 60);
      });
    } catch (e) {}
  }
  playLoot() {
    try {
      this.init();
      if (!this.ctx) return;
      const freqs = [440, 554, 659, 880];
      freqs.forEach((f, i) => {
        setTimeout(() => this.playBeep(f, 'triangle', 0.08, 0.15), i * 50);
      });
    } catch (e) {}
  }
  playAttack() {
    this.playBeep(220, 'sawtooth', 0.1, 0.18);
  }
}

class BugQuestGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.audio = new RetroAudio();

    this.tileSize = 40;
    this.gridWidth = 16;
    this.gridHeight = 12;

    this.player = {
      x: 2,
      y: 2,
      hp: 100,
      maxHp: 100,
      mana: 80,
      maxMana: 100,
      gold: 50,
      level: 3,
      inventory: ['Wooden Sword', 'Health Potion (x2)', 'Bug Net'],
      stepsTaken: 0,
    };

    // Dungeon interactable anomalies
    this.entities = [
      { id: 'chest_null', type: 'chest', x: 5, y: 2, name: 'Cursed Chest of Null', errorType: 'TypeError', icon: '📦', color: '#ff4757', desc: 'Triggers TypeError (reading property of null)' },
      { id: 'altar_void', type: 'altar', x: 12, y: 2, name: 'Forbidden Void Altar', errorType: 'ReferenceError', icon: '🔮', color: '#9b59b6', desc: 'Triggers ReferenceError (undefined function)' },
      { id: 'shield_loop', type: 'item', x: 3, y: 8, name: 'Looping Mirror Shield', errorType: 'RangeError', icon: '🛡️', color: '#e67e22', desc: 'Triggers RangeError (Stack Overflow)' },
      { id: 'crystal_save', type: 'crystal', x: 8, y: 5, name: 'Corrupt Cloud Save Crystal', errorType: 'PromiseRejection', icon: '💾', color: '#3498db', desc: 'Triggers Unhandled Promise Rejection' },
      { id: 'merchant_404', type: 'merchant', x: 13, y: 8, name: 'Dark Web 404 Goblin', errorType: 'NetworkError', icon: '🧌', color: '#1abc9c', desc: 'Triggers Network 404 Fetch Failure' },
      { id: 'boss_lag', type: 'boss', x: 8, y: 9, name: 'Chrono Freeze Overlord', errorType: 'SlowTransaction', icon: '👑', color: '#f1c40f', desc: 'Triggers 1.2s Main Thread Lag / Perf Trace' },
      { id: 'pot_heal', type: 'loot', x: 6, y: 8, name: 'Healing Flask', errorType: 'none', icon: '🧪', color: '#2ecc71', desc: 'Recovers 25 HP & records Breadcrumb' },
      { id: 'pot_gold', type: 'loot', x: 10, y: 2, name: 'Bag of Ancient Coins', errorType: 'none', icon: '💰', color: '#ffd32a', desc: 'Awards 40 Gold & records Breadcrumb' },
    ];

    this.particles = [];
    this.currentRoom = 'Chamber of Anomalies (Floor 1)';
    this.initControls();
    this.updateHUD();
    this.startLoop();
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      let dx = 0;
      let dy = 0;
      if (['ArrowUp', 'KeyW'].includes(e.code)) dy = -1;
      if (['ArrowDown', 'KeyS'].includes(e.code)) dy = 1;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) dx = -1;
      if (['ArrowRight', 'KeyD'].includes(e.code)) dx = 1;
      if (['Space', 'KeyE', 'Enter'].includes(e.code)) {
        this.interactWithAdjacent();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        this.movePlayer(dx, dy);
      }
    });

    // Touch / UI directional button support
    const btnMap = {
      'btn-up': [0, -1],
      'btn-down': [0, 1],
      'btn-left': [-1, 0],
      'btn-right': [1, 0],
    };
    Object.entries(btnMap).forEach(([id, [dx, dy]]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => this.movePlayer(dx, dy));
      }
    });

    const actionBtn = document.getElementById('btn-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => this.interactWithAdjacent());
    }
  }

  movePlayer(dx, dy) {
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    // Check bounds
    if (newX < 1 || newX >= this.gridWidth - 1 || newY < 1 || newY >= this.gridHeight - 1) {
      this.audio.playBeep(180, 'sine', 0.05);
      return;
    }

    // Check entity collision
    const targetEntity = this.entities.find(e => e.x === newX && e.y === newY);
    if (targetEntity) {
      this.triggerEntityInteraction(targetEntity);
      return;
    }

    this.player.x = newX;
    this.player.y = newY;
    this.player.stepsTaken++;

    // Add Sentry breadcrumb every 5 moves to simulate real session navigation
    if (this.player.stepsTaken % 5 === 0) {
      if (window.sentryManager) {
        window.sentryManager.addBreadcrumb('navigation', `Player walked to tile (${this.player.x}, ${this.player.y})`, {
          steps: this.player.stepsTaken,
          hp: this.player.hp,
          mana: this.player.mana,
          room: this.currentRoom,
        });
      }
    }

    this.audio.playBeep(330 + (this.player.stepsTaken % 4) * 30, 'triangle', 0.04, 0.05);
    this.updateHUD();
  }

  interactWithAdjacent() {
    const adjacent = this.entities.find(e => {
      const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
      return dist <= 1;
    });

    if (adjacent) {
      this.triggerEntityInteraction(adjacent);
    } else {
      if (window.sentryManager) {
        window.sentryManager.addBreadcrumb('player.action', 'Player swung sword at thin air');
      }
      this.audio.playAttack();
    }
  }

  triggerEntityInteraction(entity) {
    this.audio.init();

    // Sentry Context update before interaction
    if (window.sentryManager) {
      window.sentryManager.setContext('gameState', {
        playerStats: { ...this.player },
        activeAnomaly: entity.name,
        targetCoord: { x: entity.x, y: entity.y }
      });
      window.sentryManager.addBreadcrumb('gameplay.interaction', `Player interacted with "${entity.name}"`, {
        entityId: entity.id,
        anomalyType: entity.errorType,
        pos: { x: entity.x, y: entity.y }
      });
    }

    switch (entity.errorType) {
      case 'TypeError':
        this.audio.playErrorGlitch();
        this.addSparks(entity.x, entity.y, '#ff4757');
        window.sentryManager.triggerTypeError();
        break;

      case 'ReferenceError':
        this.audio.playErrorGlitch();
        this.addSparks(entity.x, entity.y, '#9b59b6');
        window.sentryManager.triggerReferenceError();
        break;

      case 'RangeError':
        this.audio.playErrorGlitch();
        this.addSparks(entity.x, entity.y, '#e67e22');
        window.sentryManager.triggerRangeError();
        break;

      case 'PromiseRejection':
        this.audio.playErrorGlitch();
        this.addSparks(entity.x, entity.y, '#3498db');
        window.sentryManager.triggerPromiseRejection();
        break;

      case 'NetworkError':
        this.audio.playErrorGlitch();
        this.addSparks(entity.x, entity.y, '#1abc9c');
        window.sentryManager.triggerNetworkError().catch(() => {});
        break;

      case 'SlowTransaction':
        this.audio.playErrorGlitch();
        this.addSparks(entity.x, entity.y, '#f1c40f');
        window.sentryManager.triggerSlowTransaction();
        break;

      default:
        // Regular Loot / Healing
        if (entity.id === 'pot_heal') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
          this.audio.playLoot();
          this.addSparks(entity.x, entity.y, '#2ecc71');
          if (window.sentryManager) {
            window.sentryManager.addBreadcrumb('inventory.consume', 'Player drank Healing Flask (+25 HP)', { newHp: this.player.hp });
            window.sentryManager.logToUI('success', 'Restored 25 HP', 'Drank Healing Flask');
          }
        } else if (entity.id === 'pot_gold') {
          this.player.gold += 40;
          this.audio.playLoot();
          this.addSparks(entity.x, entity.y, '#ffd32a');
          if (window.sentryManager) {
            window.sentryManager.addBreadcrumb('inventory.gold', 'Player looted Bag of Ancient Coins (+40 Gold)', { totalGold: this.player.gold });
            window.sentryManager.logToUI('success', 'Found +40 Gold Coins!', `Total Gold: ${this.player.gold}`);
          }
        }
        break;
    }

    this.updateHUD();
  }

  addSparks(gridX, gridY, color) {
    const px = (gridX + 0.5) * this.tileSize;
    const py = (gridY + 0.5) * this.tileSize;
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        color: color || '#ff4757',
        size: Math.random() * 3 + 2,
      });
    }
  }

  updateHUD() {
    const hpBar = document.getElementById('hud-hp');
    const hpText = document.getElementById('hud-hp-text');
    const manaBar = document.getElementById('hud-mana');
    const manaText = document.getElementById('hud-mana-text');
    const goldText = document.getElementById('hud-gold');
    const levelText = document.getElementById('hud-level');
    const stepText = document.getElementById('hud-steps');

    if (hpBar) hpBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    if (hpText) hpText.textContent = `${this.player.hp}/${this.player.maxHp}`;
    if (manaBar) manaBar.style.width = `${(this.player.mana / this.player.maxMana) * 100}%`;
    if (manaText) manaText.textContent = `${this.player.mana}/${this.player.maxMana}`;
    if (goldText) goldText.textContent = this.player.gold;
    if (levelText) levelText.textContent = this.player.level;
    if (stepText) stepText.textContent = this.player.stepsTaken;
  }

  startLoop() {
    const render = () => {
      this.draw();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = '#0f141f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dungeon floor grid
    ctx.strokeStyle = '#1a2234';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        ctx.strokeRect(px, py, this.tileSize, this.tileSize);

        // Wall borders
        if (x === 0 || x === this.gridWidth - 1 || y === 0 || y === this.gridHeight - 1) {
          ctx.fillStyle = '#161c2b';
          ctx.fillRect(px, py, this.tileSize, this.tileSize);
          ctx.strokeStyle = '#27334d';
          ctx.strokeRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
        }
      }
    }

    // Draw Entities
    this.entities.forEach(ent => {
      const px = ent.x * this.tileSize;
      const py = ent.y * this.tileSize;

      // Glow halo
      ctx.save();
      ctx.shadowColor = ent.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = ent.color + '22';
      ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
      ctx.restore();

      // Border box
      ctx.strokeStyle = ent.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);

      // Icon
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ent.icon, px + this.tileSize / 2, py + this.tileSize / 2);
    });

    // Draw Player
    const playerPx = this.player.x * this.tileSize;
    const playerPy = this.player.y * this.tileSize;

    ctx.save();
    ctx.shadowColor = '#6c5ce7';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#6c5ce7';
    ctx.beginPath();
    ctx.arc(playerPx + this.tileSize / 2, playerPy + this.tileSize / 2, this.tileSize / 2 - 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Player Hero Emoji
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧙‍♂️', playerPx + this.tileSize / 2, playerPy + this.tileSize / 2);

    // Update & Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new BugQuestGame();
});
