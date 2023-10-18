import { PlayAudio } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { clearEnemies, enemies, spawnEnemies } from "./enemy.js";
import { level, exit, levelHeader, entrance, gameOverText, Render } from "./main.js";
import { showGameOverMenu, updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { clearPlayers, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, exitLocation} from "./tile.js";

export let pause = false;
export let levelWidth = 19;
export let levelHeight = 13;

export class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.numOfEnemies = -1;
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
        this.initLevel();
        this.newLevel();    // TODO: Tämän jos kommentoi pois niin menee rikki
        spawnPlayers();
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
        Render();
    }

    continueGame() {
        clearPlayers();
        clearEnemies();
        this.loadGame();
        this.initLevel();
        this.newLevel();    // TODO: Tämän jos kommentoi pois niin menee rikki
        spawnPlayers();
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
        Render();
    }

    initLevel() {
        // Endgame
        if (this.level > 3) {   // TODO: Numero
            this.level = "Z";
        }

        fetchLevelInfo(this.level).then((tilesObject) => {
            console.log(tilesObject);
            levelWidth = tilesObject.width;
            levelHeight = tilesObject.height;
            this.newLevel();    // TODO: kutsuakko tässä vai..?
        });

        fetchEnemies(this.level).then((enemiesArray) => {
            this.numOfEnemies = enemiesArray.length;
            console.info("Initial numOfEnemies:", this.numOfEnemies, enemiesArray);
            spawnEnemies(enemiesArray);

            if (exitLocation.isOpen) {
                this.toggleDoor();
            };
        });
    }

    newLevel() {
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
        clearEnemies();
        resetPlayerPositions();

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
    
    nextLevel() {   // TODO: yks iso sekamelska tää
        this.numOfEnemies = -1;
        this.level++;
        clearBombs();
        // this.newLevel();
        this.initLevel();
        updateLevelDisplay(this.level);

        if (this.level != "Z") {
            this.saveGame();
        }

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
