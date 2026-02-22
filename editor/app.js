const app = {
    mode: 'world',
    curRx: 0,
    curRy: 0,
    selectedTile: 1,
    tool: 'pencil',
    isDrawing: false,
    history: [],
    redoStack: [],
    clipboard: null,

    ctxRoom: document.getElementById('room-canvas').getContext('2d'),
    ctxWorld: document.getElementById('world-canvas').getContext('2d'),
    ctxMini: document.getElementById('minimap-canvas').getContext('2d'),

    camX: 0, camY: 0, zoom: 0.5,
    isDragging: false, lastMouse: { x: 0, y: 0 }, keys: {},

    init() {
        this.renderPalette();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupInputs();
        this.setMode('world');
        this.centerView();
        this.drawWorld();
        this.setupDraggable();
    },

    setupDraggable() {
        const overlay = document.getElementById('minimap-overlay');
        const header = document.getElementById('minimap-header');
        let isDragging = false;
        let startX, startY, initLeft, initTop;

        header.addEventListener('mousedown', e => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            // Get current computed position since it might be absolute
            const rect = overlay.getBoundingClientRect();
            // We need relative position to viewport to set style.top/left
            initLeft = rect.left;
            initTop = rect.top;

            // Disable text selection during drag
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Remove 'right' property if it exists so left takes over
            overlay.style.right = 'auto';
            overlay.style.left = (initLeft + dx) + 'px';
            overlay.style.top = (initTop + dy) + 'px';
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = 'auto';
        });
    },

    resizeCanvas() {
        const vp = document.getElementById('viewport');
        const cvs = document.getElementById('world-canvas');
        cvs.width = vp.clientWidth;
        cvs.height = vp.clientHeight;
        if (this.mode === 'world') this.drawWorld();
    },

    setMode(m) {
        this.mode = m;
        document.getElementById('btn-mode-world').className = m === 'world' ? 'active' : '';
        document.getElementById('btn-mode-room').className = m === 'room' ? 'active' : '';
        document.getElementById('status-bar').innerText = m === 'world' ? 'Mode: World Map' : 'Mode: Room Editor';

        document.getElementById('room-canvas').style.display = m === 'room' ? 'block' : 'none';
        document.getElementById('world-canvas').style.display = m === 'world' ? 'block' : 'none';

        // Minimap is visible in both modes? Usually room editor only.
        // User asked for "upper right minimap", usually context for Room Editor.
        document.getElementById('minimap-overlay').style.display = m === 'room' ? 'flex' : 'none';

        if (m === 'room') {
            this.drawRoom();
            this.drawMinimap();
        } else {
            this.drawWorld();
        }
    },

    setTool(t) {
        this.tool = t;
        document.getElementById('tool-pencil').className = t === 'pencil' ? 'active' : '';
        document.getElementById('tool-bucket').className = t === 'bucket' ? 'active' : '';
    },

    showMessage(msg, type = 'info') {
        const el = document.getElementById('status-message');
        el.innerText = msg;
        el.style.color = type === 'error' ? '#ff5555' : '#fff';
        setTimeout(() => el.innerText = '', 2000);
    },

    // --- DRAWING LOGIC ---

    drawRoom() {
        if (this.mode !== 'room') return;
        const ctx = this.ctxRoom;
        const key = `${this.curRx},${this.curRy}`;
        const data = worldData[key] || Array(ROOM_ROWS).fill().map(() => Array(ROOM_COLS).fill(0));

        ctx.clearRect(0, 0, 480, 288);

        // Create Adapter
        const mockMap = new MockMap(data);

        for (let y = 0; y < ROOM_ROWS; y++) {
            for (let x = 0; x < ROOM_COLS; x++) {
                const tid = data[y][x];
                if (tid !== 0) {
                    const def = getTileDef(tid);
                    if (def) {
                        const renderer = RenderRegistry.get(def.ren);
                        if (renderer) {
                            renderer(ctx, x * TILE_SIZE, y * TILE_SIZE, x, y, mockMap, def);
                        } else {
                            // Fallback
                            ctx.fillStyle = "#f0f";
                            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        }

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= ROOM_COLS; x++) { ctx.moveTo(x * TILE_SIZE, 0); ctx.lineTo(x * TILE_SIZE, 288); }
        for (let y = 0; y <= ROOM_ROWS; y++) { ctx.moveTo(0, y * TILE_SIZE); ctx.lineTo(480, y * TILE_SIZE); }
        ctx.stroke();
    },

    drawWorld() {
        if (this.mode !== 'world') return;
        const ctx = this.ctxWorld;
        const cvs = document.getElementById('world-canvas');

        ctx.fillStyle = "#090909";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        const roomW = 60 * this.zoom;
        const roomH = 36 * this.zoom;
        const gap = 4 * this.zoom;
        const cellW = roomW + gap;
        const cellH = roomH + gap;

        // Grid Lines
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
        const startX = (this.camX % cellW) - cellW;
        const startY = (this.camY % cellH) - cellH;

        ctx.beginPath();
        for (let x = startX; x < cvs.width + cellW; x += cellW) { ctx.moveTo(x, 0); ctx.lineTo(x, cvs.height); }
        for (let y = startY; y < cvs.height + cellH; y += cellH) { ctx.moveTo(0, y); ctx.lineTo(cvs.width, y); }
        ctx.stroke();

        // Origin Lines
        ctx.strokeStyle = "#444";
        ctx.beginPath();
        ctx.moveTo(0, this.camY); ctx.lineTo(cvs.width, this.camY);
        ctx.moveTo(this.camX, 0); ctx.lineTo(this.camX, cvs.height);
        ctx.stroke();

        // Rooms
        for (let key in worldData) {
            const [rx, ry] = key.split(',').map(Number);
            const scX = this.camX + (rx * cellW);
            const scY = this.camY + (ry * cellH);

            if (scX + roomW < 0 || scX > cvs.width || scY + roomH < 0 || scY > cvs.height) continue;

            ctx.fillStyle = "#333344";
            ctx.fillRect(scX, scY, roomW, roomH);
            ctx.strokeStyle = "#555";
            ctx.strokeRect(scX, scY, roomW, roomH);

            // Preview
            const rData = worldData[key];
            const pSize = roomW / ROOM_COLS;
            if (this.zoom > 0.4 && rData) {
                for (let r = 0; r < ROOM_ROWS; r++) {
                    if (!rData[r]) continue;
                    for (let c = 0; c < ROOM_COLS; c++) {
                        const tid = rData[r][c];
                        if (tid !== 0 && TILE_DEF[tid]) {
                            const def = TILE_DEF[tid];
                            // Try to guess a representative color for preview
                            if (def.col === COLLISION_TYPE.SOLID || def.isSecret) {
                                if (def.isSecret) continue;
                                if (def.ren === RENDER_STYLE.DOOR_OPEN) continue;
                                if (def.ren === RENDER_STYLE.DOOR_CLOSED) ctx.fillStyle = COLORS.mapClosed;
                                else if (def.isTransparent) ctx.fillStyle = COLORS.mapTransparent;
                                else ctx.fillStyle = COLORS.tileDark;
                            }
                            else if (def.col === COLLISION_TYPE.LIQUID) ctx.fillStyle = COLORS.waterSurface;
                            else if (def.col === COLLISION_TYPE.HAZARD) ctx.fillStyle = "#ff0000"; // Red Spikes
                            else ctx.fillStyle = "#888";

                            // If it's a generated tile with raw fillStyle in render, we can't easily guess, so default to gray

                            ctx.fillRect(scX + c * pSize, scY + r * pSize, pSize, pSize);
                        }
                    }
                }
            }

            if (this.zoom > 0.6) {
                ctx.fillStyle = "white";
                ctx.font = `${10 * this.zoom}px monospace`;
                ctx.fillText(`${rx},${ry}`, scX + 2, scY + 12 * this.zoom);
            }
        }

        const selScX = this.camX + (this.curRx * cellW);
        const selScY = this.camY + (this.curRy * cellH);

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(selScX, selScY, roomW, roomH);
    },

    drawMinimap() {
        const ctx = this.ctxMini;
        const cvs = document.getElementById('minimap-canvas');

        // Use container size but maintain internal logical resolution if needed, 
        // or just let canvas stretch. 
        // For crisp pixels, we should probably resize canvas to match container pixel size?
        // But the user asked for 30:18 scaling. Let's fix the drawing logic scale.

        const contentDiv = document.getElementById('minimap-content');
        if (contentDiv.clientWidth !== cvs.width || contentDiv.clientHeight !== cvs.height) {
            // Auto resize canvas to fit container (Resizable Window)
            cvs.width = contentDiv.clientWidth;
            cvs.height = contentDiv.clientHeight;
        }

        ctx.clearRect(0, 0, cvs.width, cvs.height);

        // 3x3 rooms. Each room is 30x18 units.
        // Total grid is 90x54 units.
        // We need to scale this to fit the canvas.

        const totalW = 90;
        const totalH = 54;

        // Calculate scale to fit
        const scale = Math.min(cvs.width / totalW, cvs.height / totalH) * 0.9; // 0.9 for padding

        const roomPixW = 30 * scale;
        const roomPixH = 18 * scale;

        const centerX = cvs.width / 2;
        const centerY = cvs.height / 2;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = this.curRx + dx;
                const ty = this.curRy + dy;
                const key = `${tx},${ty}`;
                const drawX = centerX + (dx * roomPixW) - (roomPixW / 2);
                const drawY = centerY + (dy * roomPixH) - (roomPixH / 2);

                // Draw Grid Slot
                ctx.strokeStyle = "rgba(100,100,100,0.5)";
                ctx.lineWidth = 1;
                ctx.strokeRect(drawX, drawY, roomPixW, roomPixH);

                if (worldData[key]) {
                    // Match World Map Colors
                    // Active Room: Highlighted slightly lighter
                    // Others: Dark background
                    ctx.fillStyle = (dx === 0 && dy === 0) ? "#444455" : "#333344";
                    ctx.fillRect(drawX, drawY, roomPixW, roomPixH);

                    const rData = worldData[key];
                    const dotW = roomPixW / ROOM_COLS;
                    const dotH = roomPixH / ROOM_ROWS;

                    for (let r = 0; r < ROOM_ROWS; r++) {
                        if (!rData[r]) continue;
                        for (let c = 0; c < ROOM_COLS; c++) {
                            const tid = rData[r][c];
                            if (tid !== 0) {
                                ctx.fillStyle = "#888";
                                // Add specific colors for minimap too if desired
                                const def = TILE_DEF[tid];
                                if (def) {
                                    if (def.col === COLLISION_TYPE.HAZARD) ctx.fillStyle = "#d44";
                                    else if (def.col === COLLISION_TYPE.SOLID) ctx.fillStyle = "#112";
                                }
                                ctx.fillRect(drawX + c * dotW, drawY + r * dotH, Math.ceil(dotW), Math.ceil(dotH));
                            }
                        }
                    }
                }

                // Current Room Border Highlight
                if (dx === 0 && dy === 0) {
                    ctx.strokeStyle = "#0f0";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(drawX, drawY, roomPixW, roomPixH);
                }
            }
        }
    },

    // --- INTERACTION ---

    renderPalette() {
        const p = document.getElementById('palette');
        p.innerHTML = '';
        Object.keys(TILE_DEF).forEach(k => {
            const def = TILE_DEF[k];
            const div = document.createElement('div');
            div.className = `p-btn ${parseInt(k) === this.selectedTile ? 'active' : ''}`;

            // Generate Preview
            const cvs = document.createElement('canvas');
            cvs.width = 16; cvs.height = 16;
            const ctx = cvs.getContext('2d');

            // Use the actual render function for preview!
            const renderer = RenderRegistry.get(def.ren);
            if (renderer) {
                // Mock map for preview
                const mock = new MockMap([[]]);
                // We need to fool the renderer for context aware tiles
                mock.getTile = () => parseInt(k);

                try {
                    renderer(ctx, 0, 0, 0, 0, mock, def);
                } catch (e) {
                    ctx.fillStyle = "#f00"; ctx.fillRect(0, 0, 16, 16);
                }
            } else {
                ctx.fillStyle = "#333"; ctx.fillRect(0, 0, 16, 16);
            }

            div.appendChild(cvs);
            div.title = `${def.name} (ID: ${k})`;
            // Show custom tag if it has an export char assigned
            if (def.exportChar) {
                const tag = document.createElement('div');
                tag.style = "position:absolute; bottom:0; right:0; font-size:8px; background:rgba(0,0,0,0.8); color:#0f0;";
                tag.innerText = def.exportChar;
                div.appendChild(tag);
            }

            div.onclick = () => {
                this.selectedTile = parseInt(k);
                this.renderPalette();
            };
            p.appendChild(div);
        });
    },

    setupInputs() {
        window.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            this.keys[e.code] = true;
            if (e.ctrlKey || e.metaKey) {
                switch (e.code) {
                    case 'KeyC': e.preventDefault(); this.copyRoom(); break;
                    case 'KeyX': e.preventDefault(); this.cutRoom(); break;
                    case 'KeyV': e.preventDefault(); this.pasteRoom(); break;
                    case 'KeyS': e.preventDefault(); dataManager.saveWithUI(); break;
                    case 'KeyZ': e.preventDefault(); this.undo(); break;
                    case 'KeyY': e.preventDefault(); this.redo(); break;
                }
            }
            if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); this.deleteRoom(); }
            if (e.code === 'KeyP') this.setTool('pencil');
            if (e.code === 'KeyB') this.setTool('bucket');
        });

        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // World Canvas Events
        const wCvs = document.getElementById('world-canvas');
        wCvs.addEventListener('contextmenu', e => e.preventDefault());
        wCvs.addEventListener('mousedown', e => {
            if (e.button === 1 || e.button === 2 || (e.button === 0 && this.keys['Space'])) {
                e.preventDefault();
                this.isDragging = true;
                this.lastMouse = { x: e.clientX, y: e.clientY };
                wCvs.style.cursor = 'grabbing';
            }
        });
        window.addEventListener('mousemove', e => {
            if (this.isDragging && this.mode === 'world') {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                this.camX += dx;
                this.camY += dy;
                this.lastMouse = { x: e.clientX, y: e.clientY };
                this.drawWorld();
            }
        });
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isDrawing = false;
            wCvs.style.cursor = 'grab';
        });
        wCvs.addEventListener('click', e => {
            if (e.button !== 0 || this.keys['Space'] || this.isDragging) return;
            const rect = wCvs.getBoundingClientRect();
            const gridX = Math.round((e.clientX - rect.left - this.camX) / ((64) * this.zoom));
            const gridY = Math.round((e.clientY - rect.top - this.camY) / ((40) * this.zoom));
            this.selectRoom(gridX, gridY);
        });
        wCvs.addEventListener('dblclick', e => {
            if (e.button !== 0) return;
            this.editCurrentRoom();
        });
        wCvs.addEventListener('wheel', e => {
            e.preventDefault();
            const rect = wCvs.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const delta = -e.deltaY * 0.001;
            const oldZoom = this.zoom;
            let newZoom = Math.max(0.1, Math.min(oldZoom + delta, 5.0));
            const worldX = (mouseX - this.camX) / oldZoom;
            const worldY = (mouseY - this.camY) / oldZoom;
            this.camX = mouseX - (worldX * newZoom);
            this.camY = mouseY - (worldY * newZoom);
            this.zoom = newZoom;
            this.drawWorld();
        });

        // Room Canvas Events
        const rCvs = document.getElementById('room-canvas');
        const paint = (e, isClick) => {
            const rect = rCvs.getBoundingClientRect();
            const scaleX = rCvs.width / rect.width;
            const scaleY = rCvs.height / rect.height;
            const x = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
            const y = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

            if (x < 0 || x >= ROOM_COLS || y < 0 || y >= ROOM_ROWS) return;

            const key = `${this.curRx},${this.curRy}`;
            if (!worldData[key]) worldData[key] = Array(ROOM_ROWS).fill().map(() => Array(ROOM_COLS).fill(0));

            let val = this.selectedTile;
            // Right click removed from erase logic
            if (e.buttons === 2) return;

            // ============================================
            // VALIDATION LOGIC FOR DOORS (ID 21 & 22)
            // ============================================
            if (val === 21) { // Closed Door
                if (y === 0) {
                    this.showMessage("Cannot place door at top edge!", 'error');
                    return;
                }
                const tileAbove = worldData[key][y - 1][x];
                if (tileAbove !== 1) { // Must be Wall (1)
                    this.showMessage("Closed Door must be under a Wall (1)!", 'error');
                    return;
                }
            } else if (val === 22) { // Open Door
                if (y === 0) {
                    this.showMessage("Cannot place door at top edge!", 'error');
                    return;
                }
                const tileAbove = worldData[key][y - 1][x];
                if (tileAbove !== 0) { // Must be Air (0)
                    this.showMessage("Open Door must be under Air (0)!", 'error');
                    return;
                }
            }
            // ============================================

            if (this.tool === 'bucket' && isClick && e.buttons === 1) {
                this.floodFill(x, y, val);
            } else {
                worldData[key][y][x] = val;
            }
            this.drawRoom();
            this.drawMinimap();
        };

        rCvs.addEventListener('mousedown', e => {
            if (e.buttons === 2) return; // Ignore right click start
            this.saveState();
            this.isDrawing = true;
            paint(e, true);
        });
        rCvs.addEventListener('mousemove', e => { if (this.isDrawing) paint(e, false); });
        rCvs.addEventListener('contextmenu', e => e.preventDefault());
    },

    floodFill(x, y, val) {
        const key = `${this.curRx},${this.curRy}`;
        const grid = worldData[key];
        const target = grid[y][x];
        if (target === val) return;
        const stack = [[x, y]];
        while (stack.length) {
            const [cx, cy] = stack.pop();
            if (cx < 0 || cx >= ROOM_COLS || cy < 0 || cy >= ROOM_ROWS) continue;
            if (grid[cy][cx] === target) {
                grid[cy][cx] = val;
                stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
            }
        }
    },

    // Standard CRUD
    saveState() {
        if (this.mode !== 'room') return;
        const key = `${this.curRx},${this.curRy}`;
        if (!worldData[key]) return;
        const state = worldData[key].map(row => [...row]);
        this.history.push({ key, data: state });
        if (this.history.length > 50) this.history.shift();
        this.redoStack = [];
    },
    undo() {
        if (this.history.length === 0) return this.showMessage("Nothing to Undo");
        const s = this.history.pop();
        this.redoStack.push({ key: s.key, data: worldData[s.key].map(r => [...r]) });
        worldData[s.key] = s.data;
        if (s.key === `${this.curRx},${this.curRy}`) this.drawRoom();
        this.showMessage("Undo");
    },
    redo() {
        if (this.redoStack.length === 0) return this.showMessage("Nothing to Redo");
        const s = this.redoStack.pop();
        this.history.push({ key: s.key, data: worldData[s.key].map(r => [...r]) });
        worldData[s.key] = s.data;
        if (s.key === `${this.curRx},${this.curRy}`) this.drawRoom();
        this.showMessage("Redo");
    },
    copyRoom() {
        const key = `${this.curRx},${this.curRy}`;
        if (worldData[key]) {
            this.clipboard = worldData[key].map(row => [...row]);
            this.showMessage("Copied");
        }
    },
    cutRoom() {
        this.copyRoom();
        this.clearRoomContent();
    },
    pasteRoom() {
        if (!this.clipboard) return;
        this.saveState();
        worldData[`${this.curRx},${this.curRy}`] = this.clipboard.map(row => [...row]);
        this.drawRoom();
        this.showMessage("Pasted");
    },
    deleteRoom() {
        if (confirm("Delete Room?")) {
            delete worldData[`${this.curRx},${this.curRy}`];
            this.drawRoom();
            this.drawWorld();
        }
    },
    clearRoomContent() {
        this.saveState();
        worldData[`${this.curRx},${this.curRy}`] = Array(ROOM_ROWS).fill().map(() => Array(ROOM_COLS).fill(0));
        this.drawRoom();
    },
    selectRoom(x, y) { this.curRx = x; this.curRy = y; if (this.mode === 'room') this.drawRoom(); else this.drawWorld(); },
    editCurrentRoom() {
        if (!worldData[`${this.curRx},${this.curRy}`]) worldData[`${this.curRx},${this.curRy}`] = Array(ROOM_ROWS).fill().map(() => Array(ROOM_COLS).fill(0));
        this.setMode('room');
    },
    centerView() { this.camX = document.getElementById('world-canvas').width / 2; this.camY = document.getElementById('world-canvas').height / 2; }
};
