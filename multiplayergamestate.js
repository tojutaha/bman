import { Game, setLevelHeight, setLevelPowerup, setLevelType, setLevelWidth, setPowerupCount, setSoftwallPercent } from "./gamestate.js";
import { playTrack, loadAudioFiles, tracks, playBirdsong, stopBirdsong, stopCurrentTrack } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX } from "./camera.js";
import { clearEnemies, enemies, spawnEnemies } from "./enemy.js";
import { setTextures, initHardWallsCanvas } from "./level.js";
import { level, exit, levelHeader, entrance, gameOverText, setGlobalPause, tutorial, bigBomb, fadeTransition, bigBombOverlay } from "./main.js";
import { showGameOverMenu, updateLevelDisplay, updateP1Score, updatePVPTimerDisplay, updateScoreDisplay } from "./page.js";
import { clearPlayers, players, resetPlayerPositions, spawnPlayers } from "./player.js";
import { createTiles, exitLocation} from "./tile.js";
import { levels, levelWidth, levelHeight, levelType, levelPowerup, softwallPercent, powerupCount } from "./gamestate.js";

const PVPlevelData = {
    width: 13,
    height: 13,
    type: "forest_night",
    powerup: "random",
    powerupCount: 5,
    softwallPercent: 0.2,
};

export class MultiplayerGame extends Game
{
    constructor() {
        super();
        this.numPlayers = 2;
        this.timerHandle = null;
        this.seconds = 0;
        this.minutes = 0;
    }

    startTimer() {
        this.timerHandle = setInterval(() => {
            if(++this.seconds % 60 == 0) {
                ++this.minutes;
                this.seconds = 0;
            }
            updatePVPTimerDisplay(`${this.minutes.toString().padStart(2, '0')}:
                                  ${this.seconds.toString().padStart(2, '0')}`);
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
        // TODO: Oma score display
        //updateLevelDisplay(this.level);
        //updateScoreDisplay(this.score);
    }

    initLevel() {
        // Heartbeatit pois
        this.beatDropped = true;
        // Reset camera position
        setCameraX(0);
    }

    newLevel() {
        setGlobalPause(true);
        clearEnemies(); // Varmuuden vuoksi..
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
            //levelHeader.playAnimation(); TODO
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
                //levelHeader.playAnimation(); TODO
                //resetPlayerPositions();
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
        }, 2000);
    }
    
    increaseScore(points) {
        // TODO
    }

    nextLevel() {
        // Only one level
    }
    
    checkGameState() {
        // TODO
    }

    // Saving & loading
    saveGame() {
        // No saving
    }
    
    loadGame() {
        // No loading
    }
}
