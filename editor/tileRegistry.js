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
    'g': 20,  // Glass
    'D': 21,  // Door Closed
    'd': 22,  // Door Open
    'x': 99,  // Spike
};

const TILE_DEF = {
    0: { name: "Air", col: COLLISION_TYPE.NONE, ren: RENDER_STYLE.INVISIBLE, isVoid: true },
    1: { name: "Dirt", col: COLLISION_TYPE.SOLID, ren: RENDER_STYLE.BLOCK_BASIC },
    2: { name: "Water", col: COLLISION_TYPE.LIQUID, ren: RENDER_STYLE.LIQUID, friction: 0.9, gravityMod: 0.5, isVoid: true },
    3: { name: "ChestNode", col: COLLISION_TYPE.NONE, ren: RENDER_STYLE.OBJECT_MARKER, isVoid: true, symbol: '📦' },
    4: { name: "Ladder", col: COLLISION_TYPE.CLIMBABLE, ren: RENDER_STYLE.LADDER, isVoid: true },
    5: { name: "LightNode", col: COLLISION_TYPE.NONE, ren: RENDER_STYLE.OBJECT_MARKER, isVoid: true, symbol: '💡' },
    6: { name: "SecretWall", col: COLLISION_TYPE.NONE, ren: RENDER_STYLE.BLOCK_BASIC, isSecret: true },
    8: { name: "WoodPlatform", col: COLLISION_TYPE.ONE_WAY, ren: RENDER_STYLE.PLATFORM_WOOD, isVoid: true },
    10: { name: "DirtAlt", col: COLLISION_TYPE.SOLID, ren: RENDER_STYLE.BLOCK_BASIC },
    20: { name: "Glass", col: COLLISION_TYPE.SOLID, ren: RENDER_STYLE.GLASS, isTransparent: true, noBounce: true },
    21: { name: "DoorClosed", col: COLLISION_TYPE.SOLID, ren: RENDER_STYLE.DOOR_CLOSED },
    22: { name: "DoorOpen", col: COLLISION_TYPE.NONE, ren: RENDER_STYLE.DOOR_OPEN },
    99: { name: "Spike", col: COLLISION_TYPE.HAZARD, ren: RENDER_STYLE.SPIKE_ROCK, damage: 100, isVoid: true },
};

function getTileDef(id) { return TILE_DEF[id] || TILE_DEF[0]; }
function getTileValue(val) {
    if (typeof val === 'number') return val;
    if (TILE_DATA_MAP.hasOwnProperty(val)) return TILE_DATA_MAP[val];
    return 0;
}

// Registry with Editor compatibility
const RenderRegistry = {
    strategies: {},
    register: function (id, fn) { this.strategies[id] = fn; },
    get: function (id) { return this.strategies[id]; }
};

// 定义复古调色板，方便统一调整风格
const DOOR_PALETTE = {
    FRAME_DARK: '#2d2d2d', // 门框深色（阴影）
    FRAME_LIGHT: '#4a4a4a', // 门框亮色（石头/金属）
    WOOD_BASE: '#5c3a21', // 木头底色
    WOOD_DARK: '#3e2716', // 木头缝隙/阴影
    WOOD_LIGHT: '#7a4d2b', // 木头高光
    IRON_BAND: '#222222', // 铁条
    IRON_RIVET: '#666666', // 铆钉
    GOLD_LOCK: '#ffaa00', // 金色锁
    VOID: '#0f0f0f'  // 开门后的黑暗
};
