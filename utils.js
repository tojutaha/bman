import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet } from "./main.js";

export function isWalkable(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].isWalkable;
}

export function isDeadly(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].isDeadly;
}

export function isOpenExit(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }
    
    return level[x][y].isOpen;
}

export function hasPowerup(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].hasPowerup;
}

//
export function getRandomColor()
{

    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

// lerppi aka linear interpolation
export function lerp(start, end, t)
{
    return start + t * (end - start);
}

// Palauttaa etäisyyden kahden laatan välillä (manhattan distance)
export function getDistanceTo(from, to)
{
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

// Palauttaa satunnaisen laatan jossa voi kävellä
export function getRandomWalkablePointInRadius(center, minRadius, maxRadius)
{
    const walkableTiles = [];
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const tile = level[x][y];
            const walkable = isWalkable(x, y);
            const dist = getDistanceTo(center, {x: tile.x, y: tile.y});
            if (walkable && dist >= minRadius && dist <= maxRadius) {
                walkableTiles.push(tile);
            }
        }
    }

    const randomIndex = Math.floor(Math.random() * walkableTiles.length);
    return walkableTiles[randomIndex];
}

// Palauttaa laatan parametrin koordinaateista
export function getTileFromWorldLocation(loc)
{
    const x = Math.round(loc.x / tileSize);
    const y = Math.round(loc.y / tileSize);
    return level[x][y];
}

// Sama kuin edellinen mutta floor
export function getTileFromWorldLocationF(loc)
{
    const x = Math.floor(loc.x / tileSize);
    const y = Math.floor(loc.y / tileSize);
    return level[x][y];
}

// Palauttaa 4 (ylös, alas, vasen, oikea) naapuri laattaa parametrin ympärillä
export function getNeigbouringTiles_linear(loc, range = 2)
{
    //range += 1;
    const center = {x: loc.x / tileSize, y: loc.y / tileSize};
    const result = [];

    for (let x = 1; x < range; x++) {
        for (let y = 1; y < range; y++) {
            result.push({x: level[center.x + x][center.y].x, y: level[center.x + x][center.y].y});
            result.push({x: level[center.x - x][center.y].x, y: level[center.x - x][center.y].y});
            result.push({x: level[center.x][center.y + y].x, y: level[center.x][center.y + y].y});
            result.push({x: level[center.x][center.y - y].x, y: level[center.x][center.y - y].y});
        }
    }

    return result;
}

// Palauttaa kaikki 8 naapuri laattaa parametrin ympärillä
export function getNeigbouringTiles_diagonal(loc)
{
    const center = {x: loc.x / tileSize, y: loc.y / tileSize};
    const result = [];

    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {

            if (x == 0 && y == 0) continue;

            const coordX = center.x + x;
            const coordY = center.y + y;

            result.push({x: level[coordX][coordY].x, 
                         y: level[coordX][coordY].y});
        }
    }

    return result;
}


// Sama kuin edellinen mutta palauttaa kaikki 9 tile objekteina
// koordinaattien sijaan
export function getSurroundingTiles(loc)
{
    const center = {x: Math.floor(loc.x / tileSize), y: Math.floor(loc.y / tileSize)};
    const result = [];

    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {

            const coordX = center.x + x;
            const coordY = center.y + y;

            if (coordX >= 0 && coordX < level.length && coordY >= 0 && coordY < level[coordX].length) {
                result.push(level[coordX][coordY]);
            }
        }
    }

    return result;
}

// Axis-Aligned Bounding Box testi, Palauttaa true, jos
// kaksi suorakulmiota leikkaavat.
export function aabbCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}

