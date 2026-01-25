// boss/boss.js

// 简单的弹幕类
class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.r = 4; this.life = 100;
    }
    update(timeScale) {
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        this.life -= 1 * timeScale;
    }
}

class BossEntity {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.r = 16; // 半径
        
        this.maxHealth = 5;
        this.health = this.maxHealth;
        
        // 状态机: INTRO, IDLE, CHASE, DASH, STUNNED, DEAD
        this.state = 'INTRO'; 
        this.stateTimer = 0;
        
        this.invulnerable = true; // 无敌状态
        this.hitFlashTimer = 0;
        
        this.targetX = x;
        this.targetY = y;
    }
}

class BossScript extends MapScript {
    constructor() {
        super();
        this.boss = null;
        this.renderer = new BossRenderer();
        this.projectiles = [];
        this.uiElement = null;
        this.barFill = null;
    }

    init(game) {
        // --- 修复逻辑：检查 Boss 是否已死 ---
        // 我们利用 game.system 动态存储一个 bossDefeated 标记
        if (game.system.bossDefeated) {
            // 如果 Boss 已经死过一次：
            // 1. 重新应用地图修改（梯子和出口），因为房间重置了
            this.createExitLadder(game, false); // false 表示不显示提示文字
            // 2. 不生成 Boss，直接返回
            return;
        }

        // --- 正常生成逻辑 ---
        this.boss = new BossEntity(350, 150);
        this.createUI();
        game.ui.showMessage("WARNING: HIGH ENERGY DETECTED", "#ff0000", 3000);
    }

    createUI() {
        if (document.getElementById('boss-ui')) return;

        const container = document.createElement('div');
        container.id = 'boss-ui';
        container.innerHTML = `
            <div class="boss-name">CORE KEEPER</div>
            <div class="health-bar-container">
                <div class="health-bar-fill" id="boss-health-fill"></div>
            </div>
        `;
        document.getElementById('game-container').appendChild(container);
        this.uiElement = container;
        this.barFill = document.getElementById('boss-health-fill');

        requestAnimationFrame(() => { 
            if(this.uiElement) this.uiElement.style.opacity = 1; 
        });
    }

    cleanup() {
        if (this.uiElement) {
            this.uiElement.style.opacity = 0;
            setTimeout(() => { if(this.uiElement) this.uiElement.remove(); }, 1000);
        }
    }

    update(game, timeScale) {
        // 如果没有 Boss 实体（说明已击败并重进房间），则不执行任何逻辑
        if (!this.boss) return;
        
        this.updateLogic(game, timeScale);
        this.updateProjectiles(game, timeScale);
        
        if (this.barFill && this.boss) {
            const pct = (this.boss.health / this.boss.maxHealth) * 100;
            this.barFill.style.width = `${Math.max(0, pct)}%`;
        }
    }

    updateLogic(game, timeScale) {
        const b = this.boss;
        const p = game.player;

        // 计时器本身之前就是正确的，因为它乘了 timeScale
        b.stateTimer += 0.016 * timeScale; 
        b.hitFlashTimer -= 0.1 * timeScale;

        // --- 修复点 1: 普通移动补上 timeScale ---
        // 使用 timeScale 修正 Lerp，防止在高刷新率屏幕上移动过快
        // 公式：Current + (Target - Current) * Factor * timeScale
        b.x += (b.targetX - b.x) * 0.05 * timeScale;
        b.y += (b.targetY - b.y) * 0.05 * timeScale;

        // 状态机
        switch (b.state) {
            case 'INTRO':
                b.targetY = 100;
                b.invulnerable = true;
                if (b.stateTimer > 2.0) {
                    this.switchState('IDLE');
                    game.ui.showMessage("FIGHT!", "#ffffff", 1000);
                }
                break;

            case 'IDLE':
                b.invulnerable = false;
                b.targetX = p.x;
                // 悬浮动画保持基于时间戳，不受帧率影响
                b.targetY = 100 + Math.sin(Date.now() / 500) * 20;
                
                if (b.stateTimer > 3.0) {
                    this.switchState(Math.random() > 0.5 ? 'DASH' : 'CHASE');
                }
                break;

            case 'CHASE':
                b.targetX = p.x;
                b.targetY = p.y;
                if (b.stateTimer > 2.5) this.switchState('IDLE');
                break;

            case 'DASH':
                if (b.stateTimer < 0.5) {
                    // 预警 (后退)
                    b.targetX = p.x > b.x ? b.x - 20 : b.x + 20;
                } else if (b.stateTimer < 0.6) {
                    // 锁定位置
                    b.targetX = p.x;
                    b.targetY = p.y;
                } else {
                    // --- 修复点 2: 冲刺速度补上 timeScale ---
                    // 之前漏了 timeScale，导致高刷屏速度加倍
                    // 0.2 * timeScale 保证了在不同帧率下每帧移动的比例相对于时间是恒定的
                    b.x += (b.targetX - b.x) * 0.2 * timeScale; 
                    b.y += (b.targetY - b.y) * 0.2 * timeScale;
                    
                    if (b.stateTimer > 1.5) this.switchState('STUNNED');
                }
                break;

            case 'STUNNED':
                b.invulnerable = false;
                b.targetY = 250; 
                if (b.stateTimer > 2.0) this.switchState('IDLE');
                break;

            case 'DEAD':
                // --- 修复点 3: 下落重力补上 timeScale ---
                b.targetY += 0.5 * timeScale; 
                
                b.invulnerable = true;
                if (Math.random() < 0.3) game.spawnParticles(b.x + (Math.random()-0.5)*30, b.y + (Math.random()-0.5)*30, 2, 'spark');
                
                if (b.stateTimer > 3.0) {
                    game.ui.showSystemMessage("THREAT NEUTRALIZED");
                    
                    game.system.bossDefeated = true; 
                    // game.system.enable("minerHat");
                    
                    this.createExitLadder(game, true); 
                    
                    this.cleanup();
                    this.boss = null; 
                }
                break;
        }

        if (b.state !== 'DEAD' && b.state !== 'INTRO') {
            this.checkPlayerCollision(game, b);
        }
    }

    // --- 修改：增加 showMessage 参数，避免重进房间时重复提示 ---
    createExitLadder(game, showMessage = true) {
        const ladderX = 28;
        const wallX = 29; 
        const yStart = 15;
        const yEnd = 11;

        // 1. 生成梯子
        for (let y = yStart; y >= yEnd; y--) {
            this.setTile(game, ladderX, y, '4'); 
            if(showMessage) game.spawnParticles(ladderX * 16 + 8, y * 16 + 8, 5, 'dust');
        }

        // 2. 打通出口
        this.setTile(game, wallX, 11, '0');
        this.setTile(game, wallX, 10, '0');
        
        if (showMessage) {
            game.ui.showMessage("ESCAPE ROUTE OPENED", "#aaffaa", 3000);
        }
    }

    setTile(game, x, y, char) {
        if (y < 0 || y >= game.map.layout.length) return;
        let row = game.map.layout[y];
        game.map.layout[y] = row.substring(0, x) + char + row.substring(x + 1);
    }

    checkPlayerCollision(game, b) {
        const p = game.player;
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < (p.r + b.r)) {
            if (p.vy > 0 && p.y < b.y - b.r * 0.5 && !b.invulnerable) {
                this.damageBoss(game, 1);
                p.vy = -4; 
                game.spawnParticles(b.x, b.y, 10, 'spark');
            } else {
                if (!game.isDead && game.recoveryTimer <= 0) {
                    game.triggerDeath();
                }
            }
        }
    }

    damageBoss(game, amount) {
        if (this.boss.invulnerable) return;
        
        this.boss.health -= amount;
        this.boss.hitFlashTimer = 5;
        this.boss.state = 'DASH';
        this.boss.stateTimer = 0;
        
        game.ui.showMessage(`HIT! HP: ${this.boss.health}`, "#ffaa00", 500);

        if (this.boss.health <= 0) {
            this.switchState('DEAD');
            game.ui.showMessage("VICTORY!", "#00ff00", 2000);
            game.spawnParticles(this.boss.x, this.boss.y, 50, 'rubble');
        }
    }

    switchState(newState) {
        this.boss.state = newState;
        this.boss.stateTimer = 0;
    }

    updateProjectiles(game, timeScale) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update(timeScale);
            if (Math.hypot(p.x - game.player.x, p.y - game.player.y) < (p.r + game.player.r)) {
                if (!game.isDead) game.triggerDeath();
            }
            if (p.life <= 0) this.projectiles.splice(i, 1);
        }
    }

    drawForeground(ctx, game) {
        if (this.boss) {
            this.renderer.draw(ctx, this.boss, 1.0);
            this.renderer.drawProjectiles(ctx, this.projectiles);
        }
    }
}