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

const ROOM_LOOT = {
    "0,0": "minimap",
    "2,1": "minerHat",
    "-3,1": "key",
    // "3,0": "extraJump", // 额外跳跃能力（可选）
    // "1,2": "dash",       // 冲刺能力（可选）
};

//通过刺死在刺上刷新房间来进行解密？
//1层水跳4，2层水跳9
