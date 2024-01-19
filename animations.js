import { playAudio, sfxs } from "./audio.js";
import { enemies } from "./enemy.js";
import { lastLevel } from "./gamestate.js";
import { initHardWallsCanvas, setTextures } from "./level.js";
import { FULL_CANVAS_SIZE, canvas, ctx, game, globalPause, locBlinkers, tileSize } from "./main.js";
import { isMobile } from "./mobile.js";
import { spriteSheets } from "./spritesheets.js";
import { exitLocation, powerupLocations } from "./tile.js";

////////////////////
// Character animations
export let deathRow = [];
export class EnemyDeathAnimation {
    constructor(x, y, type, direction) {
        this.x = x - tileSize || 0;
        this.y = y - tileSize || 0;
        this.type = type;
        this.direction = direction;

        this.spriteSheet = new Image();
        switch(type) {
            case "zombie": {
                switch(direction) {
                    case "Up": {
                        this.spriteSheet.src = spriteSheets.zombie_death_back;
                        break;
                    }
                    case "Down": {
                        this.spriteSheet.src = spriteSheets.zombie_death_front;
                        break;
                    }
                    case "Left": {
                        this.spriteSheet.src = spriteSheets.zombie_death_left;
                        break;
                    }
                    case "Right": {
                        this.spriteSheet.src = spriteSheets.zombie_death_right;
                        break;
                    }
                }
                break;
            }
            case "ghost": {
                this.spriteSheet.src = spriteSheets.ghost_death;
                break;
            }
            case "skeleton": {
                switch(direction) {
                    case "Up": {
                        this.spriteSheet.src = spriteSheets.skeleton_death_back;
                        break;
                    }
                    case "Down": {
                        this.spriteSheet.src = spriteSheets.skeleton_death_front;
                        break;
                    }
                    case "Left": {
                        this.spriteSheet.src = spriteSheets.skeleton_death_left;
                        break;
                    }
                    case "Right": {
                        this.spriteSheet.src = spriteSheets.skeleton_death_right;
                        break;
                    }
                }
                break;
            }
            case "witch": {
                switch(direction) {
                    case "Up": {
                        this.spriteSheet.src = spriteSheets.witch_death_back;
                        break;
                    }
                    case "Down": {
                        this.spriteSheet.src = spriteSheets.witch_death_front;
                        break;
                    }
                    case "Left": {
                        this.spriteSheet.src = spriteSheets.witch_death_left;
                        break;
                    }
                    case "Right": {
                        this.spriteSheet.src = spriteSheets.witch_death_right;
                        break;
                    }
                }
                break;
            }
        }
        
        this.frameSize = 192;
        this.frames = 18;
        this.currentFrame = 0;
        this.animationMs = 130;
    }

    startTimer() {
        let timer = this.frames;
        let interval = setInterval(() => {
            timer--;
            this.currentFrame++;
            if (timer <= 0) {
                this.currentFrame = 0;
                this.visible = false;
                clearInterval(interval);
                deathRow.splice(0, 1);
            }
        }, this.animationMs);
    }
}

export function renderEnemyDeaths() {
    deathRow.forEach(animation => {
        ctx.drawImage(animation.spriteSheet, 
            animation.frameSize * animation.currentFrame, 0, 
            animation.frameSize, animation.frameSize, animation.x, animation.y, animation.frameSize, animation.frameSize);
    });
}


////////////////////
// World animations
export class locBlinkingAnimation {
    constructor() {
        this.showLocation = false;
        this.isBlinking = false;
    }

    // Blink the location overlays of powerups
    startBlinking() {
        this.isBlinking = true;
        this.blinker = setInterval(() => {
            this.showLocation = !this.showLocation;

            if (!this.isBlinking) {
                clearInterval(blinker);
            }
        }, 700);
    }

    stopBlinking() {
        this.showLocation = false;
        this.isBlinking = false;
        clearInterval(this.blinker);
    }

    render() {
        if (this.showLocation) {
            powerupLocations.forEach(tile => {
                if (tile.type === "SoftWall") {
                    ctx.fillStyle = "rgba(255, 190, 130, 0.3)";
                    ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
                }
            });

            if (exitLocation.type === "SoftWall") {
                ctx.fillStyle = "rgba(255, 100, 100, 0.2)";
                ctx.fillRect(exitLocation.x, exitLocation.y, tileSize, tileSize);
            }
        }
    }
}

const doorAnimation = new Image();
export class EntranceAnimation {
    constructor() {
        this.frames = 0;
    }
    
    playAnimation() {
        locBlinkers.stopBlinking();
        this.frames = 0;
        playAudio(sfxs['DOOR_CLOSE']);
        
        this.frameTimer = setInterval(() => {
            this.frames++;

            if (this.frames >= 18) {
                clearInterval(this.frameTimer);
            }
        }, 80);
    }
    
    render() {
        if (!doorAnimation.src) {
            doorAnimation.src = spriteSheets.door;
        }
        let frameW = tileSize * 3;
        let frameH = tileSize;
        
        ctx.drawImage(doorAnimation, 0, frameH * this.frames, frameW, frameH, 0, tileSize, frameW, frameH);
    }
}

export class ExitAnimation {
    constructor() {
        // The spritesheet goes backwards
        this.frames = 11;
    }

    init() {
        locBlinkers.stopBlinking();
        this.frames = 11;
    }
    
    playAnimation() {
        locBlinkers.startBlinking();
        setTimeout(() => {
            playAudio(sfxs['DOOR_OPEN']);
            this.frameTimer = setInterval(() => {
                this.frames--;
    
                if (this.frames <= 6) {
                    clearInterval(this.frameTimer);
                }
            }, 300);
        }, 1500);
    }
    
    render() {
        let frameW = tileSize * 3;
        let frameH = tileSize;
        
        ctx.drawImage(doorAnimation, 0, frameH * this.frames, frameW, frameH, exitLocation.x - tileSize, exitLocation.y, frameW, frameH);
    }
}


////////////////////
// Text animations
const normalLineWidth = 20;
const normalFont = "100px Minimal";
const mobileLineWidth = 15;
const mobileFont = "70px Minimal";

function animateText(text) {
    // Use identity matrix to draw the text to the center of canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeText(text, canvas.width / 2, canvas.width / 2);
    ctx.fillText(text, canvas.width / 2, canvas.width / 2);
    ctx.restore();
}

export class DeathReasonAnimation {
    constructor() {
        this.visible = false;
        this.frames = 0;
        this.alpha = 0.80;
        this.text = "";
    }
    
    playAnimation(text) {
        this.visible = true;
        this.text = text;

        this.fadeIn();
        setTimeout(() => {
            this.fadeOut();
        }, 3000);
    }

    fadeIn() {
        this.alpha = 0.0;
        this.fadeInTimer = setInterval(() => {
            this.alpha += 0.05;

            if (this.alpha >= 1.0) {
                clearInterval(this.fadeInTimer);
            }
        }, 10);
    }

    fadeOut() {
        this.fadeOutTimer = setInterval(() => {
            this.alpha -= 0.05;

            if (this.alpha <= 0.0) {
                this.visible = false;
                clearInterval(this.fadeOutTimer);
            }
        }, 10);
    }
    
    render() {
        if (this.visible) {
            ctx.fillStyle = `rgba(240, 240, 240, ${this.alpha})`;
            ctx.strokeStyle = `rgba(30, 30, 30, ${this.alpha})`;
            
            ctx.lineWidth = 10;
            ctx.font = "50px Minimal";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            animateText(this.text);
        }
    }
}

export class LevelHeaderAnimation {
    constructor() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;
        this.text = ` LEVEL ${game.level}`;
    }
    
    playAnimation() {
        this.frames = 0;
        this.alpha = 0.80;
        if (!lastLevel) {
            this.text = ` LEVEL ${game.level}`;
        } else {
            this.text = " LEVEL Z";
        }

        setTimeout(() => {
            this.frameTimer = setInterval(() => {
                this.frames++;
    
                if (this.frames >= this.text.length) {
                    setTimeout(() => {
                        this.fadeOut();
                    }, 2100);
                    clearInterval(this.frameTimer);
                }
            }, 100);
        }, 1000);
    }

    fadeOut() {
        this.fadeOutTimer = setInterval(() => {
            this.alpha -= 0.05;

            if (this.alpha <= 0.0) {
                clearInterval(this.fadeOutTimer);
            }
        }, 10);
    }
    
    render() {
        if (this.visible) {
            ctx.fillStyle = `rgba(240, 240, 240, ${this.alpha})`;
            ctx.strokeStyle = `rgba(0, 0, 0, ${this.alpha})`;
            
            if (isMobile) {
                ctx.lineWidth = mobileLineWidth;
                ctx.font = mobileFont;
            } else {
                ctx.lineWidth = normalLineWidth;
                ctx.font = normalFont;
            }
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const substring = this.text.substring(0, this.frames);
            animateText(substring);
        }
    }
}

export class GameOverAnimation {
    constructor() {
        this.visible = false;
        this.frames = 0;
        this.alpha = 0.80;
        this.text = " GAME OVER";
    }
        
    playAnimation() {
        return new Promise((resolve) => {
            this.visible = true;
            this.frames = 0;
            this.alpha = 0.95;

            
            setTimeout(() => {
                playAudio(sfxs['GAMEOVER']);
                this.frameTimer = setInterval(() => {
                    this.frames++;

                    if (this.frames >= this.text.length) {
                        setTimeout(() => {
                            this.fadeOut();
                            resolve();
                        }, 2000);
                        clearInterval(this.frameTimer);
                    }
                }, 100);
            }, 2500);
        });
    }

    fadeOut() {
        this.fadeOutTimer = setInterval(() => {
            this.alpha -= 0.05;

            if (this.alpha <= 0.0) {
                clearInterval(this.fadeOutTimer);
            }
        }, 10);
    }

    render() {
        if (this.visible) {
            ctx.fillStyle = `rgba(240, 240, 240, ${this.alpha})`;
            ctx.strokeStyle = `rgba(30, 30, 30, ${this.alpha})`;

            if (isMobile) {
                ctx.lineWidth = mobileLineWidth;
                ctx.font = mobileFont;
            } else {
                ctx.lineWidth = normalLineWidth;
                ctx.font = normalFont;
            }

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const substring = this.text.substring(0, this.frames);
            animateText(substring);
        }
    }
}

////////////////////
// Overlay animations
export class FadeTransition {
    constructor() {
        this.visible = false;
        this.frames = 0;
        this.alpha = 1.0;
        this.fadeMs = 3;
        this.fadeAmount = 0.015;
    }
    
    fadeIn() {
        this.visible = true;
        let fade = setInterval(() => {
            this.alpha -= this.fadeAmount;
            if (this.alpha <= 0.0) {
                this.visible = false;
                clearInterval(fade);
            }
        }, this.fadeMs);
    }

    fadeOut() {
        this.alpha = 0.0;
        this.visible = true;
        let fade = setInterval(() => {
            this.alpha += this.fadeAmount;
            if (this.alpha >= 1.0) {
                clearInterval(fade);
            }
        }, this.fadeMs);
    }

    blackScreen() {
        this.visible = true;
        this.alpha = 1.0;
    }
    
    render() {
        if (this.visible) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.alpha})`;
            ctx.fillRect(0, 0, FULL_CANVAS_SIZE, FULL_CANVAS_SIZE);
        }
    }
}

export class TutorialAnimation {
    constructor() {
        this.visible = false;
        this.currentFrame = 0;
        this.frames = 7;
        this.keys = new Image();
        this.imageWidth = 224;
        this.imageHeight = 320;
        this.fadeMs = 60;
    }
    
    playAnimation() {
        // Doesn't show if player drops a bomb early enough.
        setTimeout(() => {

            if (game.firstBombDropped) return;
            
            this.fadeIn();
            let checker = setInterval(() => {
                if (game.firstBombExploded) {
                    this.fadeOut();
                    clearInterval(checker);
                }
            }, 500);
        }, 7000);
    }

    fadeIn() {
        this.visible = true;
        this.currentFrame = 0;
        let fade = setInterval(() => {
            if (this.currentFrame < this.frames) {
                this.currentFrame++;
            } else {
                clearInterval(fade);
            }
        }, this.fadeMs);
    }

    fadeOut() {
        let fade = setInterval(() => {
            if (this.currentFrame > 0) {
                this.currentFrame--;
            } else {
                this.visible = false;
                clearInterval(fade);
            }
        }, this.fadeMs);
    }

    render() {
        if (!this.keys.src) {
            this.keys.src = spriteSheets.tutorial_keys;
        }

        if (this.visible) {
            ctx.drawImage(this.keys, 
                this.imageWidth * this.currentFrame, 0, 
                this.imageWidth, this.imageHeight, canvas.width - this.imageWidth, 0, this.imageWidth, this.imageHeight);
        }
    }
}

export class BigBombAnimation {
    constructor() {
        this.visible = true;
        this.currentFrame = 0;
        this.frames = 45;
        this.firstHalf = 37;    // The shattering animation begins on frame 27
        this.spriteSheet = new Image();
        this.animationMs = 60;
        this.imageHeight = 832;
    }
    
    playLightUp() {
        this.currentFrame = 0;
        this.visible = true;

        let lightUp = setInterval(() => {
            if (this.currentFrame < this.firstHalf) {
                this.currentFrame++;
            } else {
                clearInterval(lightUp);
            }
        }, this.animationMs);
    }

    playShatter() {
        // The first level has special textures on mobile
        if (isMobile) {
            setTextures();
            initHardWallsCanvas();
        }
        
        let shatter = setInterval(() => {
            if (this.currentFrame < this.frames) {
                this.currentFrame++;
            } else {
                this.visible = false;
                this.currentFrame = 0;
                clearInterval(shatter);
            }

            if (this.currentFrame === 40) {
                enemies.forEach(enemy => {
                    enemy.showSprite();
                });

            }
        }, this.animationMs);
    }

    render() {
        if (!this.spriteSheet.src) {
            this.spriteSheet.src = spriteSheets.big_bomb_overlay;
        }

        if (this.visible) {
            ctx.drawImage(this.spriteSheet, 
                this.imageHeight * this.currentFrame, 0, 
                this.imageHeight, this.imageHeight, 0, 0, this.imageHeight, this.imageHeight);
        }
    }
}

///////////////////
// Shroom
const canvasContainer = document.querySelector(".canvas-container");
const floor = document.querySelector('.floor');
export let shroomTrigger = false;
export function shroom(player) {
    shroomTrigger = true;
    // Settings
    const minSize = 90;
    const maxSize = 100;
    let size = maxSize;
    let rotation = 1;

    let blur = 0.1;
    const maxBlur = 4;
    let blurring = true;
    let stopBlur = false;

    // Spritesheet
    player.spriteSheet.src = player.mushroomedSprite;
    
    // Beating blur
    let blurInterval = setInterval(() => {
        if (stopBlur && blur > 0) {
            canvas.style.filter = `blur(${blur}px)`;
            floor.style.filter = `blur(${blur}px)`;
            blur -= 0.1
        }
        else if (stopBlur && blur <= 0) {
            clearInterval(blurInterval);
        }
        else if (blur < maxBlur && blurring) {
            blur += 0.1;
        }
        else if (blur >= maxBlur) {
            blurring = false;
            blur -= 0.1;
        }
        else if (blur <= 1) {
            blurring = true;
        } else {
            blur -= 0.1;
        }
    }, 30);
    
    // Rotation and zoom
    let effectInterval = setInterval(() => {
        // Speed up the effect if dead or exited game
        if (!game.isRunning) {
            player.spriteSheet.src = player.lanternSprite;
            clearInterval(effectInterval);
            canvas.style.borderStyle = "none";
            let gameOverInterval = setInterval(() => {
                if (rotation < 180) {
                    rotation--;
                } else {
                    rotation++;
                }
                if (rotation <= 0 || rotation >= 360) {
                    rotation = 0;
                    stopBlur = true;
                    shroomTrigger = false;
                    canvas.style.borderStyle = "solid";
                    clearInterval(gameOverInterval);
                }
                floor.style.transform = `rotate(-${rotation}deg)`;
                canvas.style.transform = `rotate(-${rotation}deg)`;
                canvas.style.filter = `hue-rotate(${rotation}deg) blur(${blur}px)`;
                floor.style.filter = `hue-rotate(${rotation}deg) blur(${blur}px)`;
            }, 1);
        }        
        else if (globalPause) {
            return;
        }
        else if (rotation > 0 && rotation < 360) {
            rotation++
        // Clear all effects after one full rotation
        } else {
            rotation = 0;
            stopBlur = true;
            shroomTrigger = false;
            setTimeout(() => {
                player.spriteSheet.src = player.lanternSprite;
            }, 1000);
            clearInterval(effectInterval);
        }
        floor.style.transform = `rotate(-${rotation}deg)`;
        canvas.style.transform = `rotate(-${rotation}deg)`;
        canvas.style.filter = `hue-rotate(${rotation}deg) blur(${blur}px)`;
        floor.style.filter = `hue-rotate(${rotation}deg) blur(${blur}px)`;

        // Zoom
        if (size > minSize && rotation > 0 && rotation < 350) {
            size--;
        }
        else if (size < maxSize && rotation >= 350) {
            size++
        }
        canvasContainer.style.cssText = `scale: ${size}%`;
    }, 20);
}