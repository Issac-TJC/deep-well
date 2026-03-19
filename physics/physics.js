class CountBounce {
    constructor() { this.reset(); }
    reset() {
        this.start = { rx: 0, ry: 0, x: 0, y: 0 };
        this.current = { rx: 0, ry: 0, x: 0, y: 0 };
        this.count = 0;
    }
    update(hitRx, hitRy, hitX, hitY, game) {
        if (!this.start ||
            this.start.rx !== hitRx || this.start.ry !== hitRy ||
            this.start.x !== hitX || this.start.y !== hitY) {
            this.start = { rx: hitRx, ry: hitRy, x: hitX, y: hitY };
            this.current = { rx: hitRx, ry: hitRy, x: hitX, y: hitY };
            this.count = 0;
        }

        this.current.y -= 1;
        if (this.current.y < 0) {
            this.current.ry--;
            if (!WORLD_LAYOUTS[`${this.current.rx},${this.current.ry}`]) {
                this.reset(); return;
            }
            this.current.y = 17;
        }

        const tileRaw = WORLD_LAYOUTS[`${this.current.rx},${this.current.ry}`][this.current.y][this.current.x];
        const tileVal = getTileValue(tileRaw);
        const def = getTileDef(tileVal);

        if (def.col === COLLISION_TYPE.SOLID && !def.noBounce) {
            this.count++;
            game.spawnParticles(game.player.x, game.player.y, 3, 'dust');
        } else if (def.col === COLLISION_TYPE.HAZARD) {
            const permanent = game.system.abilities.minerHat;
            if (!game.map.isSpikeDestroyedExplicit(this.current.rx, this.current.ry, this.current.x, this.current.y)) {
                game.map.destroySpikeExplicit(this.current.rx, this.current.ry, this.current.x, this.current.y, permanent);
                game.spawnParticles(game.player.x, game.player.y, 30, 'spark');
                game.audio.playSound('destroy_spike');
            }
            this.reset();
        } else {
            this.reset();
        }
    }
}

class Physics {
    static applyPlatformerPhysics(entity, map, input, timeScale, game) {
        const gravity = 0.25;
        const centerTileDef = getTileDef(map.getTile(Math.floor(entity.x / TILE_SIZE), Math.floor((entity.y + entity.r * 0.7) / TILE_SIZE)));
        const inWater = (centerTileDef.col === COLLISION_TYPE.LIQUID);

        const ladderDef = getTileDef(map.getTile(Math.floor(entity.x / TILE_SIZE), Math.floor(entity.y / TILE_SIZE)));
        const touchingLadder = (ladderDef.col === COLLISION_TYPE.CLIMBABLE);

        let moveSpeed = 0.8;
        let frictionX = 0.85;

        if (inWater) {
            moveSpeed = 0.4; frictionX = 0.9;
        }

        if (input.left) entity.vx -= moveSpeed * timeScale;
        if (input.right) entity.vx += moveSpeed * timeScale;

        // Ladder Logic
        if (touchingLadder && !inWater) {
            entity.onLadder = true; entity.grounded = true; entity.vy = 0; entity.floatTimer = 0;
            let climbed = false;
            if (input.up) { entity.vy = -1.5; climbed = true; }
            if (input.down) { entity.vy = 1.5; climbed = true; }
            if (climbed && typeof entity.onClimb === 'function') entity.onClimb(game, timeScale);
            if (input.jump) {
                if (!entity.jumpHeld) {
                    if (typeof entity.onJump === 'function') entity.onJump(game, -4.5);
                    entity.onLadder = false;
                }
            } else entity.jumpHeld = false;
        }
        // Water Logic
        else if (inWater) {
            entity.onLadder = false;
            entity.vy += gravity * timeScale; entity.vy -= 0.55 * timeScale;
            if (input.down) entity.vy += 0.6 * timeScale;
            if (input.jump) {
                entity.floatTimer += 1.0 * timeScale;
                const bonusAccel = Math.min(entity.floatTimer * 0.02, 1.5);
                entity.vy -= (0.10 + bonusAccel) * timeScale;
                if (Math.floor(entity.floatTimer) % 5 === 0 && typeof entity.onBubble === 'function') {
                    entity.onBubble(game);
                }
                entity.stretch = 1.1 + Math.min(entity.floatTimer * 0.01, 0.4);
                entity.squash = 1.0 - Math.min(entity.floatTimer * 0.005, 0.2);
            } else { entity.floatTimer = 0; }
            if (entity.vy > 0) entity.vy *= Math.pow(0.9, timeScale);
            else entity.vy *= Math.pow(0.98, timeScale);
        }
        // Air Logic
        else {
            entity.onLadder = false; entity.floatTimer = 0;
            if (input.jump) {
                if (!entity.jumpHeld && entity.grounded) {
                    if (typeof entity.onJump === 'function') entity.onJump(game, -4.5);
                }
            } else entity.jumpHeld = false;
            entity.vy += gravity * timeScale;
        }

        entity.vx *= Math.pow(frictionX, timeScale);

        const maxSpeedX = inWater ? 1.0 : 1.6;
        const maxSpeedY = inWater ? 6 : 8;
        if (Math.abs(entity.vx) > maxSpeedX) entity.vx = maxSpeedX * Math.sign(entity.vx);
        if (entity.vy > maxSpeedY) entity.vy = maxSpeedY;

        entity.x += entity.vx * timeScale;
        Physics.resolveCollision(entity, map, 'x', timeScale, game);

        entity.y += entity.vy * timeScale;
        entity.grounded = false;
        Physics.resolveCollision(entity, map, 'y', timeScale, game);

        // Notify entity of water transition if applicable
        if (typeof entity.onWaterTransition === 'function') {
            entity.onWaterTransition(game, inWater);
        }

        return { inWater, touchingLadder };
    }

    static checkHazards(entity, map, game) {
        let startX = Math.floor((entity.x - entity.r) / TILE_SIZE);
        let endX = Math.floor((entity.x + entity.r) / TILE_SIZE);
        let startY = Math.floor((entity.y - entity.r) / TILE_SIZE);
        let endY = Math.floor((entity.y + entity.r) / TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                let tile = map.getTile(x, y);
                let def = getTileDef(tile);
                if (def.col === COLLISION_TYPE.HAZARD && !map.isSpikeDestroyed(x, y)) {
                    game.triggerDeath();
                    return;
                }
            }
        }
    }

    static resolveCollision(entity, map, axis, timeScale, game) {
        let startX = Math.floor((entity.x - entity.r) / TILE_SIZE);
        let endX = Math.floor((entity.x + entity.r) / TILE_SIZE);
        let startY = Math.floor((entity.y - entity.r) / TILE_SIZE);
        let endY = Math.floor((entity.y + entity.r) / TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                let tile = map.getTile(x, y);
                let def = getTileDef(tile);

                // Type A: One-Way Platforms
                if (def.col === COLLISION_TYPE.ONE_WAY) {
                    if (axis === 'y' && entity.vy >= 0) {
                        const tileTop = y * TILE_SIZE;
                        const previousFeetY = (entity.y - entity.vy * timeScale) + entity.r;
                        const currentFeetY = entity.y + entity.r;
                        if (previousFeetY <= tileTop + 0.1 && currentFeetY >= tileTop - 0.1) {
                            entity.y = tileTop - entity.r - 0.01;
                            entity.grounded = true;
                            entity.vy = 0;
                            if (entity.vy > 2) { entity.squash = 1.4; entity.stretch = 0.6; }
                        }
                    }
                    continue;
                }

                // Type B: Solid Walls
                if (def.col === COLLISION_TYPE.SOLID) {
                    if (axis === 'x') {
                        if (entity.vx > 0) entity.x = x * TILE_SIZE - entity.r - 0.01;
                        if (entity.vx < 0) entity.x = (x + 1) * TILE_SIZE + entity.r + 0.01;
                        entity.vx = 0;
                    } else {
                        if (entity.vy > 0) { // Landing
                            if (entity.vy > 1.5) game.audio.playSound('land', Math.min(entity.vy / 8, 1));
                            entity.y = y * TILE_SIZE - entity.r - 0.01;
                            entity.grounded = true;
                            if (entity.vy > 2) { entity.squash = 1.4; entity.stretch = 0.6; }
                        }
                        if (entity.vy < 0) { // Hitting Head
                            entity.y = (y + 1) * TILE_SIZE + entity.r + 0.01;
                            if (!def.noBounce) {
                                map.triggerTileBounce(x, y);
                            }
                            const hasMinerHat = game.system.abilities.minerHat;
                            map.processSpikeHit(x, y, hasMinerHat, game);
                        }
                        entity.vy = 0;
                    }
                }
            }
        }
    }
}
