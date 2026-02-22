class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.respawnX = x; this.respawnY = y;
        this.r = 5;
        this.vx = 0; this.vy = 0;
        this.grounded = false;
        this.inWater = false;
        this.wasInWater = false;
        this.onLadder = false;
        this.squash = 1; this.stretch = 1;
        this.jumpHeld = false;
        this.floatTimer = 0;
    }

    setRespawn() { this.respawnX = this.x; this.respawnY = this.y; }

    update(game, timeScale) {
        if (game.renderer.showMap || game.isDead) return;

        const map = game.map;
        const input = game.input;
        map.checkFalseWalls(this);

        Physics.checkHazards(this, map, game);
        if (game.isDead) return;

        // --- Apply Physics (Decoupled) ---
        const envState = Physics.applyPlatformerPhysics(this, map, input, timeScale, game);
        this.inWater = envState.inWater;

        // --- Visual / Polish logic ---
        const squashK = 1 - Math.pow(0.9, timeScale);
        this.squash += (1 - this.squash) * squashK;
        this.stretch += (1 - this.stretch) * squashK;

        this.checkRoomTransitions(game);
    }

    // Hook: called from Physics when jumping
    onJump(game, force) {
        this.vy = force;
        this.grounded = false;
        this.jumpHeld = true;
        this.stretch = 1.3;
        this.squash = 0.7;
        game.spawnParticles(this.x, this.y + this.r, 4, 'dust');
        game.audio.playSound('jump');
    }

    // Hook: called from Physics when climbing
    onClimb(game, timeScale) {
        if (Math.random() < 0.05 * timeScale) {
            game.audio.playSound('climb', 0.5);
        }
    }

    // Hook: called from Physics when swimming up
    onBubble(game) {
        game.spawnParticles(this.x, this.y + this.r, 1, 'bubble');
    }

    // Hook: called from Physics AFTER resolving collision positions
    onWaterTransition(game, currentInWater) {
        if (!this.wasInWater && currentInWater) {
            if (this.vy > 1.5) {
                game.spawnParticles(this.x, this.y, 8, 'splash');
                this.vy *= 0.5;
                game.audio.playSound('splash');
            }
        }
        if (this.wasInWater && !currentInWater) {
            if (this.vy < -2.5) {
                game.spawnParticles(this.x, this.y + this.r, 12, 'splash');
                game.spawnParticles(this.x, this.y + this.r, 5, 'bubble');
                game.audio.playSound('splash', 0.8);
            } else if (this.vy < 0 && this.vy > -1.0) {
                this.vy *= 0.5;
            }
        }
        this.wasInWater = currentInWater;
    }

    attemptSwitch(game, xOff, yOff, newX, newY) {
        if (game.loadRoom(game.map.roomX + xOff, game.map.roomY + yOff)) {
            if (newX !== null) this.x = newX;
            if (newY !== null) this.y = newY;
            this.setRespawn();
            game.spawnParticles(this.x, this.y, 10, 'dust');
            return true;
        }
        return false;
    }

    checkRoomTransitions(game) {
        if (this.x > GAME_WIDTH) {
            if (this.attemptSwitch(game, 1, 0, this.x - GAME_WIDTH, null)) { }
            else { this.x = GAME_WIDTH; this.vx = 0; }
        } else if (this.x < 0) {
            if (this.attemptSwitch(game, -1, 0, this.x + GAME_WIDTH, null)) { }
            else { this.x = 0; this.vx = 0; }
        }
        if (this.y > GAME_HEIGHT) {
            if (this.attemptSwitch(game, 0, 1, null, this.y - GAME_HEIGHT)) { }
            else { this.y += GAME_HEIGHT; this.vy = 0; this.grounded = true; }
        } else if (this.y < 0) {
            if (this.attemptSwitch(game, 0, -1, null, GAME_HEIGHT)) { }
            else { this.y = 0; this.vy = 0; }
        }
    }

    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.squash, this.stretch);
        ctx.fillStyle = COLORS.playerCore;
        ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill();
        if (typeof game !== 'undefined' && game.system.abilities.minerHat) {
            ctx.fillStyle = COLORS.hat; ctx.fillRect(-3, -7, 6, 3);
            ctx.fillStyle = COLORS.hatLight; ctx.fillRect(0, -7, 2, 2);
        }
        ctx.restore();
    }
}
