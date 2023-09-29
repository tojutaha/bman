import { clearBombArray, tilesWithBombs } from "./bomb.js";
import { enemies, loadEnemies } from "./enemy.js";
import { level, loadLevel } from "./main.js";
import { updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { players } from "./player.js";
import { exitLocation, loadExit } from "./tile.js";

// Testiksi eri class ettei mee sekavaksi
// Jotain tällästä rakennetta?
// http://gamedevgeek.com/tutorials/managing-game-states-in-c/
class GameState {
    constructor() {
        this.state = state;
        this.running = Boolean;
    }

    init() {
        //
    }

    cleanup() {
        // 
    }

    changeState(state) {
        // 
    }

    pushState(state) {
        // 
    }

    popState() {
        // 
    }

    handleEvents() {
        // 
    }

    update() {
        // 
    }

    draw() {
        // 
    }

    quit() {
       running = false; 
    }
}

export class Game {
    constructor() {
      this.score = 0;
      this.level = 1;
      this.numOfEnemies = 0;
    }
  
    increaseScore(points) {
      this.score += points;
      updateScoreDisplay(this.score);
    }
  
    nextLevel() {
      this.level++;
      updateLevelDisplay(this.level);
    }

    increaseEnemies() {
        this.numOfEnemies++;
    }

    decreaseEnemies() {
        this.numOfEnemies--;
    }

    openDoor() {
        exitLocation.isOpen = true;
    }

    // Saving & loading
    // TODO: pelaajat häviää jos ottaa tallennetun powerupin
    // juuri jätetty pommi/tile räjähtää näkymättömänä kun lataa pelin
    // vihut jumahtaa (varmaan setter ongelma)

    saveGame() {
        // Save the display
        localStorage.setItem("level-number", this.level);
        localStorage.setItem("score", this.score);

        // Save the game state
        localStorage.setItem("level", JSON.stringify(level));
        localStorage.setItem("bombs", JSON.stringify(tilesWithBombs));
        localStorage.setItem("exit", JSON.stringify(exitLocation));
        localStorage.setItem("enemies", JSON.stringify(enemies));
        localStorage.setItem("players", JSON.stringify(players));
    }

    loadGame() {
      if (localStorage.length != 0) {
        // Load the display
        this.level = parseInt(localStorage.getItem("level-number"));
        this.score = parseInt(localStorage.getItem("score"));
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);

        // Load the game state
        const loadedLevel = JSON.parse(localStorage.getItem("level"));
        clearBombs(loadedLevel);
        // loadLevel(clearedLevel);
        loadLevel(loadedLevel);

        // const loadedBombs = JSON.parse(localStorage.getItem("bombs"));
        // loadBombs(loadedBombs);

        const loadedExit = JSON.parse(localStorage.getItem("exit"));
        loadExit(loadedExit);
        
        const loadedEnemies = JSON.parse(localStorage.getItem("enemies"));
        loadEnemies(loadedEnemies);
        
        const loadedPlayers = JSON.parse(localStorage.getItem("players"));
        loadPlayers(loadedPlayers);
      }
    }
}

function loadPlayers(loadedPlayers) {
    for (let i = 0; i < players.length; i++) {
        players[i].x = loadedPlayers[i].x;
        players[i].y = loadedPlayers[i].y;
        players[i].speed = loadedPlayers[i].speed;
        players[i].powerup = loadedPlayers[i].powerup;
    }
}

// function loadBombs(loadedBombs) {
//     for (let i = 0; i < loadedBombs.length; i++) {
//         console.log(loadedBombs[i]);
//     }
// }

function clearBombs(loadedLevel) {
    clearBombArray();
    for (let i = 0; i < loadedLevel.length; i++) {
        for (let j = 0; j < loadedLevel[i].length; j++) {
            let currentTile = loadedLevel[i][j];
            if (currentTile.bomb) {
                currentTile.bomb.hasExploded = true;
                currentTile.bomb.ticks = 0;
                currentTile.isWalkable = true;
            }
        }
    }
}