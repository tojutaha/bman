// TODO: säätää pommien collision
// TODO: Bugi: Grid movement, jos rämpyttää liikkumis-nappeja, pelaaja voi liikkua nopeammin kuin on tarkoitus.
// TODO: deltaTime smoothMovementtiin



// Tämän kun heittää trueksi, saa sen ensimmäisen version
// liikkumisen takaisin.
const useGridMovement = false;

const gridMovementSpeed = 125; // interval / ms
let initialMove = true;

export let smoothMovementSpeed = 1.0; // pixels/s

export function setMovementSpeed(value) {
    smoothMovementSpeed = value;
}

export const player = {
    x: 32, // start from top left corner
    y: 32,
    w: 30,
    h: 30,
    dx: 0,
    dy: 0,
};

export const Direction = {
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
}

// TODO: Tätä ei välttämättä tarvii enää exporttina (deklaraatio takaisin smoothMovementUpdatePlayeriin)
// No pixel-perfect collisions pls
export const playerOffset = 5;

////////////////////
// Render/Update
let movementTimer = null;

function startMovement(direction)
{
    if (movementTimer === null) {
        movementTimer = setInterval(() => {
            movePlayer(direction);
        }, gridMovementSpeed);
    }
}

function stopMovement()
{
    initialMove = true;
    clearInterval(movementTimer);
    movementTimer = null;
}

function movePlayer(direction)
{
    switch(direction) {
        case Direction.UP:
            player.dy = -1;
            player.dx = 0;
            break;
        case Direction.DOWN:
            player.dy = 1;
            player.dx = 0;
            break;
        case Direction.LEFT:
            player.dx = -1;
            player.dy = 0;
            break;
        case Direction.RIGHT:
            player.dx = 1;
            player.dy = 0;
            break;
    }

}

function gridMovementUpdatePlayer()
{
    let nextX = Math.floor((player.x + player.w / 2) / tileSize);
    let nextY = Math.floor((player.y + player.h / 2) / tileSize);

    nextX += player.dx;
    nextY += player.dy;

    if (isWalkable(nextX, nextY)) {
        player.x = nextX * tileSize;
        player.y = nextY * tileSize;
        player.dx = 0;
        player.dy = 0;
    }
}

function smoothMovementUpdatePlayer()
{
    const nextX = player.x + player.dx;
    const nextY = player.y + player.dy;

    let collides = false;
    for (let y = 0; y < levelHeight; y++) {
        for (let x = 0; x < levelWidth; x++) {
            const tileLeft   = level[x][y].x;
            const tileRight  = level[x][y].x + tileSize;
            const tileTop    = level[x][y].y;
            const tileBottom = level[x][y].y + tileSize;


            if (!isWalkable(x, y) &&
                nextX + (player.w - playerOffset) >= tileLeft &&
                (nextX + playerOffset) < tileRight &&
                nextY + (player.h - playerOffset) >= tileTop &&
                (nextY + playerOffset) < tileBottom
            ) {

                collides = true;
            }

            if (isDeadly(x, y) &&
                nextX + (player.w - playerOffset) >= tileLeft &&
                (nextX + playerOffset) < tileRight &&
                nextY + (player.h - playerOffset) >= tileTop &&
                (nextY + playerOffset) < tileBottom
            ) {
                console.info("DEATH BY TILE");
            }

            // No picking up from just touching the walls
            const pickupOffset = 3;
            if (hasPowerup(x, y) &&
                nextX + (player.w - playerOffset - pickupOffset) >= tileLeft &&
                (nextX + playerOffset + pickupOffset) < tileRight &&
                nextY + (player.h - playerOffset - pickupOffset) >= tileTop &&
                (nextY + playerOffset + pickupOffset) < tileBottom
            ) {
                pickPowerup(level[x][y]);
            }
        }
    }

    //console.log(collides);
    if (!collides) {
        player.x += player.dx;
        player.y += player.dy;
    }
}

const updatePlayer = useGridMovement ? gridMovementUpdatePlayer : smoothMovementUpdatePlayer;
export function renderPlayer()
{
    updatePlayer();
    
    // Alkuperäinen palikka
    // ctx.fillStyle = "#ff0000";
    // ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.drawImage(spriteSheet, 0, 64, 32, 32, player.x, player.y, player.w, player.h);


    // Uudet pelaajat
    players.forEach(p => {
        p.update();
        ctx.drawImage(spriteSheet, 0, 64, 32, 32, p.x, p.y, p.w, p.h);
    });
}

////////////////////
// Inputs
function gridMovementHandleKeyDown(event)
{
    event.preventDefault();

    const move = initialMove ? movePlayer : startMovement;
    switch(event.key) {
        case "w":
            //startMovement(Direction.UP);
            move(Direction.UP);
            initialMove = false;
            break;

        case "a":
            //startMovement(Direction.LEFT);
            move(Direction.LEFT);
            initialMove = false;
            break;

        case "s":
            //startMovement(Direction.DOWN);
            move(Direction.DOWN);
            initialMove = false;
            break;

        case "d":
            //startMovement(Direction.RIGHT);
            move(Direction.RIGHT);
            initialMove = false;
            break;

        case " ":
            dropBomb();
            break;
    }
}

function smoothMovementHandleKeyDown(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
            player.dy = -smoothMovementSpeed;
            player.dx = 0;
            break;

        case "a":
            player.dx = -smoothMovementSpeed;
            player.dy = 0;
            break;

        case "s":
            player.dy = smoothMovementSpeed;
            player.dx = 0;
            break;

        case "d":
            player.dx = smoothMovementSpeed;
            player.dy = 0;
            break;

        case " ":
            dropBomb();
            break;
    }
}

function gridMovementHandleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
        case "s":
        case "a":
        case "d":
            stopMovement();
            break;
    }
}

function smoothMovementHandleKeyUp(event)
{
    event.preventDefault();

    switch(event.key) {
        case "w":
        case "s":
            player.dy = 0;
            break;

        case "a":
        case "d":
            player.dx = 0;
            break;
    }
}

////////////////////
// DOM
const handleKeyDown = useGridMovement ? gridMovementHandleKeyDown : smoothMovementHandleKeyDown;
const handleKeyUp = useGridMovement ? gridMovementHandleKeyUp : smoothMovementHandleKeyUp;
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

