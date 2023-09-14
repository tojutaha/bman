import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { enemies, debugPaths } from "./enemy.js";
import { getDistanceTo, getRandomWalkablePointInRadius, v2 } from "./utils.js";

const useDiagonalMovement = false;

export function requestPath(requester)
{
    // TODO: queue systeemi..?
    //console.log(requester);
    const maxRadius = 12*tileSize;
    const minRadius = 4*tileSize;
    const targetLocation = 
        getRandomWalkablePointInRadius({x: requester.x, y: requester.y},
                                        minRadius, maxRadius);
    requester.targetLocation = {x: targetLocation.x, y: targetLocation.y};

    requester.currentPath = astar(requester.getLocation(),
                                  {x: targetLocation.x, y: targetLocation.y});

    if (requester.currentPath) {
        requester.move();
    }
}

// TODO: Nää vois laittaa utilsiin?
function getTileFromWorldLocation(loc)
{
    const x = Math.floor(loc.x / tileSize);
    const y = Math.floor(loc.y / tileSize);
    return level[x][y];
}


function getNeigbouringTiles_linear(loc)
{
    const center = {x: loc.x / tileSize, y: loc.y / tileSize};
    const result = [];

    // TODO: Ja käänteinen järjestys
    result.push({x: level[center.y + 1][center.x].x, y: level[center.y + 1][center.x].y});
    result.push({x: level[center.y - 1][center.x].x, y: level[center.y - 1][center.x].y});
    result.push({x: level[center.y][center.x + 1].x, y: level[center.y][center.x + 1].y});
    result.push({x: level[center.y][center.x - 1].x, y: level[center.y][center.x - 1].y});

    return result;
}

function getNeigbouringTiles_diagonal(loc)
{
    const center = {x: loc.x / tileSize, y: loc.y / tileSize};
    const result = [];

    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {

            if (x == 0 && y == 0) continue;

            const coordX = center.x + x;
            const coordY = center.y + y;

            // TODO: Tää on taas käänteinen..
            result.push({x: level[coordY][coordX].x, 
                         y: level[coordY][coordX].y});
        }
    }

    return result;
}

const getNeigbouringTiles = useDiagonalMovement ? getNeigbouringTiles_diagonal : getNeigbouringTiles_linear;

export function astar(start, target)
{
    const openList = [ [0, start] ];
    const costSoFar = new Map();
    const cameFrom = new Map();

    costSoFar.set(start, 0);

    while (openList.length > 0) {
        openList.sort((a, b) => a[0] - b[0]);
        const [currentCost, current] = openList.shift();

        // reached target
        if (current.x == target.x && current.y == target.y) {
            const path = [];
            let curr = target;

            while (curr && (curr.x !== start.x || curr.y !== start.y)) {
                path.push(curr);
                curr = cameFrom.get(`${curr.x},${curr.y}`);
                //console.log(curr);
            }

            path.push(start);
            //path.push(target);
            path.reverse();

            //console.log("Path found:", path);
            return path;
        }

        for (const neighbour of getNeigbouringTiles(current)) {
            const tile = getTileFromWorldLocation(neighbour);
            if (tile.isWalkable) {
                const newCost = costSoFar.get(current) + 1;

                const neighbourKey = `${neighbour.x},${neighbour.y}`;
                if (!costSoFar.has(neighbourKey) || newCost < costSoFar.get(neighbourKey)) {
                    costSoFar.set(neighbourKey, newCost);
                    cameFrom.set(neighbourKey, current); // store the previous node!
                    const priority = newCost + getDistanceTo(neighbour, target);
                    openList.push([priority, neighbour]);
                }
            }
        }
    }

    console.error(`Could not find requested path from ${start.x}, ${start.y} to ${target.x} ${target.y}`);
    return null;
}

////////////////////
// TODO: Debug
export function drawPath()
{
    debugPaths.forEach(p => {
        if (p) {
            ctx.beginPath();
            ctx.arc(p.x + tileSize/2, p.y + tileSize/2, 10, 0, 2*Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
        }
    });
    /*
    enemies.forEach(enemy => {
        if (enemy.currentPath) {
            enemy.currentPath.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x + tileSize/2, p.y + tileSize/2, 10, 0, 2*Math.PI);
                ctx.strokeStyle = "yellow";
                ctx.stroke();
            });
        }
    });
    */

    const p = {x: enemies[0].targetLocation.x, y: enemies[0].targetLocation.y};
    ctx.beginPath();
    ctx.arc(p.x + tileSize/2, p.y + tileSize/2, 10, 0, 2*Math.PI);
    ctx.strokeStyle = "red";
    ctx.stroke();
}

