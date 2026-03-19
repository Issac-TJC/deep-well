const fs = require('fs');

// Read rooms
const roomsStr = fs.readFileSync('world/world_data/rooms.js', 'utf8');
const roomsMatch = roomsStr.match(/const WORLD_LAYOUTS = (\{[\s\S]+?\n\});/);
if (roomsMatch) {
    const WORLD_LAYOUTS = eval('(' + roomsMatch[1] + ')');
    fs.writeFileSync('data/maps/rooms.json', JSON.stringify(WORLD_LAYOUTS, null, 2));
}

// Read tiles
const tileStr = fs.readFileSync('world/world_data/tile.js', 'utf8');
// We need to evaluate the whole file up to TILE_DEF, but stripping out DOM/Render stuff.
// Actually, we can just grab the blocks.
const colMatch = tileStr.match(/const COLLISION_TYPE = (\{[\s\S]+?\});/);
const renMatch = tileStr.match(/const RENDER_STYLE = (\{[\s\S]+?\});/);
const mapMatch = tileStr.match(/const TILE_DATA_MAP = (\{[\s\S]+?\});/);
const defMatch = tileStr.match(/const TILE_DEF = (\{[\s\S]+?\});/);

if (colMatch && renMatch && mapMatch && defMatch) {
    const COLLISION_TYPE = eval('(' + colMatch[1] + ')');
    const RENDER_STYLE = eval('(' + renMatch[1] + ')');
    const TILE_DATA_MAP = eval('(' + mapMatch[1] + ')');

    // Evaluate TILE_DEF with the enums in scope
    const TILE_DEF = eval(`
        const COLLISION_TYPE = ${JSON.stringify(COLLISION_TYPE)};
        const RENDER_STYLE = ${JSON.stringify(RENDER_STYLE)};
        (${defMatch[1]})
    `);

    const tilesData = {
        COLLISION_TYPE,
        RENDER_STYLE,
        TILE_DATA_MAP,
        TILE_DEF
    };
    fs.writeFileSync('data/config/tiles.json', JSON.stringify(tilesData, null, 2));
}

// Read loot
const lootStr = fs.readFileSync('world/world_data/room_ability.js', 'utf8');
const lootMatch = lootStr.match(/const ROOM_LOOT = (\{[\s\S]+?\});/);
if (lootMatch) {
    const ROOM_LOOT = eval('(' + lootMatch[1] + ')');
    fs.writeFileSync('data/config/loot.json', JSON.stringify(ROOM_LOOT, null, 2));
}

console.log('Extraction complete.');
