// NOTE: An internal clock starts ticking when audio context is created
let audioCtx = null;

const BPM = 110;
const BEAT = 60 / BPM;
export const msPerBeat = BEAT * 1000;

let songDuration = undefined;
let beatsInSong = undefined;

export let tracks = {};
export let sfxs = {};
const TrackURLs = {
    HEART: "assets/music/song_heartbeat.mp3",
    SLOWHEART: "assets/music/song_heartbeat_slow.mp3",
    HEART_DRONES: "assets/music/song_beat_drones.mp3",
    HEART_DRONES_BELL: "assets/music/song_beat_drones_cowbell.mp3",
    KICK_DRONES: "assets/music/song_kick_drones.mp3",
    INT1: "assets/music/song_intensity01.mp3",
    INT2: "assets/music/song_intensity02.mp3",
    INT3: "assets/music/song_intensity03.mp3",
    MP_WAIT: "assets/music/mp_song_wait.mp3",
    MP_DAY: "assets/music/mp_song_day.mp3",
    MP_NIGHT: "assets/music/mp_song_night.mp3",
    MP_HELL: "assets/music/mp_song_hell.mp3",
}

const SfxURLs = {
    BIRDS: "assets/music/dawn-chorus-birdsong.mp3",
    ZOMBIES: ["assets/sfx/zombie01.mp3", "assets/sfx/zombie02.mp3", "assets/sfx/zombie03.mp3", "assets/sfx/zombie04.mp3", "assets/sfx/zombie05.mp3"],
    GHOSTS: ["assets/sfx/ghost01.mp3", "assets/sfx/ghost02.mp3", "assets/sfx/ghost03.mp3", "assets/sfx/ghost04.mp3", "assets/sfx/ghost05.mp3"],
    LAUGHS: ["assets/sfx/laugh01.mp3", "assets/sfx/laugh02.mp3", "assets/sfx/laugh03.mp3", "assets/sfx/laugh04.mp3", "assets/sfx/laugh05.mp3"],
    BOMBS: ["assets/sfx/bomb01.mp3", "assets/sfx/bomb02.mp3", "assets/sfx/bomb03.mp3"],
    TITLE: "assets/sfx/title.mp3",
    DOOR_OPEN: "assets/sfx/door_open.mp3",
    DOOR_CLOSE: "assets/sfx/door_close.mp3",
    BLASTED_DOOR: "assets/sfx/blasted_door.wav",
    GAMEOVER: "assets/sfx/gameover.mp3",
    DEATH: "assets/sfx/death2.wav",
    STEPS: "assets/sfx/steps.mp3",
    RISER: "assets/sfx/riser.mp3",
    VICTORY: "assets/sfx/victory.mp3",
    POWERUP: "assets/sfx/powerup1.wav",
    POWERUP2: "assets/sfx/powerup2.wav",
    POWERUP3: "assets/sfx/powerup3.wav",
    MUSHROOM: "assets/sfx/mushroom.wav",
    BUILD1: "assets/sfx/build1.mp3",
}

// Some functions below are modified from:
// https://github.com/mdn/webaudio-examples/tree/main/multi-track
// https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games

// Loading function for fetching the audio file and decode the data
async function getFile(filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

// Function to call each file and return an array of decoded files
export async function loadFile(filePath) {
    const track = await getFile(filePath);
    return track;
}

let firstTrackLoaded = false;

export async function loadAudioFiles() {
    if (audioCtx != null) {
        return;
    }
    audioCtx = new AudioContext();

    for (const trackName in TrackURLs) {
        const song = await loadFile(TrackURLs[trackName]);
        // Store the song with its track name as the key
        tracks[trackName] = song;

        // Get some info about the loop
        if (!firstTrackLoaded) {
            songDuration = song.duration;
            beatsInSong = Math.round(songDuration / BEAT);
            firstTrackLoaded = true;
        }
    }

    // Handles arrays and single files.
    for (const sfxName in SfxURLs) {
        if (Array.isArray(SfxURLs[sfxName])) {
            sfxs[sfxName] = [];
            for (const url of SfxURLs[sfxName]) {
                const audio = await loadFile(url);
                sfxs[sfxName].push(audio);
            }
        } else {
            const audio = await loadFile(SfxURLs[sfxName]);
            sfxs[sfxName] = audio;
        }
    }
}


let startTime = 0;
let currentTrack = null;

export function getOffset() {
    let elapsedTime = audioCtx.currentTime;
    let offset = elapsedTime % songDuration;
    return offset;
}

export function playTrack(audioBuffer) {
    const trackSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    trackSource.loop = true;
    trackSource.connect(audioCtx.destination);

    let offset = getOffset();

    if (currentTrack !== null) {
        currentTrack.disconnect();
        currentTrack.stop();
    }

    // Start the new track from the same position as the old track
    trackSource.start(0, offset % audioBuffer.duration);

    currentTrack = trackSource;
    // Update start time
    startTime = audioCtx.currentTime;

    return trackSource;
}

export function stopCurrentTrack() {
    if (currentTrack !== null) {
        currentTrack.disconnect();
        currentTrack.stop();
        currentTrack = null;
    }
}

let footsteps = null;
export function playFootsteps(isWalking) {
    if (isWalking) return;

    const audioBuffer = sfxs['STEPS'];
    const audioSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    audioSource.loop = true;
    audioSource.connect(audioCtx.destination);
    
    if (footsteps !== null) {
        footsteps.stop();
    }

    let offset = getOffset();
    
    audioSource.start(0, offset);

    footsteps = audioSource;
    startTime = audioCtx.currentTime - offset;
}

export function stopFootsteps() {
    if (footsteps !== null) {
        footsteps.stop();
        footsteps = null;
    }
}

// Play birdsong
let birdsong = null;
export function playBirdsong() {
    const audioBuffer = sfxs['BIRDS'];
    const audioSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    audioSource.loop = true;
    audioSource.connect(audioCtx.destination);
    
    if (birdsong !== null) {
        birdsong.stop();
    }

    let offset = getOffset();
    
    audioSource.start(0, offset);

    birdsong = audioSource;
    startTime = audioCtx.currentTime - offset;
}

export function stopBirdsong() {
    if (birdsong !== null) {
        birdsong.stop();
        birdsong = null;
    }
}

// Pick a random sound from an sfx array
export function randomSfx(sfxPath) {
    const randomSound = sfxPath[Math.floor(Math.random() * sfxPath.length)];
    return randomSound
}

export function playAudio(audioBuffer) {
    const audioSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    audioSource.connect(audioCtx.destination);

    audioSource.start();

    return audioSource;
}

// Used with setTimeOut to play sfx in sync with the song
export function getMusicalTimeout(offbeat = false) {
    let songOffset = getOffset();
    let beatsPassed = Math.floor(songOffset / BEAT);
    
    let nextBeatInterval;
    if (offbeat) {
        if (beatsPassed % 2 === 0) {
            nextBeatInterval = 1;
        } else {
            nextBeatInterval = 2;
        }
    } else {
        if (beatsPassed % 2 !== 0) {
            nextBeatInterval = 1;
        } else {
            nextBeatInterval = 2;
        }
    }

    let nextBeat = (beatsPassed + nextBeatInterval) * BEAT;
    // Convert to milliseconds
    let timeout = (nextBeat - songOffset) * 1000;

    return timeout;
}

export let riserPlaying = false;
export function playRiser() {
    riserPlaying = true;
    let audio = playAudio(sfxs['RISER']);
    audio.onended = function() {
        riserPlaying = false;
    };
}