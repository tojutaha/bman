import { PlayAudio } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { spawnEnemies } from "./enemy.js";
import { exit, newLevel } from "./main.js";
import { updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { players } from "./player.js";
import { createTiles, exitLocation} from "./tile.js";

export let pause = false;

export class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.numOfEnemies = -1;
        this.firstBombExploded = false;
        this.isPaused = false;
    }

    init()
    {
        // TODO: Escin kuuntelija (ehkä muualle?)
        document.addEventListener('keyup', function(event) {
            if (event.key === 'Escape') {
                this.isPaused = !this.isPaused;
                console.log("pause", this.isPaused);
            }
        });
    }

    initLevel() {
        fetchLevelInfo(this.level).then((tilesObject) => {
            // console.log(tilesObject);
            // TODO: tässä säätämiset. Missä määritetään levelWidth ja -height?
            // createTiles(tilesObject);
        });

        fetchEnemies(this.level).then((enemiesArray) => {
            this.numOfEnemies = enemiesArray.length;
            console.info("Initial numOfEnemies:", this.numOfEnemies, enemiesArray);
            spawnEnemies(enemiesArray);
        });

    }
    
    increaseScore(points) {
        this.score += points;
        updateScoreDisplay(this.score);
    }
    
    nextLevel() {   // TODO: yks iso sekamelska tää
        this.numOfEnemies = -1;
        this.level++;
        updateLevelDisplay(this.level);
        clearBombs();
        this.saveGame();
        newLevel();
        this.initLevel();

        players.forEach(p => {
            p.healthPoints = 3;
            p.updateHealthPoints();
        });
    }
    
    increaseEnemies() {
        this.numOfEnemies++;
        // console.info("numOfEnemies:", this.numOfEnemies);
    }
    
    decreaseEnemies() {
        this.numOfEnemies--;
        console.info("numOfEnemies:", this.numOfEnemies);
    }
    
    toggleDoor() {
        exitLocation.isOpen = !exitLocation.isOpen;
        console.log("toggle")
        
        if (exitLocation.isOpen) {
            exit.playAnimation();
        } else {
            exit.init();
        }
    }

    checkGameState() {
        if (this.numOfEnemies === 0 && exitLocation.isOpen === false) {
            this.toggleDoor();
            PlayAudio("assets/audio/exitopen01.wav");
        }
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
    for (let i = 0; i < players.length; i++) {
        players[i].speed = loadedPlayers[i].speed;
        players[i].powerup.maxBombs = loadedPlayers[i].powerup.maxBombs;
        players[i].powerup.maxRange = loadedPlayers[i].powerup.maxRange;
        
        console.info("LOADED PLAYER", i+1, "\nSpeed:", players[i].speed, "Bombs:", players[i].powerup.maxBombs, "Range:", players[i].powerup.maxRange)
    }
}

// JSON
async function fetchEnemies(lvl) {
    const response = await fetch("levels.json");
    const data = await response.json();
    const enemiesObject = data[lvl].enemies;

    const enemiesArray = Object.entries(enemiesObject).flatMap(([key, value]) => Array(value).fill(key));
    return enemiesArray;
}

async function fetchLevelInfo(lvl) {
    const response = await fetch("levels.json");
    const data = await response.json();
    const tilesObject = data[lvl].tiles;

    return tilesObject;
}
