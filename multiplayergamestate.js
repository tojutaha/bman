import { Game, setLevelHeight, setLevelPowerup, setLevelType, setLevelWidth, setPowerupCount, setSoftwallPercent } from "./gamestate.js";
import { stopBirdsong, stopCurrentTrack } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX } from "./camera.js";
import { clearEnemies, enemyType, spawnEnemyByTypeAtLocation } from "./enemy.js";
import { setTextures, initHardWallsCanvas } from "./level.js";
import { ctx, tileSize, level, setGlobalPause, fadeTransition, locBlinkers } from "./main.js";
import { updateP1Score, updateP2Score, updatePVPTimerDisplay } from "./page.js";
import { clearPlayers, findPlayerById, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, powerupLocations} from "./tile.js";
import { getRandomWalkablePoint } from "./utils.js";
import { initPowerups, randomPowerup } from "./powerup.js";
import { createFloatingText } from "./particles.js";
import { locBlinkingAnimation } from "./animations.js";

const PVPlevelData = {
    width: 13,
    height: 13,
    type: "forest_night",
    powerup: "random",
    powerupCount: 5,
    softwallPercent: 0.2,
};

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
        this.points = 1000; // Points per pvp kill
        this.timerHandle = null;
        this.enemySpawnRate = 10;
        this.enemySpawnTimerHandle = null;
        this.powerupSpawnrate = 10;
        this.powerupSpawnTimerHandle = null;
        this.seconds = 0;
        this.minutes = 0;
    }

    startTimer() {
        this.timerHandle = setInterval(() => {

            // Päivittää ajan
            if(++this.seconds % 60 == 0) {
                ++this.minutes;
                this.seconds = 0;
            }

            updatePVPTimerDisplay(`${this.minutes.toString().padStart(2, '0')}:
                                  ${this.seconds.toString().padStart(2, '0')}`);

            // Spawnaa zombeja tietyn ajan välein
            if(this.seconds % this.enemySpawnRate == 0) {
                const location = getRandomWalkablePoint();

                let blinker = new SpawnBlinker();
                blinker.location = location;
                blinker.startBlinking(spawnType.ENEMY);
                pvpBlinkers.push(blinker);

                let counter = 0;
                this.enemySpawnTimerHandle = setInterval(() => {
                    if(counter >= 5) {
                        blinker.stopBlinking();
                        counter = 0;
                        clearInterval(this.enemySpawnTimerHandle);
                        spawnEnemyByTypeAtLocation(enemyType.ZOMBIE, location);
                    }
                    counter++;
                }, 1000);
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
                        if(counter >= 3) {
                            blinker.stopBlinking()
                            counter = 0;
                            clearInterval(this.powerupSpawnTimerHandle);
                            tile.powerup = randomPowerup();
                            tile.hasPowerup = true;
                            powerupLocations.push(tile);
                            initPowerups();
                        }

                        counter++;
                    }, 1000);
                }
            }
        }, 1000);
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
        pvpBlinkers.length = 0;
        locBlinkers.stopBlinking();
        this.player1Score = 0;
        this.player2Score = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.startTimer();
        stopBirdsong(); // TODO: Halutaanko jotain audiota tänne?
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
        // Heartbeatit pois
        this.beatDropped = true;
        // Reset camera position
        setCameraX(0);
    }

    newLevel() {
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
        initPowerups();
        setGlobalPause(false);
    }

    restartLevel()
    {
        pvpBlinkers.length = 0;
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
            initPowerups();
            setGlobalPause(false);
        
            this.initLevel();
            players.forEach(p => {
                p.isDead = false;
            });
            resetPlayerPositions();
            clearEnemies();
        }, 2000);
    }
    
    updateScore(playerWhoDied, playerWhoKilled, enemyWhoKilled) {

        const player = findPlayerById(playerWhoDied);
        if(player)
        {
            const x = player.x;
            const y = player.y;

            if (playerWhoDied === playerWhoKilled) {

                // Reset powerupit jos pommittaa ittensä
                player.powerup.reset();
                player.speed = player.originalSpeed;

                if (playerWhoDied === 0) {
                    this.player1Score -= this.points;
                    createFloatingText({ x: x, y: y }, `-${this.points}`);
                    updateP1Score(this.player1Score);
                } else {
                    this.player2Score -= this.points;
                    createFloatingText({ x: x, y: y }, `-${this.points}`);
                    updateP2Score(this.player2Score);
                }
            } else {
                if (playerWhoKilled === 0) {
                    this.player1Score += this.points;
                    createFloatingText({ x: x, y: y }, `+${this.points}`);
                    updateP1Score(this.player1Score);
                } else {
                    this.player2Score += this.points;
                    createFloatingText({ x: x, y: y }, `+${this.points}`);
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
                createFloatingText({ x: x, y: y }, `+${points}`);
                updateP1Score(this.player1Score);
            } else {
                this.player2Score += points;
                createFloatingText({ x: x, y: y }, `+${points}`);
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
