import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { v2, isWalkable } from "./utils.js";

////////////////////
// Enemy

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
        this.currentPath.push(this.getLocation());
    }

    getLocation() {
        return {x: this.x, y: this.y};
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
        ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    });

    //
    drawPath();
    //
}

////////////////////
// Pathfinder
// TODO: Muuta tämä suoraan spawnEnemies funktioksi..
export function initPathFinder()
{
    /*
    let len = 0;
    for (let i = 0; i < level.length; i++) {
        len += level[i].length;
    }
    console.log("Init", len);
    */
    spawnEnemies();
}

function requestPath(requester)
{
    console.log(requester);
}

function getDistanceTo(from, to)
{
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function getRandomWalkablePointInRadius(center, minRadius, maxRadius)
{
    const walkableTiles = [];
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const tile = level[x][y];
            const walkable = isWalkable(y, x);// TODO: Miksi tämän pitää olla käänteinen..?
            const dist = getDistanceTo(center, {x: tile.x, y: tile.y});
            if (walkable && dist >= minRadius && dist <= maxRadius) {
                walkableTiles.push(tile);
            }
        }
    }

    const randomIndex = Math.floor(Math.random() * walkableTiles.length);
    return walkableTiles[randomIndex];
}

////////////////////
// TODO: Debug
function drawPath()
{
    enemies.forEach(enemy => {
        enemy.currentPath.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x + tileSize/2, p.y + tileSize/2, 10, 0, 2*Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
        });
    });
}

