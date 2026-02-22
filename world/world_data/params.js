/**
 * ============================================================================
 * MODULE: CORE & UTILS (core.js)
 * Basic utilities, constants, and the Event Bus.
 * ============================================================================
 */
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
};

function rand(min, max) { return Math.random() * (max - min) + min; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

