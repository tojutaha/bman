import { playTrack, loadAudioFiles, tracks } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX } from "./camera.js";
import { clearEnemies, enemies, spawnEnemies } from "./enemy.js";
import { setTextures, initHardWallsCanvas } from "./level.js";
import { level, exit, levelHeader, entrance, gameOverText, setGlobalPause, tutorial, bigBomb, fadeTransition, bigBombOverlay } from "./main.js";
import { showGameOverMenu, updateLevelDisplay, updateScoreDisplay } from "./page.js";
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
        this.firstBombDropped = false;
        this.firstBombExploded = false;
        this.beatDropped = false;
    }

    newGame() {
        fadeTransition.fadeIn();
        playTrack(tracks['BIRDS']);
        setGlobalPause(true);
        localStorage.clear();
        this.level = 1;
        this.score = 0;
        clearPlayers();
        this.newLevel();
        spawnPlayers();
        this.initLevel();
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
    }

    continueGame() {
        fadeTransition.fadeIn();
        setGlobalPause(true);
        clearPlayers();
        clearEnemies();
        spawnPlayers();
        this.loadGame();
        this.newLevel();
        this.initLevel();
        playTrack(tracks['INT1']);
    }

    initLevel() {
        const levelEnemies = levels[this.level].enemies;

        // Add small delay before respawning the enemies, so we 
        // dont instantly collide them with player
        setTimeout(() => {
            spawnEnemies(levelEnemies);
            this.numOfEnemies = levelEnemies.length;
            
            // Enemies show only outlines during the big bomb overlay
            if (bigBombOverlay && this.level > 1 && !this.firstBombExploded) {
                enemies.forEach(enemy => {
                    enemy.showOutline();
                });
            }
        }, 100);
        
        if (exitLocation.isOpen) {
            this.toggleDoor();
        };

        // Reset camera position
        setCameraX(0);
    }
    
    newLevel() {
        this.beatDropped = false;

        if (this.level === 1) {
            tutorial.playAnimation();
            bigBomb.visible = false;
        }
        if (this.level > 1) {
            if (tutorial.visible) {
                tutorial.visible = false;
            }
            bigBomb.visible = true;         
        }
        if (this.level >= levels.length - 1) {
            lastLevel = true;
        } else lastLevel = false;

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
            this.firstBombDropped = false;
            this.firstBombExploded = false;
            levelHeader.playAnimation();
            entrance.playAnimation();
            exit.init();
            resetPlayerPositions();
        } else {
            throw new Error("Failed to create level");
        }
        initHardWallsCanvas();
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
        playTrack(tracks['INT1']);

        fadeTransition.blackScreen();
        fadeTransition.fadeIn();
        
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
    }
    
    decreaseEnemies() {
        this.numOfEnemies--;
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
        // Open the door
        if (this.numOfEnemies === 0 && exitLocation.isOpen === false) {
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
    }
}

// JSON
export async function fetchEverything() {
    const response = await fetch("levels.json");
    const data = await response.json();
    await loadAudioFiles();
    
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const enemyObject = data[key].enemies;
            const enemyArray = Object.entries(enemyObject).flatMap(([key, value]) => Array(value).fill(key));
            const levelObject = data[key].tiles;

            levelObject.enemies = enemyArray;
            levels.push(levelObject);
        }
    }
}
