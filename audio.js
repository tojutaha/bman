// https://stackoverflow.com/questions/61453760/how-to-rapidly-play-multiple-copies-of-a-soundfile-in-javascript

//PlayAudio("audio/click.mp3", 1);
export const PlayAudio = async (audioFile, volume = 0.5) =>
{
    const audioContext = new AudioContext();
    const response = await fetch(audioFile);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    audioSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    audioSource.start();
}

