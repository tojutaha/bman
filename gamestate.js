import { playTrack, loadAudioFiles, tracks, stopBirdsong, playBirdsong } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX, setCameraY } from "./camera.js";
import { clearEnemies, enemies, spawnEnemies } from "./enemy.js";
import { setTextures, initHardWallsCanvas } from "./level.js";
import { initPickups } from "./pickups.js";
import { level, exit, levelHeader, entrance, gameOverText, setGlobalPause, tutorial, bigBomb, fadeTransition, bigBombOverlay } from "./main.js";
import { showGameOverMenu, updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { clearPlayers, godMode, players, resetPlayerPositions, spawnPlayers, toggleGodMode } from "./player.js";
import { createTiles, exitLocation} from "./tile.js";
import { isMobile } from "./mobile.js";

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

// Setters for MultiplayerGame
export function setLastLevel(value) {
    lastLevel = value;
}

export function setLevelWidth(width) {
    levelWidth = width;
}

export function setLevelHeight(height) {
    levelHeight = height;
}

export function setLevelType(type) {
    levelType = type;
}

export function setLevelPowerup(powerup) {
    levelPowerup = powerup;
}

export function setSoftwallPercent(percent) {
    softwallPercent = percent;
}

export function setPowerupCount(count) {
    powerupCount = count;
}


export class Game {
    constructor() {
        this.isRunning = false;
        this.score = 0;
        this.level = 1;
        this.numOfEnemies = 0;
        this.firstBombDropped = false;
        this.firstBombExploded = false;
        this.beatDropped = false;
        this.trackPlaying;
    }

    newGame() {
        this.isRunning = true;

        fadeTransition.fadeIn();
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
        this.isRunning = true;
        
        fadeTransition.fadeIn();
        setGlobalPause(true);
        clearPlayers();
        clearEnemies();
        spawnPlayers();
        this.loadGame();
        this.newLevel();
        updateLevelDisplay(this.level);
        this.initLevel();
    }

    initLevel() {
        const levelEnemies = levels[this.level].enemies;

        // Add small delay before respawning the enemies, so we 
        // dont instantly collide them with player
        setTimeout(() => {
            spawnEnemies(levelEnemies);
            this.numOfEnemies = levelEnemies.length;
            
            // Enemies show only outlines during the big bomb overlay
            if (bigBombOverlay && this.level === 1 && !this.firstBombExploded) {
                if (isMobile) {
                    setTextures("limbo");
                    initHardWallsCanvas();
                }
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
        setCameraY(0);
    }
    
    newLevel() {
        if (this.level === 1) {
            //tutorial.playAnimation();
            bigBomb.visible = true;
        } else {
            if (tutorial.visible) {
                tutorial.visible = false;
            }
            bigBomb.visible = false;         
        }

        if (this.level >= levels.length - 1) {
            lastLevel = true;
        } else lastLevel = false;
        
        // Set the music
        this.beatDropped = false;
        
        if (lastLevel) {
            playTrack(tracks['HEART']);
        } 
        else if (this.level > 1) {
            playTrack(tracks['INT1']);
        }

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
        initPickups();
        setGlobalPause(false);
    }

    restartLevel()
    {
        resetPlayerPositions();
        if (!godMode) {
            toggleGodMode();
        }

        setTimeout(() => {
            clearBombs();
        }, 1000);

        setTimeout(() => {
            players.forEach(p => {
                p.isDead = false;
            });
        }, 2000);

        setTimeout(() => {
            if (godMode) {
                toggleGodMode();
            }
        }, 5000);
    }
    
    increaseScore(points) {
        this.score += points;
        updateScoreDisplay(this.score);
    }
    
    nextLevel() {
        if (lastLevel) {
            return;
        }

        fadeTransition.blackScreen();
        fadeTransition.fadeIn();
        
        this.level++;
        if (this.level === 2) {
            stopBirdsong();
        }

        this.newLevel();
        this.initLevel();
        updateLevelDisplay(this.level);
        
        if (!lastLevel) {
            // Fill the healtpoints before saving
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
        this.saveGame();
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
            }
            else if (!lastLevel) {
                playTrack(tracks['INT1']);            
            }

        }
        else if (this.numOfEnemies <= 3 && this.level > 2) {
            if (!lastLevel) {
                playTrack(tracks['INT3']);
            } else {
                playTrack(tracks['HEART_DRONES_BELL']);
            }
        }
    }

    over() {
        this.isRunning = false;

        if (isMobile) {
            const mobilePauseBtn = document.getElementById('pause-button');
            mobilePauseBtn.style.visibility = 'hidden';
            const mobileController = document.querySelector('.mobile-controller');
            mobileController.style.visibility = 'hidden';
        }

        gameOverText.playAnimation().then(() => {
            playTrack(tracks['HEART']);
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
