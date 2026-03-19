const dataManager = {
    originalTileData: null,

    openSmart() { document.getElementById('file-loader').click(); },

    onFileSelected(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => this.parseData(e.target.result);
        reader.readAsText(file);
    },

    onTileJsonSelected(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.originalTileData = JSON.parse(e.target.result);
                document.getElementById('tile-js-status').style.display = 'none';
                alert("tiles.json loaded. You can now save patched versions.");
            } catch (err) {
                alert("Invalid JSON format.");
            }
        };
        reader.readAsText(file);
    },

    openImport() { document.getElementById('json-modal').style.display = 'block'; },

    processImport() {
        this.parseData(document.getElementById('json-io').value);
        document.getElementById('json-modal').style.display = 'none';
    },

    parseData(txt) {
        try {
            // Support legacy JS file by stripping out valid JSON
            let jsonStr = txt;
            if (txt.includes("WORLD_LAYOUTS =")) {
                const start = txt.indexOf("{", txt.indexOf("WORLD_LAYOUTS"));
                let count = 0;
                for (let i = start; i < txt.length; i++) {
                    if (txt[i] === '{') count++;
                    if (txt[i] === '}') count--;
                    if (count === 0 && i > start) {
                        jsonStr = txt.substring(start, i + 1);
                        break;
                    }
                }
                jsonStr = jsonStr.replace(/([a-zA-Z0-9_-]+):/g, '"$1":').replace(/'/g, '"');
            }

            const data = JSON.parse(jsonStr);

            const newData = {};
            for (let key in data) {
                newData[key] = data[key].map(rowStr => {
                    if (Array.isArray(rowStr)) return rowStr;
                    return rowStr.split('').map(char => {
                        return getTileValue(char);
                    });
                });
            }

            worldData = newData;
            app.renderPalette();
            app.selectRoom(0, 0);
            alert("Map Loaded!");

        } catch (e) {
            console.error(e);
            alert("Parse error. Check console.");
        }
    },

    saveWithUI() {
        const status = document.getElementById('tile-js-status');
        if (!this.originalTileData) {
            status.style.display = 'block';
            status.innerText = "Warning: tiles.json not loaded. Cannot patch tile definitions.";
        } else {
            status.style.display = 'none';
        }
        document.getElementById('save-modal').style.display = 'flex';
    },

    saveMap() {
        document.getElementById('save-modal').style.display = 'none';

        const outputData = {};
        const keys = Object.keys(worldData).sort((a, b) => {
            const [ax, ay] = a.split(',').map(Number);
            const [bx, by] = b.split(',').map(Number);
            return ay === by ? ax - bx : ay - by;
        });

        keys.forEach((key) => {
            outputData[key] = worldData[key].map(row => {
                return row.map(id => {
                    if (TILE_DEF[id] && TILE_DEF[id].exportChar) {
                        return TILE_DEF[id].exportChar;
                    }
                    const entry = Object.entries(TILE_DATA_MAP).find(([k, v]) => v === id && k.length === 1);
                    return entry ? entry[0] : (id === 0 ? '0' : '?');
                }).join('');
            });
        });

        this.download(JSON.stringify(outputData, null, 4), 'rooms.json');
    },

    savePatchedTileJson() {
        if (!this.originalTileData) {
            alert("Please load the original tiles.json first using the 'LOAD TILES.JSON' button.");
            return;
        }

        let updatedData = JSON.parse(JSON.stringify(this.originalTileData)); // deep copy
        let customCode = `// Generated specific rendering logic for custom tiles\n`;

        NEW_TILES_LIST.forEach(tile => {
            updatedData.TILE_DATA_MAP[tile.char] = tile.id;
            updatedData.TILE_DEF[tile.id] = { name: tile.name, col: parseInt(tile.col), ren: tile.id };
            customCode += `\n// Custom Tile: ${tile.name}\nRenderRegistry.register(${tile.id}, (ctx, tx, ty, x, y, map, def) => {\n    ${tile.code}\n});\n`;
        });

        this.download(JSON.stringify(updatedData, null, 2), 'tiles.json');

        if (NEW_TILES_LIST.length > 0) {
            setTimeout(() => {
                this.download(customCode, 'custom_tiles.js');
            }, 500); // Small delay to allow consecutive downloads
        }

        document.getElementById('save-modal').style.display = 'none';
    },

    download(content, filename) {
        const type = filename.endsWith('.json') ? 'application/json' : 'text/javascript';
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};
