import { enemies, enemyType, spawnEnemiesByType } from "./enemy.js";
import { ctx, tileSize, game, setGlobalPause, globalPause, setNumOfPlayers, isMultiplayer } from "./main.js";
import { fetchEverything, lastLevel, levelHeight, levelWidth } from "./gamestate.js";
import { godMode, players, toggleGodMode } from "./player.js";
import { playAudio, playTrack, sfxs, stopBirdsong, tracks } from "./audio.js";
import { loadTextures } from "./level.js";
import { loadSpriteSheets } from "./spritesheets.js";
import { isMobile } from "./mobile.js";

// Settings
export let wonGame = false;

////////////////////
// Score and level display

// Solo
let scoreDisplay = document.getElementById("score");
export function updateScoreDisplay(score) {
    scoreDisplay.textContent = score;
}

let levelDisplay = document.getElementById("level");
export function updateLevelDisplay(level) {
    if (!lastLevel) {
        levelDisplay.textContent = `LEVEL ${level}`;
    }
    else if (lastLevel && !wonGame) {
        levelDisplay.textContent = "YOU'RE GONNA DIE";
    } else {
        levelDisplay.textContent = "YOU WIN";
    }
}
// PVP
let p1ScoreDisplay = document.getElementById("p1-score");
export function updateP1Score(value) {
    p1ScoreDisplay.textContent = value;
}
let p2ScoreDisplay = document.getElementById("p2-score");
export function updateP2Score(value) {
    p2ScoreDisplay.textContent = value;
}
let pvpTimerDisplay = document.getElementById("pvp-timer");
export function updatePVPTimerDisplay(value) {
    pvpTimerDisplay.textContent = value;
}

////////////////////
// Main menu / buttons
const playButton = document.getElementById("playGameButton");
const loadingText = document.getElementById("loading-text");
const titleAnimation = document.getElementById("title-logo-animation");
const playContainer = document.querySelector(".play-game-container");
const infoDisplays = document.querySelector(".info-displays");
const pvpInfoDisplays = document.querySelector(".pvp-info-displays");
const menuBackground = document.querySelector('.menu-background');
const mainMenu = document.querySelector('.main-menu-container');
const newGameButton = document.getElementById("newGameButton");
const confirmText = document.getElementById("confirmText");
const continueGameButton = document.getElementById("continueGameButton");
const pvpGameButton = document.getElementById("PVPGameButton")
const howToPlayMenu = document.querySelector(".how-to-play-container");
const howToPlayButton = document.getElementById("howToPlayButton");
const closeButton = document.getElementById("closeButton");
const mobileController = document.querySelector(".mobile-controller");
const mobilePauseBtn = document.getElementById('pause-button');
const floor = document.querySelector('.floor');


export function showMainMenu()
{
    // No saves were found
    if (localStorage.length === 0) {
        continueGameButton.disabled = true;
    } else {
        continueGameButton.disabled = false;
    }
    menuBackground.style.visibility = 'visible';
    mainMenu.style.visibility = 'visible';
    infoDisplays.style.visibility = 'hidden';
    infoDisplays.style.display = 'grid';
    pvpInfoDisplays.style.display = 'none';
    mobileController.style.visibility = 'hidden';
    mobilePauseBtn.style.visibility = 'hidden;'
    floor.style.background = 'none';
}

let confirmed = false;
newGameButton.addEventListener('click', function() {
    setNumOfPlayers(1);
    if (localStorage.length === 0) {
        game.newGame();
        menuBackground.style.visibility = 'hidden';
        mainMenu.style.visibility = 'hidden';
        infoDisplays.style.visibility = 'visible';
        pvpInfoDisplays.style.display = 'none';
        mobileController.style.visibility = 'visible';
        mobilePauseBtn.style.visibility = 'visible';
        confirmed = false;
    } else {
        confirmText.style.visibility = 'visible';
        newGameButton.innerText = "Confirm";
        if(confirmed) {
            game.newGame();
            confirmText.style.visibility = 'hidden';
            menuBackground.style.visibility = 'hidden';
            mainMenu.style.visibility = 'hidden';
            infoDisplays.style.visibility = 'visible';
            pvpInfoDisplays.style.display = 'none';
            mobileController.style.visibility = 'visible';
            mobilePauseBtn.style.visibility = 'visible';
            newGameButton.innerText = "New Game";
        }
        confirmed = true;
    }

});

pvpGameButton.addEventListener('click', function() {
    setNumOfPlayers(2);
    game.newGame();
    menuBackground.style.visibility = 'hidden';
    mainMenu.style.visibility = 'hidden';
    infoDisplays.style.display = 'none';
    pvpInfoDisplays.style.display = 'flex';
});

continueGameButton.addEventListener('click', function() {
    game.continueGame();
    menuBackground.style.visibility = 'hidden';
    mainMenu.style.visibility = 'hidden';
    infoDisplays.style.visibility = 'visible';
    confirmText.style.visibility = 'hidden';
    mobileController.style.visibility = 'visible';
    mobilePauseBtn.style.visibility = 'visible';
    newGameButton.innerText = "New Game";
    confirmed = false;
});

howToPlayButton.addEventListener('click', function() {
    howToPlayMenu.style.visibility = 'visible';
    menuBackground.style.visibility = 'hidden';
    mainMenu.style.visibility = 'hidden';
});

closeButton.addEventListener('click', function() {
    howToPlayMenu.style.visibility = 'hidden';
    menuBackground.style.visibility = 'visible';
    mainMenu.style.visibility = 'visible';
});

playButton.addEventListener('click', async function() {
    if (isMobile) {
        loadingText.style.display = 'none';
        playButton.style.display = 'none';
        titleAnimation.style.display = 'flex';
        titleAnimation.src = "./assets/logo_loading_animation.gif";
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        }
    } else {
        loadingText.style.visibility = 'visible';
        playButton.style.visibility = 'hidden';
    }
    let loadTimer = animateLoadingText();
    await fetchEverything();
    await loadTextures();
    await loadSpriteSheets();
    clearInterval(loadTimer);
    loadingText.style.visibility = 'hidden';
    playContainer.style.visibility = 'hidden';
    showMainMenu();
    playAudio(sfxs['TITLE']);
});

function animateLoadingText() {
    let dots = 0;
    let loadTimer = setInterval(() => {
        if (dots >= 3) {
            loadingText.textContent = "Loading";
            dots = 0;
        } else {
            loadingText.textContent += ".";
            dots++;
        }
    }, 600);

    return loadTimer;
}

////////////////////
// Game over menu / buttons
const gameOverMenu = document.querySelector(".game-over-container");
const ggMenu = document.querySelector(".gg-container");
const restartButton = document.getElementById("restartButton");
const exitButton = document.getElementById("exitButton");
const ggExitButton = document.getElementById("gg-exitButton");
const gameOverScore = document.getElementById("game-over-score");
const ggScore = document.getElementById("gg-score");
const ggHeader = document.getElementById("gg-header");

export function showGameOverMenu()
{
    gameOverScore.innerText = `Score ${game.score}`;
    menuBackground.style.visibility = 'visible';
    gameOverMenu.style.visibility = 'visible';
    if (isMobile) {
        infoDisplays.style.visibility = 'hidden';
    }
}

restartButton.addEventListener('click', function() {
    menuBackground.style.visibility = 'hidden';
    gameOverMenu.style.visibility = 'hidden';
    if (isMobile) {
        mobileController.style.visibility = 'visible';
        infoDisplays.style.visibility = 'visible';
        mobilePauseBtn.style.visibility = 'visible';
    }
    game.newGame();
});

exitButton.addEventListener('click', function() {
    game.isRunning = false;
    menuBackground.style.visibility = 'hidden';
    gameOverMenu.style.visibility = 'hidden';
    showMainMenu();
});

////////////////////
// GG menu / buttons
ggExitButton.addEventListener('click', function() {
    menuBackground.style.visibility = 'hidden';
    ggMenu.style.visibility = 'hidden';
    localStorage.clear();
    showMainMenu();
    
    if (isMultiplayer) {
        playTrack(tracks['SLOWHEART']);
        stopBirdsong();
    }
});
export function showGGMenu()
{
    wonGame = true;
    updateLevelDisplay();
    ggScore.innerText = `Score ${game.score}`;
    menuBackground.style.visibility = 'visible';
    ggMenu.style.visibility = 'visible';
}

////////////////////
// Pause menu / buttons
const pauseMenu = document.querySelector(".pause-menu-container");
const pauseMenuContinueButton = document.getElementById("pauseMenu-ContinueButton");
const pauseMenuExitButton = document.getElementById("pauseMenu-ExitButton");
const canvas = document.getElementById('canvas');

export function showPauseMenu() {
    setGlobalPause(!globalPause);
    const visibility = globalPause ? 'visible' : 'hidden';
    menuBackground.style.visibility = visibility;
    pauseMenu.style.visibility = visibility;
    
    const reverseVisibility = globalPause ? 'hidden' : 'visible';
    mobileController.style.visibility = reverseVisibility;
    canvas.style.visibility = reverseVisibility;
    floor.style.visibility = reverseVisibility;
}

pauseMenuContinueButton.addEventListener('click', function() {
    menuBackground.style.visibility = 'hidden';
    pauseMenu.style.visibility = 'hidden';
    mobileController.style.visibility = 'visible';
    mobilePauseBtn.style.visibility = 'visible';
    canvas.style.visibility = 'visible';
    floor.style.visibility = 'visible';
    setGlobalPause(false);
});

pauseMenuExitButton.addEventListener('click', function() {
    game.isRunning = false;

    menuBackground.style.visibility = 'hidden';
    pauseMenu.style.visibility = 'hidden';
    mobilePauseBtn.style.visibility = 'hidden';
    canvas.style.visibility = 'visible';
    floor.style.visibility = 'visible';
    showMainMenu();

    if(isMultiplayer) {
        updateP1Score(0);
        updateP2Score(0);
        game.over(); // Clears timer handles etc.
    }

    playTrack(tracks['SLOWHEART']);
});


////////////////////
// DEBUG & TESTING

// Scale buttons
const canvasContainer = document.querySelector(".canvas-container");
const scaleBtn50 = document.getElementById("scale50");
const scaleBtn75 = document.getElementById("scale75");
const scaleBtn100 = document.getElementById("scale100");

scaleBtn50.addEventListener("click", scale50);
scaleBtn75.addEventListener("click", scale75);
scaleBtn100.addEventListener("click", scale100);

function scale50() {
    canvasContainer.style.cssText = "scale: 50%;";
}
function scale75() {
    canvasContainer.style.cssText = "scale: 75%;";
}
function scale100() {
    canvasContainer.style.cssText = "scale: 100%;";
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
    }
});

let rangeButton = document.getElementById("rangeplus");
rangeButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxRange += 1;
    }
});

let resetPowerupsButton = document.getElementById("reset-powerups");
resetPowerupsButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxBombs = 1;
        players[i].powerup.maxRange = 1;
    }
});

let killEnemiesButton = document.getElementById("kill-enemies");
killEnemiesButton.addEventListener("click", function() {
    enemies.forEach(enemy => {
        enemy.die();
    })
});

let godModeButton = document.getElementById("god-mode");
godModeButton.addEventListener("click", function() {
    toggleGodMode();
    if(godMode) {
        godModeButton.innerText = "GodMode On ";
    } else {
        godModeButton.innerText = "GodMode Off";
    }
});

let killPlayersButton = document.getElementById("kill-players");
killPlayersButton.addEventListener("click", function() {
    players.forEach(p => {
        p.onDeath();
    })
});

let healPlayersButton = document.getElementById('heal-players');
healPlayersButton.addEventListener('click', function() {
    players.forEach(p => {
        p.healthPoints = 3;
        p.updateHealthPoints();
    })
});

let spawnGhostButton = document.getElementById('spawn-ghost');
spawnGhostButton.addEventListener('click', function() {
    spawnEnemiesByType(enemyType.GHOST, 1);
});

let spawnSkeletonButton = document.getElementById('spawn-skeleton');
spawnSkeletonButton.addEventListener('click', function() {
    spawnEnemiesByType(enemyType.SKELETON, 1);
});

let spawnWitchButton = document.getElementById('spawn-witch');
spawnWitchButton.addEventListener('click', function() {
    spawnEnemiesByType(enemyType.WITCH, 1);
});

let spawnZombieButton = document.getElementById('spawn-zombie');
spawnZombieButton.addEventListener('click', function() {
    spawnEnemiesByType(enemyType.ZOMBIE, 1);
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
