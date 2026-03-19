/**
 * ============================================================================
 * MODULE: TILE INTERACTION REGISTRY
 * Handles dynamic logic for interactive tiles (Doors, Switches, Signs, etc.)
 * ============================================================================
 */

const TileInteractions = (function () {

    // 注册表：存储不同 Tile ID 对应的逻辑
    const registry = {};

    // 内部状态：用于处理持续性交互（如等待按键确认）
    let activeInteraction = null;

    return {
        /**
         * 注册交互逻辑
         * @param {number} tileId - 目标 Tile ID
         * @param {object} handler - 包含 check(), onNear(), onActive() 等方法
         */
        register: function (tileId, handler) {
            registry[tileId] = handler;
        },

        /**
         * 主更新循环，由 Map 在每帧调用
         * @param {Game} game - 游戏实例
         * @param {Map} map - 地图实例
         * @param {number} timeScale - 时间缩放因子
         */
        update: function (game, map, timeScale) {
            const player = game.player;

            // 1. 如果有正在进行的交互会话（例如弹窗等待输入），优先处理
            if (activeInteraction) {
                const finished = activeInteraction.handler.onActive(game, map, activeInteraction.x, activeInteraction.y, timeScale);
                if (finished) {
                    activeInteraction = null;
                    game.ui.showMessage(""); // 清理 UI
                }
                return; // 阻塞其他交互搜索
            }

            // 2. 搜索玩家周围的 Tile
            const px = Math.floor(player.x / TILE_SIZE);
            const py = Math.floor(player.y / TILE_SIZE);
            // 检查 4 邻域
            const neighbors = [
                { x: px, y: py }, // 自身（如果踩在上面）
                { x: px + 1, y: py }, { x: px - 1, y: py },
                { x: px, y: py - 1 }, { x: px, y: py + 1 }
            ];

            for (let n of neighbors) {
                const tileId = map.getTile(n.x, n.y);

                if (registry[tileId]) {
                    const handler = registry[tileId];
                    // 计算精确距离
                    const dist = Math.hypot(
                        (n.x * TILE_SIZE + TILE_SIZE / 2) - player.x,
                        (n.y * TILE_SIZE + TILE_SIZE / 2) - player.y
                    );

                    // 如果满足触发距离
                    if (dist < (handler.distance || 20)) {
                        // 尝试进入交互状态
                        if (handler.onNear(game, map, n.x, n.y, timeScale)) {
                            activeInteraction = { handler: handler, x: n.x, y: n.y };
                            // 吞掉当前帧的按键，防止误触
                            game.input.keys['e'] = false;
                            game.input.keys['E'] = false;
                        }
                        return; // 一次只处理一个
                    }
                }
            }
        },
        /**
         * Load interactions dynamically from JSON config
         */
        registerFromData: function (interactionsData) {
            for (let id in interactionsData) {
                const config = interactionsData[id];
                if (config.type === "door") {
                    this.register(parseInt(id), {
                        distance: config.distance || 24,
                        onNear: function (game, map, x, y, timeScale) {
                            if (game.system.keys >= config.requirements.keys) {
                                return true;
                            } else {
                                if (Math.random() < 0.05) {
                                    game.ui.showMessage(config.messages.locked.text, config.messages.locked.color, 500);
                                }
                                return false;
                            }
                        },
                        onActive: function (game, map, x, y, timeScale) {
                            game.ui.showMessage(config.messages.active.text, config.messages.active.color, 0);

                            if (game.input.interact) {
                                if (game.system.keys >= config.requirements.keys) {
                                    game.system.keys -= config.effects.consumeKey;
                                    map.setTile(x, y, config.effects.changeTile);
                                    if (config.effects.clearTop) map.setTile(x, y - 1, 0);
                                    game.ui.showMessage(config.messages.opened.text, config.messages.opened.color, 1000);
                                    return true;
                                } else {
                                    game.ui.showMessage(config.messages.notEnough.text, config.messages.notEnough.color, 1000);
                                    return true;
                                }
                            }

                            if (game.input.left || game.input.right || game.input.up || game.input.down) {
                                return true;
                            }
                            return false;
                        }
                    });
                }
            }
        }
    };
})();

