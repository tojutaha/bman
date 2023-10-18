import { canvas, ctx, level, tileSize } from "./main.js";
import { enemies } from "./enemy.js";
import { getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, getNeigbouringTiles_linear, getNeigbouringTiles_diagonal } from "./utils.js";

class Queue
{
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const item = this.items.shift(); // Get the first item
        const { data, callback } = item;

        // Execute the function associated with the item, if it exists
        if (typeof callback === 'function') {
            callback(data);
        }

        return item;
    }

    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[0].data;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }
}

const pathFindQueue = new Queue();

function processQueue()
{
    if (!pathFindQueue.isEmpty()) {
        const item = pathFindQueue.dequeue();
        const next = pathFindQueue.peek();
        //console.log(`Processing: ${JSON.stringify(item.data)}`);
        //console.log(`Next to process: ${next}`);

        processQueue();
    }
    /*
    else {
        console.log("Queue is empty.");
    }
    */
}

function processData(requester)
{
    //console.log("processing: ", requester);

    //console.time('astar');
    requester.enemy.currentPath = astar(requester.enemy.useDiagonalMovement,
                                  requester.start,
                                  requester.target);
    //console.timeEnd('astar');
    requester.enemy.startMove();
}

export function requestPath(requester, startLoc, targetLoc)
{
    const request = {enemy: requester, start: startLoc, target: targetLoc};
    pathFindQueue.enqueue({data: request, callback: processData});
    //console.log("Size:", pathFindQueue.size());
    processQueue();

    /*
    requester.currentPath = astar(requester.useDiagonalMovement,
                                  startLoc,
                                  {x: targetLoc.x, y: targetLoc.y});
    requester.startMove();
    */
}

function astar(useDiagonalMovement, start, target)
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

    //console.log(`Could not find requested path from ${start.x}, ${start.y} to ${target.x} ${target.y}`);
    return null;
}

