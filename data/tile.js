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
    99: { name: "Spike",         col: COLLISION_TYPE.HAZARD,    ren: RENDER_STYLE.SPIKE_ROCK,   damage: 100, isVoid: true }
};

function getTileDef(id) { return TILE_DEF[id] || TILE_DEF[0]; }

function getTileValue(val) { 
    if (TILE_DATA_MAP.hasOwnProperty(val)) {
        return TILE_DATA_MAP[val];
    }
    return 0; 
}
