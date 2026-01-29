/**
 * ============================================================================
 * 9. RESPONSIVE & MOBILE CONTROLS ADD-ON
 * ============================================================================
 */
function handleResize() {
    const canvas = document.getElementById('gameCanvas');
    const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
    const windowRatio = window.innerWidth / window.innerHeight;
    
    let newWidth, newHeight;
    
    // Scale to fit window while maintaining aspect ratio
    if (windowRatio < aspectRatio) {
        newWidth = window.innerWidth;
        newHeight = window.innerWidth / aspectRatio;
    } else {
        newHeight = window.innerHeight;
        newWidth = window.innerHeight * aspectRatio;
    }
    
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
}

window.addEventListener('resize', handleResize);
handleResize(); // Call once on load

// Mobile Touch Controls
const touchMap = {
    'btn-up': 'ArrowUp',
    'btn-down': 'ArrowDown',
    'btn-left': 'ArrowLeft',
    'btn-right': 'ArrowRight',
    'btn-jump': 'Space',
    'btn-map': 'Tab'
};

Object.keys(touchMap).forEach(id => {
    const btn = document.getElementById(id);
    const key = touchMap[id];
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling/zooming
        btn.classList.add('active');
        if(game && game.input) {
            if(key === 'Tab') {
                // Toggle behavior for map needs a keyup/keydown simulation or direct logic
                 game.input.keys[key] = true;
            } else {
                game.input.keys[key] = true;
            }
        }
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        if(game && game.input) {
            game.input.keys[key] = false;
        }
    }, { passive: false });
});