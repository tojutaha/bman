import { canvas, ctx, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { enemies } from "./enemy.js";
import { getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, getNeigbouringTiles_linear, getNeigbouringTiles_diagonal } from "./utils.js";

export function requestPath(requester, startLoc, targetLoc)
{
    // TODO: queue systeemi..?

    requester.currentPath = astar(requester.useDiagonalMovement,
                                  startLoc,
                                  {x: targetLoc.x, y: targetLoc.y});
    requester.startMove();
}

export function astar(useDiagonalMovement, start, target)
{
    const getNeigbouringTiles = useDiagonalMovement ? getNeigbouringTiles_diagonal : getNeigbouringTiles_linear;

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

    console.log(`Could not find requested path from ${start.x}, ${start.y} to ${target.x} ${target.y}`);
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
                ctx.arc(p.x + tileSize/2, p.y + tileSize/2, 3, 0, 2*Math.PI);
                ctx.strokeStyle = enemy.pathColor;
                ctx.stroke();
            });
        }
    });
}

