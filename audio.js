// Modified from:
// https://github.com/mdn/webaudio-examples/tree/main/multi-track
// https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games

// NOTE: An internal clock that starts ticking the moment you create an audio context
let audioCtx = null;

export let tracks = {};
const TrackURLs = {
    BIRDS: "assets/music/dawn-chorus-birdsong.mp3",
    BEAT: "assets/music/song_heartbeat.mp3",
    KICK: "assets/music/song_kick.mp3",
    KICK_DRONES: "assets/music/song_kick_drones.mp3",
    INT1: "assets/music/song_intensity01.mp3",
    INT2: "assets/music/song_intensity02.mp3",
    INT3: "assets/music/song_intensity03.mp3",
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
    audioCtx = new AudioContext();  // TODO: luo tämä vasta kun painettu jotain

    for (const trackName in TrackURLs) {
        const song = await loadFile(TrackURLs[trackName]);
        tracks[trackName] = song; // Store the song with its track name as the key
    }

    return tracks;
}



let startTime = 0;
let currentTrack = null;

// TODO: TEMPO
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

    return trackSource;
}

// https://stackoverflow.com/questions/61453760/how-to-rapidly-play-multiple-copies-of-a-soundfile-in-javascript
//PlayAudio("assets/sfx/click.mp3", 1);
export const PlayAudio = async (filepath, volume = 0.5) =>  // TODO: tee loadAudioFilessä
{
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    audioSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audioSource.start();
}

// DEBUG (index_audiodebug.html)
// // Provide a start button so demo can load tracks from an event handler for cross-browser compatibility
// const startButton = document.querySelector("#startbutton");

// // Select all list elements
// const trackEls = document.querySelectorAll("li");
// startButton.addEventListener("click", () => {
//     if (audioCtx != null) {
//         return;
//     }

//     audioCtx = new AudioContext();

//     document.querySelector("#startbutton").hidden = true;

//     trackEls.forEach((el) => {
//         // Get children
//         const anchor = el.querySelector("a");
//         const loadText = el.querySelector("p");
//         const playButton = el.querySelector(".playbutton");

//         // Load file
//         loadFile(anchor.href).then((track) => {
//         el.dataset.loading = "false";

//             // Hide loading text
//             loadText.style.display = "none";

//             // Show button
//             playButton.style.display = "inline-block";

//             // Allow play on click
//             playButton.addEventListener("click", () => {
//                 // check if context is in suspended state (autoplay policy)
//                 if (audioCtx.state === "suspended") {
//                 audioCtx.resume();
//                 }

//                 playTrack(track);
//                 playButton.dataset.playing = true;
//                 });
//         });
//     });
// });