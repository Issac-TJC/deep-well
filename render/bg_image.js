/**
 * Static Background Image Plugin for Depth of the Well
 * Hot-pluggable architecture, compatible with renderer background layer.
 */

class BackgroundImagePlugin {
    constructor(isOffscreen = false, imagePath = null) {
        this.isOffscreen = isOffscreen;
        this.imagePath = imagePath;
        this.image = null;

        this.canvas = null;
        this.ctx = null;

        this.loaded = false;
        this.active = false;
        this.alpha = 1.0;

        this.width = 0;
        this.height = 0;

        this._resizeHandlerBound = this._handleResize.bind(this);
    }

    init() {
        if (!this.isOffscreen) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'bg-image-canvas';
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '-2';
            this.canvas.style.pointerEvents = 'none';

            const container = document.getElementById('game-container') || document.body;
            document.body.insertBefore(this.canvas, document.body.firstChild);

            this.ctx = this.canvas.getContext('2d');
            window.addEventListener('resize', this._resizeHandlerBound);
            this._handleResize();
        }

        if (this.imagePath) {
            this.loadImage(this.imagePath);
        }
    }

    _handleResize() {
        if (!this.canvas) return;
        this.width = document.documentElement.clientWidth;
        this.height = document.documentElement.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this._drawCanvas();
    }

    _drawCanvas() {
        if (!this.ctx || !this.loaded || !this.active || !this.image) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = this.alpha;

        // cover scale drawing
        const scale = Math.max(this.width / this.image.width, this.height / this.image.height);
        const x = (this.width / 2) - (this.image.width / 2) * scale;
        const y = (this.height / 2) - (this.image.height / 2) * scale;
        this.ctx.drawImage(this.image, x, y, this.image.width * scale, this.image.height * scale);

        this.ctx.globalAlpha = 1.0;
    }

    loadImage(imagePath) {
        this.image = new Image();
        this.image.onload = () => {
            this.loaded = true;
            this.active = true;
            this._drawCanvas();
            console.log(`BackgroundImagePlugin loaded: ${this.imagePath}`);
        };
        this.image.onerror = () => {
            console.error(`BackgroundImagePlugin failed to load: ${this.imagePath}`);
        };
        this.image.src = imagePath;
    }

    setImage(imagePath) {
        this.active = false;
        this.loaded = false;
        this.imagePath = imagePath;
        if (!this.canvas && !this.isOffscreen) {
            this.init();
        } else {
            this.loadImage(imagePath);
        }
    }

    setAlpha(alpha) {
        this.alpha = Math.max(0, Math.min(1, alpha));
        this._drawCanvas();
    }

    start() {
        if (this.loaded) {
            this.active = true;
            this._drawCanvas();
        }
    }

    pause() {
        this.active = false;
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    destroy() {
        this.pause();
        this.image = null;
        this.loaded = false;
        if (!this.isOffscreen) {
            window.removeEventListener('resize', this._resizeHandlerBound);
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
        this.canvas = null;
        this.ctx = null;
        console.log("BackgroundImagePlugin destroyed.");
    }
}
