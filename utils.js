import { canvas, ctx, level, tileSize } from "./main.js";
import { levelHeight, levelWidth } from "./gamestate.js";


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

//
export function colorTemperatureToRGB(kelvin)
{
    var temp = kelvin / 100;
    var red, green, blue;

    if(temp <= 66) {
        red = 255;
        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;
    } else {
        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492);
    }

    if(temp >= 66) {
        blue = 255;
    } else if(temp <= 19) {
        blue = 0;
    } else {
        blue = temp - 10;
        blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
    }

    return {
        red : clamp(red, 0, 255),
        green : clamp(green, 0, 255),
        blue : clamp(blue, 0, 255)
    }
}

//
export function clamp(x, min, max)
{
    if(x<min) return min;
    if(x>max) return max;
    return x;
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

// Sama kuin ylempi mutta euclidean distance
export function getDistanceToEuclidean(from, to)
{
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    return Math.sqrt(dx * dx + dy * dy);
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

// Palauttaa lineaarisesti walkable tilet 2D taulukkona kunnes vastaan tulee seinä tai pommi.
export function getLinearUntilObstacle(loc, range, includeObstacle = false, includeCenter = false) {
    const xIndex = loc.x / tileSize;
    const yIndex = loc.y / tileSize;

    const centerTile = [level[xIndex][yIndex]],
        topTiles = [],
        leftTiles = [],
        rightTiles = [],
        bottomTiles = [];
    
    let leftWallReached = false,
        topWallReached = false,
        rightWallReached = false,
        bottomWallReached = false;
    
    for (let i = 0; i < range; i++) {
        if (!leftWallReached) {
            const onLeft = xIndex - i - 1;
            if (onLeft >= 0) {
                const currentTile = level[onLeft][yIndex];
                if (!currentTile.isWalkable) {
                    leftWallReached = true;
                }
                if (!leftWallReached || (leftWallReached && includeObstacle)) {
                    leftTiles.push(currentTile);
                }
            }
        }

        if (!topWallReached) {
            const onTop = yIndex - i - 1;
            if (onTop >= 0) {
                const currentTile = level[xIndex][onTop];
                if (!currentTile.isWalkable) {
                    topWallReached = true;
                }
                if (!topWallReached || (topWallReached && includeObstacle)) {
                    topTiles.push(currentTile);
                }
            }            
        }

        if (!rightWallReached) {
            const onRight = xIndex + i + 1;
            if (onRight < levelWidth) {
                const currentTile = level[onRight][yIndex];
                if (!currentTile.isWalkable) {
                    rightWallReached = true;
                }
                if (!rightWallReached || (rightWallReached && includeObstacle)) {
                    rightTiles.push(currentTile);
                }
            }
        }

        if (!bottomWallReached) {
            const onBottom = yIndex + i + 1;
            if (onBottom < levelHeight) {
                const currentTile = level[xIndex][onBottom];
                if (!currentTile.isWalkable) {
                    bottomWallReached = true;
                }
                if (!bottomWallReached || (bottomWallReached && includeObstacle)) {
                    bottomTiles.push(currentTile);
                }
            }
        }
    }

    if (includeCenter)
    {
        return [centerTile, leftTiles, topTiles, rightTiles, bottomTiles];
    }
    return [leftTiles, topTiles, rightTiles, bottomTiles];
}


// Axis-Aligned Bounding Box testi, Palauttaa true, jos
// kaksi suorakulmiota leikkaavat.
export function aabbCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}

// Depth First Search algoritmi.
// Hakee käveltävän polun rangen pituudelta, tai
// jos polkua ei löydy, niin pienimmän mahdollisen jossa voi kävellä.
export function dfs(start, range) {
    let stack = [[start.x/tileSize, start.y/tileSize, 0, []]];
    let visited = new Array(level.length).fill(0).map(() => new Array(level[0].length).fill(false));
    let longestPath = [];

    while (stack.length > 0) {
        let [x, y, dist, path] = stack.pop();

        if (dist > range) {
            continue;
        }

        visited[x][y] = true;

        let newPath = path.concat([{x: x*tileSize, y: y*tileSize}]);
        if(newPath.length > longestPath.length) {
            longestPath = newPath;
        }

        //let neighbours = getNeigbouringTiles_diagonal({x: x*tileSize, y: y*tileSize});
        let neighbours = getNeigbouringTiles_linear({x: x*tileSize, y: y*tileSize});
        neighbours.forEach(n => {
            const coord = {x: n.x/tileSize, y: n.y/tileSize};
            if(coord.x >= 0 && coord.x <= levelWidth && coord.y >= 0 && coord.y <= levelHeight) {
                if (level[coord.x][coord.y].isWalkable) {
                    if(!visited[coord.x][coord.y]) {
                        stack.push([coord.x, coord.y, dist + 1, newPath]);
                    }
                }
            }
        });
    }

    return longestPath;
}

