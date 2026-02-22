// 1. Basic Block 
RenderRegistry.register(RENDER_STYLE.BLOCK_BASIC, (ctx, tx, ty, x, y, map, def) => {
    ctx.save();
    const bounceOff = map.bouncingTiles[`${x},${y}`] || 0;
    if (bounceOff !== 0) ctx.translate(0, bounceOff);
    if (def.isSecret && map.isRevealed(x, y)) ctx.globalAlpha = 0.4;

    ctx.fillStyle = def.customColor || COLORS.tileDark;
    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

    // Add texture details
    if ((x + y) % 2 === 0) {
        ctx.fillStyle = COLORS.tileLight;
        ctx.fillRect(tx + 2, ty + 2, 4, 4);
        ctx.fillRect(tx + 8, ty + 8, 2, 2);
        ctx.fillRect(tx + 12, ty + 4, 2, 2);
    }

    // Draw borders (Void edges)
    ctx.fillStyle = COLORS.tileHighlight;
    const edgeW = 2;
    const isRegionInside = (nx, ny) => {
        if (nx < 0 || nx >= map.cols || ny < 0 || ny >= map.rows) return false;
        // In editor, everything is revealed, so just check void
        const tileId = getTileValue(map.getTile(nx, ny));
        const ntDef = getTileDef(tileId);
        return ntDef.isVoid && !ntDef.isSecret;
    };

    if (isRegionInside(x, y - 1)) ctx.fillRect(tx, ty, TILE_SIZE, edgeW);
    if (isRegionInside(x, y + 1)) ctx.fillRect(tx, ty + TILE_SIZE - edgeW, TILE_SIZE, edgeW);
    if (isRegionInside(x - 1, y)) ctx.fillRect(tx, ty, edgeW, TILE_SIZE);
    if (isRegionInside(x + 1, y)) ctx.fillRect(tx + TILE_SIZE - edgeW, ty, edgeW, TILE_SIZE);
    ctx.restore();
});

// 2. Liquid 
RenderRegistry.register(RENDER_STYLE.LIQUID, (ctx, tx, ty) => {
    ctx.fillStyle = COLORS.waterBase;
    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
});

// 3. Ladder
RenderRegistry.register(RENDER_STYLE.LADDER, (ctx, tx, ty) => {
    ctx.fillStyle = COLORS.ladder;
    ctx.fillRect(tx + 4, ty, 2, TILE_SIZE);
    ctx.fillRect(tx + 10, ty, 2, TILE_SIZE);
    for (let i = 2; i < TILE_SIZE; i += 5) ctx.fillRect(tx + 4, ty + i, 8, 1);
});

// 4. Wood Platform
RenderRegistry.register(RENDER_STYLE.PLATFORM_WOOD, (ctx, tx, ty, x, y, map) => {
    ctx.fillStyle = COLORS.woodLight;
    ctx.fillRect(tx, ty, TILE_SIZE, 3);
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(tx + 2, ty + 3, 2, 2);
    ctx.fillRect(tx + 8, ty + 3, 2, 2);
    ctx.fillRect(tx + 12, ty + 3, 2, 2);

    const leftId = getTileValue(map.getTile(x - 1, y));
    const rightId = getTileValue(map.getTile(x + 1, y));
    const leftDef = getTileDef(leftId);
    const rightDef = getTileDef(rightId);
    ctx.fillStyle = COLORS.woodDetail;

    if (leftDef.col === COLLISION_TYPE.SOLID) {
        ctx.beginPath(); ctx.moveTo(tx, ty + 3); ctx.lineTo(tx, ty + 10); ctx.lineTo(tx + 7, ty + 3); ctx.fill();
    }
    if (rightDef.col === COLLISION_TYPE.SOLID) {
        ctx.beginPath(); ctx.moveTo(tx + 16, ty + 3); ctx.lineTo(tx + 16, ty + 10); ctx.lineTo(tx + 9, ty + 3); ctx.fill();
    }
});

// 5. Spikes
RenderRegistry.register(RENDER_STYLE.SPIKE_ROCK, (ctx, tx, ty, x, y, map) => {
    if (map.isSpikeDestroyed(x, y)) return;
    const seed = (x * 37 + y * 13) % 100;

    ctx.fillStyle = COLORS.spike;
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty + TILE_SIZE);
    ctx.lineTo(tx + 4 + (seed % 4), ty + 2 + (seed % 6));
    ctx.lineTo(tx + 10, ty + TILE_SIZE);
    ctx.lineTo(tx + 14, ty + TILE_SIZE);
    ctx.lineTo(tx + 12, ty + 6 + (seed % 4));
    ctx.lineTo(tx + 8, ty + TILE_SIZE);
    ctx.fill();

    ctx.fillStyle = COLORS.spikeDark;
    ctx.beginPath();
    ctx.moveTo(tx + 4 + (seed % 4), ty + 2 + (seed % 6));
    ctx.lineTo(tx + 5 + (seed % 4), ty + TILE_SIZE);
    ctx.lineTo(tx + 3 + (seed % 4), ty + TILE_SIZE);
    ctx.fill();
});

// 6. Glass (Solid but transparent, with no bounce)
RenderRegistry.register(RENDER_STYLE.GLASS, (ctx, tx, ty) => {
    ctx.fillStyle = '#888888'; ctx.fillRect(tx + 0, ty + 0, 1, 1); ctx.fillRect(tx + 1, ty + 0, 1, 1); ctx.fillRect(tx + 2, ty + 0, 1, 1); ctx.fillRect(tx + 3, ty + 0, 1, 1); ctx.fillRect(tx + 4, ty + 0, 1, 1); ctx.fillRect(tx + 5, ty + 0, 1, 1); ctx.fillRect(tx + 6, ty + 0, 1, 1); ctx.fillRect(tx + 7, ty + 0, 1, 1); ctx.fillRect(tx + 8, ty + 0, 1, 1); ctx.fillRect(tx + 9, ty + 0, 1, 1); ctx.fillRect(tx + 10, ty + 0, 1, 1); ctx.fillRect(tx + 11, ty + 0, 1, 1); ctx.fillRect(tx + 12, ty + 0, 1, 1); ctx.fillRect(tx + 13, ty + 0, 1, 1); ctx.fillRect(tx + 14, ty + 0, 1, 1); ctx.fillRect(tx + 15, ty + 0, 1, 1); ctx.fillRect(tx + 0, ty + 1, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 1, ty + 1, 1, 1); ctx.fillRect(tx + 2, ty + 1, 1, 1); ctx.fillRect(tx + 3, ty + 1, 1, 1); ctx.fillRect(tx + 4, ty + 1, 1, 1); ctx.fillRect(tx + 5, ty + 1, 1, 1); ctx.fillRect(tx + 6, ty + 1, 1, 1); ctx.fillRect(tx + 7, ty + 1, 1, 1); ctx.fillRect(tx + 8, ty + 1, 1, 1); ctx.fillRect(tx + 9, ty + 1, 1, 1); ctx.fillRect(tx + 10, ty + 1, 1, 1); ctx.fillRect(tx + 11, ty + 1, 1, 1); ctx.fillRect(tx + 12, ty + 1, 1, 1); ctx.fillRect(tx + 13, ty + 1, 1, 1); ctx.fillRect(tx + 14, ty + 1, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 1, 1, 1); ctx.fillRect(tx + 0, ty + 2, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 1, ty + 2, 1, 1); ctx.fillRect(tx + 2, ty + 2, 1, 1); ctx.fillRect(tx + 3, ty + 2, 1, 1); ctx.fillRect(tx + 4, ty + 2, 1, 1); ctx.fillRect(tx + 5, ty + 2, 1, 1); ctx.fillRect(tx + 6, ty + 2, 1, 1); ctx.fillRect(tx + 7, ty + 2, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 8, ty + 2, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 9, ty + 2, 1, 1); ctx.fillRect(tx + 10, ty + 2, 1, 1); ctx.fillRect(tx + 11, ty + 2, 1, 1); ctx.fillRect(tx + 12, ty + 2, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 13, ty + 2, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 14, ty + 2, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 2, 1, 1); ctx.fillRect(tx + 0, ty + 3, 1, 1); ctx.fillRect(tx + 7, ty + 3, 1, 1); ctx.fillRect(tx + 12, ty + 3, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 3, 1, 1); ctx.fillRect(tx + 14, ty + 3, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 3, 1, 1); ctx.fillRect(tx + 0, ty + 4, 1, 1); ctx.fillRect(tx + 6, ty + 4, 1, 1); ctx.fillRect(tx + 11, ty + 4, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 4, 1, 1); ctx.fillRect(tx + 14, ty + 4, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 4, 1, 1); ctx.fillRect(tx + 0, ty + 5, 1, 1); ctx.fillRect(tx + 5, ty + 5, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 5, 1, 1); ctx.fillRect(tx + 14, ty + 5, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 5, 1, 1); ctx.fillRect(tx + 0, ty + 6, 1, 1); ctx.fillRect(tx + 4, ty + 6, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 6, 1, 1); ctx.fillRect(tx + 14, ty + 6, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 6, 1, 1); ctx.fillRect(tx + 0, ty + 7, 1, 1); ctx.fillRect(tx + 3, ty + 7, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 7, 1, 1); ctx.fillRect(tx + 14, ty + 7, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 7, 1, 1); ctx.fillRect(tx + 0, ty + 8, 1, 1); ctx.fillRect(tx + 12, ty + 8, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 8, 1, 1); ctx.fillRect(tx + 14, ty + 8, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 8, 1, 1); ctx.fillRect(tx + 0, ty + 9, 1, 1); ctx.fillRect(tx + 11, ty + 9, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 9, 1, 1); ctx.fillRect(tx + 14, ty + 9, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 9, 1, 1); ctx.fillRect(tx + 0, ty + 10, 1, 1); ctx.fillRect(tx + 10, ty + 10, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 10, 1, 1); ctx.fillRect(tx + 14, ty + 10, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 10, 1, 1); ctx.fillRect(tx + 0, ty + 11, 1, 1); ctx.fillRect(tx + 4, ty + 11, 1, 1); ctx.fillRect(tx + 9, ty + 11, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 11, 1, 1); ctx.fillRect(tx + 14, ty + 11, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 11, 1, 1); ctx.fillRect(tx + 0, ty + 12, 1, 1); ctx.fillRect(tx + 3, ty + 12, 1, 1); ctx.fillRect(tx + 8, ty + 12, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 12, 1, 1); ctx.fillRect(tx + 14, ty + 12, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 12, 1, 1); ctx.fillRect(tx + 0, ty + 13, 1, 1); ctx.fillRect(tx + 2, ty + 13, 1, 1); ctx.fillRect(tx + 7, ty + 13, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 13, 1, 1); ctx.fillRect(tx + 14, ty + 13, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 13, 1, 1); ctx.fillRect(tx + 0, ty + 14, 1, 1); ctx.fillStyle = '#666677'; ctx.fillRect(tx + 13, ty + 14, 1, 1); ctx.fillRect(tx + 14, ty + 14, 1, 1); ctx.fillStyle = '#888888'; ctx.fillRect(tx + 15, ty + 14, 1, 1); ctx.fillRect(tx + 0, ty + 15, 1, 1); ctx.fillRect(tx + 1, ty + 15, 1, 1); ctx.fillRect(tx + 2, ty + 15, 1, 1); ctx.fillRect(tx + 3, ty + 15, 1, 1); ctx.fillRect(tx + 4, ty + 15, 1, 1); ctx.fillRect(tx + 5, ty + 15, 1, 1); ctx.fillRect(tx + 6, ty + 15, 1, 1); ctx.fillRect(tx + 7, ty + 15, 1, 1); ctx.fillRect(tx + 8, ty + 15, 1, 1); ctx.fillRect(tx + 9, ty + 15, 1, 1); ctx.fillRect(tx + 10, ty + 15, 1, 1); ctx.fillRect(tx + 11, ty + 15, 1, 1); ctx.fillRect(tx + 12, ty + 15, 1, 1); ctx.fillRect(tx + 13, ty + 15, 1, 1); ctx.fillRect(tx + 14, ty + 15, 1, 1); ctx.fillRect(tx + 15, ty + 15, 1, 1);
});



// 7. Exquisite Closed Door (1x2 Tall, Anchor at Bottom)
// 注意：这个逻辑假设你在 ty 位置渲染，但会向上画出上半部分
// 如果你的系统是分块渲染的，请看代码后的“分块渲染”说明
RenderRegistry.register(RENDER_STYLE.DOOR_CLOSED, (ctx, tx, ty) => {
    const x = tx;
    const y = ty - TILE_SIZE; // 起点上移一格，因为门是 2x 高
    const w = TILE_SIZE;
    const h = TILE_SIZE * 2;

    // --- 1. 绘制门框 (Frame) ---
    // 门框外轮廓
    ctx.fillStyle = DOOR_PALETTE.FRAME_DARK;
    ctx.fillRect(x, y, w, h);

    // 门框受光面 (模拟立体感，左边和上边亮)
    ctx.fillStyle = DOOR_PALETTE.FRAME_LIGHT;
    ctx.fillRect(x, y, w - 2, h);      // 左侧亮条
    ctx.fillRect(x + 2, y + 2, w - 4, h - 2); // 挖空中间

    // --- 2. 绘制门板背景 (Door Panel) ---
    // 门板整体稍微内陷 (inset)
    const doorX = x + 2;
    const doorY = y + 4; // 顶部留出更多空间形成门楣阴影
    const doorW = w - 4;
    const doorH = h - 4;

    ctx.fillStyle = DOOR_PALETTE.WOOD_BASE;
    ctx.fillRect(doorX, doorY, doorW, doorH);

    // --- 3. 绘制木纹细节 (Wood Planks) ---
    // 每隔几像素画一条深色竖线，模拟木板拼接
    ctx.fillStyle = DOOR_PALETTE.WOOD_DARK;
    const plankWidth = doorW / 4;
    for (let i = 1; i < 4; i++) {
        ctx.fillRect(doorX + (i * plankWidth), doorY, 1, doorH);
    }

    // 顶部阴影 (门框投射在门板上的阴影)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(doorX, doorY, doorW, 4);

    // --- 4. 绘制铸铁加固条 (Iron Bands) ---
    // 上下各一条横向铁条
    const bandHeight = 4;
    const topBandY = y + (TILE_SIZE / 2);
    const botBandY = y + TILE_SIZE + (TILE_SIZE / 2);

    ctx.fillStyle = DOOR_PALETTE.IRON_BAND;
    ctx.fillRect(doorX, topBandY, doorW, bandHeight);
    ctx.fillRect(doorX, botBandY, doorW, bandHeight);

    // 绘制铆钉 (Rivets) - 简单的亮色点
    ctx.fillStyle = DOOR_PALETTE.IRON_RIVET;
    // 上铁条铆钉
    ctx.fillRect(doorX + 2, topBandY + 1, 1, 1);
    ctx.fillRect(doorX + doorW - 3, topBandY + 1, 1, 1);
    // 下铁条铆钉
    ctx.fillRect(doorX + 2, botBandY + 1, 1, 1);
    ctx.fillRect(doorX + doorW - 3, botBandY + 1, 1, 1);

    // --- 5. 绘制门把手/锁 (Lock & Handle) ---
    // 位于下半部分的右侧
    const lockX = doorX + doorW - 6;
    const lockY = botBandY - 6;

    // 锁的底座
    ctx.fillStyle = '#000';
    ctx.fillRect(lockX - 1, lockY - 1, 5, 6);

    // 金色锁体
    ctx.fillStyle = DOOR_PALETTE.GOLD_LOCK;
    ctx.fillRect(lockX, lockY, 3, 4);

    // 门环 (Ring) - 简单的空心矩形表示
    ctx.fillStyle = '#cc8800';
    ctx.fillRect(lockX - 1, lockY + 2, 5, 1); // 环顶部
    ctx.fillRect(lockX - 1, lockY + 2, 1, 3); // 环左侧
    ctx.fillRect(lockX + 3, lockY + 2, 1, 3); // 环右侧
    ctx.fillRect(lockX - 1, lockY + 5, 5, 1); // 环底部

    // --- 6. 底部接触地面的阴影 ---
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y + h - 1, w, 1);
});

// 8. Exquisite Open Door (Dark Void + Frame depth)
RenderRegistry.register(RENDER_STYLE.DOOR_OPEN, (ctx, tx, ty) => {
    // 同样假设基于底部格子渲染，向上延伸
    const x = tx;
    const y = ty - TILE_SIZE;
    const w = TILE_SIZE;
    const h = TILE_SIZE * 2;

    // --- 1. 绘制门框 ---
    ctx.fillStyle = DOOR_PALETTE.FRAME_DARK;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = DOOR_PALETTE.FRAME_LIGHT;
    // 只画门框的左右和上部，中间挖空
    ctx.fillRect(x, y, w, h); // Base
    ctx.fillStyle = DOOR_PALETTE.VOID;
    // 挖出一个黑暗的入口，稍微偏右一点形成侧面厚度感
    ctx.fillRect(x + 2, y + 4, w - 4, h - 4);

    // --- 2. 绘制入口的厚度 (Thickness/Depth) ---
    // 在黑暗入口的左侧画一条暗色垂直线，表示墙壁的厚度
    ctx.fillStyle = '#222'; // 深灰色
    ctx.fillRect(x + 2, y + 4, 2, h - 4); // 左侧内壁

    // 顶部内壁
    ctx.fillRect(x + 2, y + 4, w - 4, 2);

    // --- 3. 地板延续 (可选) ---
    // 如果想要看起来像地板延伸进去了，可以在底部画一点地板色
    // 这里简单处理为黑暗逐渐消失
});

// 6. Object Marker (Nodes)
RenderRegistry.register(RENDER_STYLE.OBJECT_MARKER, (ctx, tx, ty, x, y, map, def) => {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.symbol || "?", tx + TILE_SIZE / 2, ty + TILE_SIZE / 2);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
});

// 7. Invisible
RenderRegistry.register(RENDER_STYLE.INVISIBLE, () => { });
