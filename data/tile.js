/**
 * ============================================================================
 * MODULE: REGISTRY (registry.js)
 * Tile definitions and configurations.
 * ============================================================================
 */
const COLLISION_TYPE = {
    NONE: 0, SOLID: 1, ONE_WAY: 2, LIQUID: 3, CLIMBABLE: 4, HAZARD: 5
};

const RENDER_STYLE = {
    INVISIBLE: 0, BLOCK_BASIC: 1, LIQUID: 2, LADDER: 3, 
    PLATFORM_WOOD: 4, SPIKE_ROCK: 5, OBJECT_MARKER: 6
};

const TILE_DATA_MAP = {
    '0': 0,   // Air
    '1': 1,   // Dirt
    '2': 2,   // Water
    '3': 3,   // Chest
    '4': 4,   // Ladder
    '5': 5,   // Light
    '6': 6,   // SecretWall
    '8': 8,   // WoodPlatform
    '10': 10, // DirtAlt (Existing logic handled '10', keeping it explicitly)
    'x': 99,  // Spike
};

const TILE_DEF = {
    0:  { name: "Air",           col: COLLISION_TYPE.NONE,      ren: RENDER_STYLE.INVISIBLE,    isVoid: true },
    1:  { name: "Dirt",          col: COLLISION_TYPE.SOLID,     ren: RENDER_STYLE.BLOCK_BASIC },
    2:  { name: "Water",         col: COLLISION_TYPE.LIQUID,    ren: RENDER_STYLE.LIQUID,       friction: 0.9, gravityMod: 0.5, isVoid: true },
    3:  { name: "ChestNode",     col: COLLISION_TYPE.NONE,      ren: RENDER_STYLE.OBJECT_MARKER, isVoid: true },
    4:  { name: "Ladder",        col: COLLISION_TYPE.CLIMBABLE, ren: RENDER_STYLE.LADDER,       isVoid: true },
    5:  { name: "LightNode",     col: COLLISION_TYPE.NONE,      ren: RENDER_STYLE.OBJECT_MARKER, isVoid: true },
    6:  { name: "SecretWall",    col: COLLISION_TYPE.NONE,      ren: RENDER_STYLE.BLOCK_BASIC,  isSecret: true }, 
    8:  { name: "WoodPlatform",  col: COLLISION_TYPE.ONE_WAY,   ren: RENDER_STYLE.PLATFORM_WOOD, isVoid: true },
    10: { name: "DirtAlt",       col: COLLISION_TYPE.SOLID,     ren: RENDER_STYLE.BLOCK_BASIC },
    99: { name: "Spike",         col: COLLISION_TYPE.HAZARD,    ren: RENDER_STYLE.SPIKE_ROCK,   damage: 100, isVoid: true },
};

function getTileDef(id) { return TILE_DEF[id] || TILE_DEF[0]; }

function getTileValue(val) { 
    if (TILE_DATA_MAP.hasOwnProperty(val)) {
        return TILE_DATA_MAP[val];
    }
    return 0; 
}

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


(function() {

    // Custom Tile: MyCustomTile (ID: 100, Char: A)
    if(typeof RenderRegistry !== 'undefined') {
        RenderRegistry.register(100, (ctx, tx, ty, x, y, map, def) => {
            ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+1, ty+13, 1, 1); ctx.fillRect(tx+3, ty+13, 1, 1); ctx.fillRect(tx+5, ty+13, 1, 1); ctx.fillRect(tx+7, ty+13, 1, 1); ctx.fillRect(tx+9, ty+13, 1, 1); ctx.fillRect(tx+11, ty+13, 1, 1); ctx.fillRect(tx+13, ty+13, 1, 1); ctx.fillRect(tx+15, ty+13, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+0, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+1, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+2, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+3, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+4, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+5, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+6, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+7, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+8, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+9, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+10, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+11, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+12, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+13, ty+14, 1, 1); ctx.fillStyle = '#3a2a24'; ctx.fillRect(tx+14, ty+14, 1, 1); ctx.fillStyle = '#2a1e19'; ctx.fillRect(tx+15, ty+14, 1, 1); ctx.fillRect(tx+0, ty+15, 1, 1); ctx.fillRect(tx+1, ty+15, 1, 1); ctx.fillRect(tx+2, ty+15, 1, 1); ctx.fillRect(tx+3, ty+15, 1, 1); ctx.fillRect(tx+4, ty+15, 1, 1); ctx.fillRect(tx+5, ty+15, 1, 1); ctx.fillRect(tx+6, ty+15, 1, 1); ctx.fillRect(tx+7, ty+15, 1, 1); ctx.fillRect(tx+8, ty+15, 1, 1); ctx.fillRect(tx+9, ty+15, 1, 1); ctx.fillRect(tx+10, ty+15, 1, 1); ctx.fillRect(tx+11, ty+15, 1, 1); ctx.fillRect(tx+12, ty+15, 1, 1); ctx.fillRect(tx+13, ty+15, 1, 1); ctx.fillRect(tx+14, ty+15, 1, 1); ctx.fillRect(tx+15, ty+15, 1, 1); 
        });
    }
    if(typeof TILE_DEF !== 'undefined') {
        TILE_DEF[100] = { name: "MyCustomTile", col: 2, ren: 100 };
    }
    if(typeof TILE_DATA_MAP !== 'undefined') {
        TILE_DATA_MAP['A'] = 100;
    }
})();