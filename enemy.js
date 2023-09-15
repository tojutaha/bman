import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { getDistanceTo, getRandomWalkablePointInRadius, isWalkable } from "./utils.js";
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
        this.getRandomPath();
        requestPath(this, this.getLocation(), this.targetLocation);
    }

    getRandomPath() {
        const maxRadius = 12*tileSize;
        const minRadius = 4*tileSize;
        const targetLocation = 
        getRandomWalkablePointInRadius({x: this.x, y: this.y},
                                        minRadius, maxRadius);
        this.targetLocation = {x: targetLocation.x, y: targetLocation.y};
    }

    startMove() {

        if (!this.currentPath) {
            console.log("Handle failed path request here");
            return;
        }

        if (this.currentPath.length == 0) {
            console.log("Another possible failure case");
            return;
        }

        let index = 0;
        let timer = setInterval(() => {

            const loc = this.currentPath[index];

            this.x = loc.x;
            this.y = loc.y;

            index++;

            if (index >= this.currentPath.length) {
                this.currentPath.length = 0;

                switch(this.movementMode) {
                    case movementMode.IDLE:
                        // Nothing to do
                        clearInterval(timer);
                        break;
                    case movementMode.ROAM:
                        // Randomly roam around map
                        this.getRandomPath();
                        requestPath(this, this.getLocation(), this.targetLocation);
                        clearInterval(timer);
                        break;
                    case movementMode.PATROL:
                        // TODO:
                        // Patrol between two points
                        clearInterval(timer);
                        break;
                    case movementMode.FOLLOW:
                        // TODO:
                        // Follow player
                        clearInterval(timer);
                        break;
                }
            }

        }, 500);
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

