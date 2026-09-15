/**
 * Sentry Crash Racer - High Speed Highway Crash Engine
 */

class CrashAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'square', duration = 0.1, gainVal = 0.1) {
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
    } catch (e) {}
  }
  playEngine(speedRatio) {
    this.playTone(80 + speedRatio * 160, 'sawtooth', 0.05, 0.02);
  }
  playNitro() {
    this.playTone(400, 'sawtooth', 0.15, 0.08);
    this.playTone(600, 'sine', 0.2, 0.08);
  }
  playScreech() {
    this.playTone(850, 'sawtooth', 0.12, 0.08);
  }
  playExplosion() {
    try {
      this.init();
      if (!this.ctx) return;
      const freqs = [180, 140, 110, 80, 50, 30];
      freqs.forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sawtooth', 0.35, 0.25 - i * 0.03), i * 40);
      });
    } catch (e) {}
  }
}

class CrashRacerGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.audio = new CrashAudio();

    // Highway Geometry: 4 Lanes
    this.roadWidth = 380;
    this.laneWidth = this.roadWidth / 4;
    this.roadX = (this.canvas.width - this.roadWidth) / 2;

    // Player State
    this.player = {
      lane: 1, // 0 to 3
      x: this.roadX + this.laneWidth * 1.5,
      targetX: this.roadX + this.laneWidth * 1.5,
      y: 460,
      width: 44,
      height: 75,
      speed: 120, // km/h
      minSpeed: 70,
      maxSpeed: 210,
      nitroSpeed: 270,
      isNitro: false,
      distance: 0,
      score: 0,
      crashed: false
    };

    // World animation
    this.roadOffset = 0;
    this.obstacles = [];
    this.particles = [];
    this.smokeParticles = [];
    this.screenShake = 0;
    this.lastObstacleSpawn = 0;
    this.lastBreadcrumbDist = 0;

    // Input state
    this.keys = { left: false, right: false, up: false, down: false, nitro: false };

    this.initControls();
    this.startLoop();
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      this.audio.init();
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.shiftLane(-1);
        this.keys.left = true;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.shiftLane(1);
        this.keys.right = true;
      }
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = true;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        this.keys.nitro = true;
        if (!this.player.crashed) {
          this.audio.playNitro();
          if (window.sentryManager) {
            window.sentryManager.addBreadcrumb('engine.nitro', `Nitro Engaged! Speed boosting towards 260 km/h`, { speed: this.player.speed });
          }
        }
      }

      // Respawn on Enter or Space when crashed
      if (this.player.crashed && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) {
        this.respawn();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = false;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) this.keys.nitro = false;
    });

    // Touch & Click Control Buttons
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('mousedown', (e) => { e.preventDefault(); this.audio.init(); onDown(); });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); if (onUp) onUp(); });
      el.addEventListener('touchstart', (e) => { e.preventDefault(); this.audio.init(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); if (onUp) onUp(); });
    };

    bindBtn('btn-steer-left', () => this.shiftLane(-1));
    bindBtn('btn-steer-right', () => this.shiftLane(1));
    bindBtn('btn-gas', () => { this.keys.up = true; }, () => { this.keys.up = false; });
    bindBtn('btn-brake', () => { this.keys.down = true; }, () => { this.keys.down = false; });
    bindBtn('btn-nitro', () => {
      this.keys.nitro = true;
      this.audio.playNitro();
    }, () => { this.keys.nitro = false; });

    // Respawn button in overlay
    const respawnBtn = document.getElementById('btn-respawn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => this.respawn());
    }

    const feedbackBtn = document.getElementById('btn-crash-feedback');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        if (window.sentryManager) window.sentryManager.showCrashFeedbackDialog();
      });
    }
  }

  shiftLane(dir) {
    if (this.player.crashed) return;
    const oldLane = this.player.lane;
    this.player.lane = Math.max(0, Math.min(3, this.player.lane + dir));
    if (oldLane !== this.player.lane) {
      this.audio.playScreech();
      this.player.targetX = this.roadX + (this.player.lane + 0.5) * this.laneWidth;
      if (window.sentryManager) {
        window.sentryManager.addBreadcrumb('driving.steer', `Player steered to Lane ${this.player.lane + 1}`, {
          speed: Math.round(this.player.speed),
          lane: this.player.lane + 1,
          distance: Math.round(this.player.distance)
        });
      }
    }
  }

  respawn() {
    this.player.crashed = false;
    this.player.speed = 110;
    this.player.lane = 1;
    this.player.targetX = this.roadX + (this.player.lane + 0.5) * this.laneWidth;
    this.player.x = this.player.targetX;
    this.obstacles = [];
    this.particles = [];
    this.screenShake = 0;

    // Hide crash modal
    const overlay = document.getElementById('crash-overlay');
    if (overlay) overlay.style.display = 'none';

    if (window.sentryManager) {
      window.sentryManager.addBreadcrumb('game.respawn', 'Player respawned at starting line');
      window.sentryManager.logToUI('success', 'Vehicle Repaired & Ready!', 'Steer away from obstacles or crash again to test Sentry.');
    }
  }

  spawnObstacle() {
    // 4 Distinct types of crash anomalies
    const obstacleTypes = [
      { type: 'truck', name: 'Null Freight Truck', error: 'TypeError', color: '#ff4757', width: 50, height: 110, icon: '🚛' },
      { type: 'barrier', name: 'Concrete Guardrail', error: 'ReferenceError', color: '#9b59b6', width: 44, height: 50, icon: '🚧' },
      { type: 'vortex', name: 'Oil Slick Vortex', error: 'RangeError', color: '#e67e22', width: 48, height: 48, icon: '🌀' },
      { type: 'rival', name: 'Rival Turbo Racer', error: 'FatalCrash', color: '#ffd32a', width: 42, height: 72, icon: '🏎️' },
    ];

    const chosen = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const lane = Math.floor(Math.random() * 4);
    const x = this.roadX + (lane + 0.5) * this.laneWidth;

    this.obstacles.push({
      ...chosen,
      lane,
      x,
      y: -120,
      speed: chosen.type === 'truck' ? 50 : chosen.type === 'rival' ? 80 : 0
    });
  }

  update() {
    if (this.player.crashed) {
      // Keep updating particles during crash
      this.updateParticles();
      if (this.screenShake > 0) this.screenShake *= 0.9;
      return;
    }

    // Accelerate / Brake logic
    if (this.keys.nitro) {
      this.player.speed = Math.min(this.player.nitroSpeed, this.player.speed + 2.5);
      this.player.isNitro = true;
      // Flame particles behind player car
      this.addExhaustFlame();
    } else if (this.keys.up) {
      this.player.speed = Math.min(this.player.maxSpeed, this.player.speed + 1.2);
      this.player.isNitro = false;
    } else if (this.keys.down) {
      this.player.speed = Math.max(this.player.minSpeed, this.player.speed - 2.5);
      this.player.isNitro = false;
    } else {
      // Return to cruise speed
      if (this.player.speed > 130) this.player.speed -= 0.6;
      else if (this.player.speed < 110) this.player.speed += 0.5;
      this.player.isNitro = false;
    }

    // Distance & Score
    const deltaDist = (this.player.speed / 3600) * 1000 * 0.5;
    this.player.distance += deltaDist;
    this.player.score += Math.round(this.player.speed * 0.05);

    // Periodic driving telemetry breadcrumb
    if (this.player.distance - this.lastBreadcrumbDist > 150) {
      this.lastBreadcrumbDist = this.player.distance;
      if (window.sentryManager) {
        window.sentryManager.addBreadcrumb('telemetry', `Speedometer: ${Math.round(this.player.speed)} km/h | Dist: ${Math.round(this.player.distance)}m | Lane: ${this.player.lane + 1}`, {
          speed: Math.round(this.player.speed),
          distance: Math.round(this.player.distance),
          lane: this.player.lane + 1,
          score: this.player.score
        });
      }
    }

    // Road scroll speed
    this.roadOffset = (this.roadOffset + this.player.speed * 0.12) % 60;

    // Smooth lane transition
    this.player.x += (this.player.targetX - this.player.x) * 0.25;

    // Spawn obstacles
    this.lastObstacleSpawn += this.player.speed * 0.016;
    if (this.lastObstacleSpawn > 65) {
      this.spawnObstacle();
      this.lastObstacleSpawn = 0;
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      // Move relative to player speed
      obs.y += (this.player.speed - obs.speed) * 0.08;

      // Check Collision with Player Car
      const hitBoxX = Math.abs(this.player.x - obs.x) < (this.player.width + obs.width) * 0.42;
      const hitBoxY = Math.abs(this.player.y - obs.y) < (this.player.height + obs.height) * 0.42;

      if (hitBoxX && hitBoxY) {
        this.triggerCrash(obs);
        break;
      }

      // Remove passed obstacles
      if (obs.y > this.canvas.height + 150) {
        this.obstacles.splice(i, 1);
        this.player.score += 25; // Dodge bonus
      }
    }

    this.updateParticles();
    this.updateHUD();
  }

  addExhaustFlame() {
    this.particles.push({
      x: this.player.x + (Math.random() * 16 - 8),
      y: this.player.y + this.player.height / 2 + 5,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 5 + 4,
      life: 1.0,
      decay: 0.1,
      color: Math.random() > 0.4 ? '#00d2d3' : '#54a0ff',
      size: Math.random() * 5 + 3
    });
  }

  triggerCrash(obstacle) {
    this.player.crashed = true;
    this.screenShake = 22;
    this.audio.playExplosion();

    // Massive Explosion Particles
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 2;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        color: ['#ff4757', '#ffa502', '#ff6348', '#2ed573', '#ffffff'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 3
      });
    }

    // DISPATCH ACTUAL SENTRY ERROR BASED ON OBSTACLE
    let errorPromise;
    const impactSpeed = this.player.speed;
    const impactLane = this.player.lane + 1;

    if (window.sentryManager) {
      if (impactSpeed > 230) {
        errorPromise = window.sentryManager.reportNitroCrash(impactSpeed, impactLane);
      } else if (obstacle.error === 'TypeError') {
        errorPromise = window.sentryManager.reportTruckCrash(impactSpeed, impactLane);
      } else if (obstacle.error === 'ReferenceError') {
        errorPromise = window.sentryManager.reportBarrierCrash(impactSpeed, impactLane);
      } else if (obstacle.error === 'RangeError') {
        errorPromise = window.sentryManager.reportVortexCrash(impactSpeed, impactLane);
      } else {
        errorPromise = window.sentryManager.reportTruckCrash(impactSpeed, impactLane);
      }
    }

    // Show on-screen Crash Overlay
    const overlay = document.getElementById('crash-overlay');
    const crashTitle = document.getElementById('crash-title');
    const crashSpeed = document.getElementById('crash-speed');
    const crashError = document.getElementById('crash-error-name');
    const crashSentryNotice = document.getElementById('crash-sentry-status');

    if (overlay) {
      overlay.style.display = 'flex';
      if (crashTitle) crashTitle.textContent = `💥 CRASH INTO ${obstacle.name.toUpperCase()}!`;
      if (crashSpeed) crashSpeed.textContent = `${Math.round(impactSpeed)} km/h`;
      if (crashError) crashError.textContent = obstacle.error || 'FatalCrashException';
      if (crashSentryNotice) crashSentryNotice.textContent = '⚡ Error & Telemetry Dispatched to Sentry Dashboard!';
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateHUD() {
    const speedEl = document.getElementById('hud-speed');
    const distEl = document.getElementById('hud-dist');
    const scoreEl = document.getElementById('hud-score');
    const gaugeFill = document.getElementById('speed-gauge-fill');

    if (speedEl) speedEl.textContent = Math.round(this.player.speed);
    if (distEl) distEl.textContent = `${Math.round(this.player.distance)}m`;
    if (scoreEl) scoreEl.textContent = this.player.score;

    if (gaugeFill) {
      const ratio = Math.min(1, this.player.speed / 260);
      gaugeFill.style.width = `${ratio * 100}%`;
      gaugeFill.style.background = this.player.speed > 220 ? '#00d2d3' : this.player.speed > 160 ? '#ff4757' : '#ffd32a';
    }
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    ctx.save();
    // Screen shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Grass / Highway Outskirts
    ctx.fillStyle = '#0a1912';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Guardrails
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(this.roadX - 18, 0, 18, this.canvas.height);
    ctx.fillRect(this.roadX + this.roadWidth, 0, 18, this.canvas.height);

    // Asphalt Road
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(this.roadX, 0, this.roadWidth, this.canvas.height);

    // Solid Edge Lines (Yellow)
    ctx.fillStyle = '#eccc68';
    ctx.fillRect(this.roadX + 4, 0, 4, this.canvas.height);
    ctx.fillRect(this.roadX + this.roadWidth - 8, 0, 4, this.canvas.height);

    // Dashed White Lane Dividers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -this.roadOffset;

    for (let l = 1; l <= 3; l++) {
      const lx = this.roadX + l * this.laneWidth;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash

    // Draw Obstacles
    this.obstacles.forEach(obs => {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-obs.width / 2 + 5, -obs.height / 2 + 5, obs.width, obs.height);

      // Body
      ctx.fillStyle = obs.color;
      ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

      // Outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

      // Icon & Name
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obs.icon, 0, -8);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(obs.error, 0, obs.height / 2 - 12);

      ctx.restore();
    });

    // Draw Player Car (If not crashed or in debris state)
    if (!this.player.crashed) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Car Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-this.player.width / 2 + 6, -this.player.height / 2 + 8, this.player.width, this.player.height);

      // Wheels
      ctx.fillStyle = '#111';
      ctx.fillRect(-this.player.width / 2 - 4, -this.player.height / 2 + 10, 6, 16);
      ctx.fillRect(this.player.width / 2 - 2, -this.player.height / 2 + 10, 6, 16);
      ctx.fillRect(-this.player.width / 2 - 4, this.player.height / 2 - 24, 6, 16);
      ctx.fillRect(this.player.width / 2 - 2, this.player.height / 2 - 24, 6, 16);

      // Car Chassis
      const carGrad = ctx.createLinearGradient(0, -this.player.height / 2, 0, this.player.height / 2);
      carGrad.addColorStop(0, '#5352ed');
      carGrad.addColorStop(0.5, '#3742fa');
      carGrad.addColorStop(1, '#2f3542');
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.roundRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height, 8);
      ctx.fill();

      // Racing Stripes
      ctx.fillStyle = this.player.isNitro ? '#00d2d3' : '#ffffff';
      ctx.fillRect(-4, -this.player.height / 2, 8, this.player.height);

      // Windshield
      ctx.fillStyle = '#70a1ff';
      ctx.fillRect(-this.player.width / 2 + 6, -this.player.height / 2 + 18, this.player.width - 12, 16);

      // Headlights (Beams)
      ctx.fillStyle = 'rgba(255, 242, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(-16, -this.player.height / 2);
      ctx.lineTo(-45, -this.player.height / 2 - 120);
      ctx.lineTo(45, -this.player.height / 2 - 120);
      ctx.lineTo(16, -this.player.height / 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.sentryManager) {
    window.sentryManager.init();
  }
  window.crashRacer = new CrashRacerGame();
});
