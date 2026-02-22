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
    'btn-jump': 'Space',
    'btn-map': 'Tab',
    'btn-interact': 'e'
};

Object.keys(touchMap).forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const key = touchMap[id];

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling/zooming
        btn.classList.add('active');
        if (game && game.input) {
            game.input.keys[key] = true;
        }
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        if (game && game.input) {
            game.input.keys[key] = false;
        }
    }, { passive: false });
});

// Joystick Logic
const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');

if (joystickBase && joystickKnob) {
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickRadius = 70; // Half of 140px

    const resetJoystickKeys = () => {
        if (game && game.input) {
            game.input.keys['ArrowUp'] = false;
            game.input.keys['ArrowDown'] = false;
            game.input.keys['ArrowLeft'] = false;
            game.input.keys['ArrowRight'] = false;
        }
    };

    const updateJoystick = (touch) => {
        let dx = touch.clientX - joystickCenter.x;
        let dy = touch.clientY - joystickCenter.y;
        const dist = Math.hypot(dx, dy);

        let visualDist = Math.min(dist, joystickRadius);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * visualDist;
        const ny = Math.sin(angle) * visualDist;

        joystickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;

        if (game && game.input) {
            resetJoystickKeys();
            if (visualDist > 15) { // Deadzone
                // Determine horizontal movement
                if (nx > 20) game.input.keys['ArrowRight'] = true;
                else if (nx < -20) game.input.keys['ArrowLeft'] = true;

                // Determine vertical movement
                if (ny > 20) game.input.keys['ArrowDown'] = true;
                else if (ny < -20) game.input.keys['ArrowUp'] = true;
            }
        }
    };

    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter.x = rect.left + rect.width / 2;
        joystickCenter.y = rect.top + rect.height / 2;
        updateJoystick(e.touches[0]);
    }, { passive: false });

    joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) {
            updateJoystick(e.touches[0]);
        }
    }, { passive: false });

    const endJoystick = (e) => {
        e.preventDefault();
        joystickActive = false;
        joystickKnob.style.transform = 'translate(-50%, -50%)';
        resetJoystickKeys();
    };

    joystickBase.addEventListener('touchend', endJoystick, { passive: false });
    joystickBase.addEventListener('touchcancel', endJoystick, { passive: false });
}