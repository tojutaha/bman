// Modified from:
// https://github.com/mdn/webaudio-examples/tree/main/multi-track
// https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games

// NOTE: An internal clock that starts ticking the moment you create an audio context
let audioCtx = null;

export let tracks = {};
export let sfxs = {};
const TrackURLs = {
    BIRDS: "assets/music/dawn-chorus-birdsong.mp3",
    BEAT: "assets/music/song_heartbeat.mp3",
    KICK: "assets/music/song_kick.mp3",
    KICK_DRONES: "assets/music/song_kick_drones.mp3",
    INT1: "assets/music/song_intensity01.mp3",
    INT2: "assets/music/song_intensity02.mp3",
    INT3: "assets/music/song_intensity03.mp3",
    STEPS: "assets/sfx/steps.mp3",
}

const SfxURLs = {
    ZOMBIES: ["assets/sfx/zombie01.mp3", "assets/sfx/zombie02.mp3", "assets/sfx/zombie03.mp3", "assets/sfx/zombie04.mp3", "assets/sfx/zombie05.mp3"],
    GHOSTS: ["assets/sfx/ghost01.mp3", "assets/sfx/ghost02.mp3", "assets/sfx/ghost03.mp3", "assets/sfx/ghost04.mp3", "assets/sfx/ghost05.mp3"],
    LAUGHS: ["assets/sfx/laugh01.mp3", "assets/sfx/laugh02.mp3", "assets/sfx/laugh03.mp3", "assets/sfx/laugh04.mp3", "assets/sfx/laugh05.mp3"],
    BOMBS: ["assets/sfx/bomb01.mp3", "assets/sfx/bomb02.mp3", "assets/sfx/bomb03.mp3"],
    TITLE: "assets/sfx/title.mp3",
    DOOR_OPEN: "assets/sfx/door_open.mp3",
    DOOR_CLOSE: "assets/sfx/door_close.mp3",
    GAMEOVER: "assets/sfx/gameover.mp3",
}

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

export async function loadAudioFiles() {
    if (audioCtx != null) {
        return;
    }
    audioCtx = new AudioContext();

    for (const trackName in TrackURLs) {
        const song = await loadFile(TrackURLs[trackName]);
        tracks[trackName] = song; // Store the song with its track name as the key
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

export function playTrack(audioBuffer) {
    const trackSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    trackSource.loop = true;
    trackSource.connect(audioCtx.destination);

    if (currentTrack !== null) {
        currentTrack.stop();
    }

    let elapsedTime = audioCtx.currentTime - startTime;
    let offset = elapsedTime % audioBuffer.duration;

    trackSource.start(0, offset);

    currentTrack = trackSource;
    startTime = audioCtx.currentTime - offset; // Update start time considering the offset
}

// Syncs the footsteps with the track
let footsteps = null;
export function playFootsteps(audioBuffer) {
    const audioSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    audioSource.loop = true;
    audioSource.connect(audioCtx.destination);

    if (footsteps !== null) {
        footsteps.stop();
    }

    let elapsedTime = audioCtx.currentTime - startTime;
    let offset = elapsedTime % audioBuffer.duration;

    audioSource.start(0, offset);

    footsteps = audioSource;
    startTime = audioCtx.currentTime - offset;
}

export function stopFootsteps() {
    if (footsteps !== null) {
        footsteps.stop();
        footsteps = null; // Reset footsteps to null
    }
}

// Pick a random sound from an sfx array
export function randomSfx(sfxPath) {
    console.log("path", sfxPath);
    const randomSound = sfxPath[Math.floor(Math.random() * sfxPath.length)];
    console.log("picked", randomSound);
    return randomSound
}

export function playAudio(audioBuffer) {
    const audioSource = new AudioBufferSourceNode(audioCtx, {
        buffer: audioBuffer,
    });
    audioSource.connect(audioCtx.destination);

    audioSource.start();
}