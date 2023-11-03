import { playAudio, sfxs } from "./audio.js";
import { enemies } from "./enemy.js";
import { lastLevel } from "./gamestate.js";
import { canvas, ctx, game, locBlinkers, tileSize } from "./main.js";
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
            case "Zombie": {
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
            case "Ghost": {
                this.spriteSheet.src = spriteSheets.ghost_death;
                break;
            }
            case "Skeleton": {
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
// UI Animations
export class DeathReasonAnimation {
    constructor() {
        this.visible = false;
        this.frames = 0;
        this.alpha = 0.95;
        this.text = "";
    }
    
    playAnimation(text) {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;
        this.text = text;

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
            ctx.strokeStyle = `rgba(30, 30, 30, ${this.alpha})`;
            
            ctx.lineWidth = 20;
            ctx.font = "80px Minimal";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const substring = this.text.substring(0, this.frames);
            ctx.strokeText(substring, canvas.width / 2, canvas.width / 2);
            ctx.fillText(substring, canvas.width / 2, canvas.width / 2);
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
        this.alpha = 0.95;
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
            // ctx.strokeStyle = `rgba(30, 30, 30, ${this.alpha})`;
            ctx.strokeStyle = `rgba(0, 0, 0, ${this.alpha})`;
            
            ctx.lineWidth = 20;
            ctx.font = "100px Minimal";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const substring = this.text.substring(0, this.frames);
            ctx.strokeText(substring, canvas.width / 2, canvas.width / 2);
            ctx.fillText(substring, canvas.width / 2, canvas.width / 2);
        }
    }
}

export class GameOverAnimation {
    constructor() {
        this.visible = false;
        this.frames = 0;
        this.alpha = 0.95;
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

            ctx.lineWidth = 20;
            ctx.font = "100px Minimal";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Use identity matrix to draw the text to the center
            // of canvas
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const substring = this.text.substring(0, this.frames);
            ctx.strokeText(substring, canvas.width / 2, canvas.width / 2);
            ctx.fillText(substring, canvas.width / 2, canvas.width / 2);

            ctx.restore();
        }
    }
}

export class FadeTransition {
    constructor() {
        this.visible = false;
        this.frames = 0;
        this.alpha = 1.0;
        this.fadeMs = 3;
        this.fadeAmount = 0.02;
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
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}

export class TutorialAnimations {
    constructor() {
        this.visible = false;
        this.currentFrame = 0;
        this.frames = 7;
        this.keys = new Image();
        this.keysWidth = 224;
        this.keysHeight = 320;
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
        }, 6000);
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
                this.keysWidth * this.currentFrame, 0, 
                this.keysWidth, this.keysHeight, canvas.width - this.keysWidth, 0, this.keysWidth, this.keysHeight);
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
                canvas.width * this.currentFrame, 0, 
                canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        }
    }
}