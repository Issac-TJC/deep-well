/**
 * ============================================================================
 * 5. MAP SCRIPT SYSTEM
 * ============================================================================
 */

// Example Implementation: Tutorial Text & Triggers
class StartRoomScript extends MapScript {
    update(game) {
        const p = game.player;
        if (p.x < 100) game.ui.showMessage("Fall down to dive");
        else if (p.x > 250) game.ui.showMessage("Jump right ->");
        else if (p.y > 150) game.ui.showMessage("Hold Space in Water to CHARGE");
    }

    //     // --- NEW: Custom Background Logic ---
    // drawBackground(ctx, game) {
    //     // Draw an OwlWatcher that follows the player
    //     const ox = 40;
    //     const oy = 30;
        
    //     // Body
    //     ctx.fillStyle = '#151525';
    //     ctx.beginPath();
    //     ctx.ellipse(ox, oy, 12, 16, 0, 0, Math.PI * 2);
    //     ctx.fill();
        
    //     // Ears
    //     ctx.beginPath();
    //     ctx.moveTo(ox - 8, oy - 12); ctx.lineTo(ox - 12, oy - 22); ctx.lineTo(ox, oy - 14);
    //     ctx.moveTo(ox + 8, oy - 12); ctx.lineTo(ox + 12, oy - 22); ctx.lineTo(ox, oy - 14);
    //     ctx.fill();

    //     // Eyes Logic
    //     const px = game.player.x;
    //     const py = game.player.y;
        
    //     const drawEye = (ex, ey) => {
    //         // White
    //         ctx.fillStyle = '#ccccdd';
    //         ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI*2); ctx.fill();
            
    //         // Pupil (Tracks Player)
    //         const angle = Math.atan2(py - ey, px - ex);
    //         const dist = Math.min(2, Math.hypot(px - ex, py - ey) / 20);
    //         const pupX = ex + Math.cos(angle) * dist;
    //         const pupY = ey + Math.sin(angle) * dist;

    //         ctx.fillStyle = '#000';
    //         ctx.beginPath(); ctx.arc(pupX, pupY, 2, 0, Math.PI*2); ctx.fill();
    //     };

    //     drawEye(ox - 5, oy - 2);
    //     drawEye(ox + 5, oy - 2);
        
    //     // Beak
    //     ctx.fillStyle = '#333';
    //     ctx.beginPath(); ctx.moveTo(ox - 2, oy + 2); ctx.lineTo(ox + 2, oy + 2); ctx.lineTo(ox, oy + 6); ctx.fill();
    // }
}

class MapItemScript extends MapScript {
    update(game) {
        if (!game.system.abilities.minimap) game.ui.showMessage("A signal nearby...");
        else game.ui.showMessage("Minimap Online (TAB)", '#aaffaa');
    }
}

class DeepWaterScript extends MapScript {
    init(game) {
        game.ui.showMessage("The Sunken Depths", '#aaaaff', 2000);
    }
}

// Registry linking coordinates to script instances
const SCRIPT_REGISTRY = {
    "0,0": new StartRoomScript(),
    "1,0": new MapItemScript(),
    "0,1": new DeepWaterScript(),
    "1,6": new BossScript()
};
