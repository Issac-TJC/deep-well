/**
 * ============================================================================
 * 5. MAP SCRIPT SYSTEM
 * ============================================================================
 */

class MapScript {
    // Interface required by the ScriptManager
    init(game) { }   // Called once when entering the room
    exit(game) { }   // Called once when exiting the room

    update(game, timeScale) { }

    // Layer Hooks
    drawBackground(ctx, game, timeScale) { } // NEW: Called by BackgroundLayer
    drawForeground(ctx, game, timeScale) { } // Called by GameRenderer
}

class ScriptManager {
    constructor() {
        this.currentScript = null;
    }

    onRoomEnter(game, roomX, roomY) {
        if (this.currentScript && this.currentScript.exit) {
            this.currentScript.exit(game);
        }

        const key = `${roomX},${roomY}`;
        if (SCRIPT_REGISTRY[key]) {
            this.currentScript = SCRIPT_REGISTRY[key];
            if (this.currentScript.init) this.currentScript.init(game);
        } else {
            this.currentScript = null;
        }
    }

    update(game, timeScale) {
        if (this.currentScript && this.currentScript.update) {
            this.currentScript.update(game, timeScale);
        }
    }
}
