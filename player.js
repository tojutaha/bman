import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet } from "./main.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { powerups } from "./powerup.js";
import { getTileFromWorldLocation, isDeadly, isWalkable, hasPowerup, getDistanceTo } from "./utils.js";

// TODO: deltaTime Movementtiin

export const Direction = {
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
}

export function renderPlayer()
{
    players.forEach(p => {
        p.update();
        ctx.drawImage(spriteSheet, 0, 64, 32, 32, p.x, p.y, p.w, p.h);
    });
}

////////////////////////////////////////////////////////////////////////////////
// Players
export const players = [];

class Player
{
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 30;
        this.dx = 0;
        this.dy = 0;

        this.speed = 1.0; // pixels/s

        this.collisionOffset = 5;

        // Key binds
        this.key_move_up    = "w";
        this.key_move_down  = "s";
        this.key_move_left  = "a";
        this.key_move_right = "d";
        this.key_drop_bomb  = " ";

        // Powerups
        this.maxBombs = 5; // HUOM
        this.maxRange = 1;
        this.currentTicks = 4;
    }

    // Handles movement and collision
    update() {
        const nextX = this.x + this.dx;
        const nextY = this.y + this.dy;

        let collides = false;
        for (let y = 0; y < levelHeight; y++) {
            for (let x = 0; x < levelWidth; x++) {
                const tileLeft   = level[x][y].x;
                const tileRight  = level[x][y].x + tileSize;
                const tileTop    = level[x][y].y;
                const tileBottom = level[x][y].y + tileSize;

                if (!isWalkable(x, y) &&
                    nextX + (this.w - this.collisionOffset) >= tileLeft &&
                    (nextX + this.collisionOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset) >= tileTop &&
                    (nextY + this.collisionOffset) < tileBottom
                ) {

                    collides = true;
                }

                if (isDeadly(x, y) &&
                    nextX + (this.w - this.collisionOffset) >= tileLeft &&
                    (nextX + this.collisionOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset) >= tileTop &&
                    (nextY + this.collisionOffset) < tileBottom
                ) {
                    console.info("DEATH BY TILE");
                }

                // No picking up from just touching the walls
                const pickupOffset = 3;
                if (hasPowerup(x, y) &&
                    nextX + (this.w - this.collisionOffset - pickupOffset) >= tileLeft &&
                    (nextX + this.collisionOffset + pickupOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset - pickupOffset) >= tileTop &&
                    (nextY + this.collisionOffset + pickupOffset) < tileBottom
                ) {
                    this.pickPowerup(level[x][y]);
                }
            }
        }

        //console.log(collides);
        if (!collides) {
            this.x += this.dx;
            this.y += this.dy;
        }
    }

    // Powerups
    pickPowerup(tile) {
        tile.hasPowerup = false;

        if (tile.powerup === "ExtraBomb") {
            this.maxBombs += 1;
        }
        else if (tile.powerup === "ExtraRange") {
            this.maxRange += 1;
        }

    else if (tile.powerup === "ExtraSpeed") {
        this.speed += 0.5;
    }

    }

    // Bomb
    dropBomb() {
        let bombTile = getTileFromWorldLocation(this);

        if (tilesWithBombs.indexOf(bombTile) === -1 && tilesWithBombs.length < this.maxBombs) {
            if (!bombTile.bomb || bombTile.bomb.hasExploded) {
                bombTile.bomb = new Bomb(bombTile.x, bombTile.y, this.currentTicks, this.maxRange);
                tilesWithBombs.push(bombTile);
                
                // Checks whether player is still standing on the bomb after it was dropped.
                let posCheck = setInterval(() => {
                    let playerTile = getTileFromWorldLocation(this);

                    if (getDistanceTo(bombTile, this) > tileSize) {
                        //console.log("not on bomb, your coordinates:", this.x, this.y);
                        bombTile.isWalkable = false;
                        clearInterval(posCheck);
                    }
                }, 20);
            }
        }
    }

    // Inputs
    handleKeyDown(event) {
        event.preventDefault();

        switch(event.key) {
            case this.key_move_up:
                this.dy = -this.speed;
                this.dx = 0;
                break;

            case this.key_move_left:
                this.dx = -this.speed;
                this.dy = 0;
                break;

            case this.key_move_down:
                this.dy = this.speed;
                this.dx = 0;
                break;

            case this.key_move_right:
                this.dx = this.speed;
                this.dy = 0;
                break;

            case this.key_drop_bomb:
                this.dropBomb();
                break;
        }
    }

    handleKeyUp(event) {
        event.preventDefault();

        switch(event.key) {
            case this.key_move_up:
            case this.key_move_down:
                this.dy = 0;
                break;

            case this.key_move_left:
            case this.key_move_right:
                this.dx = 0;
                break;
        }
    }
};

players.push(new Player(0, 32, 32));

document.addEventListener("keyup", function(event) {
  players[0].handleKeyUp(event);
});
document.addEventListener("keydown", function(event) {
  players[0].handleKeyDown(event);
});

