import { playAudio, sfxs } from "./audio.js";
import { lastLevel } from "./gamestate.js";
import { ctx, game } from "./main.js";

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
            ctx.strokeStyle = `rgba(30, 30, 30, ${this.alpha})`;
            
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
    }
    
    // playAnimation() {
    //     this.visible = true;
    //     this.frames = 0;
    //     this.alpha = 1.0;

    //     setTimeout(() => {
    //         this.frameTimer = setInterval(() => {
    //             this.frames++;
    
    //             if (this.frames >= this.text.length) {
    //                 setTimeout(() => {
    //                     this.fadeOut();
    //                 }, 2000);
    //                 clearInterval(this.frameTimer);
    //             }
    //         }, 100);
    //     }, 500);
    // }

    // fadeOut() {
    //     this.fadeOutTimer = setInterval(() => {
    //         this.alpha -= 0.05;

    //         if (this.alpha <= 0.0) {
    //             clearInterval(this.fadeOutTimer);
    //         }
    //     }, 10);
    // }
    
    render() {
        if (this.visible) {
            ctx.fillStyle = `rgba(0, 0, 0, 0)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}
