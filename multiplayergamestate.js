import { Game, setLevelHeight, setLevelPowerup, setLevelType, setLevelWidth, setPowerupCount, setSoftwallPercent } from "./gamestate.js";
import { playTrack, loadAudioFiles, tracks, playBirdsong, stopBirdsong } from "./audio.js";
import { clearBombs } from "./bomb.js";
import { setCameraX } from "./camera.js";
import { clearEnemies, enemies, spawnEnemies } from "./enemy.js";
import { setTextures, initHardWallsCanvas } from "./level.js";
import { level, exit, levelHeader, entrance, gameOverText, setGlobalPause, tutorial, bigBomb, fadeTransition, bigBombOverlay } from "./main.js";
import { showGameOverMenu, updateLevelDisplay, updateScoreDisplay } from "./page.js";
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
    }

    newGame() {
        console.log("MultiplayerGame");
        fadeTransition.fadeIn();
        setGlobalPause(true);
        localStorage.clear();
        this.level = 1;
        this.score = 0;
        clearPlayers();
        this.newLevel();
        spawnPlayers(2);
        this.initLevel();
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
    }

    initLevel() {

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
            this.firstBombDropped = false;
            this.firstBombExploded = false;
            levelHeader.playAnimation();
            //entrance.playAnimation();
            //exit.init();
            resetPlayerPositions();
        } else {
            throw new Error("Failed to create level");
        }
        initHardWallsCanvas();
        setGlobalPause(false);
    }
}