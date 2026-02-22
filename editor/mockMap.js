// Mocks the Game Map interface so we can pass it to RenderRegistry functions
class MockMap {
    constructor(data) {
        this.data = data; // 2D array of IDs
        this.cols = ROOM_COLS;
        this.rows = ROOM_ROWS;
        this.bouncingTiles = {};
        this.visible = Array(ROOM_ROWS).fill().map(() => Array(ROOM_COLS).fill(true));
    }

    getTile(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return 0;
        return this.data[y][x];
    }

    isRevealed(x, y) { return true; } // Editor always sees all
    isSpikeDestroyed(x, y) { return false; } // Editor spikes always intact
}
