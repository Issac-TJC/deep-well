class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.buffers = {};
        this.initialized = false;

        // This is the sound registry!
        // To add a new sound, just add a key and the path to the file here.
        this.soundRegistry = {
            'jump': 'data/sounds/jump.mp3',
            'land': 'data/sounds/land.mp3',
            'splash': 'data/sounds/splash.mp3',
            'climb': 'data/sounds/climb.mp3',
            'destroy_spike': 'data/sounds/destroy_spike.mp3',
            'bgm_water': 'data/sounds/bgm_water.mp3'
        };

        this.currentMusicSource = null;
        this.currentMusicGain = null;

        // Initialize on first user interaction to comply with browser policies
        const initAudio = () => {
            if (!this.initialized) {
                this.init();
                this.initialized = true;
            }
            window.removeEventListener('keydown', initAudio);
            window.removeEventListener('mousedown', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };

        window.addEventListener('keydown', initAudio);
        window.addEventListener('mousedown', initAudio);
        window.addEventListener('touchstart', initAudio);
    }

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.loadAllSounds();
            console.log("AudioContext initialized.");
        } catch (e) {
            console.warn("Web Audio API not supported in this browser.", e);
        }
    }

    async loadAllSounds() {
        for (const [key, path] of Object.entries(this.soundRegistry)) {
            this.loadSound(key, path);
        }
    }

    async loadSound(id, url) {
        if (!this.context) return;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                // If the file doesn't exist yet, we just silently ignore it to allow hot-plugging later without crashing.
                console.warn(`[AudioManager] Missing audio file: ${url}`);
                return;
            }
            const buffer = await response.arrayBuffer();
            this.buffers[id] = await this.context.decodeAudioData(buffer);
            console.log(`[AudioManager] Loaded sound: ${id}`);
        } catch (error) {
            console.warn(`[AudioManager] Error loading sound ${id} from ${url}:`, error);
        }
    }

    playSound(id, volume = 1.0) {
        if (!this.context || !this.initialized) return;
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const buffer = this.buffers[id];
        if (!buffer) return; // Sound not loaded or doesn't exist

        const source = this.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(0);
    }

    playMusic(id, volume = 0.5) {
        if (!this.context || !this.initialized) return;
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const buffer = this.buffers[id];
        if (!buffer) return;

        // Stop current music if it's playing
        this.stopMusic();

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // Looping BGM

        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(0);

        this.currentMusicSource = source;
        this.currentMusicGain = gainNode;
    }

    stopMusic() {
        if (this.currentMusicSource) {
            try {
                this.currentMusicSource.stop();
                this.currentMusicSource.disconnect();
                if (this.currentMusicGain) {
                    this.currentMusicGain.disconnect();
                }
            } catch (e) {
                // Ignore if it's already stopped
            }
            this.currentMusicSource = null;
            this.currentMusicGain = null;
        }
    }
}
