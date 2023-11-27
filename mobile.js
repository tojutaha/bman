import { globalPause, setGlobalPause } from "./main.js";

window.addEventListener('resize', responsivityCheck);

export function responsivityCheck() {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;

    if (isPortrait) {
        console.log("Portrait");
        // setGlobalPause(!globalPause);    // TODO: ei toimi debuglatauksessa
    } else {
        console.log("Not portrait");
    }    
}

