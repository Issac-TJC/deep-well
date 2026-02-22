class Game {
    constructor() {
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.ui = new UIManager();
        this.system = new SystemManager(this.ui);
        this.renderer = new GameRenderer(document.getElementById('gameCanvas'), this.ui);
        this.scripts = new ScriptManager();
        this.map = new Map();
        // this.player = new Player(55, 150);
        this.player = new Player(-1200, 500);
        this.particles = [];
        this.isDead = false;
        this.deathTimer = 0;
        this.recoveryTimer = 0;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.loadRoom(0, 0);
    }

    loadRoom(rx, ry) {
        if (this.map.load(rx, ry)) {
            this.scripts.onRoomEnter(this, rx, ry);
            return true;
        }
        return false;
    }

    spawnParticles(x, y, count, type) {
        for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, type));
    }

    triggerDeath() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathTimer = 0;
        this.recoveryTimer = 0;
        this.spawnParticles(this.player.x, this.player.y, 20, 'spark');
    }

    respawn() {
        this.isDead = false;
        this.recoveryTimer = 1000;
        this.player.x = this.player.respawnX;
        this.player.y = this.player.respawnY;
        this.player.vx = 0; this.player.vy = 0;
        this.map.temporaryDestroyedSpikes.clear();
        this.spawnParticles(this.player.x, this.player.y, 10, 'dust');
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        const TARGET_FPS = 60;
        const timeScale = Math.min(deltaTime / (1000 / TARGET_FPS), 4.0);
        this.accumulatedTime += deltaTime;

        this.renderer.handleMapInput(this);

        if (this.isDead) {
            this.deathTimer += deltaTime;
            if (this.deathTimer > 1000) { this.respawn(); }
        } else {
            if (this.recoveryTimer > 0) {
                this.recoveryTimer -= deltaTime;
                if (this.recoveryTimer < 0) this.recoveryTimer = 0;
            }

            this.player.update(this, timeScale);
            this.map.updateInteractions(this, timeScale);
            this.map.updateEntities(this, timeScale);
            this.map.updateVisibility(this.player);
            this.scripts.update(this, timeScale);

            if (Math.random() < (0.1 * timeScale)) this.spawnParticles(rand(0, GAME_WIDTH), rand(0, GAME_HEIGHT), 1, 'dust');
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(timeScale);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        this.renderer.draw(this, this.accumulatedTime, timeScale);
        requestAnimationFrame((t) => game.loop(t));
    }
}

// Start Game
const game = new Game();
requestAnimationFrame((t) => game.loop(t));
