import { exitLocation } from "./tile.js";

export class GameState {
    constructor() {
      this.score = 0;
      this.level = 1;
      this.numOfEnemies = -1;
    }
  
    increaseScore(points) {
      this.score += points;
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