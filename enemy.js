import { canvas, ctx, deltaTime, level, levelHeight, levelWidth, tileSize } from "./main.js";
import { player, Direction } from "./player.js";
import { lerp, getDistanceTo, getRandomWalkablePointInRadius, getTileFromWorldLocation, isWalkable } from "./utils.js";
import { requestPath, drawPath } from "./pathfinder.js";
import { tilesWithBombs } from "./bomb.js";

// TODO: Random nykimistä smooth renderissä

const movementMode = {
    IDLE: "Idle",
    ROAM: "Roam",
    PATROL: "Patrol",
    FOLLOW: "Follow",
}

class Enemy
{
    constructor(x, y, w, h, newMovementMode, speed) {
        this.x  = x;
        this.y  = y;
        this.w  = w;
        this.h  = h;
        this.dx = 0;
        this.dy = 0;
        this.currentPath = [];
        this.startLocation = {x: this.x, y: this.y};
        this.targetLocation = {x: 0, y: 0};
        this.useDiagonalMovement = false;
        this.movementMode = newMovementMode || movementMode.ROAM;
        this.speed = speed || 500;
        this.direction = Direction.UP;

        // Rendering:
        this.renderX = this.x;
        this.renderY = this.y;
        this.t = 0;

        // Debug colors:
        this.color = "#ff00ff";
        this.pathColor = "yellow";
    }

    setDebugColors() {
        switch(this.movementMode) {
            case movementMode.IDLE:
                this.color = "#00ff00";
                break;
            case movementMode.ROAM:
                this.color = "#ff00ff";
                break;
            case movementMode.PATROL:
                this.color = "#00ffff";
                break;
            case movementMode.FOLLOW:
                this.color = "#ff0000";
                break;
        }
    }

    getLocation() {
        return {x: this.x, y: this.y};
    }

    setMovementMode(newMovementMode) {
        this.movementMode = newMovementMode;
    }

    init() {
        switch(this.movementMode) {
            case movementMode.IDLE:
                // Nothing to do
                break;
            case movementMode.ROAM:
                // Randomly roam around map
                this.roam();
                break;
            case movementMode.PATROL:
                // Patrol between two points
                this.patrol();
                break;
            case movementMode.FOLLOW:
                // Follow player
                this.followPlayer();
                break;
        }
    }

    getRandomPath() {
        const maxRadius = 12*tileSize;
        const minRadius = 4*tileSize;
        const targetLocation = 
        getRandomWalkablePointInRadius({x: this.x, y: this.y},
                                        minRadius, maxRadius);
        this.targetLocation = {x: targetLocation.x, y: targetLocation.y};
    }

    getPlayerLocation() {
        const tile = getTileFromWorldLocation({x: player.x, y: player.y});
        this.targetLocation = {x: tile.x, y: tile.y};
    }

    startMove() {
        let timer = null;

        if (!this.currentPath) {
            console.log("Trying again..");
            if (timer) {
                clearInterval(timer);
                timer = null;
            }

            setTimeout(() => {
                this.init();
            }, 3000);
            return;
        }

        let index = 0;
        timer = setInterval(() => {

            const next = this.currentPath[index];

            // Check if there is a bomb on the path
            const bombCoords = tilesWithBombs.find(bomb => bomb.x === next.x && bomb.y === next.y);
            if (bombCoords) {
                console.log("Bomb in path: ", bombCoords.x, bombCoords.y)
            }

            // Store movement direction
            if (next.x < this.x) {
                this.direction = Direction.LEFT;
            } else if (next.x > this.x) {
                this.direction = Direction.RIGHT;
            }

            if (next.y < this.y) {
                this.direction = Direction.UP;
            } else if (next.y > this.y) {
                this.direction = Direction.DOWN;
            }

            //console.log(this.direction);

            // Move enemy
            this.x = next.x;
            this.y = next.y;
            this.t = 0;

            if (getDistanceTo(this, player) < tileSize) {
                console.log("reached player");
                //clearInterval(timer);
            }

            // Smoother movement for rendering
            let renderIndex = index + 1;
            if (renderIndex < this.currentPath.length) {
                const renderLoc = this.currentPath[renderIndex]
                this.renderX = renderLoc.x;
                this.renderY = renderLoc.y;
            }

            index++;
            
            if (index >= this.currentPath.length) {

                //this.renderX = this.x;
                //this.renderY = this.y;
                //this.t = 0;

                clearInterval(timer);
                switch(this.movementMode) {
                    case movementMode.IDLE:
                        // Nothing to do
                        this.currentPath.length = 0;
                        break;
                    case movementMode.ROAM:
                        // Randomly roam around map
                        this.currentPath.length = 0;
                        this.roam();
                        break;
                    case movementMode.PATROL:
                        // Patrol between two points
                        this.patrol();
                        break;
                    case movementMode.FOLLOW:
                        // Follow player
                        this.currentPath.length = 0;
                        this.followPlayer();
                        break;
                }
            }

        }, this.speed);
    }

    roam() {
        this.getRandomPath();
        requestPath(this, this.getLocation(), this.targetLocation);
    }

    patrol() {
        if (!this.currentPath || this.currentPath.length == 0) {
            this.getRandomPath();
            requestPath(this, this.getLocation(), this.targetLocation);
        } else {
            if (this.getLocation().x == this.targetLocation.x &&
                this.getLocation().y == this.targetLocation.y) {
                const temp = this.startLocation;
                this.startLocation = this.targetLocation;
                this.targetLocation = temp;
                this.currentPath.reverse();
                this.startMove();
            }
        }
    }

    followPlayer() {
        this.getPlayerLocation();
        requestPath(this, this.getLocation(), this.targetLocation);
    }
};

function getRandomColor()
{

    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

function getRandomSpeed()
{
    const max = 500;
    const min = 150;
    const random = Math.random() * (max - min) + min;
    return Math.floor(random);
}

export const enemies = [];
export function spawnEnemies()
{
    const movementValues = Object.values(movementMode);
    //const amount = movementValues.length;
    const amount = 1;
    const maxRadius = 25*tileSize;
    const minRadius = 10*tileSize;

    for (let i = 0; i < amount; i++) {
        const random = getRandomWalkablePointInRadius({x: player.x,
                                                       y: player.y},
                                                       minRadius, maxRadius);
        const enemy = new Enemy(random.x, random.y, 32, 32);
        let colIndex = i;
        //enemy.setMovementMode(movementValues[colIndex]);
        enemy.speed = getRandomSpeed();
        enemy.setDebugColors();
        //enemy.color = getRandomColor();
        enemy.pathColor = getRandomColor();
        enemy.init();
        enemies.push(enemy);

        if (colIndex > movementValues.length) {
            colIndex = 0;
        }
    }
}

export function renderEnemies()
{
    if (isNaN(deltaTime)) {
        return;
    }
    
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        //ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

        if (!enemy.t) {
            enemy.t = 0;
        }
        
        enemy.t += deltaTime * (1 / (enemy.speed / 1000));

        console.log("t: ", enemy.t);
        console.log("actual location: ", enemy.x, enemy.y);
        console.log("render location: ", enemy.renderX, enemy.renderY);

        const x = lerp(enemy.x, enemy.renderX, enemy.t);
        const y = lerp(enemy.y, enemy.renderY, enemy.t);

        if (enemy.t > 1) {
            enemy.t = 0;
        }

        //ctx.fillStyle = "#00ff00";
        ctx.fillRect(x, y, enemy.w, enemy.h);
    });

    //
    drawPath();
    //
}

