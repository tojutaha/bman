import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { v2, getDistanceTo, getRandomWalkablePointInRadius, isWalkable } from "./utils.js";
import { requestPath, drawPath } from "./pathfinder.js";

export const debugPaths = [];

class Enemy
{
    constructor(x, y, w, h) {
        this.x  = x;
        this.y  = y;
        this.w  = w;
        this.h  = h;
        this.dx = 0;
        this.dy = 0;
        this.currentPath = [];
        this.targetLocation = {x: 0, y: 0};
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    move() {
        // TODO
        let index = 0;
        let timer = setInterval(() => {
            debugPaths.push(this.currentPath[index]);
            index++;

            console.log(this.currentPath.length);

            if (index >= this.currentPath.length) {
                this.currentPath.length = 0;
                debugPaths.length = 0;
                requestPath(this);
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
    ctx.fillStyle = "#ff00ff";
    enemies.forEach(enemy => {
        //enemy.move();
        ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    });

    //
    drawPath();
    //
}

