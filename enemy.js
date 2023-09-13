import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player } from "./player.js";
import { isWalkable } from "./utils.js";

////////////////////
// Utils
export const v2 = {
    x: 0,
    y: 0,

    addV2: function(other) {
        this.x += other.x;
        this.y += other.y;
    },

    addS: function(scalar) {
        this.x += scalar;
        this.y += scalar;
    },

    subtractV2: function(other) {
        this.x -= other.x;
        this.y -= other.y;
    },

    subtractS: function(scalar) {
        this.x -= scalar;
        this.y -= scalar;
    },

    multiplyV2: function(other) {
        this.x *= other.x;
        this.y *= other.y;
    },

    multiplyS: function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    },

    isEqual: function(other) {
        return this.x === other.x &&
               this.y === other.y;
    },

    dist: function(other) {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

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
    }
};

const startX = Math.floor(25*30/2+8);
const startY = Math.floor(25*30/2+8);
//const enemy = new Enemy(25*30-16,
//                        25*30-16, 
//                        32, 32);

const enemy = new Enemy(startX,
                        startY, 
                        32, 32);

export function renderEnemies(dt)
{
    return;
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    //
    drawPath();
    //console.log(getDistanceTo(path[0], path[2]));
    //
}

////////////////////
// Pathfinder
export function initPathFinder()
{
    return;
    /*
    let len = 0;
    for (let i = 0; i < level.length; i++) {
        len += level[i].length;
    }
    console.log("Init", len);
    */
    const maxRadius = 12*tileSize;
    const minRadius = 3*tileSize;
    const random = getRandomPointInRadius({x: enemy.x, y: enemy.y}, minRadius, maxRadius);
    //path.push(random);
}

function getDistanceTo(from, to)
{
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function getRandomPointInRadius(center, minRadius, maxRadius)
{
    const walkableTiles = [];
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const tile = level[x][y];
            const walkable = isWalkable(y, x);// TODO: Miksi tämän pitää olla käänteinen..?
            const dist = getDistanceTo(center, {x: tile.x, y: tile.y});
            if (walkable && dist >= minRadius && dist <= maxRadius) {
                //path.push(tile);
                //return tile;
                walkableTiles.push(tile);
            }
        }
    }

    walkableTiles.forEach(tile => {
        if (!tile.isWalkable) console.log(tile);
        path.push(tile);
    });
    //console.log(walkableTiles);
}

const path = [];
path.push({x: enemy.x, y: enemy.y});

function drawPath()
{
    path.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x + tileSize/2, p.y + tileSize/2, 10, 0, 2*Math.PI);
        ctx.strokeStyle = "yellow";
        ctx.stroke();
    });
}

