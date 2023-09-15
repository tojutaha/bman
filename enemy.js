import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { v2, getDistanceTo, getRandomWalkablePointInRadius, isWalkable } from "./utils.js";
import { requestPath, drawPath } from "./pathfinder.js";

export const debugPaths = [];

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

        // Debug color:
        switch(this.movementMode) {
            case movementMode.IDLE:
                this.color = "#ff00ff";
                break;
            case movementMode.ROAM:
                this.color = "#ff00ff";
                break;
            case movementMode.PATROL:
                this.color = "#ff00ff";
                break;
            case movementMode.FOLLOW:
                this.color = "#ff00ff";
                break;
        }
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    setMovementMode(newMovementMode) {
        this.movementMode = newMovementMode;
    }

    startMove() {

        if (!this.currentPath) {
            console.log("Handle failed path request here");
            return;
        }

        let index = 0;
        let timer = setInterval(() => {

            const loc = this.currentPath[index];
            debugPaths.push(loc);

            this.x = loc.x;
            this.y = loc.y;

            index++;

            if (index >= this.currentPath.length) {
                this.currentPath.length = 0;
                debugPaths.length = 0;

                switch(this.movementMode) {
                    case movementMode.IDLE:
                        // Nothing to do
                        break;
                    case movementMode.ROAM:
                        // Randomly roam around map
                        requestPath(this);
                        break;
                    case movementMode.PATROL:
                        // TODO:
                        // Patrol between two points
                        break;
                    case movementMode.FOLLOW:
                        // TODO:
                        // Follow player
                        break;
                }

                clearInterval(timer);
            }

        }, 500);
    }
};

export const enemies = [];
export function spawnEnemies()
{
    const amount = 1;
    const maxRadius = 25*tileSize;
    const minRadius = 10*tileSize;

    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, 32, 32);
        requestPath(enemy);
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

