class InputHandler {
    constructor() {
        this.keys = {
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            w: false, s: false, a: false, d: false,
            Space: false, " ": false, Tab: false,
            "=": false, "+": false, "-": false, "_": false,
            e: false, E: false
        };
        this.initListeners();
    }
    initListeners() {
        window.addEventListener('keydown', e => {
            if (this.keys.hasOwnProperty(e.key) || e.key === " ") {
                if (e.key === "Tab") e.preventDefault();
                this.keys[e.key] = true;
            }
        });
        window.addEventListener('keyup', e => {
            if (this.keys.hasOwnProperty(e.key) || e.key === " ") this.keys[e.key] = false;
        });
    }
    isPressed(key) { return this.keys[key]; }
    get up() { return this.keys.ArrowUp || this.keys.w; }
    get down() { return this.keys.ArrowDown || this.keys.s; }
    get left() { return this.keys.ArrowLeft || this.keys.a; }
    get right() { return this.keys.ArrowRight || this.keys.d; }
    get jump() { return this.keys.Space || this.keys[" "]; }
    get map() { return this.keys.Tab; }
    get interact() { return this.keys.e || this.keys.E; }
}

class UIManager {
    constructor() {
        this.element = document.getElementById('ui-layer');
        this.timeout = null;

        // --- Event Listener ---
        events.on('SYSTEM_MESSAGE', (text) => this.showSystemMessage(text));
    }
    showMessage(text, color = 'rgba(255, 255, 255, 0.7)', duration = 200) {
        if (this.element.innerText === text && this.element.style.opacity > 0) return;
        if (this.element.innerText.includes("SYSTEM") && !text.includes("SYSTEM")) {
            if (this.element.style.opacity > 0) return;
        }
        this.element.innerText = text;
        this.element.style.color = color;
        this.element.style.opacity = 1;
        if (this.timeout) clearTimeout(this.timeout);
        if (duration > 0 && duration < 5000) {
            this.timeout = setTimeout(() => { this.element.style.opacity = 0; }, duration);
        }
    }
    showSystemMessage(text) {
        this.element.innerText = `[SYSTEM]: ${text}`;
        this.element.style.opacity = 1;
        this.element.style.color = '#aaffaa';
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.element.style.opacity = 0;
            setTimeout(() => this.element.style.color = 'rgba(255, 255, 255, 0.7)', 500);
        }, 3000);
    }
}

class SystemManager {
    constructor(ui) {
        this.ui = ui;
        this.abilities = {
            minimap: true,
            minerHat: false
        };
        this.keys = 0;
        events.on('UNLOCK_ABILITY', (id) => this.enable(id));
    }

    enable(id) {
        if (id === 'key') {
            this.keys++;
            events.emit('SYSTEM_MESSAGE', `KEY ACQUIRED (Total: ${this.keys})`);
        } else if (this.abilities.hasOwnProperty(id)) {
            this.abilities[id] = true;
            events.emit('SYSTEM_MESSAGE', `${id.toUpperCase()} MODULE INSTALLED`);
        }
    }
}
