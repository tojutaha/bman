////////////////////
// Imports
import { renderWalls, renderFloor } from "./level.js";
import { EntranceAnimation, ExitAnimation, locBlinkingAnimation, LevelHeaderAnimation, GameOverAnimation, DeathReasonAnimation, renderEnemyDeaths, TutorialAnimation, BigBombAnimation, FadeTransition, isBigBombOver } from "./animations.js";
import { renderPickups } from "./pickups.js";
import { renderPlayer } from "./player.js";
import { renderEnemies } from "./enemy.js";
import { renderBombs, renderExplosions } from "./bomb.js";
import { Game } from "./gamestate.js";
import { MultiplayerGame, renderPVPBlinkers } from "./multiplayergamestate.js";
import { updateCamera } from "./camera.js";
import { showDoor, showPauseMenu } from "./page.js";
import { isMobile, responsivityCheck } from "./mobile.js";
import { renderFloatingText } from "./particles.js";
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
export const cagePlayers = true;
export const bigBombOverlay = false;
const showTutorial = false;
const fadeTransitions = true;

////////////////////
// Assets
export let spriteSheet = document.getElementById("sprite-sheet");

////////////////////
// Render
let lastTimeStamp = 0;
let updateHz = 60; // Determines how often the movement/"physics" should update.
const frameDelay = 1000 / updateHz;
export let fixedDeltaTime = 1000 / updateHz;
export let scale = 1;

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
    updateHz = isMobile ? 30 : 60;

    const elapsed = timeStamp - lastTimeStamp;
    fixedDeltaTime = clamp(fixedDeltaTime, 0, 1/updateHz);
    //console.log("dt:", fixedDeltaTime, " fps:", 1/fixedDeltaTime, " maxFPS:", updateHz);
    
    // Render only if enough time has passed
    if (elapsed > frameDelay) {

        ctx.save();
    
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        ctx.restore();
    
        if(!globalPause) {
            updateCamera();
            renderFloor();
            if (!showDoor && !isMultiplayer) {
                exit.render();
                renderPickups();
            }
            if(!isMultiplayer){
                entrance.render();
            }
            if(isMultiplayer) {
                renderPickups();
            }
            renderBombs();
            renderPlayer(timeStamp);
            if (!bigBombOverlay) {
                renderEnemies(timeStamp);
            }
            else if (bigBombOverlay && isBigBombOver) {
                renderEnemies(timeStamp);
            }
            // We want to render the walls here so that the shadows go under them
            renderWalls();

            if (bigBombOverlay && !isMultiplayer) {
                bigBomb.render();
            }
            // Enemies outlines rendered on top of the overlay
            if (bigBombOverlay && !isBigBombOver) {
                renderEnemies(timeStamp);
            }
            locBlinkers.render();
            renderPVPBlinkers();
            if (showDoor && !isMultiplayer) {
                exit.render();
                renderPickups();
            }
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

////////////////////
// DOM
document.addEventListener("DOMContentLoaded", function ()
{
    canvas = document.getElementById("canvas");
    if (canvas) {
        ctx = canvas.getContext("2d");
        if (ctx) {
            Render();
            responsivityCheck();
        } else {
            throw new Error("Could not find ctx object.");
        }
    } else {
        throw new Error("Could not find canvas object.");
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'Escape' && game.isRunning) {
        showPauseMenu();
    }
});

