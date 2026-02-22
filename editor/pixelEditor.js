const pixelEditor = {
    canvas: document.getElementById('pixel-canvas'),
    ctx: document.getElementById('pixel-canvas').getContext('2d'),
    gridSize: 16,
    pixels: [],
    currentColor: '#ffffff',

    init() {
        const palContainer = document.getElementById('pe-palette');
        const colorKeys = Object.keys(COLORS).filter(k => typeof COLORS[k] === 'string');
        colorKeys.forEach(k => {
            const s = document.createElement('div');
            s.className = 'color-swatch';
            s.style.backgroundColor = COLORS[k];
            s.title = k;
            s.onclick = () => {
                this.currentColor = COLORS[k];
                document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
                s.classList.add('active');
            };
            palContainer.appendChild(s);
        });

        const customPicker = document.getElementById('pe-custom-color');
        customPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            // Deselect palettes
            document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('active'));
        });

        let drawing = false;
        const paint = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scale = this.canvas.width / rect.width;
            const x = Math.floor((e.clientX - rect.left) * scale / (this.canvas.width / this.gridSize));
            const y = Math.floor((e.clientY - rect.top) * scale / (this.canvas.height / this.gridSize));
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;

            // Handle Right Click Erase
            if (e.buttons === 2) {
                this.pixels[y][x] = null; // Erase
            } else if (e.buttons === 1) {
                this.pixels[y][x] = this.currentColor;
            }

            this.render();
        };

        this.canvas.addEventListener('mousedown', e => {
            // Allow right click now
            drawing = true; paint(e);
        });
        this.canvas.addEventListener('mousemove', e => { if (drawing) paint(e); });
        window.addEventListener('mouseup', () => drawing = false);
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    },

    open() {
        document.getElementById('pixel-editor-panel').style.display = 'flex';
        this.pixels = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        this.render();
    },

    close() { document.getElementById('pixel-editor-panel').style.display = 'none'; },

    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const pSize = w / this.gridSize;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, w, h);

        // Grid
        this.ctx.fillStyle = '#444';
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if ((x + y) % 2 === 0) this.ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
            }
        }

        // Pixels
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.pixels[y][x]) {
                    this.ctx.fillStyle = this.pixels[y][x];
                    this.ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
                }
            }
        }

        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.beginPath();
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.moveTo(i * pSize, 0); this.ctx.lineTo(i * pSize, h);
            this.ctx.moveTo(0, i * pSize); this.ctx.lineTo(w, i * pSize);
        }
        this.ctx.stroke();
    },

    save() {
        const name = document.getElementById('pe-name').value.replace(/\s+/g, '');
        const type = parseInt(document.getElementById('pe-type').value);
        const inputId = parseInt(document.getElementById('pe-id').value);
        const inputChar = document.getElementById('pe-char').value;

        if (!name) return alert("Name required");
        if (!inputId || !inputChar) return alert("ID and Char required");

        // Validation (Soft check)
        if (TILE_DEF[inputId]) {
            if (!confirm(`ID ${inputId} exists (${TILE_DEF[inputId].name}). Overwrite in editor?`)) return;
        }

        const newId = inputId;
        const char = inputChar;

        // 3. Register locally in Editor
        // We use the same ID for render style for simplicity
        const renderStyleId = newId;

        // Compile Pixel Data to JS Code
        let drawCommands = "";
        let fill = "";
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const c = this.pixels[y][x];
                if (c) {
                    if (c !== fill) {
                        drawCommands += `ctx.fillStyle = '${c}'; `;
                        fill = c;
                    }
                    drawCommands += `ctx.fillRect(tx+${x}, ty+${y}, 1, 1); `;
                }
            }
        }

        // Create the Runtime Strategy
        RenderRegistry.register(renderStyleId, new Function('ctx', 'tx', 'ty', 'x', 'y', 'map', 'def', drawCommands));

        // Update Editor Defs
        TILE_DEF[newId] = {
            name: name,
            col: type,
            ren: renderStyleId,
            exportChar: char // Store strictly for export
        };
        // Update local mapping for the editor session
        TILE_DATA_MAP[char] = newId;
        TILE_DATA_MAP[newId] = newId;

        // 4. Store Data for tile.js Patcher
        NEW_TILES_LIST.push({
            id: newId,
            char: char,
            name: name,
            col: type,
            code: drawCommands
        });

        app.renderPalette();
        this.close();
        app.showMessage(`Saved ${name} as '${char}'`);
    }
};
