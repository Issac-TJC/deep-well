// boss/boss_visuals.js

class BossRenderer {
    constructor() {
        this.spinAngle = 0;
    }

    draw(ctx, boss, timeScale) {
        if (boss.state === 'DEAD' && boss.deathTimer > 0.5) return; // 死亡闪烁结束后不绘制

        this.spinAngle += 0.05 * timeScale;

        // 震动效果 (受伤时)
        let shakeX = 0;
        let shakeY = 0;
        if (boss.hitFlashTimer > 0) {
            shakeX = (Math.random() - 0.5) * 5;
            shakeY = (Math.random() - 0.5) * 5;
        }

        const cx = boss.x + shakeX;
        const cy = boss.y + shakeY;

        ctx.save();
        ctx.translate(cx, cy);

        // 1. 绘制光环 (Shields)
        ctx.strokeStyle = boss.invulnerable ? '#ffffff' : '#ff4444';
        ctx.lineWidth = 2;
        
        // 外圈
        ctx.beginPath();
        const r1 = boss.r + 10 + Math.sin(this.spinAngle) * 2;
        ctx.arc(0, 0, r1, 0, Math.PI * 2);
        ctx.stroke();

        // 旋转碎片
        for(let i=0; i<3; i++) {
            const angle = this.spinAngle + (i * (Math.PI * 2 / 3));
            const px = Math.cos(angle) * (boss.r + 5);
            const py = Math.sin(angle) * (boss.r + 5);
            ctx.fillStyle = boss.state === 'DASH' ? '#ffaa00' : '#aa0000';
            ctx.fillRect(px - 3, py - 3, 6, 6);
        }

        // 2. 绘制核心 (Core)
        if (boss.hitFlashTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.fillStyle = '#ffffff'; // 受伤白闪
        } else {
            ctx.fillStyle = '#440000';
        }
        
        // 核心形状 (菱形)
        ctx.beginPath();
        ctx.moveTo(0, -boss.r);
        ctx.lineTo(boss.r, 0);
        ctx.lineTo(0, boss.r);
        ctx.lineTo(-boss.r, 0);
        ctx.closePath();
        ctx.fill();

        // 核心高光
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, boss.r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 3. 绘制血条 (在头顶，可选，因为我们已经有UI了，这里画一个简单的状态指示)
        if (boss.state === 'STUNNED') {
            ctx.fillStyle = '#ffff00';
            ctx.font = "10px monospace";
            ctx.fillText("!!!", boss.x - 5, boss.y - boss.r - 10);
        }
    }

    // 绘制弹幕/冲击波
    drawProjectiles(ctx, projectiles) {
        ctx.fillStyle = '#ffaa00';
        projectiles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}