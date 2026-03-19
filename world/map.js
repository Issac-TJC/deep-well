class Map {
    constructor() {
        this.roomX = 0; this.roomY = 0;
        this.layout = [];
        this.rows = 0; this.cols = 0;
        this.entities = [];
        this.waterNodes = [];
        this.visitedRooms = new Set();
        this.explored = {};
        this.visible = [];
        this.secretRegistry = {};
        this.globalDestroyedSpikes = new Set();
        this.temporaryDestroyedSpikes = new Set();
        this.bouncingTiles = {};
        this.bounceCounter = new CountBounce();
    }

    load(rx, ry) {
        const key = `${rx},${ry}`;
        if (!WORLD_LAYOUTS[key]) return false;

        this.bounceCounter.reset();
        this.roomX = rx; this.roomY = ry;
        this.layout = WORLD_LAYOUTS[key];
        this.rows = this.layout.length; this.cols = this.layout[0].length;
        this.visitedRooms.add(key);

        if (!this.explored[key]) this.explored[key] = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        this.visible = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        if (!this.secretRegistry[key]) this.secretRegistry[key] = new Set();

        this.temporaryDestroyedSpikes.clear();
        this.bouncingTiles = {};

        this.generateEntities(key);
        return true;
    }

    generateEntities(roomKey) {
        this.entities = [];
        this.waterNodes = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                let t = getTileValue(this.layout[y][x]);
                if (typeof spawnEntityFromConfig === 'function') {
                    spawnEntityFromConfig(this, x, y, roomKey, t);
                }
            }
        }
    }

    processSpikeHit(hitX, hitY, permanent, game) {
        this.bounceCounter.update(this.roomX, this.roomY, hitX, hitY, game);
    }

    isSpikeDestroyedExplicit(rx, ry, x, y) {
        const key = `${rx},${ry},${x},${y}`;
        return this.globalDestroyedSpikes.has(key) || this.temporaryDestroyedSpikes.has(key);
    }

    destroySpikeExplicit(rx, ry, x, y, permanent) {
        const key = `${rx},${ry},${x},${y}`;
        if (permanent) {
            this.globalDestroyedSpikes.add(key);
            this.temporaryDestroyedSpikes.delete(key);
        } else {
            this.temporaryDestroyedSpikes.add(key);
        }
    }

    isSpikeDestroyed(x, y) {
        return this.isSpikeDestroyedExplicit(this.roomX, this.roomY, x, y);
    }

    isSpikeDestroyedAt(rx, ry, x, y) {
        return this.globalDestroyedSpikes.has(`${rx},${ry},${x},${y}`);
    }

    triggerTileBounce(x, y) {
        this.bouncingTiles[`${x},${y}`] = -4;
    }

    updateEntities(game, timeScale) {
        this.entities.forEach(e => e.update(game, timeScale));
        for (let key in this.bouncingTiles) {
            this.bouncingTiles[key] *= Math.pow(0.8, timeScale);
            if (Math.abs(this.bouncingTiles[key]) < 0.1) delete this.bouncingTiles[key];
        }
    }

    checkFalseWalls(player) {
        const tx = Math.floor(player.x / TILE_SIZE);
        const ty = Math.floor(player.y / TILE_SIZE);
        const key = `${this.roomX},${this.roomY}`;

        const tileDef = getTileDef(this.getTile(tx, ty));
        if (tileDef.isSecret && !this.secretRegistry[key].has(`${tx},${ty}`)) {
            const stack = [[tx, ty]];
            while (stack.length > 0) {
                const [cx, cy] = stack.pop();
                const coordKey = `${cx},${cy}`;
                if (!this.secretRegistry[key].has(coordKey)) {
                    this.secretRegistry[key].add(coordKey);
                    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(n => {
                        const nx = cx + n[0], ny = cy + n[1];
                        const ntDef = getTileDef(this.getTile(nx, ny));
                        if (ntDef.isSecret) stack.push([nx, ny]);
                    });
                }
            }
        }
    }

    updateVisibility(player) {
        this.visible = Array(this.rows).fill(0).map(() => Array(this.cols).fill(false));
        const key = `${this.roomX},${this.roomY}`;
        const roomExplored = this.explored[key];
        const px = Math.floor(player.x / TILE_SIZE);
        const py = Math.floor(player.y / TILE_SIZE);

        let queue = [{ x: px, y: py }];
        const markVisible = (x, y) => {
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                this.visible[y][x] = true;
                if (roomExplored) roomExplored[y][x] = true;
            }
        };
        markVisible(px, py);

        while (queue.length > 0) {
            const curr = queue.shift();
            const neighbors = [{ x: curr.x, y: curr.y - 1 }, { x: curr.x, y: curr.y + 1 }, { x: curr.x - 1, y: curr.y }, { x: curr.x + 1, y: curr.y }];

            for (let n of neighbors) {
                if (n.x < 0 || n.x >= this.cols || n.y < 0 || n.y >= this.rows) continue;
                if (this.visible[n.y][n.x]) continue;
                markVisible(n.x, n.y);

                const tile = getTileValue(this.layout[n.y][n.x]);
                const def = getTileDef(tile);

                if (def.col === COLLISION_TYPE.HAZARD && !this.isSpikeDestroyed(n.x, n.y)) continue;
                if (def.col === COLLISION_TYPE.SOLID && !def.isTransparent) continue;
                if (def.isSecret) continue;

                queue.push(n);
            }
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            return getTileValue(this.layout[y][x]);
        }
        let nx = x, ny = y, rx = this.roomX, ry = this.roomY;
        if (x < 0) { rx--; nx = x + this.cols; }
        else if (x >= this.cols) { rx++; nx = x - this.cols; }
        if (y < 0) { ry--; ny = y + this.rows; }
        else if (y >= this.rows) { ry++; ny = y - this.rows; }

        const key = `${rx},${ry}`;
        const neighborLayout = WORLD_LAYOUTS[key];
        if (neighborLayout && ny >= 0 && ny < neighborLayout.length && nx >= 0 && nx < neighborLayout[0].length) {
            return getTileValue(neighborLayout[ny][nx]);
        }
        return 0;
    }

    isRevealed(x, y) {
        const key = `${this.roomX},${this.roomY}`;
        return this.secretRegistry[key] && this.secretRegistry[key].has(`${x},${y}`);
    }

    // stable version
    setTile(x, y, id) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
        const char = getTileChar ? getTileChar(id) : id;
        let row = this.layout[y];
        if (typeof row === 'string') {
            this.layout[y] = row.substring(0, x) + char + row.substring(x + 1);
        } else if (Array.isArray(row)) {
            this.layout[y][x] = char;
        }
    }

    updateInteractions(game, timeScale) {
        if (typeof TileInteractions !== 'undefined') {
            TileInteractions.update(game, this, timeScale);
        }
    }
}
