import { playTrack, loadAudioFiles, tracks } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { clearEnemies, spawnEnemies } from "./enemy.js";
import { setTextures, updateHardWallsCanvas } from "./level.js";
import { level, exit, levelHeader, entrance, gameOverText, setGlobalPause, game } from "./main.js";
import { restarted, showGameOverMenu, showMainMenu, updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { clearPlayers, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, exitLocation} from "./tile.js";

export let pause = false;

// Level settings
export const levels = [];
export let lastLevel = false;
export let levelWidth = 13;
export let levelHeight = 13;
export let levelType = "none";
export let levelPowerup = "random";
export let softwallPercent = 0.1;
export let powerupCount = 2;


export class Game {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.numOfEnemies = 0;
        this.firstBombExploded = false;
    }

    newGame() {
        playTrack(tracks['BIRDS']);
        setGlobalPause(true);
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
    }

    continueGame() {
        setGlobalPause(true);
        clearPlayers();
        clearEnemies();
        spawnPlayers();
        this.loadGame();
        this.newLevel();
        this.initLevel();
    }

    initLevel() {
        const levelEnemies = levels[this.level].enemies;

        // Add small delay before respawning the enemies, so we 
        // dont instantly collide them with player
        setTimeout(() => {
            spawnEnemies(levelEnemies);
            this.numOfEnemies = levelEnemies.length;
        }, 500);
        
        if (exitLocation.isOpen) {
            this.toggleDoor();
        };
    }
    
    newLevel() {
        if (this.level >= levels.length - 1) {
            lastLevel = true;
        } else lastLevel = false;
        
        if (this.level > 1) {
            if (lastLevel) {
                playTrack(tracks['BEAT']);
            } else {
                playTrack(tracks['INT1']);
            }
        };


        setGlobalPause(true);
        clearEnemies();
        clearBombs();
 
        const levelData = levels[this.level];
        levelHeight = levelData.height;
        levelWidth = levelData.width;
        levelType = levelData.type;
        levelPowerup = levelData.powerup;
        powerupCount = levelData.powerupCount;
        softwallPercent = levelData.softwallPercent;
        setTextures();
        
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
        updateHardWallsCanvas();
        setGlobalPause(false);
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
    
    nextLevel() {
        if (lastLevel) {
            return;
        }
        
        this.level++;
        this.newLevel();
        this.initLevel();
        updateLevelDisplay(this.level);
        
        if (!lastLevel) {
            // Fill the healtpoints before saving
            players.forEach(p => {
                p.healthPoints = 3;
                p.updateHealthPoints();
            });
            // No saving on level Z
            this.saveGame();
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
    
    toggleDoor() {
        exitLocation.isOpen = !exitLocation.isOpen;
        
        if (exitLocation.isOpen) {
            exit.playAnimation();
        } else {
            exit.init();
        }
    }

    checkGameState() {
        // TODO: Delete the door and maybe add last level music.
        if (lastLevel) {
            return;
        }

        if (this.firstBombExploded) {
            if (this.level >= 2) {
                playTrack(tracks['INT2']);
            }
        }
        
        // Open the door
        if (this.numOfEnemies <= 0 && exitLocation.isOpen === false) {
            this.toggleDoor();

            if (this.level === 1) {
                playTrack(tracks['KICK_DRONES']);
            } else {
                playTrack(tracks['INT1']);                
            }
        }
        else if (this.numOfEnemies <= 3 && this.level > 2) {
            playTrack(tracks['INT3']);
        }
    }

    over() {
        gameOverText.playAnimation().then(() => {
            playTrack(tracks['BEAT']);
            localStorage.clear();
            showGameOverMenu();
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
            loadPlayerAttributes(loadedPlayers);
        }
    }
}

function loadPlayerAttributes(loadedPlayers) {
    for (let i = 0; i < players.length; i++) {
        players[i].speed = loadedPlayers[i].speed;
        players[i].powerup.maxBombs = loadedPlayers[i].powerup.maxBombs;
        players[i].powerup.maxRange = loadedPlayers[i].powerup.maxRange;
        players[i].healthPoints = loadedPlayers[i].healthPoints;
        players[i].updateHealthPoints();
        
        console.info("LOADED PLAYER", i+1, "\nSpeed:", players[i].speed, 
            "Bombs:", players[i].powerup.maxBombs, 
            "Range:", players[i].powerup.maxRange,
            "Healthpoints:", players[i].healthPoints);
    }
}

// JSON
export async function fetchEverything() {
    const response = await fetch("levels.json");
    const data = await response.json();
    await loadAudioFiles();
    
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
    
    console.log("Everything fetched and ready.");
}
