class DataManager {
    constructor() {
        this.tiles = null;
        this.interactions = null;
        this.entities = null;
        this.loot = null;
        this.maps = null;
    }

    async loadAll() {
        try {
            console.log("Fetching game data...");
            const [tilesRes, interactionsRes, entitiesRes, lootRes, mapsRes] = await Promise.all([
                fetch('data/config/tiles.json'),
                fetch('data/config/interactions.json'),
                fetch('data/config/entities.json'),
                fetch('data/config/loot.json'),
                fetch('data/maps/rooms.json')
            ]);

            this.tiles = await tilesRes.json();
            this.interactions = await interactionsRes.json();
            this.entities = await entitiesRes.json();
            this.loot = await lootRes.json();
            this.maps = await mapsRes.json();

            // Setup global variables to maintain backward compatibility for unaltered systems
            window.COLLISION_TYPE = this.tiles.COLLISION_TYPE;
            window.RENDER_STYLE = this.tiles.RENDER_STYLE;
            window.TILE_DATA_MAP = this.tiles.TILE_DATA_MAP;
            window.TILE_DEF = this.tiles.TILE_DEF;
            window.WORLD_LAYOUTS = this.maps;
            window.ROOM_LOOT = this.loot;

            console.log("Game Data Loaded successfully!");
            return true;
        } catch (error) {
            console.error("Failed to load game data", error);
            const uiLayer = document.getElementById('ui-layer');
            if (uiLayer) {
                uiLayer.innerText = "Fatal Error: Failed to load Game Data. Cannot run via file:// protocol directly, must use localhost server.";
                uiLayer.style.color = "red";
            }
            return false;
        }
    }
}

// Global instance
window.GameData = new DataManager();
