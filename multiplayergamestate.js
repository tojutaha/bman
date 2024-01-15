import { Game, setLevelHeight, setLevelPowerup, setLevelType, setLevelWidth, setPowerupCount, setSoftwallPercent } from "./gamestate.js";
import { playTrack, stopBirdsong, stopCurrentTrack, tracks } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX } from "./camera.js";
import { clearEnemies, enemyType, spawnEnemyByTypeAtLocation } from "./enemy.js";
import { setTextures, initHardWallsCanvas, getRandomLevelType } from "./level.js";
import { ctx, tileSize, level, setGlobalPause, fadeTransition, locBlinkers, globalPause, game } from "./main.js";
import { updateP1Score, updateP2Score, updatePVPTimerDisplay } from "./page.js";
import { clearPlayers, findPlayerById, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, powerupLocations} from "./tile.js";
import { getRandomWalkablePoint } from "./utils.js";
import { initPickups, randomPowerup } from "./pickups.js";
import { createFloatingText } from "./particles.js";
import { locBlinkingAnimation } from "./animations.js";

let currentLevelType = "hell";
function createPVPLevel() {
    let randomLevelType = getRandomLevelType();
    while (randomLevelType === currentLevelType) {
        randomLevelType = getRandomLevelType();
    }
    currentLevelType = randomLevelType;
    
    const randomInt = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    let randomFloat;
    if (currentLevelType !== 'hell') {
        randomFloat = Math.random() * (0.4 - 0.2) + 0.2;
    } else {
        randomFloat = Math.random() * (0.2 - 0.1) + 0.1;
    }
    
    const level = {
        width: 13,
        height: 13,
        type: randomLevelType,
        powerup: "random",
        powerupCount: randomInt,
        softwallPercent: randomFloat,
    };
    
    return level
}

const spawnType = {
    ENEMY: "Enemy",
    POWERUP: "Powerup",
}

export const pvpBlinkers = [];

export function renderPVPBlinkers() {
    for(let i = 0; i < pvpBlinkers.length; ++i) {
        const blinker = pvpBlinkers[i];
        if(blinker.isBlinking) {
            blinker.render();
        } else {
            pvpBlinkers.splice(i, 1);
        }
    }
}

export class SpawnBlinker extends locBlinkingAnimation
{
    constructor() {
        super();
        this.location = {x: 64, y: 64};
        this.fillStyle = "rgba(255, 100, 100, 0.2)";
    }

    startBlinking(type) {

        switch(type) {
            case spawnType.ENEMY:
                this.fillStyle = "rgba(255, 100, 100, 0.2)";
                break;
            case spawnType.POWERUP:
                this.fillStyle = "rgba(255, 190, 130, 0.3)";
                break;
        }

        this.isBlinking = true;
        this.blinker = setInterval(() => {
            this.showLocation = !this.showLocation;

            if (!this.isBlinking) {
                clearInterval(blinker);
            }
        }, 700);
    }

    render() {
        if(this.showLocation) {
            ctx.fillStyle = this.fillStyle;
            ctx.fillRect(this.location.x, this.location.y, tileSize, tileSize);
        }
    }
}

export class MultiplayerGame extends Game
{
    constructor() {
        super();
        this.numPlayers = 2;
        this.player1Score = 0;
        this.player2Score = 0;
        this.pvpPoints = 1000;
        this.killedByEnemyPoints = 500;
        this.timerHandle = null;
        this.enemySpawnRate = 15;
        this.enemySpawnTimerHandle = null;
        this.powerupSpawnrate = 10;
        this.powerupSpawnTimerHandle = null;
        this.seconds = 0;
        this.minutes = 0;

        this.restaring = false;
    }

    startTimer() {
        this.timerHandle = setInterval(() => {

            if(globalPause) return;

            // Päivittää ajan
            updatePVPTimerDisplay(`${this.minutes.toString().padStart(2, '0')}:
                                  ${this.seconds.toString().padStart(2, '0')}`);

            if(++this.seconds % 60 == 0) {
                ++this.minutes;
                this.seconds = 0;
            }

            // Spawnaa vihollsia tietyn ajan välein
            if(this.seconds % this.enemySpawnRate == 0) {
                const location = getRandomWalkablePoint();
                if(location) {
                    let blinker = new SpawnBlinker();
                    blinker.location = location;
                    blinker.startBlinking(spawnType.ENEMY);
                    pvpBlinkers.push(blinker);

                    let counter = 0;
                    this.enemySpawnTimerHandle = setInterval(() => {
                        if (globalPause) return;

                        if(counter >= 5) {
                            blinker.stopBlinking();
                            counter = 0;
                            clearInterval(this.enemySpawnTimerHandle);

                            let enemies;
                            if (currentLevelType === "forest_day") {
                                enemies = ["ZOMBIE", "ZOMBIE", "WITCH"];
                            } 
                            else if (currentLevelType === "forest_night") {
                                enemies = ["ZOMBIE", "GHOST", "SKELETON"];
                            }
                            else if (currentLevelType === "hell") {
                                enemies = ["SKELETON", "SKELETON", "GHOST"];
                            } else {
                                enemies = ["ZOMBIE", "SKELETON", "GHOST", "WITCH"];
                            }
                            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
            
                            spawnEnemyByTypeAtLocation(enemyType[randomEnemy], location);
                        }
                        counter++;
                    }, 1000);
                }
            }

            // Spawnaa random poweruppeja tietyn ajan välein
            if(this.seconds % this.powerupSpawnrate == 0) {

                const tile = getRandomWalkablePoint(false);
                if(tile) {
                    let blinker = new SpawnBlinker();
                    blinker.location = tile;
                    blinker.startBlinking(spawnType.POWERUP);
                    pvpBlinkers.push(blinker);

                    let counter = 0;
                    this.powerupSpawnTimerHandle = setInterval(() => {
                        if (globalPause) return;

                        if(counter >= 3) {
                            blinker.stopBlinking()
                            counter = 0;
                            clearInterval(this.powerupSpawnTimerHandle);
                            tile.powerup = randomPowerup();
                            tile.hasPowerup = true;
                            powerupLocations.push(tile);
                            initPickups();
                        }

                        counter++;
                    }, 1000);
                }
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerHandle);
        this.timerHandle = null;
    }

    over() {
        if(this.enemySpawnTimerHandle) {
            clearInterval(this.enemySpawnTimerHandle);
        }
        if(this.powerupSpawnTimerHandle) {
            clearInterval(this.powerupSpawnTimerHandle);
        }
        clearEnemies();
        pvpBlinkers.length = 0;
        locBlinkers.stopBlinking();
        if(this.timerHandle) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;

            this.seconds = 0;
            this.minutes = 0;
            updatePVPTimerDisplay(`${this.minutes.toString().padStart(2, '0')}:
                                  ${this.seconds.toString().padStart(2, '0')}`);
        }
    }

    newGame() {
        game.isRunning = true;
        
        pvpBlinkers.length = 0;
        locBlinkers.stopBlinking();
        this.player1Score = 0;
        this.player2Score = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.startTimer();
        stopBirdsong();
        stopCurrentTrack();
        fadeTransition.fadeIn();
        setGlobalPause(true);
        localStorage.clear();
        this.level = 1;
        this.score = 0;
        clearPlayers();
        this.newLevel();
        spawnPlayers(2);
        this.initLevel();
    }

    initLevel() {
        // Reset camera position
        setCameraX(0);
    }

    newLevel() {
        game.beatDropped = false;
        playTrack(tracks['MP_WAIT']);
        stopBirdsong();
        
        const PVPlevelData = createPVPLevel();
        setGlobalPause(true);
        clearEnemies();
        clearBombs();
 
        setLevelHeight(PVPlevelData.height);
        setLevelWidth(PVPlevelData.width);
        setLevelType(PVPlevelData.type);
        setLevelPowerup(PVPlevelData.powerup);
        setPowerupCount(PVPlevelData.powerupCount);
        setSoftwallPercent(PVPlevelData.softwallPercent);
        setTextures();
        
        let newLevel = createTiles();
        level.length = 0;
        Array.prototype.push.apply(level, newLevel);

        if (level.length > 0) {
            this.firstBombDropped = true;
            this.firstBombExploded = true;
            //levelHeader.playAnimation();
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
        // Prevent level restarting twice, if both players die at same time.
        if(this.restaring) return;

        this.restaring = true;

        game.beatDropped = false;
        playTrack(tracks['MP_WAIT']);
        stopBirdsong();
        
        const PVPlevelData = createPVPLevel();
        this.stopTimer();
        // Clear spawn timers to prevent enemies traveling from previous round
        if(this.enemySpawnTimerHandle) {
            clearInterval(this.enemySpawnTimerHandle);
        }
        if(this.powerupSpawnTimerHandle) {
            clearInterval(this.powerupSpawnTimerHandle);
        }
        pvpBlinkers.length = 0;
        locBlinkers.stopBlinking();

        setTimeout(() => {
            setGlobalPause(true);
            this.seconds = 0;
            this.minutes = 0;
            clearBombs();

            setLevelHeight(PVPlevelData.height);
            setLevelWidth(PVPlevelData.width);
            setLevelType(PVPlevelData.type);
            setLevelPowerup(PVPlevelData.powerup);
            setPowerupCount(PVPlevelData.powerupCount);
            setSoftwallPercent(PVPlevelData.softwallPercent);
            setTextures();

            let newLevel = createTiles();
            level.length = 0;
            Array.prototype.push.apply(level, newLevel);

            if (level.length > 0) {
                this.firstBombDropped = true;
                this.firstBombExploded = true;
                //levelHeader.playAnimation();
            } else {
                throw new Error("Failed to create level");
            }
            initHardWallsCanvas();
            initPickups();
            setGlobalPause(false);
        
            this.initLevel();
            players.forEach(p => {
                p.isDead = false;
                p.powerup.currentWalls = 3; // Reset build materials
            });
            resetPlayerPositions();
            clearEnemies();
            this.startTimer();
            this.restaring = false;
        }, 2000);
    }
    
    updateScore(playerWhoDied, playerWhoKilled, enemyWhoKilled) {

        const player = findPlayerById(playerWhoDied);
        if(player) {

            const x = player.x;
            const y = player.y;

            if (enemyWhoKilled) {
                if (player.id == 0) {
                    createFloatingText({ x: x, y: y }, `+${this.killedByEnemyPoints}`);
                    this.player2Score += this.killedByEnemyPoints;
                    updateP2Score(this.player2Score);
                } else if (player.id == 1) {
                    createFloatingText({ x: x, y: y }, `+${this.killedByEnemyPoints}`);
                    this.player1Score += this.killedByEnemyPoints;
                    updateP1Score(this.player1Score);
                }
                return;
            }

            if (playerWhoDied === playerWhoKilled) {

                // Reset powerups if self kill
                player.powerup.reset();
                player.speed = player.originalSpeed;

                // Add scores to the other player
                if(player.id == 0) {
                    createFloatingText({ x: x, y: y }, `+${this.pvpPoints}`);
                    this.player2Score += this.pvpPoints;
                    updateP2Score(this.player2Score);
                } else if(player.id == 1) {
                    createFloatingText({ x: x, y: y }, `+${this.pvpPoints}`);
                    this.player1Score += this.pvpPoints;
                    updateP1Score(this.player1Score);
                }

            } else {
                if (playerWhoKilled === 0) {
                    createFloatingText({ x: x, y: y }, `+${this.pvpPoints}`);
                    this.player1Score += this.pvpPoints;
                    updateP1Score(this.player1Score);
                } else {
                    createFloatingText({ x: x, y: y }, `+${this.pvpPoints}`);
                    this.player2Score += this.pvpPoints;
                    updateP2Score(this.player2Score);
                }
            }
        }
    }

    increaseScore(playerID, points) {
        const player = findPlayerById(playerID);
        if(player)
        {
            const x = player.x;
            const y = player.y;

            if (playerID === 0) {
                this.player1Score += points;
                updateP1Score(this.player1Score);
            } else {
                this.player2Score += points;
                updateP2Score(this.player2Score);
            }
        }
    }

    nextLevel() {
        // Only one level
    }
    
    checkGameState() {
        // Nothing to do
    }

    // Saving & loading
    saveGame() {
        // No saving
    }
    
    loadGame() {
        // No loading
    }
}
