import { getDistanceTo, getTileFromWorldLocation, getNeigbouringTiles_linear, getNeigbouringTiles_diagonal } from "./utils.js";

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


export const astar_openlist =[];
function astar(useDiagonalMovement, start, target)
{

    // NOTE: DEBUG
    astar_openlist.length = 0;

    const getNeigbouringTiles = useDiagonalMovement ? getNeigbouringTiles_diagonal : getNeigbouringTiles_linear;

    const openList = [ [0, start] ];
    const costSoFar = new Map(); // Keeps track of the cost so far to reach node
    const cameFrom = new Map(); // Keeps track of the node from which a given node can be reached at the lowest cost

    costSoFar.set(start, 0);

    while (openList.length > 0) {
        openList.sort((a, b) => a[0] - b[0]); // Sort the list, so that nodes with lowest cost/priority comes first
        const current = openList.shift()[1];

        // reached target
        if (current.x == target.x && current.y == target.y) {
            const path = [];
            let curr = target;
            // Trace back the from target node to start node
            while (curr && (curr.x !== start.x || curr.y !== start.y)) {
                path.push(curr);
                curr = cameFrom.get(`${curr.x},${curr.y}`); // Get the node that can be reached at the lowest cost
            }

            path.push(start);
            path.reverse();

            return path;
        }

        // Loop through neighbouring tiles. If a neighbour is reachable and either has not been
        // reached before or can be reached at a lower cost from the current node, update the cost
        // and the previous node for this neighbour and add it to open list.
        for (const neighbour of getNeigbouringTiles(current)) {
            const tile = getTileFromWorldLocation(neighbour);

            // NOTE: DEBUG
            astar_openlist.push(tile);

            if (tile.isWalkable) {
                const newCost = costSoFar.get(current) + 1; // Cost for adjacent tile

                const neighbourKey = `${neighbour.x},${neighbour.y}`;
                if (!costSoFar.has(neighbourKey) || newCost < costSoFar.get(neighbourKey)) {
                    costSoFar.set(neighbourKey, newCost); // Store the cost so far
                    cameFrom.set(neighbourKey, current); // Store the previous node!
                    const priority = newCost + getDistanceTo(neighbour, target); // Store priority which is used to sort the open list 
                    openList.push([priority, neighbour]);
                }
            }
        }
    }

    //console.log(`Could not find requested path from ${start.x}, ${start.y} to ${target.x} ${target.y}`);
    return null;
}

