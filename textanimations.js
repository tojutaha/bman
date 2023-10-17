import { ctx } from "./main";

// TODO: ei tuore versio, toistaiseksi vielä level.js!
// TODO: kun koitti käyttää tätä tiedostoa valitti MIME tyypistä
export class LevelHeaderAnimation {
    constructor() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;
    }
    
    playAnimation() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;

        setTimeout(() => {
            this.frameTimer = setInterval(() => {
                this.frames++;
    
                if (this.frames >= 7) {
                    setTimeout(() => {
                        this.fadeOut();
                    }, 2000);
                    clearInterval(this.frameTimer);
                }
            }, 100);
        }, 500);
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

            if (this.frames === 1) {
                ctx.strokeText("L", canvas.width / 2, canvas.width / 2);
                ctx.fillText("L", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 2) {
                ctx.strokeText("LE", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LE", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 3) {
                ctx.strokeText("LEV", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEV", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 4) {
                ctx.strokeText("LEVE", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVE", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 5) {
                ctx.strokeText("LEVEL", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVEL", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 6) {
                ctx.strokeText("LEVEL ", canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVEL ", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames >= 7) {
                ctx.strokeText("LEVEL " + game.level, canvas.width / 2, canvas.width / 2);
                ctx.fillText("LEVEL " + game.level, canvas.width / 2, canvas.width / 2);
            }
        }
    }
}

export class GameOverAnimation {
    constructor() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;
    }
    
    playAnimation() {
        this.visible = true;
        this.frames = 0;
        this.alpha = 0.95;

        setTimeout(() => {
            this.frameTimer = setInterval(() => {
                this.frames++;
    
                if (this.frames >= 8) {
                    setTimeout(() => {
                        this.fadeOut();
                    }, 2000);
                    clearInterval(this.frameTimer);
                }
            }, 100);
        }, 500);
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

            if (this.frames === 1) {
                ctx.strokeText("G", canvas.width / 2, canvas.width / 2);
                ctx.fillText("G", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 2) {
                ctx.strokeText("GA", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GA", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 3) {
                ctx.strokeText("GAM", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAM", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 3) {
                ctx.strokeText("GAME", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAME", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 4) {
                ctx.strokeText("GAME ", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAME ", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 5) {
                ctx.strokeText("GAME O", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAME O", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 6) {
                ctx.strokeText("GAME OV", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAME OV", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 7) {
                ctx.strokeText("GAME OVE", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAME OVE", canvas.width / 2, canvas.width / 2);
            }
            if (this.frames === 8) {
                ctx.strokeText("GAME OVER", canvas.width / 2, canvas.width / 2);
                ctx.fillText("GAME OVER", canvas.width / 2, canvas.width / 2);
            }
        }
    }
}
