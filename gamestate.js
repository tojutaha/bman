import { PlayAudio } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { clearEnemies, spawnEnemies } from "./enemy.js";
import { level, exit, levelHeader, entrance, gameOverText, Render } from "./main.js";
import { showGameOverMenu, updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { clearPlayers, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, exitLocation} from "./tile.js";

export let pause = false;
export let levelWidth = 19;
export let levelHeight = 13;
export const levels = [];
export let lastLevel = false;

export class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.numOfEnemies = 0;
        this.firstBombExploded = false;
        this.isPaused = false;
    }

    init() {
        // TODO: Escin kuuntelija (ehkä muualle?)
        document.addEventListener('keyup', function(event) {
            if (event.key === 'Escape') {
                this.isPaused = !this.isPaused;
                console.log("pause", this.isPaused);
            }
        });
    }

    newGame() {
        localStorage.clear();
        this.level = 1;
        this.score = 0;
        clearPlayers();
        clearEnemies();
        this.newLevel();
        spawnPlayers();
        this.initLevel();
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
        Render();
    }

    continueGame() {
        clearPlayers();
        clearEnemies();
        this.loadGame();
        this.newLevel();
        spawnPlayers();
        this.initLevel();
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
        Render();
    }

    initLevel() {
        const levelEnemies = levels[this.level].enemies;
        spawnEnemies(levelEnemies);
        this.numOfEnemies = levelEnemies.length;
        
        if (exitLocation.isOpen) {
            this.toggleDoor();
        };
    }
    
    newLevel() {
        console.log("Level", this.level, levels[this.level]);
        if (this.level >= levels.length - 1) {
            lastLevel = true;
        }

        clearEnemies();
        clearBombs();

        levelHeight = levels[this.level].height;
        levelWidth = levels[this.level].width;

        let newLevel = createTiles();
        level.length = 0;
        Array.prototype.push.apply(level, newLevel);

        if (level.length > 0) {
            this.firstBombExploded = false;
            levelHeader.playAnimation();
            entrance.playAnimation();
            exit.init();
            resetPlayerPositions();
        } else {
            throw new Error("Failed to create level");
        }
    }

    restartLevel()
    {
        resetPlayerPositions();
        clearEnemies();

        setTimeout(() => {
            clearBombs();
        }, 1000);

        setTimeout(() => {
            this.initLevel();
            players.forEach(p => {
                p.isDead = false;
            });
        }, 2000);
    }
    
    increaseScore(points) {
        this.score += points;
        updateScoreDisplay(this.score);
    }
    
    nextLevel() {
        if (lastLevel) {
            return;
        }
        
        this.level++;
        this.newLevel();
        this.initLevel();
        updateLevelDisplay(this.level);
        this.saveGame();

        if (!lastLevel) {
            players.forEach(p => {
                p.healthPoints = 3;
                p.updateHealthPoints();
            });
        } else {
            players.forEach(p => {
                p.healthPoints = 1;
                p.updateHealthPoints();
            });
        }
    }
    
    increaseEnemies() {
        this.numOfEnemies++;
        // console.info("numOfEnemies:", this.numOfEnemies);
    }
    
    decreaseEnemies() {
        this.numOfEnemies--;
        // console.info("numOfEnemies:", this.numOfEnemies);
    }
    
    toggleDoor() {  // TODO ehkä: uudemmissa Bombermaneissa powerup-tiili alkaa välkkymään
        exitLocation.isOpen = !exitLocation.isOpen;
        
        if (exitLocation.isOpen) {
            exit.playAnimation();
        } else {
            exit.init();
        }
    }

    checkGameState() {
        if (this.numOfEnemies <= 0 && exitLocation.isOpen === false) {
            this.toggleDoor();
            PlayAudio("assets/audio/exitopen01.wav");
        }
    }

    over() {
        gameOverText.playAnimation().then(() => {
            showGameOverMenu();
            localStorage.clear();
            this.level = 1;
            this.score = 0;
        });
    }

    // Saving & loading
    saveGame() {
        // Save the display
        localStorage.setItem("level-number", this.level);
        localStorage.setItem("score", this.score);
        localStorage.setItem("players", JSON.stringify(players));
    }
    
    loadGame() {
        if (localStorage.length != 0) {
            // Load the display
            this.level = parseInt(localStorage.getItem("level-number"));
            this.score = parseInt(localStorage.getItem("score"));
            updateLevelDisplay(this.level);
            updateScoreDisplay(this.score);
            
            const loadedPlayers = JSON.parse(localStorage.getItem("players"));
            loadPowerups(loadedPlayers);
        }
    }
}

function loadPowerups(loadedPlayers) {
    console.log("called loadPowerups (TODO: tää ei toimi)");
    for (let i = 0; i < players.length; i++) {
        players[i].speed = loadedPlayers[i].speed;
        players[i].powerup.maxBombs = loadedPlayers[i].powerup.maxBombs;
        players[i].powerup.maxRange = loadedPlayers[i].powerup.maxRange;
        
        console.info("LOADED PLAYER", i+1, "\nSpeed:", players[i].speed, "Bombs:", players[i].powerup.maxBombs, "Range:", players[i].powerup.maxRange)
    }
}

// JSON
export async function fetchLevels() {
    const response = await fetch("levels.json");
    const data = await response.json();
    
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            // console.log(`Level ${key}:`, data[key]);
            const enemyObject = data[key].enemies;
            const enemyArray = Object.entries(enemyObject).flatMap(([key, value]) => Array(value).fill(key));
            const levelObject = data[key].tiles;

            levelObject.enemies = enemyArray;
            levels.push(levelObject);
        }
    }
    console.log("Levels fetched and ready.");
}

// orig
// async function fetchEnemies(lvl) {
//     const response = await fetch("levels.json");
//     const data = await response.json();
//     const enemiesObject = data[lvl].enemies;

//     const enemiesArray = Object.entries(enemiesObject).flatMap(([key, value]) => Array(value).fill(key));
//     return enemiesArray;
// }

// async function fetchLevelInfo(lvl) {
//     const response = await fetch("levels.json");
//     const data = await response.json();
//     const tilesObject = data[lvl].tiles;

//     return tilesObject;
// }