/**
 * ============================================================================
 * 5. MAP SCRIPT SYSTEM
 * ============================================================================
 */

// Example Implementation: Tutorial Text & Triggers
class StartRoomScript extends MapScript {
    update(game, timeScale) {
        const p = game.player;
        if (p.x < 100) game.ui.showMessage("Fall down to dive");
        else if (p.x > 250) game.ui.showMessage("Jump right ->");
        else if (p.y > 150) game.ui.showMessage("Hold Space in Water to CHARGE");
    }

    //     // --- NEW: Custom Background Logic ---
    // drawBackground(ctx, game) {
    //     // Draw an OwlWatcher that follows the player
    //     const ox = 40;
    //     const oy = 30;

    //     // Body
    //     ctx.fillStyle = '#151525';
    //     ctx.beginPath();
    //     ctx.ellipse(ox, oy, 12, 16, 0, 0, Math.PI * 2);
    //     ctx.fill();

    //     // Ears
    //     ctx.beginPath();
    //     ctx.moveTo(ox - 8, oy - 12); ctx.lineTo(ox - 12, oy - 22); ctx.lineTo(ox, oy - 14);
    //     ctx.moveTo(ox + 8, oy - 12); ctx.lineTo(ox + 12, oy - 22); ctx.lineTo(ox, oy - 14);
    //     ctx.fill();

    //     // Eyes Logic
    //     const px = game.player.x;
    //     const py = game.player.y;

    //     const drawEye = (ex, ey) => {
    //         // White
    //         ctx.fillStyle = '#ccccdd';
    //         ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI*2); ctx.fill();

    //         // Pupil (Tracks Player)
    //         const angle = Math.atan2(py - ey, px - ex);
    //         const dist = Math.min(2, Math.hypot(px - ex, py - ey) / 20);
    //         const pupX = ex + Math.cos(angle) * dist;
    //         const pupY = ey + Math.sin(angle) * dist;

    //         ctx.fillStyle = '#000';
    //         ctx.beginPath(); ctx.arc(pupX, pupY, 2, 0, Math.PI*2); ctx.fill();
    //     };

    //     drawEye(ox - 5, oy - 2);
    //     drawEye(ox + 5, oy - 2);

    //     // Beak
    //     ctx.fillStyle = '#333';
    //     ctx.beginPath(); ctx.moveTo(ox - 2, oy + 2); ctx.lineTo(ox + 2, oy + 2); ctx.lineTo(ox, oy + 6); ctx.fill();
    // }
}

class MapItemScript extends MapScript {
    update(game, timeScale) {
        if (!game.system.abilities.minimap) game.ui.showMessage("A signal nearby...");
        else game.ui.showMessage("Minimap Online (TAB)", '#aaffaa');
    }
}

class DeepWaterScript extends MapScript {
    init(game, timeScale) {
        game.ui.showMessage("The Sunken Depths", '#aaaaff', 2000);
        if (game.audio) game.audio.playMusic('bgm_water', 0.5);
    }

    exit(game) {
        if (game.audio) game.audio.stopMusic();
    }
}

/**
 * ============================================================================
 * SPECTRAL RABBIT (Hand-Drawn Style & Volumetric Lighting)
 * ============================================================================
 */
class RabbitHouseScript extends MapScript {
    constructor() {
        super();

        // --- 触发区域 ---
        this.triggerRect = { x: 100, y: 200, w: 50, h: 100 };
        this.spawnPos = { x: 380, y: 100 };

        // --- 状态标志 ---
        this.hasTriggered = false;
        this.isGone = false;
        this.state = 'EATING';

        // --- 物理位置 ---
        this.x = 0;
        this.y = 0;

        // --- 动画计时器 (分离不同频率) ---
        this.breathTime = 0; // 慢速呼吸
        this.twitchTime = 0; // 快速抽搐
        this.runTime = 0;    // 跑步循环

        // --- 动态变量 ---
        this.bodyY = 0;
        this.headAngle = 0;
        this.earTwitch = 0;
    }

    init(game) {
        if (!this.hasTriggered) {
            this.state = 'EATING';
            this.x = this.spawnPos.x;
            this.y = this.spawnPos.y;
            this.breathTime = 0;
        }
    }

    update(game, timeScale) {
        if (this.isGone) return;

        const p = game.player;

        // 1. 基础呼吸 (非常慢，模拟生物感)
        // 修正：速度乘数从原来的 1.0 降为 0.05，消除鬼畜感
        this.breathTime += 0.05 * timeScale;
        const breath = Math.sin(this.breathTime);
        this.bodyY = breath * 2; // 身体轻微起伏

        // 2. 随机抽搐逻辑 (神经质的感觉)
        this.twitchTime += 0.1 * timeScale;
        // 只有在特定随机时刻才发生剧烈抽搐
        if (Math.random() < 0.02) {
            this.earTwitch = (Math.random() - 0.5) * 1.5;
        } else {
            // 阻尼效果：让抽搐逐渐平滑停止
            this.earTwitch *= 0.8;
        }

        // --- 状态机 ---

        if (this.state === 'EATING') {
            // 进食动作：低头 -> 抬头 -> 低头
            this.headAngle = 0.4 + Math.sin(this.twitchTime * 2) * 0.1;

            // 触发检测
            if (!this.hasTriggered &&
                p.x > this.triggerRect.x && p.x < this.triggerRect.x + this.triggerRect.w &&
                p.y > this.triggerRect.y - 50 && p.y < this.triggerRect.y + 50
            ) {
                this.hasTriggered = true;
                this.state = 'ALERT';
                this.runTime = 0; // 复用作计时器
                game.ui.showMessage("...", "#aaddff", 1000);
            }
        }
        else if (this.state === 'ALERT') {
            // 警觉：猛然抬头，耳朵竖起
            // 使用线性插值(Lerp)平滑过渡角度，避免瞬间跳变
            this.headAngle = this.lerp(this.headAngle, -0.2, 0.1 * timeScale);
            this.earTwitch = this.lerp(this.earTwitch, 0, 0.1); // 耳朵定住

            this.runTime += timeScale;
            // 停留 1.2 秒 (约 72 帧)
            if (this.runTime > 72) {
                this.state = 'RUNNING';
                this.runTime = 0;
            }
        }
        else if (this.state === 'RUNNING') {
            this.runTime += 0.08 * timeScale; // 修正跑步帧率，更像逐帧动画

            // 移动速度
            this.x += 8 * timeScale; // 稍微减慢速度，看清动作

            // 跳跃抛物线
            const hop = Math.abs(Math.sin(this.runTime * 3)); // 修正频率
            this.y = this.spawnPos.y - hop * 40; // 跳得更高

            // 跑步时的动态姿态
            this.headAngle = -0.2 + (hop * 0.5); // 跳起时头略微后仰

            if (this.x > 2000) this.isGone = true;
        }
    }

    /**
     * 辅助数学函数：线性插值
     */
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    /**
     * 渲染核心
     * 风格：手绘流线、体积光、边缘发光
     */
    drawBackground(ctx, game, timeScale) {
        if (this.isGone) return; // 跑了就不画了

        const x = this.x;
        const y = this.y + this.bodyY;

        ctx.save();

        // --- 1. 全局辉光设置 (Ghost Bloom) ---
        // 这是制造“边缘模糊发光”的关键
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(100, 200, 255, 0.6)";

        ctx.translate(x, y);
        if (this.state === 'RUNNING') ctx.scale(-1, 1); // 跑步镜像

        // 定义材质颜色 (渐变色球)
        // 核心是深色，边缘透出一点幽灵蓝
        const bodyGradient = ctx.createRadialGradient(0, -10, 5, 0, -10, 30);
        bodyGradient.addColorStop(0, '#3a3a50');      // 核心：深灰蓝
        bodyGradient.addColorStop(0.6, '#222233');    // 中间：深靛色
        bodyGradient.addColorStop(1, 'rgba(20,20,35,0.9)'); // 边缘：半透黑

        const outlineColor = 'rgba(150, 200, 255, 0.3)'; // 非常淡的手绘轮廓线

        // --- 2. 绘制后腿 (远端) ---
        this.drawLimb(ctx, 5, 5, 0.8, bodyGradient, outlineColor);

        // --- 3. 绘制身体 (手绘流线型) ---
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round'; // 线条端点圆润

        ctx.beginPath();
        // 这是一个类似“水滴”或“豆子”的有机形状，模拟弓背
        ctx.moveTo(-15, -5);
        ctx.bezierCurveTo(-10, -30, 15, -35, 25, -5); // 背部高耸的弧线
        ctx.bezierCurveTo(25, 15, -10, 15, -15, -5);  // 腹部下垂的弧线
        ctx.fill();
        ctx.stroke();

        // 绘制几根毛发 (Fur Detail) - 不用贴图，用线条模拟手绘
        ctx.beginPath();
        ctx.moveTo(18, -25); ctx.quadraticCurveTo(22, -30, 25, -22); // 背部乱毛
        ctx.stroke();

        // --- 4. 头部 (独立旋转) ---
        ctx.save();
        ctx.translate(-15, -12); // 脖子位置
        ctx.rotate(this.headAngle);

        // 头型 (稍微有点像骷髅/面具的兔子头)
        ctx.beginPath();
        ctx.moveTo(5, 5);
        ctx.quadraticCurveTo(-10, 10, -15, 0);   // 下颚
        ctx.quadraticCurveTo(-18, -10, -5, -12); // 额头
        ctx.quadraticCurveTo(8, -10, 5, 5);      // 后脑
        ctx.fillStyle = '#444455'; // 头稍微亮一点
        ctx.fill();
        ctx.stroke();

        // 耳朵 (长而飘逸，像丝带)
        this.drawFlowyEar(ctx, -5, -12, 0.2 + this.earTwitch, outlineColor); // 耳朵1
        this.drawFlowyEar(ctx, -2, -12, -0.1 + this.earTwitch, outlineColor);// 耳朵2 (错开)

        // 眼睛 (点睛之笔)
        this.drawSpookyEye(ctx, -8, -2, game);

        // 嘴里的胡萝卜
        if (this.state === 'EATING') {
            this.drawCarrot(ctx, -10, 8);
        }

        ctx.restore();

        // --- 5. 绘制后腿 (近端 - 更大更亮) ---
        // 跑步时腿部会摆动
        let legAngle = 0;
        if (this.state === 'RUNNING') {
            legAngle = Math.sin(this.runTime * 3) * 0.5;
        }
        ctx.save();
        ctx.rotate(legAngle);
        this.drawLimb(ctx, 0, 5, 1.0, bodyGradient, outlineColor);
        ctx.restore();

        // --- 6. 前爪 (小小的) ---
        ctx.fillStyle = '#333344';
        ctx.beginPath();
        ctx.ellipse(-8, 8, 4, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制流线型的耳朵 (贝塞尔曲线)
     */
    drawFlowyEar(ctx, x, y, angleOffset, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.5 + angleOffset); // 基础向后倾斜

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.fillStyle = '#2a2a3a';
        ctx.lineWidth = 1;

        // 像火焰一样的耳朵形状
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-5, -20, -15, -30, -5, -45); // 外沿S型曲线
        ctx.bezierCurveTo(5, -35, 5, -10, 4, 0);       // 内沿

        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 绘制腿部 (大腿肌肉 + 细足)
     */
    drawLimb(ctx, x, y, scale, fillStyle, strokeStyle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;

        ctx.beginPath();
        // 大腿 (圆润的肌肉)
        ctx.arc(0, 0, 10, 0, Math.PI * 2);

        // 足部 (延伸出去)
        ctx.moveTo(5, 5);
        ctx.quadraticCurveTo(10, 15, -5, 15); // 脚掌着地
        ctx.lineTo(-8, 5);

        ctx.fill();
        // 只勾勒下半部分轮廓，增加光影感
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.quadraticCurveTo(-5, 15, 10, 15);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * 绘制发光眼 (多层叠加)
     */
    drawSpookyEye(ctx, x, y, game) {
        // 计算看玩家的角度
        let dx = 0, dy = 0;
        if (this.state !== 'EATING') {
            const angle = Math.atan2(game.player.y - (this.y + y), game.player.x - (this.x + x));
            dx = Math.cos(angle) * 1.5;
            dy = Math.sin(angle) * 1.5;
        }

        // 1. 眼窝 (深凹)
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();

        // 2. 核心亮光 (白色)
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.2, 0, Math.PI * 2); ctx.fill();

        // 3. 溢出光晕 (青色 - 叠加模式)
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(x + dx, y + dy, 1, x + dx, y + dy, 6);
        glow.addColorStop(0, 'rgba(100, 255, 200, 0.8)');
        glow.addColorStop(1, 'rgba(0, 50, 50, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 6, 0, Math.PI * 2); ctx.fill();

        // 恢复混合模式
        ctx.globalCompositeOperation = 'source-over';
    }

    drawCarrot(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(2.5); // 叼在嘴里的角度

        // 胡萝卜不是纯橙色，而是暗淡的红褐色
        const grad = ctx.createLinearGradient(0, 0, 15, 0);
        grad.addColorStop(0, '#884422');
        grad.addColorStop(1, '#552211');

        ctx.fillStyle = grad;
        // 弯曲的胡萝卜
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.quadraticCurveTo(8, -5, 16, 0);
        ctx.quadraticCurveTo(8, 4, 0, 2);
        ctx.fill();

        ctx.restore();
    }
}

// Registry linking coordinates to script instances
const SCRIPT_REGISTRY = {
    "0,0": new StartRoomScript(),
    "1,0": new MapItemScript(),
    "0,1": new DeepWaterScript(),
    "1,6": new BossScript(),
    "2,0": new RabbitHouseScript()
};
