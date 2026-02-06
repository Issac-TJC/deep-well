/**
 * ============================================================================
 * MODULE: RENDER STRATEGIES (strategies.js)
 * The visual implementation for each tile type.
 * ============================================================================
 */
const RenderRegistry = {
    strategies: {},
    register: function(id, fn) { this.strategies[id] = fn; },
    get: function(id) { return this.strategies[id]; }
};

// 1. Basic Block (Walls, Dirt, Secret Walls)
RenderRegistry.register(RENDER_STYLE.BLOCK_BASIC, (ctx, tx, ty, x, y, map, def) => {
    ctx.save();
    const bounceOff = map.bouncingTiles[`${x},${y}`] || 0;
    if (bounceOff !== 0) ctx.translate(0, bounceOff);
    if (def.isSecret && map.isRevealed(x, y)) ctx.globalAlpha = 0.4;

    ctx.fillStyle = COLORS.tileDark;
    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
    
    // Add texture details
    if ((x + y) % 2 === 0) {
        ctx.fillStyle = COLORS.tileLight;
        ctx.fillRect(tx + 2, ty + 2, 4, 4);
        ctx.fillRect(tx + 8, ty + 8, 2, 2);
        ctx.fillRect(tx + 12, ty + 4, 2, 2);
    }

    // Draw borders (Void edges)
    ctx.fillStyle = COLORS.tileHighlight;
    const edgeW = 2;
    const isRegionInside = (nx, ny) => {
        if (nx < 0 || nx >= map.cols || ny < 0 || ny >= map.rows) return false;
        if (!map.visible[ny][nx]) return false;
        const tileId = getTileValue(map.layout[ny][nx]);
        const ntDef = getTileDef(tileId);
        // Only draw edge if neighbor is VOID (air/water) and NOT secret (looks solid)
        return ntDef.isVoid && !ntDef.isSecret;
    };

    if (isRegionInside(x, y - 1)) ctx.fillRect(tx, ty, TILE_SIZE, edgeW);
    if (isRegionInside(x, y + 1)) ctx.fillRect(tx, ty + TILE_SIZE - edgeW, TILE_SIZE, edgeW);
    if (isRegionInside(x - 1, y)) ctx.fillRect(tx, ty, edgeW, TILE_SIZE);
    if (isRegionInside(x + 1, y)) ctx.fillRect(tx + TILE_SIZE - edgeW, ty, edgeW, TILE_SIZE);
    ctx.restore();
});

// 2. Liquid (Water)
RenderRegistry.register(RENDER_STYLE.LIQUID, (ctx, tx, ty) => {
    ctx.fillStyle = COLORS.waterBase;
    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
});

// 3. Ladder
RenderRegistry.register(RENDER_STYLE.LADDER, (ctx, tx, ty) => {
    ctx.fillStyle = COLORS.ladder;
    ctx.fillRect(tx + 4, ty, 2, TILE_SIZE);
    ctx.fillRect(tx + 10, ty, 2, TILE_SIZE);
    for(let i=2; i<TILE_SIZE; i+=5) ctx.fillRect(tx + 4, ty + i, 8, 1);
});

// 4. Wood Platform (One-way)
RenderRegistry.register(RENDER_STYLE.PLATFORM_WOOD, (ctx, tx, ty, x, y, map) => {
    ctx.fillStyle = COLORS.woodLight; 
    ctx.fillRect(tx, ty, TILE_SIZE, 3);
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(tx + 2, ty + 3, 2, 2);
    ctx.fillRect(tx + 8, ty + 3, 2, 2);
    ctx.fillRect(tx + 12, ty + 3, 2, 2);

    const leftId = getTileValue(map.getTile(x - 1, y));
    const rightId = getTileValue(map.getTile(x + 1, y));
    const leftDef = getTileDef(leftId);
    const rightDef = getTileDef(rightId);
    ctx.fillStyle = COLORS.woodDetail; 

    // Diagonal supports connecting to solid walls
    if (leftDef.col === COLLISION_TYPE.SOLID) {
        ctx.beginPath(); ctx.moveTo(tx, ty + 3); ctx.lineTo(tx, ty + 10); ctx.lineTo(tx + 7, ty + 3); ctx.fill();
    }
    if (rightDef.col === COLLISION_TYPE.SOLID) {
        ctx.beginPath(); ctx.moveTo(tx + 16, ty + 3); ctx.lineTo(tx + 16, ty + 10); ctx.lineTo(tx + 9, ty + 3); ctx.fill();
    }
});

// 5. Spikes (Hazards)
RenderRegistry.register(RENDER_STYLE.SPIKE_ROCK, (ctx, tx, ty, x, y, map) => {
    if (map.isSpikeDestroyed(x, y)) return;
    const seed = (x * 37 + y * 13) % 100;
    
    ctx.fillStyle = COLORS.spike;
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty + TILE_SIZE);
    ctx.lineTo(tx + 4 + (seed % 4), ty + 2 + (seed % 6)); 
    ctx.lineTo(tx + 10, ty + TILE_SIZE);
    ctx.lineTo(tx + 14, ty + TILE_SIZE);
    ctx.lineTo(tx + 12, ty + 6 + (seed % 4));
    ctx.lineTo(tx + 8, ty + TILE_SIZE);
    ctx.fill();
    
    ctx.fillStyle = COLORS.spikeDark;
    ctx.beginPath();
    ctx.moveTo(tx + 4 + (seed % 4), ty + 2 + (seed % 6));
    ctx.lineTo(tx + 5 + (seed % 4), ty + TILE_SIZE);
    ctx.lineTo(tx + 3 + (seed % 4), ty + TILE_SIZE);
    ctx.fill();
});

/**
 * ============================================================================
 * MODULE: RENDERING SYSTEM (renderer.js)
 * Main rendering loop and camera logic.
 * ============================================================================
 */

class BackgroundLayer {
    constructor() {}
    draw(ctx, game, timeScale) {
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(80, 0, 10, GAME_HEIGHT);
        ctx.fillRect(220, 0, 15, GAME_HEIGHT);
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(100, 0); ctx.lineTo(100, 60);
        ctx.moveTo(110, 0); ctx.lineTo(110, 40);
        ctx.moveTo(250, 0); ctx.lineTo(250, 90);
        ctx.stroke();
        if (game.scripts.currentScript && game.scripts.currentScript.drawBackground) {
            game.scripts.currentScript.drawBackground(ctx, game, timeScale);
        }
    }
}

class GameRenderer {
    constructor(canvas, ui) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.ui = ui; // Kept for reference, though events preferred
        this.canvas.width = GAME_WIDTH; this.canvas.height = GAME_HEIGHT;
        this.canvas.style.width = `${GAME_WIDTH * SCALE}px`;
        this.canvas.style.height = `${GAME_HEIGHT * SCALE}px`;
        this.backgroundLayer = new BackgroundLayer();
        this.showMap = false;
        this.mapScale = 3.0;
        this.mapOffsetX = 0; this.mapOffsetY = 0;
        this.worldBounds = this.calculateWorldBounds();
    }

    calculateWorldBounds() {
        const keys = Object.keys(WORLD_LAYOUTS);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        keys.forEach(k => {
            const [x, y] = k.split(',').map(Number);
            if(x < minX) minX = x; if(x > maxX) maxX = x;
            if(y < minY) minY = y; if(y > maxY) maxY = y;
        });
        return { minX, maxX, minY, maxY };
    }

    handleMapInput(game) {
        const input = game.input;
        const system = game.system;
        const map = game.map;

        if (input.keys["Tab"]) {
            if(!this.tabHeld) {
                if (system.abilities.minimap) {
                    this.showMap = !this.showMap;
                    if(this.showMap) { 
                        const b = this.worldBounds;
                        const gridW = (b.maxX - b.minX + 1); const gridH = (b.maxY - b.minY + 1);
                        const centerGridX = b.minX + (gridW - 1) / 2;
                        const centerGridY = b.minY + (gridH - 1) / 2;
                        const pixelSize = this.mapScale;
                        const roomPixW = 30 * pixelSize; const roomPixH = 18 * pixelSize;
                        this.mapOffsetX = (centerGridX - map.roomX) * roomPixW;
                        this.mapOffsetY = (centerGridY - map.roomY) * roomPixH;
                        this.clampMapCamera(); 
                    }
                } else { events.emit('SYSTEM_MESSAGE', "MAP MODULE NOT FOUND"); }
                this.tabHeld = true;
            }
        } else { this.tabHeld = false; }

        if (this.showMap) {
            const zoomSpeed = 0.05; const panSpeed = 3;
            if(input.keys["="] || input.keys["+"]) this.mapScale = Math.min(this.mapScale + zoomSpeed, 5.0);
            if(input.keys["-"] || input.keys["_"]) this.mapScale = Math.max(this.mapScale - zoomSpeed, 0.5); 
            if(input.up) this.mapOffsetY += panSpeed;
            if(input.down) this.mapOffsetY -= panSpeed;
            if(input.left) this.mapOffsetX += panSpeed;
            if(input.right) this.mapOffsetX -= panSpeed;
            this.clampMapCamera();
        }
    }

    clampMapCamera() {
        const b = this.worldBounds;
        const gridW = (b.maxX - b.minX + 1);
        const gridH = (b.maxY - b.minY + 1);
        const pixelSize = this.mapScale;
        const roomPixW = 30 * pixelSize; 
        const roomPixH = 18 * pixelSize;
        const totalMapW = gridW * roomPixW;
        const totalMapH = gridH * roomPixH;
        const viewportW = 400; const viewportH = 240;
        let maxOffX = 0; let maxOffY = 0;
        if (totalMapW > viewportW) maxOffX = (totalMapW - viewportW) / 2;
        if (totalMapH > viewportH) maxOffY = (totalMapH - viewportH) / 2;
        this.mapOffsetX = clamp(this.mapOffsetX, -maxOffX, maxOffX);
        this.mapOffsetY = clamp(this.mapOffsetY, -maxOffY, maxOffY);
    }

    draw(game, accumulatedTime, timeScale) {
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.backgroundLayer.draw(this.ctx, game);
        this.drawFog(game.map);
        this.drawMapTiles(game.map, accumulatedTime);
        this.drawEntities(game.map); // Unified Entity Draw

        game.player.draw(this.ctx, game);
        this.drawParticles(game);
        this.drawLighting(game); 

        if (game.scripts.currentScript && game.scripts.currentScript.drawForeground) {
            game.scripts.currentScript.drawForeground(this.ctx, game, timeScale);
        }
        this.drawPostEffects(game);
        if(this.showMap) this.drawMinimap(game);
    }

    drawFog(map) {
        this.ctx.fillStyle = COLORS.bg;
        for (let y = 0; y < map.rows; y++) {
            for (let x = 0; x < map.cols; x++) {
                if (!map.visible || !map.visible[y][x]) {
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    drawPostEffects(game) {
        if (game.isDead || game.recoveryTimer > 0) {
            let mosaicFactor = 0;
            if (game.isDead) mosaicFactor = Math.min(1, game.deathTimer / 1000);
            else mosaicFactor = Math.max(0, game.recoveryTimer / 1000);

            if (mosaicFactor > 0) {
                const mosaicLevel = Math.max(1, Math.floor(mosaicFactor * 20));
                const w = this.canvas.width; const h = this.canvas.height;
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.drawImage(this.canvas, 0, 0, w, h, 0, 0, w / mosaicLevel, h / mosaicLevel);
                this.ctx.drawImage(this.canvas, 0, 0, w / mosaicLevel, h / mosaicLevel, 0, 0, w, h);
                this.ctx.fillStyle = `rgba(50, 0, 0, ${mosaicFactor * 0.5})`;
                this.ctx.fillRect(0, 0, w, h);
            }
        }
    }

    drawMapTiles(map, accumulatedTime) {
        for (let y = 0; y < map.rows; y++) {
            for (let x = 0; x < map.cols; x++) {
                if (!map.visible || !map.visible[y][x]) continue;

                const tileId = getTileValue(map.layout[y][x]);
                const def = getTileDef(tileId);
                const tx = x * TILE_SIZE;
                const ty = y * TILE_SIZE;

                // --- USAGE OF STRATEGY PATTERN ---
                const strategy = RenderRegistry.get(def.ren);
                if (strategy) {
                    strategy(this.ctx, tx, ty, x, y, map, def);
                }
            }
        }
        this.drawWaterSurface(map, accumulatedTime);
    }

    drawEntities(map) {
        map.entities.forEach(entity => {
            const tx = Math.floor(entity.x / TILE_SIZE);
            const ty = Math.floor(entity.y / TILE_SIZE);
            if (map.visible && map.visible[ty] && map.visible[ty][tx]) {
                entity.draw(this.ctx);
            }
        });
    }

    drawWaterSurface(map, accumulatedTime) {
        this.ctx.fillStyle = COLORS.waterSurface;
        this.ctx.beginPath();
        map.waterNodes.forEach(node => {
            if (map.visible && map.visible[node.y][node.x]) {
                let wx = node.x * TILE_SIZE;
                let wy = node.y * TILE_SIZE + 4;
                for(let i=0; i<=TILE_SIZE; i+=4) {
                    let h = Math.sin(accumulatedTime * 0.005 + node.x + i * 0.2) * 2;
                    this.ctx.rect(wx + i, wy + h, 4, 2);
                }
            }
        });
        this.ctx.fill();
    }

    drawParticles(game) {
        game.particles.forEach(p => {
            const tx = Math.floor(p.x / TILE_SIZE);
            const ty = Math.floor(p.y / TILE_SIZE);
            if (game.map.visible && game.map.visible[ty] && game.map.visible[ty][tx]) {
                p.draw(this.ctx);
            }
        });
    }

    drawLighting(game) {
        if (game.isDead) return;
        this.ctx.fillStyle = 'rgba(5, 5, 10, 0.3)';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.ctx.globalCompositeOperation = 'lighter';
        
        let g = this.ctx.createRadialGradient(game.player.x, game.player.y, 2, game.player.x, game.player.y, 40);
        g.addColorStop(0, 'rgba(100, 255, 150, 0.3)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = g;
        this.ctx.beginPath(); this.ctx.arc(game.player.x, game.player.y, 40, 0, Math.PI*2); this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawMinimap(game) {
        const map = game.map;
        const b = this.worldBounds;
        // this.ctx.fillStyle = COLORS.mapBg; // dark background with light visited areas
        this.ctx.fillStyle = "#222233"; // lighter background
        // this.ctx.fillStyle = "#fff"; // white background
        // transparent black background
        const mapW = 400; const mapH = 240;
        const mapX = (GAME_WIDTH - mapW) / 2;
        const mapY = (GAME_HEIGHT - mapH) / 2;
        this.ctx.fillRect(mapX, mapY, mapW, mapH);
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(mapX, mapY, mapW, mapH);
        this.ctx.clip();
        this.ctx.fillStyle = "#fff"; // text color
        // this.ctx.fillStyle = COLORS.mapBg; // text color
        this.ctx.font = "10px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`SYSTEM MAP [+/- Zoom] [Arrows Pan]`, GAME_WIDTH/2, mapY + 15);
        this.ctx.textAlign = "left"; 

        const pixelSize = this.mapScale; 
        const roomPixW = 30 * pixelSize; const roomPixH = 18 * pixelSize;
        const gridW = (b.maxX - b.minX + 1); const gridH = (b.maxY - b.minY + 1);
        const viewCX = mapX + mapW/2; const viewCY = mapY + mapH/2;

        for(let rY = b.minY; rY <= b.maxY; rY++) {
            for(let rX = b.minX; rX <= b.maxX; rX++) {
                const key = `${rX},${rY}`;
                const distX = rX - (b.minX + (gridW - 1)/2); 
                const distY = rY - (b.minY + (gridH - 1)/2);
                const dx = viewCX + this.mapOffsetX + distX * roomPixW - (roomPixW/2);
                const dy = viewCY + this.mapOffsetY + distY * roomPixH - (roomPixH/2);

                if (dx + roomPixW < mapX || dx > mapX + mapW || dy + roomPixH < mapY || dy > mapY + mapH) continue;

                if (map.explored[key]) {
                    const layout = WORLD_LAYOUTS[key];
                    const exploredData = map.explored[key];
                    
                    // MODIFIED: Use the visible blue color for ALL explored rooms, not just (0,0)
                    // This ensures empty explored space is visible everywhere.
                    // const baseColor = '#222233'; // light for explored rooms
                    // const baseColor = COLORS.mapVisited; // light for explored rooms
                    const baseColor = COLORS.mapBg; // dark lighter than mapBg

                    if (layout) {
                        for (let r = 0; r < layout.length; r++) {     
                            for (let c = 0; c < layout[r].length; c++) { 
                                if (exploredData[r][c]) {
                                    // Draw background for this specific visible tile (handles empty space)
                                    this.ctx.fillStyle = baseColor;
                                    this.ctx.fillRect(dx + c * pixelSize, dy + r * pixelSize, pixelSize, pixelSize);

                                    const tile = getTileValue(layout[r][c]);
                                    if (tile !== 0) {
                                        const def = getTileDef(tile);
                                        const isSecretRevealed = map.secretRegistry[key] && map.secretRegistry[key].has(`${c},${r}`);

                                        if (def.col === COLLISION_TYPE.SOLID || def.isSecret) {
                                            if (def.isSecret && isSecretRevealed) continue; 
                                            this.ctx.fillStyle = COLORS.mapWall;
                                        }
                                        else if (def.col === COLLISION_TYPE.LIQUID) this.ctx.fillStyle = COLORS.mapWater;
                                        else if (def.col === COLLISION_TYPE.CLIMBABLE) this.ctx.fillStyle = COLORS.ladder;
                                        else if (def.col === COLLISION_TYPE.ONE_WAY) this.ctx.fillStyle = COLORS.woodDark;
                                        else if (def.col === COLLISION_TYPE.HAZARD) {
                                            if (map.isSpikeDestroyedAt(rX, rY, c, r)) continue; 
                                            this.ctx.fillStyle = "#ff0000"; 
                                        }
                                        else if (def.ren === RENDER_STYLE.OBJECT_MARKER) {
                                            if (tile === 3) this.ctx.fillStyle = COLORS.chestClosed;
                                            else this.ctx.fillStyle = COLORS.lightGlow;
                                        }
                                        else continue;
                                        this.ctx.fillRect(dx + c * pixelSize, dy + r * pixelSize, pixelSize, pixelSize);
                                    }
                                }
                            }
                        }
                    }
                    if (rX === map.roomX && rY === map.roomY) {
                        this.ctx.strokeStyle = COLORS.playerGlow;
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(dx, dy, roomPixW, roomPixH);
                        const px = (game.player.x / TILE_SIZE) * pixelSize;
                        const py = (game.player.y / TILE_SIZE) * pixelSize;
                        this.ctx.fillStyle = '#fff';
                        this.ctx.fillRect(dx + px, dy + py, 2, 2);
                    }
                } 
            }
        }
        this.ctx.restore();
    }
}
