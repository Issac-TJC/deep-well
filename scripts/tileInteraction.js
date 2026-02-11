/**
 * ============================================================================
 * MODULE: TILE INTERACTION REGISTRY
 * Handles dynamic logic for interactive tiles (Doors, Switches, Signs, etc.)
 * ============================================================================
 */

const TileInteractions = (function() {
    
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
        register: function(tileId, handler) {
            registry[tileId] = handler;
        },

        /**
         * 主更新循环，由 Map 在每帧调用
         * @param {Game} game - 游戏实例
         * @param {Map} map - 地图实例
         * @param {number} timeScale - 时间缩放因子
         */
        update: function(game, map, timeScale) {
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
                {x: px, y: py}, // 自身（如果踩在上面）
                {x: px+1, y: py}, {x: px-1, y: py}, 
                {x: px, y: py-1}, {x: px, y: py+1}
            ];

            for (let n of neighbors) {
                const tileId = map.getTile(n.x, n.y);
                
                if (registry[tileId]) {
                    const handler = registry[tileId];
                    // 计算精确距离
                    const dist = Math.hypot(
                        (n.x * TILE_SIZE + TILE_SIZE/2) - player.x, 
                        (n.y * TILE_SIZE + TILE_SIZE/2) - player.y
                    );

                    // 如果满足触发距离
                    if (dist < (handler.distance || 20)) {
                        // 尝试进入交互状态
                        if (handler.onNear(game, map, n.x, n.y, timeScale)) {
                            activeInteraction = { handler: handler, x: n.x, y: n.y };
                            // 吞掉当前帧的按键，防止误触
                            game.input.keys['Space'] = false;
                        }
                        return; // 一次只处理一个
                    }
                }
            }
        }
    };
})();

/**
 * ============================================================================
 * 注册具体逻辑：门 (DOOR)
 * ============================================================================
 */
/**
 * ============================================================================
 * 注册具体逻辑：门 (DOOR) - ID: 21
 * ============================================================================
 */
TileInteractions.register(21, {
    distance: 24, // 触发距离

    // 1. 靠近时的逻辑
    onNear: function(game, map, x, y, timeScale) {
        // 只有当玩家有钥匙时，才激活交互会话
        if (game.system.keys > 0) {
            return true; // 进入 onActive
        } else {
            // 没钥匙，仅提示
            if (Math.random() < 0.05) {
                game.ui.showMessage("LOCKED - NEED KEY", "#ff5555", 500);
            }
            return false;
        }
    },

    // 2. 激活状态下的逻辑 (等待按键确认)
    onActive: function(game, map, x, y, timeScale) {
        game.ui.showMessage("OPEN WITH KEY? [SPACE]", "#ffff00", 0);

        // 确认开门 (假设 Space 对应 jump 或者是 action)
        if (game.input.jump) { 
            if (game.system.keys > 0) {
                // --- 核心逻辑 ---
                
                // 1. 消耗钥匙
                game.system.keys--;
                
                // 2. 修改底部 (当前格子): 21(关) -> 22(开)
                // 渲染器会自动处理 ID 22，画出一个开着的门框
                map.setTile(x, y, 22); 

                // 3. 修改顶部 (上方格子): 1(墙) -> 0(空气)
                // 物理层面上，原本挡住头的墙现在消失了，玩家可以通过
                map.setTile(x, y - 1, 0);

                // ----------------
                
                game.ui.showMessage("OPENED", "#aaffaa", 1000);
                
                // 播放开门音效 (如果你的引擎支持)
                // game.audio.play('door_open');

                return true; // 交互结束
            } else {
                game.ui.showMessage("NO KEY!", "#ff5555", 1000);
                return true;
            }
        }
        
        // 玩家移动则取消交互
        if (game.input.left || game.input.right || game.input.up || game.input.down) {
            return true; 
        }

        return false; // 继续等待输入
    }
});