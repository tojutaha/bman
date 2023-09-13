import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { v2, getDistanceTo, getRandomWalkablePointInRadius, isWalkable } from "./utils.js";
import { requestPath, drawPath } from "./pathfinder.js";

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
    }
};

export const enemies = [];
function spawnEnemies()
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

// TODO: Muuta tämä suoraan spawnEnemies funktioksi..
export function initPathFinder()
{
    spawnEnemies();
}

