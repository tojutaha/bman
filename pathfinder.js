import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { enemies } from "./enemy.js";
import { getDistanceTo, getRandomWalkablePointInRadius, v2 } from "./utils.js";

export function requestPath(requester)
{
    // TODO: queue systeemi..?
    //console.log(requester);
    const maxRadius = 12*tileSize;
    const minRadius = 4*tileSize;
    const targetLocation = 
        getRandomWalkablePointInRadius({x: requester.x, y: requester.y},
                                        minRadius, maxRadius);
    requester.targetLocation = {x: targetLocation, y: targetLocation.y};

    requester.currentPath = astar(requester.getLocation(),
                                  {x: targetLocation.x, y: targetLocation.y});

    if (requester.currentPath) {
        requester.move();
    }
}

// TODO: Nää kaks vois laittaa utilsiin?
function getTileFromWorldLocation(loc)
{
    const x = Math.floor(loc.x / tileSize);
    const y = Math.floor(loc.y / tileSize);
    return level[x][y];
}

function getNeigbouringTiles(loc)
{
    const center = {x: loc.x / tileSize, y: loc.y / tileSize};
    const result = [];

    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {

            if (x == 0 && y == 0) continue;

            const coordX = center.x + x;
            const coordY = center.y + y;

            // TODO: Nää on myös käänteisessä järjestyksessä....
            result.push({x: level[coordY][coordX].x, 
                         y: level[coordY][coordX].y});
        }
    }

    return result;
}

export function astar(start, target)
{
    const openList = [ [0, start] ];
    const costSoFar = new Map();
    costSoFar.set(start, 0);

    while (openList.length > 0) {
        openList.sort((a, b) => a[0] - b[0]);
        const [currentCost, current] = openList.shift();

        console.log("current:", current);

        // reached target
        if (v2.isEqual(current, target)) {
            const path = [];
            let curr = target;
            while (curr !== start) {
                path.push(curr);
                curr = costSoFar.get(curr);
            }
            path.push(start);
            path.reverse();

            console.log("Path found");
            return path;
        }

        for (const neighbour of getNeigbouringTiles(current)) {
            /*
            const neighbour = [current[0] + dx, current[1] + dy];

            if (neighbour[0] >= 0 && neighbour[0] < levelHeight &&
                neighbour[1] >= 0 && neighbour[1] < levelWidth &&
                level[neighbour[0]][neighbour[1]].isWalkable)
            {
                const newCost = costSoFar.get(current) + 1;

                const neighbourKey = neighbour;
                if (!costSoFar.has(neighbourKey) || newCost < costSoFar.get(neighbourKey)) {
                    costSoFar.set(neighbourKey, newCost);
                    const priority = newCost + getDistanceTo(neighbour, target);
                    openList.push([priority, neighbour]);
                }
            }
            */
            //const tile = getTileFromWorldLocation(neighbour);
            //console.log(tile);
        }
    }

    console.error(`Could not find requested path from ${start.x}, ${start.y} to ${target.x} ${target.y}`);
    return null;
}

////////////////////
// TODO: Debug
export function drawPath()
{
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
}

