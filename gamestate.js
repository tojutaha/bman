import { updateLevelDisplay, updateScoreDisplay } from "./page.js";
import { exitLocation } from "./tile.js";

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
      localStorage.setItem("level", this.level);
      localStorage.setItem("score", this.score);
    }

    loadGame() {
      if (localStorage.length != 0) {
        this.level = parseInt(localStorage.getItem("level"));
        this.score = parseInt(localStorage.getItem("score"));
        updateLevelDisplay(this.level);
        updateScoreDisplay(this.score);
      }
    }
}