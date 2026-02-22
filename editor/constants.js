/**
 * ============================================================================
 * SECTION 1: GAME CORE COMPATIBILITY
 * ============================================================================
 */

// --- Constants ---
const GAME_WIDTH = 480;
const GAME_HEIGHT = 288;
const TILE_SIZE = 16;
const SCALE = 2;

const COLORS = {
    bg: '#090914',
    tileDark: '#111122',
    tileLight: '#222238',
    tileHighlight: '#333355',
    grass: '#2a2a4a',
    grassTip: '#4a4a7a',
    flowerStem: '#446644',
    flowerBulbClosed: '#444466',
    flowerBulbOpen: '#aa88ff',
    waterBase: 'rgba(20, 40, 100, 0.4)',
    waterSurface: 'rgba(50, 100, 255, 0.6)',
    playerCore: '#ffffff',
    playerGlow: '#aaffaa',
    hat: '#ffcc00',
    hatLight: '#ffeedd',
    mapBg: 'rgba(0, 0, 0, 0.85)',
    mapVisited: '#444466',
    mapCurrent: '#aaffaa',
    mapWall: '#666688',
    mapWater: '#4444ff',
    mapClosed: '#e6d089',
    mapTransparent: 'rgba(233, 243, 243, 0.76)',
    chestClosed: '#d4af37',
    chestOpen: '#8a6e26',
    ladder: '#444455',
    lightBase: '#333344',
    lightGlow: '#ffeedd',
    spike: '#666677',
    spikeDark: '#444455',
    woodDark: '#2a1e19',
    woodLight: '#4e3b31',
    woodDetail: '#3a2a24',
    // Palette Extras
    white: '#ffffff',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    yellow: '#ffff00',
    gray: '#888888'
};

const COLLISION_TYPE = {
    NONE: 0,
    SOLID: 1,
    ONE_WAY: 2,
    LIQUID: 3,
    CLIMBABLE: 4,
    HAZARD: 5,
};

const RENDER_STYLE = {
    INVISIBLE: 0,
    BLOCK_BASIC: 1,
    LIQUID: 2,
    LADDER: 3,
    PLATFORM_WOOD: 4,
    SPIKE_ROCK: 5,
    OBJECT_MARKER: 6,
    GLASS: 8,
    DOOR_CLOSED: 9,
    DOOR_OPEN: 10,
};

// EDITOR STATE FOR NEW TILES
const NEW_TILES_LIST = [];
const ROOM_COLS = 30;
const ROOM_ROWS = 18;

// Define a global worldData representing the mock local database
let worldData = {
    "0,0": Array(ROOM_ROWS).fill().map(() => Array(ROOM_COLS).fill(0))
};
