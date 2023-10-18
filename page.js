import { enemies } from "./enemy.js";
import { ctx, tileSize, levelHeight, levelWidth, game } from "./main.js";
import { players } from "./player.js";

////////////////////
// Score and level display
let scoreDisplay = document.getElementById("score");
export function updateScoreDisplay(score) {
    scoreDisplay.textContent = score;
}

let levelDisplay = document.getElementById("level");
export function updateLevelDisplay(level) {
    levelDisplay.textContent = `LEVEL ${level}`;
}

////////////////////
// Main menu / buttons
const mainMenu = document.querySelector('.main-menu-container');
const newGameButton = document.getElementById("newGameButton");
const continueGameButton = document.getElementById("continueGameButton");
const settingsButton = document.getElementById("settingsButton");
const howToPlayButton = document.getElementById("howToPlayButton");

export function showMainMenu()
{
    mainMenu.style.visibility = 'visible';
}

newGameButton.addEventListener('click', function() {
    console.log("New Game");
});

continueGameButton.addEventListener('click', function() {
    console.log("Continue");
});

settingsButton.addEventListener('click', function() {
    console.log("Settings");
});

howToPlayButton.addEventListener('click', function() {
    console.log("How To Play");
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
    game.newGame();
});

exitButton.addEventListener('click', function() {
    gameOverMenu.style.visibility = 'hidden';
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
        console.log("Player", i+1, "bombs:", players[i].powerup.maxBombs);
    }
})

let rangeButton = document.getElementById("rangeplus");
rangeButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxRange += 1;
        console.log("Player", i+1, "range:", players[i].powerup.maxRange);
    }
})

let resetPowerupsButton = document.getElementById("reset-powerups");
resetPowerupsButton.addEventListener("click", function() {
    for (let i = 0; i < players.length; i++) {
        players[i].powerup.maxBombs = 1;
        players[i].powerup.maxRange = 1;
        console.log("Player", i+1, "range and bombs resetted");
    }
})

let killEnemiesButton = document.getElementById("kill-enemies");
killEnemiesButton.addEventListener("click", function() {
    enemies.forEach(enemy => {
        enemy.die();
    })
})

let killPlayersButton = document.getElementById("kill-players");
killPlayersButton.addEventListener("click", function() {
    players.forEach(p => {
        p.onDeath();
    })
})

// Save and load
let saveButton = document.getElementById("save");
saveButton.addEventListener("click", function() {
    game.saveGame();
})

let loadButton = document.getElementById("load");
loadButton.addEventListener("click", function() {
    game.loadGame();
})

// Delete save
let deleteButton = document.getElementById("delete-save");
deleteButton.addEventListener("click", function() {
    localStorage.clear();
    location.reload();
})
