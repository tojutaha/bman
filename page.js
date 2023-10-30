import { enemies } from "./enemy.js";
import { ctx, tileSize, game, setGlobalPause, globalPause } from "./main.js";
import { fetchEverything, lastLevel, levelHeight, levelWidth, levels } from "./gamestate.js";
import { players } from "./player.js";
import { playAudio, playTrack, sfxs, tracks } from "./audio.js";
import { loadTextures } from "./level.js";

// Settings
export let restarted = false;

////////////////////
// Score and level display
let scoreDisplay = document.getElementById("score");
export function updateScoreDisplay(score) {
    scoreDisplay.textContent = score;
}

let levelDisplay = document.getElementById("level");
export function updateLevelDisplay(level) {
    if (!lastLevel)
    {
        levelDisplay.textContent = `LEVEL ${level}`;
    } else {
        levelDisplay.textContent = "HAHAHA YOU'RE GONNA DIE";
    }
}

////////////////////
// Main menu / buttons
const playButton = document.getElementById("playGameButton");
const loadingText = document.getElementById("loading-text");
const playContainer = document.querySelector(".play-game-container");
const infoDisplays = document.querySelector(".info-displays");
const mainMenu = document.querySelector('.main-menu-container');
const newGameButton = document.getElementById("newGameButton");
const confirmText = document.getElementById("confirmText");
const continueGameButton = document.getElementById("continueGameButton");
const howToPlayMenu = document.querySelector(".how-to-play-container");
const howToPlayButton = document.getElementById("howToPlayButton");
const closeButton = document.getElementById("closeButton");

export function showMainMenu()
{
    // No saves were found
    if (localStorage.length === 0) {
        continueGameButton.disabled = true;
    } else {
        continueGameButton.disabled = false;
    }
    mainMenu.style.visibility = 'visible';
    infoDisplays.style.visibility = 'hidden';
}

let confirmed = false;
newGameButton.addEventListener('click', function() {
    if (localStorage.length === 0) {
        game.newGame();
        mainMenu.style.visibility = 'hidden';
        infoDisplays.style.visibility = 'visible';
        confirmed = false;
    } else {
        confirmText.style.visibility = 'visible';
        newGameButton.innerText = "Confirm";
        if(confirmed) {
            game.newGame();
            confirmText.style.visibility = 'hidden';
            mainMenu.style.visibility = 'hidden';
            infoDisplays.style.visibility = 'visible';
            newGameButton.innerText = "New Game";
        }
        confirmed = true;
    }

});

continueGameButton.addEventListener('click', function() {
    game.continueGame();
    mainMenu.style.visibility = 'hidden';
    infoDisplays.style.visibility = 'visible';
    confirmText.style.visibility = 'hidden';
    newGameButton.innerText = "New Game";
    confirmed = false;
});

howToPlayButton.addEventListener('click', function() {
    howToPlayMenu.style.visibility = 'visible';
    mainMenu.style.visibility = 'hidden';
});

closeButton.addEventListener('click', function() {
    howToPlayMenu.style.visibility = 'hidden';
    mainMenu.style.visibility = 'visible';
});

playButton.addEventListener('click', async function() {
    loadingText.style.visibility = 'visible';
    playButton.style.visibility = 'hidden';
    await fetchEverything();
    await loadTextures();
    loadingText.style.visibility = 'hidden';
    playContainer.style.visibility = 'hidden';
    showMainMenu();
    playAudio(sfxs['TITLE']);
});


////////////////////
// Game over menu / buttons
const gameOverMenu = document.querySelector(".game-over-container");
const restartButton = document.getElementById("restartButton");
const exitButton = document.getElementById("exitButton");
const gameOverScore = document.getElementById("game-over-score");

export function showGameOverMenu()
{
    gameOverScore.innerText = `Score ${game.score}`;
    gameOverMenu.style.visibility = 'visible';
}

restartButton.addEventListener('click', function() {
    gameOverMenu.style.visibility = 'hidden';
    restarted = true;
    game.newGame();
});

exitButton.addEventListener('click', function() {
    gameOverMenu.style.visibility = 'hidden';
    showMainMenu();
});

////////////////////
// Pause menu / buttons
const pauseMenu = document.querySelector(".pause-menu-container");
const pauseMenuContinueButton = document.getElementById("pauseMenu-ContinueButton");
const pauseMenuExitButton = document.getElementById("pauseMenu-ExitButton");

export function showPauseMenu() {
    setGlobalPause(!globalPause);
    const visibility = globalPause ? 'visible' : 'hidden';
    pauseMenu.style.visibility = visibility;
}

pauseMenuContinueButton.addEventListener('click', function() {
    pauseMenu.style.visibility = 'hidden';
    setGlobalPause(false);
});

pauseMenuExitButton.addEventListener('click', function() {
    pauseMenu.style.visibility = 'hidden';
    playTrack(tracks['BEAT']);
    showMainMenu();
});


////////////////////
// DEBUG & TESTING

// Scale buttons
let canvasContainer = document.getElementsByClassName("canvas-container");
let scaleBtn50 = document.getElementById("scale50");
let scaleBtn75 = document.getElementById("scale75");
let scaleBtn100 = document.getElementById("scale100");

scaleBtn50.addEventListener("click", scale50);
scaleBtn75.addEventListener("click", scale75);
scaleBtn100.addEventListener("click", scale100);

function scale50() {
    canvasContainer[0].style.cssText = "scale: 50%;";
}
function scale75() {
    canvasContainer[0].style.cssText = "scale: 75%;";
}
function scale100() {
    canvasContainer[0].style.cssText = "scale: 100%;";
}

// Show door and powerup location
let doorButton = document.getElementById("show-door");
export let showDoor = false;
doorButton.addEventListener("click", function() {
    showDoor = !showDoor;
});

// Show coordinates
let coordButton = document.getElementById("show-coords");
export let coordsToggle = false;
coordButton.addEventListener("click", function() {
    coordsToggle = !coordsToggle;
});

export function drawCoordinates(coordsToggle) {
    ctx.fillStyle = "#eeed";
    ctx.lineWidth = 0.4;
    ctx.font = '10px Arial';
    ctx.textBaseline = 'hanging';

    let pad = 3;
    
    if (coordsToggle) {
        for (let x = 1; x < levelHeight -1; x++) {
            for (let y = 1; y < levelWidth -1; y++) {
                const yCoord = y * tileSize;
                const xCoord = x * tileSize;
                
                ctx.fillText(`${xCoord}`, yCoord + pad, xCoord + pad + 12);
                ctx.fillText(`${yCoord},`, yCoord + pad, xCoord + pad);
            }
        }
    }
}

// Powerup buttons
let bombButton = document.getElementById("bombplus");
bombButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxBombs += 1;
        //console.log("Player", i+1, "bombs:", players[i].powerup.maxBombs);
    }
});

let rangeButton = document.getElementById("rangeplus");
rangeButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxRange += 1;
        //console.log("Player", i+1, "range:", players[i].powerup.maxRange);
    }
});

let resetPowerupsButton = document.getElementById("reset-powerups");
resetPowerupsButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxBombs = 1;
        players[i].powerup.maxRange = 1;
        //console.log("Player", i+1, "range and bombs resetted");
    }
});

let killEnemiesButton = document.getElementById("kill-enemies");
killEnemiesButton.addEventListener("click", function() {
    enemies.forEach(enemy => {
        enemy.die();
    })
});

let killPlayersButton = document.getElementById("kill-players");
killPlayersButton.addEventListener("click", function() {
    players.forEach(p => {
        p.onDeath();
    })
});

// Next level
let nxtLvlButton = document.getElementById("next-level");
nxtLvlButton.addEventListener("click", function() {
    game.nextLevel();
});

// Delete save
let deleteButton = document.getElementById("delete-save");
deleteButton.addEventListener("click", function() {
    localStorage.clear();
    location.reload();
});
