////////////////////
// Imports
import { renderWalls, renderFloor } from "./level.js";
import { EntranceAnimation, ExitAnimation, locBlinkingAnimation, LevelHeaderAnimation, GameOverAnimation, DeathReasonAnimation, renderEnemyDeaths, TutorialAnimations, BigBombAnimation, FadeTransition } from "./animations.js";
import { renderPowerups } from "./powerup.js";
import { renderPlayer } from "./player.js";
import { renderEnemies } from "./enemy.js";
import { renderBombs, renderExplosions } from "./bomb.js";
import { Game } from "./gamestate.js";
import { MultiplayerGame } from "./multiplayergamestate.js";
import { updateCamera } from "./camera.js";
import { showDoor, showPauseMenu } from "./page.js";
// TODO: Nämä importit voi ottaa myöhemmin pois
import { fetchEverything } from "./gamestate.js";
import { loadTextures } from "./level.js";
import { loadSpriteSheets } from "./spritesheets.js";
import { responsivityCheck } from "./mobile.js";


////////////////////
// Globals
export let canvas;
export let ctx;
export let level = [];
export let globalPause = true;
export function setGlobalPause(value) {
    globalPause = value;
}

export let game = new Game();
export let numOfPlayers = 1;
export function setNumOfPlayers(value) {
    numOfPlayers = value;

    if(value == 1) {
        game = new Game();
    } else if(value == 2) {
        game = new MultiplayerGame();
    }
}

////////////////////
// Settings
export const tileSize = 64;
export const cagePlayer = false;
export const cageMultiplayer = false;
export const bigBombOverlay = false;
const showTutorial = false;
const fadeTransitions = false;

////////////////////
// Assets
export let spriteSheet = document.getElementById("sprite-sheet");

////////////////////
// Render
let lastTimeStamp = 0;
export let deltaTime = 16.6; // ~60fps alkuun..
export const scale = 1;

export const levelHeader = new LevelHeaderAnimation();
export const gameOverText = new GameOverAnimation();
export const deathReasonText = new DeathReasonAnimation();
export const entrance = new EntranceAnimation();
export const exit = new ExitAnimation();
export const locBlinkers = new locBlinkingAnimation();
export const tutorial = new TutorialAnimations();
export const bigBomb = new BigBombAnimation();
export const fadeTransition = new FadeTransition();

function Render(timeStamp)
{
    deltaTime = (timeStamp - lastTimeStamp) / 1000;
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.restore();

    if(!globalPause) {

        updateCamera();
        renderFloor();
        if (!showDoor) {
            exit.render();
            renderPowerups();
        }
        entrance.render();
        renderBombs();
        renderPlayer(timeStamp);
        renderWalls();
        locBlinkers.render();
        if (showDoor) {
            exit.render();
            renderPowerups();
        }
        if (bigBombOverlay) {
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
        if (showTutorial) {
            tutorial.render();
        }
    }

    lastTimeStamp = timeStamp

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

