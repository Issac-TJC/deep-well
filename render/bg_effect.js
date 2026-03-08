/**
 * WebGL Background Effect Plugin for Depth of the Well
 * Origin: Issac-TJC.github.io/effects/bg-effect.js
 * Hot-pluggable architecture
 */

class BackgroundEffectPlugin {
    constructor(isOffscreen = false) {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.active = false;
        this.startTime = 0;
        this.isOffscreen = isOffscreen;

        this.width = 0;
        this.height = 0;

        // Shader locations
        this.uResolutionLoc = null;
        this.uTimeLoc = null;
        this.uTimeScaleLoc = null;
        this.uPixelSizeLoc = null;

        this._renderLoopBound = this._renderLoop.bind(this);
        this._resizeHandlerBound = this._handleResize.bind(this);
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'bg-effect-canvas';

        if (!this.isOffscreen) {
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '-1';
            this.canvas.style.pointerEvents = 'none';

            // Ensure game-container or body gets it
            const container = document.getElementById('game-container') || document.body;
            // Insert it as the first child of body to be exactly at the bottom
            document.body.insertBefore(this.canvas, document.body.firstChild);
        }

        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.warn("WebGL 2 not supported, background effect will be inactive.");
            return;
        }

        this._setupShaders();
        this._setupGeometry();

        if (!this.isOffscreen) {
            window.addEventListener('resize', this._resizeHandlerBound);
        }
        this._handleResize();

        this.start();
        console.log("BackgroundEffectPlugin initialized.");
    }

    _handleResize() {
        if (!this.gl) return;

        if (this.isOffscreen) {
            this.width = typeof GAME_WIDTH !== 'undefined' ? GAME_WIDTH : 400;
            this.height = typeof GAME_HEIGHT !== 'undefined' ? GAME_HEIGHT : 240;
        } else {
            this.width = document.documentElement.clientWidth;
            this.height = document.documentElement.clientHeight;
        }
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.gl.viewport(0, 0, this.width, this.height);
    }

    _compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Shader Compile Error:", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    _setupShaders() {
        const vertexShaderSource = `#version 300 es
        in vec2 a_position;
        out vec2 v_uv;
        void main() {
            v_uv = a_position * 0.5 + 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }`;

        const fragmentShaderSource = `#version 300 es
        precision highp float;

        in vec2 v_uv;
        out vec4 outColor;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_timeScale;
        uniform float u_pixelSize;

        vec3 hash3(vec2 p) {
            vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                          dot(p, vec2(269.5, 183.3)),
                          dot(p, vec2(419.2, 371.9)));
            return fract(sin(q) * 43758.5453);
        }

        float valueNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);

            float n00 = fract(sin(dot(i + vec2(0.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
            float n10 = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
            float n01 = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
            float n11 = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);

            return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
        }

        float fbm(vec2 p) {
            float f = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 5; i++) {
                f += amp * valueNoise(p);
                p = p * 2.0 + vec2(12.4, 5.1) * (u_time * u_timeScale) * 0.1; 
                amp *= 0.5;
            }
            return f;
        }

        float smoke(vec2 uv) {
            vec2 q = uv * 3.0;
            q.y -= (u_time * u_timeScale) * 0.2; 
            q.x += sin((u_time * u_timeScale) * 0.1) * 0.5;
            float n = fbm(q);
            n = fbm(q + n * 2.5);
            return smoothstep(0.3, 0.7, n);
        }

        // float particles(vec2 uv) {
        //     vec2 p = uv * 10.0;
        //     p.y += (u_time * u_timeScale) * 0.5;
        //     vec2 i = floor(p);
        //     vec2 f = fract(p);
        //     vec3 h = hash3(i);
            
        //     float dist = distance(f, h.xy);
        //     float particle = smoothstep(h.z * 0.1, 0.0, dist);
            
        //     particle *= smoothstep(0.0, 0.1, h.x) * smoothstep(1.0, 0.9, h.x);
        //     particle *= h.y;
            
        //     return particle;
        // }

        vec3 render(vec2 uv, vec2 screen_uv) {
            vec3 bgColor = vec3(0.02, 0.02, 0.04);
            vec3 smokeColor = vec3(0.1, 0.15, 0.25);
            
            float s = smoke(uv);
            vec3 finalColor = mix(bgColor, smokeColor, s);
            
            // float p = particles(uv);
            // vec3 particleColor = vec3(0.3, 0.7, 0.9);
            // finalColor += p * particleColor * 0.8;
            
            return finalColor;
        }

        void main() {
            vec2 pixel_uv = floor(v_uv * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
            vec2 uv = pixel_uv;
            uv.x *= u_resolution.x / u_resolution.y;
            
            vec2 center = vec2(0.5);
            float distFromCenter = distance(pixel_uv, center);
            float caAmount = distFromCenter * 0.005;

            vec2 uvR = pixel_uv + vec2(caAmount, 0.0);
            vec2 uvG = pixel_uv;
            vec2 uvB = pixel_uv - vec2(caAmount, 0.0);

            float r = render(uvR * vec2(u_resolution.x/u_resolution.y, 1.0), uvR).r;
            float g = render(uvG * vec2(u_resolution.x/u_resolution.y, 1.0), uvG).g;
            float b = render(uvB * vec2(u_resolution.x/u_resolution.y, 1.0), uvB).b;

            vec3 color = vec3(r, g, b);

            float scanline = sin(v_uv.y * u_resolution.y * 3.14159 * 0.5);
            scanline = scanline * 0.5 + 0.5;
            color *= mix(1.0, 0.55 + 0.15 * scanline, 0.3);

            float vignette = smoothstep(1.5, 0.3, distFromCenter);
            color *= vignette;
            
            float noise = hash3(v_uv * 1000.0 + (u_time * u_timeScale)).x;
            color += (noise - 0.5) * 0.03;

            outColor = vec4(color, 1.0);
        }`;

        const vShader = this._compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fShader = this._compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vShader);
        this.gl.attachShader(this.program, fShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error("Program Link Error:", this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        this.uResolutionLoc = this.gl.getUniformLocation(this.program, "u_resolution");
        this.uTimeLoc = this.gl.getUniformLocation(this.program, "u_time");
        this.uTimeScaleLoc = this.gl.getUniformLocation(this.program, "u_timeScale");
        this.uPixelSizeLoc = this.gl.getUniformLocation(this.program, "u_pixelSize");
    }

    _setupGeometry() {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                1, -1,
                -1, 1,
                -1, 1,
                1, -1,
                1, 1
            ]),
            this.gl.STATIC_DRAW
        );

        const positionLoc = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
    }

    start() {
        if (!this.gl || this.active) return;
        this.active = true;
        this.startTime = performance.now();
        this._renderLoop();
    }

    pause() {
        this.active = false;
    }

    destroy() {
        this.pause();
        window.removeEventListener('resize', this._resizeHandlerBound);
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.gl) {
            this.gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
        this.canvas = null;
        this.gl = null;
        this.program = null;
        console.log("BackgroundEffectPlugin destroyed.");
    }

    _renderLoop() {
        if (!this.active || !this.gl) return;

        this.gl.uniform2f(this.uResolutionLoc, this.width, this.height);
        this.gl.uniform1f(this.uTimeLoc, (performance.now() - this.startTime) / 1000.0);
        this.gl.uniform1f(this.uTimeScaleLoc, 0.2);
        this.gl.uniform1f(this.uPixelSizeLoc, 4.0);

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        requestAnimationFrame(this._renderLoopBound);
    }
}
