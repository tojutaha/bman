import { Game, setLevelHeight, setLevelPowerup, setLevelType, setLevelWidth, setPowerupCount, setSoftwallPercent } from "./gamestate.js";
import { stopBirdsong, stopCurrentTrack } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX } from "./camera.js";
import { clearEnemies, enemyType, spawnEnemiesByType } from "./enemy.js";
import { setTextures, initHardWallsCanvas } from "./level.js";
import { ctx, tileSize, level, setGlobalPause, fadeTransition, locBlinkers, enemyBlinkers } from "./main.js";
import { updateP1Score, updateP2Score, updatePVPTimerDisplay } from "./page.js";
import { clearPlayers, findPlayerById, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, powerupLocations} from "./tile.js";
import { getRandomWalkablePoint } from "./utils.js";
import { randomPowerup } from "./powerup.js";
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

export class enemySpawnBlinker extends locBlinkingAnimation
{
    constructor() {
        super();
        this.location = {x: 64, y: 64};
    }

    render() {
        if(this.showLocation) {
            ctx.fillStyle = "rgba(255, 100, 100, 0.2)";
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
        this.powerupSpawnrate = 30;
        this.seconds = 0;
        this.minutes = 0;
    }

    startTimer() {
        this.timerHandle = setInterval(() => {
            if(++this.seconds % 60 == 0) {
                ++this.minutes;
                this.seconds = 0;

                // Spawnaa zombeja minuutin välein
                spawnEnemiesByType(enemyType.ZOMBIE, 1);
            }
            updatePVPTimerDisplay(`${this.minutes.toString().padStart(2, '0')}:
                                  ${this.seconds.toString().padStart(2, '0')}`);

            // Spawnaa random poweruppeja tietyn ajan välein
            if(this.seconds % this.powerupSpawnrate == 0) {
                const tile = getRandomWalkablePoint();
                tile.powerup = randomPowerup();
                tile.hasPowerup = true;
                powerupLocations.push(tile);
            }

        }, 1000);
    }

    over() {
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
        enemyBlinkers.stopBlinking();
        locBlinkers.stopBlinking();
        this.player1Score = 0;
        this.player2Score = 0;
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
        setGlobalPause(false);
    }

    restartLevel()
    {
        setTimeout(() => {
            setGlobalPause(true);
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
