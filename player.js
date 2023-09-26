import { canvas, ctx, level, levelHeight, levelWidth, tileSize, spriteSheet } from "./main.js";
import { PlayAudio } from "./audio.js";
import { Bomb, tilesWithBombs } from "./bomb.js";
import { Powerup, powerups } from "./powerup.js";
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
    players.forEach((p, index) => {
        p.update();
        // TODO: Hack..
        const select = index == 1 ? 96 : 64;
        ctx.drawImage(spriteSheet, 0, select, 32, 32, p.x, p.y, p.w, p.h);
    });
}

////////////////////////////////////////////////////////////////////////////////
// Players
export const players = [];

class Player
{
    constructor(id, x, y, keybinds, sprite) {
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
        this.keybinds = keybinds;

        // Powerups
        this.powerup = new Powerup();
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
                    // Testi
                    if (!this.isDead) {
                        PlayAudio("audio/death01.wav");
                        this.isDead = true;
                        console.info("DEATH BY TILE");
                    }
                }

                // No picking up from just touching the walls
                const pickupOffset = 3;
                if (hasPowerup(x, y) &&
                    nextX + (this.w - this.collisionOffset - pickupOffset) >= tileLeft &&
                    (nextX + this.collisionOffset + pickupOffset) < tileRight &&
                    nextY + (this.h - this.collisionOffset - pickupOffset) >= tileTop &&
                    (nextY + this.collisionOffset + pickupOffset) < tileBottom
                ) {
                    this.powerup.pickup(level[x][y], this);
                }
            }
        }

        //console.log(collides);
        if (!collides) {
            this.x += this.dx;
            this.y += this.dy;
        }
    }

    // Bomb
    dropBomb() {
        let bombTile = getTileFromWorldLocation(this);

        if (tilesWithBombs.indexOf(bombTile) === -1 && tilesWithBombs.length < this.powerup.maxBombs) {
            if (!bombTile.bomb || bombTile.bomb.hasExploded) {
                bombTile.bomb = new Bomb(bombTile.x, bombTile.y, this.currentTicks, this.powerup.maxRange);
                tilesWithBombs.push(bombTile);
                
                // Checks whether any player is still standing on the bomb after it was dropped.
                let posCheck = setInterval(() => {
                    let isPlayerOnBomb = false;
                    for (let i = 0; i < players.length; i++) {
                        if (getDistanceTo(bombTile, players[i]) <= tileSize) {
                            isPlayerOnBomb = true;
                            break;
                        }
                    }
                    if (!isPlayerOnBomb) {
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
            case this.keybinds.move_up:
                this.dy = -this.speed;
                this.dx = 0;
                break;

            case this.keybinds.move_left:
                this.dx = -this.speed;
                this.dy = 0;
                break;

            case this.keybinds.move_down:
                this.dy = this.speed;
                this.dx = 0;
                break;

            case this.keybinds.move_right:
                this.dx = this.speed;
                this.dy = 0;
                break;

            case this.keybinds.drop_bomb:
                this.dropBomb();
                break;
        }
    }

    handleKeyUp(event) {
        event.preventDefault();

        switch(event.key) {
            case this.keybinds.move_up:
            case this.keybinds.move_down:
                this.dy = 0;
                break;

            case this.keybinds.move_left:
            case this.keybinds.move_right:
                this.dx = 0;
                break;
        }
    }

    onDeath() {
        console.log("onDeath");
    }
};

export const keybinds1 = {
    move_up: "w",
    move_down: "s",
    move_left: "a",
    move_right: "d",
    drop_bomb: " ",
};

export const keybinds2 = {
    move_up: "ArrowUp",
    move_down: "ArrowDown",
    move_left: "ArrowLeft",
    move_right: "ArrowRight",
    drop_bomb: "Enter",
};

document.addEventListener("DOMContentLoaded", function ()
{
    players.push(new Player(0, 32, 32, keybinds1));
    players.push(new Player(1, (levelWidth-2)*tileSize, (levelHeight-2)*tileSize, keybinds2));
    for (let i = 0; i < players.length; i++) {
        document.addEventListener("keyup", function(event) {
            players[i].handleKeyUp(event);
        });
        document.addEventListener("keydown", function(event) {
            players[i].handleKeyDown(event);
        });
    }
});

