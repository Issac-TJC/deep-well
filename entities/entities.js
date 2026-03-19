class Particle {
    constructor(x, y, type = 'dust') {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.life = 1.0;
        this.type = type;

        if (type === 'splash') {
            this.vy = -rand(0.5, 2); this.vx = rand(-1, 1); this.life = rand(0.5, 1);
        } else if (type === 'spark') {
            this.vx = (Math.random() - 0.5) * 2; this.vy = (Math.random() - 0.5) * 2;
        } else if (type === 'bubble') {
            this.vy = -rand(0.5, 2.0); this.vx = rand(-0.5, 0.5); this.life = rand(0.5, 1.0);
        } else if (type === 'rubble') {
            this.vx = (Math.random() - 0.5) * 3; this.vy = -rand(1, 3); this.life = rand(0.5, 0.8);
        }
    }

    update(timeScale) {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        if (this.type === 'dust') {
            this.life -= 0.005 * timeScale; this.y -= 0.05 * timeScale;
        } else if (this.type === 'splash') {
            this.vy += 0.1 * timeScale; this.life -= 0.02 * timeScale;
        } else if (this.type === 'spark') {
            this.life -= 0.03 * timeScale;
        } else if (this.type === 'bubble') {
            this.life -= 0.02 * timeScale; this.vx *= Math.pow(0.95, timeScale);
        } else if (this.type === 'rubble') {
            this.life -= 0.02 * timeScale; this.vy += 0.2 * timeScale;
        }
    }

    draw(ctx) {
        if (this.type === 'dust') ctx.fillStyle = `rgba(100, 150, 255, ${Math.max(0, this.life * 0.3)})`;
        else if (this.type === 'splash') ctx.fillStyle = `rgba(150, 200, 255, ${Math.max(0, this.life)})`;
        else if (this.type === 'spark') ctx.fillStyle = `rgba(255, 255, 150, ${Math.max(0, this.life)})`;
        else if (this.type === 'bubble') ctx.fillStyle = `rgba(200, 255, 255, ${Math.max(0, this.life * 0.6)})`;
        else if (this.type === 'rubble') ctx.fillStyle = `rgba(120, 120, 140, ${Math.max(0, this.life)})`;
        else ctx.fillStyle = `rgba(255, 255, 200, ${Math.max(0, this.life)})`;
        ctx.fillRect(this.x, this.y, 1, 1);
    }
}

class WallLight {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.baseRadius = 40;
        this.currentRadius = 40;
        this.targetRadius = 40;
    }
    update(game, timeScale) {
        const player = game.player;
        const dist = Math.hypot(player.x - (this.x + 8), player.y - (this.y + 8));
        this.targetRadius = dist < 20 ? 100 : 40;
        const k = 1 - Math.pow(0.9, timeScale);
        this.currentRadius += (this.targetRadius - this.currentRadius) * k;
    }
    draw(ctx) {
        ctx.fillStyle = COLORS.lightBase;
        ctx.fillRect(this.x + 4, this.y + 2, 8, 8);
        ctx.fillStyle = COLORS.lightGlow;
        ctx.fillRect(this.x + 6, this.y + 4, 4, 4);

        let lg = ctx.createRadialGradient(this.x + 8, this.y + 8, 2, this.x + 8, this.y + 8, this.currentRadius);
        lg.addColorStop(0, 'rgba(255, 220, 180, 0.4)');
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lg;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(this.x + 8, this.y + 8, this.currentRadius, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

class Chest {
    constructor(x, y, roomKey) {
        this.x = x; this.y = y;
        this.w = TILE_SIZE; this.h = TILE_SIZE;
        this.roomKey = roomKey;
        this.abilityId = ROOM_LOOT[roomKey] || null;
        this.opened = false;
        this.glowPhase = 0;
    }
    update(game, timeScale) {
        if (this.opened) return;
        this.glowPhase += 0.1 * timeScale;
        const dist = Math.hypot(game.player.x - (this.x + this.w / 2), game.player.y - (this.y + this.h / 2));
        if (this.abilityId && game.system.abilities[this.abilityId]) this.opened = true;
        if (dist < 15) {
            game.ui.showMessage("OPEN CHEST? [E]", "#ffff00", 100);
            if (game.input.interact) {
                game.input.keys['e'] = false;
                game.input.keys['E'] = false;
                this.open(game);
                game.ui.showMessage("");
            }
        }
    }
    open(game) {
        this.opened = true;
        if (this.abilityId) {
            events.emit('UNLOCK_ABILITY', this.abilityId);
            game.spawnParticles(this.x + 8, this.y + 8, 20, 'spark');
        }
    }
    draw(ctx) {
        ctx.fillStyle = this.opened ? COLORS.chestOpen : COLORS.chestClosed;
        if (this.opened) {
            ctx.fillRect(this.x + 2, this.y + 6, 12, 10);
            ctx.fillStyle = '#000'; ctx.fillRect(this.x + 3, this.y + 6, 10, 2);
        } else {
            ctx.fillRect(this.x + 2, this.y + 4, 12, 12);
            ctx.fillStyle = '#ffaa00'; ctx.fillRect(this.x + 7, this.y + 8, 2, 2);
            const alpha = 0.2 + Math.sin(this.glowPhase) * 0.1;
            ctx.strokeStyle = `rgba(255, 255, 170, ${alpha})`;
            ctx.strokeRect(this.x, this.y, 16, 16);
        }
    }
}

class Blade {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.h = rand(4, 8);
        this.angle = rand(-0.2, 0.2);
        this.baseAngle = this.angle;
        this.stiffness = rand(0.1, 0.2);
    }
    update(game, timeScale) {
        const player = game.player;
        const dist = Math.abs(this.x - player.x);
        const yDist = Math.abs(this.y - (player.y + player.r));
        const time = Date.now() * 0.002;
        const wind = Math.sin(time + this.x * 0.1) * 0.2;
        let force = 0;
        if (dist < (player.r + 8) && yDist < 10) force = (this.x - player.x) > 0 ? 1.5 : -1.5;
        const target = this.baseAngle + wind + force;
        const k = 1 - Math.pow(1 - this.stiffness, timeScale);
        this.angle += (target - this.angle) * k;
    }
    draw(ctx) {
        const tipX = this.x + Math.sin(this.angle) * this.h;
        const tipY = this.y - Math.cos(this.angle) * this.h;
        ctx.strokeStyle = COLORS.grass;
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(tipX, tipY); ctx.stroke();
        ctx.fillStyle = COLORS.grassTip; ctx.fillRect(tipX, tipY, 1, 1);
    }
}

class Flower {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.state = 0; this.bloomFactor = 0;
    }
    update(game, timeScale) {
        const dist = Math.hypot(game.player.x - this.x, game.player.y - this.y);
        if (dist < 30) this.bloomFactor += 0.05 * timeScale;
        else this.bloomFactor -= 0.02 * timeScale;
        this.bloomFactor = clamp(this.bloomFactor, 0, 1);
        if (this.bloomFactor > 0.8 && Math.random() < (0.05 * timeScale)) {
            game.spawnParticles(this.x, this.y - 10, 1, 'spark');
        }
    }
    draw(ctx) {
        ctx.fillStyle = COLORS.flowerStem;
        ctx.fillRect(this.x - 1, this.y, 2, 8);
        const size = 3 + this.bloomFactor * 2;
        ctx.fillStyle = this.bloomFactor > 0.5 ? COLORS.flowerBulbOpen : COLORS.flowerBulbClosed;
        ctx.beginPath(); ctx.arc(this.x, this.y - size, size, 0, Math.PI * 2); ctx.fill();
        if (this.bloomFactor > 0.1) {
            ctx.fillStyle = `rgba(170, 136, 255, ${this.bloomFactor})`;
            ctx.beginPath(); ctx.arc(this.x, this.y - size, 1, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'lighter';
            let fg = ctx.createRadialGradient(this.x, this.y - 5, 1, this.x, this.y - 5, 20 * this.bloomFactor);
            fg.addColorStop(0, `rgba(180, 100, 255, ${this.bloomFactor * 0.5})`);
            fg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.arc(this.x, this.y - 5, 30, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}

// --- Entity Factory (The Builder) ---
function spawnVegetation(map, x, y) {
    if (map.getTile(x, y - 1) === 0) {
        const count = Math.floor(rand(2, 5));
        for (let i = 0; i < count; i++) {
            map.entities.push(new Blade(x * TILE_SIZE + rand(2, 14), y * TILE_SIZE));
        }
        if (Math.random() < 0.3) {
            map.entities.push(new Flower(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE));
        }
    }
}

function spawnEntityFromConfig(map, x, y, roomKey, id) {
    if (!window.GameData || !window.GameData.entities) return;
    const config = window.GameData.entities[id];
    if (!config) return;

    if (config.type === "Chest") map.entities.push(new Chest(x * TILE_SIZE, y * TILE_SIZE, roomKey));
    else if (config.type === "WallLight") map.entities.push(new WallLight(x * TILE_SIZE, y * TILE_SIZE));
    else if (config.type === "Vegetation") spawnVegetation(map, x, y);
    else if (config.type === "WaterNode") {
        if (map.getTile(x, y - 1) === 0) map.waterNodes.push({ x: x, y: y });
    }
}
