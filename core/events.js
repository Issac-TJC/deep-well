// --- Event Bus (Decoupling Mechanism) ---
class EventBus {
    constructor() { this.listeners = {}; }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}
const events = new EventBus(); // Global singleton for the game
