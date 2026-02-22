# Audio Management System

This folder contains the `AudioManager` class responsible for high-performance audio playback in the game.

## Hot-Plugging Sounds

To add or modify sounds:
1. Place your `.mp3` or `.wav` files into this `sounds` folder.
2. Open `audioManager.js`.
3. Locate the `this.soundRegistry` dictionary inside the `constructor`.
4. Add or update the key-value pairs matching your file names:

```javascript
this.soundRegistry = {
    'jump': 'data/sounds/jump.mp3',
    'land': 'data/sounds/land.mp3',
    'splash': 'data/sounds/splash.mp3',
    'climb': 'data/sounds/climb.mp3',
    'destroy_spike': 'data/sounds/destroy_spike.mp3',
    'my_new_sound': 'data/sounds/my_new_sound.wav' // <-- new sounds look like this
};
```

## How to play sounds in the game code
Once registered in `audioManager.js`, you can call the sound from anywhere in the game logic where the `game` object is accessible:

```javascript
game.audio.playSound('jump');
game.audio.playSound('splash', 0.8); // 0.8 is the optional volume parameter
```

## How to play Background Music in Rooms
Room scripts (in `scripts/roomscripts.js`) can easily trigger looping background music when entered, and stop it when exited:

```javascript
class MyRoomScript extends MapScript {
    init(game) {
        // Will loop automatically
        game.audio.playMusic('bgm_water', 0.5); 
    }
    
    exit(game) {
        // Stop the music when leaving the room
        game.audio.stopMusic(); 
    }
}
```
