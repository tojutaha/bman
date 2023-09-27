import { updateScore } from "./page.js";
import { exitLocation } from "./tile.js";

export class GameState {
    constructor() {
      this.score = 0;
      this.level = 1;
      this.numOfEnemies = 0;
    }
  
    increaseScore(points) {
      this.score += points;
      updateScore(this.score);
    }
  
    nextLevel() {
      this.level++;
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
}