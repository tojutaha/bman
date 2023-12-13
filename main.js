////////////////////
// Imports
import { renderWalls, renderFloor } from "./level.js";
import { EntranceAnimation, ExitAnimation, locBlinkingAnimation, LevelHeaderAnimation, GameOverAnimation, DeathReasonAnimation, renderEnemyDeaths, TutorialAnimation, BigBombAnimation, FadeTransition } from "./animations.js";
import { renderPowerups } from "./powerup.js";
import { renderPlayer } from "./player.js";
import { renderEnemies } from "./enemy.js";
import { renderBombs, renderExplosions } from "./bomb.js";
import { Game } from "./gamestate.js";
import { MultiplayerGame, renderPVPBlinkers } from "./multiplayergamestate.js";
import { updateCamera } from "./camera.js";
import { showDoor, showPauseMenu } from "./page.js";
import { isMobile, responsivityCheck } from "./mobile.js";
import { renderFloatingText } from "./particles.js";
// TODO: Nämä importit voi ottaa myöhemmin pois
import { fetchEverything } from "./gamestate.js";
import { loadTextures } from "./level.js";
import { loadSpriteSheets } from "./spritesheets.js";
import { clamp } from "./utils.js";


////////////////////
// Globals
export let canvas;
export let ctx;
export const FULL_CANVAS_SIZE = 832;
export let level = [];
export let globalPause = true;
export function setGlobalPause(value) {
    globalPause = value;
}

export let game = new Game();
export let isMultiplayer = false;
export let numOfPlayers = 1;
export function setNumOfPlayers(value) {
    numOfPlayers = value;

    if(value == 1) {
        isMultiplayer = false;
        game = new Game();
    } else if(value == 2) {
        isMultiplayer = true;
        game = new MultiplayerGame();
    }
}

////////////////////
// Settings
export const tileSize = 64;
export const cagePlayer = true;
export const cageMultiplayer = false;
export const bigBombOverlay = false;
const showTutorial = false;
const fadeTransitions = true;

////////////////////
// Assets
export let spriteSheet = document.getElementById("sprite-sheet");

////////////////////
// Render
let lastTimeStamp = 0;
export let deltaTime = 16.6; // ~60fps alkuun..
export let scale = 1;
const maxFPS = 60;
const frameDelay = 1000 / maxFPS;

export const levelHeader = new LevelHeaderAnimation();
export const gameOverText = new GameOverAnimation();
export const deathReasonText = new DeathReasonAnimation();
export const entrance = new EntranceAnimation();
export const exit = new ExitAnimation();
export const locBlinkers = new locBlinkingAnimation();
export const tutorial = new TutorialAnimation();
export const bigBomb = new BigBombAnimation();
export const fadeTransition = new FadeTransition();

function Render(timeStamp)
{
    scale = isMobile ? 0.75 : 1;
    const elapsed = timeStamp - lastTimeStamp;
    
    // Render only if enough time has passed
    if (elapsed > frameDelay) {

        deltaTime = clamp(deltaTime, 0, 1/maxFPS);
        //console.log("dt:", deltaTime, " fps:", 1/deltaTime);
        //console.log(elapsed);

        ctx.save();
    
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        ctx.restore();
    
        if(!globalPause) {
            updateCamera();
            renderFloor();
            if (!showDoor && !isMultiplayer) {
                exit.render();
                renderPowerups();
            }
            if(!isMultiplayer){
                entrance.render();
            }
            if(isMultiplayer) {
                renderPowerups();
            }
            renderBombs();
            renderPlayer(timeStamp);
            renderWalls();
            locBlinkers.render();
            renderPVPBlinkers();
            if (showDoor && !isMultiplayer) {
                exit.render();
                renderPowerups();
            }
            if (bigBombOverlay && !isMultiplayer) {
                bigBomb.render();
            }
            renderEnemies(timeStamp);
            if (fadeTransitions) {
                fadeTransition.render();
            }
            renderExplosions();
            renderEnemyDeaths();
            levelHeader.render();
            gameOverText.render();
            deathReasonText.render();
            if (showTutorial && !isMobile && !isMultiplayer) {
                tutorial.render();
            }
    
            renderFloatingText();
        }
    
        lastTimeStamp = timeStamp - (elapsed % frameDelay);
    }
    
    requestAnimationFrame(Render);
}

// TODO: Tämä pois kun ei tartteta enää debuggailla
async function debugLoad()
{
    await fetchEverything();
    await loadTextures();
    await loadSpriteSheets();
    
    game.newGame();
}

////////////////////
// DOM
document.addEventListener("DOMContentLoaded", function ()
{
    responsivityCheck();
    canvas = document.getElementById("canvas");
    if (canvas) {
        ctx = canvas.getContext("2d");
        if (ctx) {
            // TODO: Tämä pois kun ei tartteta enää debuggailla
            debugLoad();
            
            Render();
        } else {
            throw new Error("Could not find ctx object.");
        }
    } else {
        throw new Error("Could not find canvas object.");
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'Escape') {
        showPauseMenu();
    }
});

