class SaveManager {
    constructor() { }

    initUI(game) {
        const btnSave = document.getElementById('btn-save');
        const btnLoad = document.getElementById('btn-load');

        if (btnSave) {
            btnSave.addEventListener('click', () => {
                // Focus back to canvas after clicking to avoid ignoring input
                document.getElementById('gameCanvas').focus();
                this.saveToJSON(game);
            });
        }

        if (btnLoad) {
            btnLoad.addEventListener('change', (e) => {
                document.getElementById('gameCanvas').focus();
                this.loadFromJSON(e, game);
            });
        }
    }

    saveToJSON(game) {
        if (!game || !game.player) return;

        // Serialize the sets inside secretRegistry
        const serializedSecrets = {};
        for (let key in game.map.secretRegistry) {
            serializedSecrets[key] = Array.from(game.map.secretRegistry[key]);
        }

        // Strip non-serializable details, keep core progression
        const saveData = {
            roomX: game.map.roomX,
            roomY: game.map.roomY,
            playerX: game.player.x,
            playerY: game.player.y,
            health: game.player.hp || 100,
            keys: game.system.keys,
            abilities: game.player.abilities || [],
            globalDestroyedSpikes: Array.from(game.map.globalDestroyedSpikes),
            visitedRooms: Array.from(game.map.visitedRooms),
            secretRegistry: serializedSecrets,
            explored: game.map.explored
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveData, null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = "save.json";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        game.ui.showMessage("GAME SAVED", "#aaffaa", 1500);
    }

    loadFromJSON(event, game) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                game.system.keys = data.keys || 0;
                game.player.abilities = data.abilities || [];
                game.player.hp = data.health || 100;

                game.map.globalDestroyedSpikes = new Set(data.globalDestroyedSpikes || []);
                game.map.visitedRooms = new Set(data.visitedRooms || []);

                if (data.explored) {
                    game.map.explored = data.explored;
                }

                if (data.secretRegistry) {
                    game.map.secretRegistry = {};
                    for (let key in data.secretRegistry) {
                        game.map.secretRegistry[key] = new Set(data.secretRegistry[key]);
                    }
                }

                // Switch map
                game.loadRoom(data.roomX, data.roomY);

                // Teleport player
                game.player.x = data.playerX;
                game.player.y = data.playerY;
                game.player.vx = 0;
                game.player.vy = 0;

                game.ui.showMessage("GAME LOADED", "#aaffaa", 1500);
            } catch (err) {
                console.error("Save file parsing error:", err);
                game.ui.showMessage("LOAD ERROR", "#ff5555", 1500);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}

// Global instance
window.GameSaveManager = new SaveManager();
