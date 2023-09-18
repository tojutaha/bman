import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, isWalkable } from "./utils.js";
import { requestPath, drawPath } from "./pathfinder.js";

const movementMode = {
    IDLE: "Idle",
    ROAM: "Roam",
    PATROL: "Patrol",
    FOLLOW: "Follow",
}

class Enemy
{
    constructor(x, y, w, h, newMovementMode) {
        this.x  = x;
        this.y  = y;
        this.w  = w;
        this.h  = h;
        this.dx = 0;
        this.dy = 0;
        this.currentPath = [];
        this.startLocation = {x: this.x, y: this.y};
        this.targetLocation = {x: 0, y: 0};
        this.useDiagonalMovement = false;
        this.movementMode = newMovementMode || movementMode.ROAM;

        // Debug colors:
        this.color = "#ff00ff";
        this.pathColor = "yellow";
    }

    setDebugColors() {
        switch(this.movementMode) {
            case movementMode.IDLE:
                this.color = "#00ff00";
                break;
            case movementMode.ROAM:
                this.color = "#ff00ff";
                break;
            case movementMode.PATROL:
                this.color = "#00ffff";
                break;
            case movementMode.FOLLOW:
                this.color = "#ff0000";
                break;
        }
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    setMovementMode(newMovementMode) {
        this.movementMode = newMovementMode;
    }

    init() {
        switch(this.movementMode) {
            case movementMode.IDLE:
                // Nothing to do
                break;
            case movementMode.ROAM:
                // Randomly roam around map
                this.roam();
                break;
            case movementMode.PATROL:
                // Patrol between two points
                this.patrol();
                break;
            case movementMode.FOLLOW:
                // Follow player
                this.followPlayer();
                break;
        }
    }

    getRandomPath() {
        const maxRadius = 12*tileSize;
        const minRadius = 4*tileSize;
        const targetLocation = 
        getRandomWalkablePointInRadius({x: this.x, y: this.y},
                                        minRadius, maxRadius);
        this.targetLocation = {x: targetLocation.x, y: targetLocation.y};
    }

    getPlayerLocation() {
        const tile = getTileFromWorldLocation({x: player.x, y: player.y});
        this.targetLocation = {x: tile.x, y: tile.y};
    }

    startMove() {
        let timer = null;

        if (!this.currentPath) {
            console.log("Trying again..");
            if (timer) {
                clearInterval(timer);
                timer = null;
            }

            setTimeout(() => {
                this.init();
            }, 3000);
            return;
        }

        let index = 0;
        timer = setInterval(() => {

            const loc = this.currentPath[index];

            this.x = loc.x;
            this.y = loc.y;

            if (this.movementMode == movementMode.FOLLOW) {
                if (this.x == player.x && this.y == player.y) {
                    console.log("reached player");
                    clearInterval(timer);
                }
            }

            index++;

            if (index >= this.currentPath.length) {

                switch(this.movementMode) {
                    case movementMode.IDLE:
                        // Nothing to do
                        clearInterval(timer);
                        this.currentPath.length = 0;
                        break;
                    case movementMode.ROAM:
                        // Randomly roam around map
                        clearInterval(timer);
                        this.currentPath.length = 0;
                        this.roam();
                        break;
                    case movementMode.PATROL:
                        // Patrol between two points
                        clearInterval(timer);
                        this.patrol();
                        break;
                    case movementMode.FOLLOW:
                        // Follow player
                        clearInterval(timer);
                        this.currentPath.length = 0;
                        this.followPlayer();
                        break;
                }
            }

        }, 500);
    }

    roam() {
        this.getRandomPath();
        requestPath(this, this.getLocation(), this.targetLocation);
    }

    patrol() {
        if (this.currentPath.length == 0) {
            this.getRandomPath();
            requestPath(this, this.getLocation(), this.targetLocation);
        } else {
            if (this.getLocation().x == this.targetLocation.x &&
                this.getLocation().y == this.targetLocation.y) {
                const temp = this.startLocation;
                this.startLocation = this.targetLocation;
                this.targetLocation = temp;
                this.currentPath.reverse();
                this.startMove();
            }
        }
    }

    followPlayer() {
        this.getPlayerLocation();
        requestPath(this, this.getLocation(), this.targetLocation);
    }
};

function getRandomColor() {

    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

export const enemies = [];
export function spawnEnemies()
{
    const movementValues = Object.values(movementMode);
    const amount = movementValues.length;
    const maxRadius = 25*tileSize;
    const minRadius = 10*tileSize;

    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, 32, 32);
        enemy.setMovementMode(movementValues[i]);
        enemy.setDebugColors();
        enemy.pathColor = getRandomColor();
        enemy.init();
        enemies.push(enemy);
    }
}

export function renderEnemies(dt)
{
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    });

    //
    drawPath();
    //
}

