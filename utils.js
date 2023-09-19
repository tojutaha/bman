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

export function hasPowerup(x, y)
{
    if (x < 0 || x >= levelWidth ||
        y < 0 || y >= levelHeight) {
        return false;
    }

    return level[x][y].hasPowerup;
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

