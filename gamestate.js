import { enemies, loadEnemies } from "./enemy.js";
import { level, loadLevel } from "./main.js";
import { updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { exitLocation, loadExit } from "./tile.js";

export class GameState {
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

    saveGame() {
      localStorage.setItem("level-number", this.level);
      localStorage.setItem("score", this.score);
      localStorage.setItem("level", JSON.stringify(level));
      localStorage.setItem("exit", JSON.stringify(exitLocation));
      localStorage.setItem("enemies", JSON.stringify(enemies));
    //   localStorage.setItem("players", JSON.stringify());
    }

    loadGame() {
      if (localStorage.length != 0) {
        this.level = parseInt(localStorage.getItem("level-number"));
        this.score = parseInt(localStorage.getItem("score"));
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);

        const loadedLevel = JSON.parse(localStorage.getItem("level"));
        loadLevel(loadedLevel);

        const loadedExit = JSON.parse(localStorage.getItem("exit"));
        loadExit(loadedExit);
        
        const loadedEnemies = JSON.parse(localStorage.getItem("enemies"));
        loadEnemies(loadedEnemies);

        // TODO: Player.js tämä
        // const loadedPlayers = JSON.parse(localStorage.getItem("player"));
        // loadPlayers(loadedPlayer);
      }
    }
}