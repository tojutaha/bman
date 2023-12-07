import { ctx, tileSize } from "./main.js";

export const textParticles = [];
export class FloatingTextParticle
{
    constructor(p, text) {
        this.p = {...p};
        this.originalX = this.p.x;
        this.text = text;
        this.alpha = 1;
        this.t = 0;
        this.oscillationAmount = 10;
        this.offsetAmount = 10;
    }

    Update() {
        this.p.y -= 0.2;
        this.p.x = this.originalX + this.oscillationAmount * (Math.sin(this.t) + (Math.random() - 0.5) / this.offsetAmount);
        this.alpha -= 0.0025;
        this.t += 0.025;
    }
    
    Render() {
        ctx.font = "1.4rem Minimal";
        ctx.strokeStyle = `rgba(0, 0, 0, ${this.alpha})`;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 4;
        const xCoord = this.p.x + tileSize / 2;
        const yCoord = this.p.y + tileSize / 2;
        ctx.strokeText(this.text, xCoord, yCoord);
        ctx.fillText(this.text, xCoord, yCoord);
    }
}

export function createFloatingText(p, text)
{
    textParticles.push(new FloatingTextParticle(p, text));
}

export function renderFloatingText()
{
    for(let i = 0; i < textParticles.length; ++i) {
        textParticles[i].Render();
    }

    for(let i = textParticles.length - 1; i >= 0; i--) {
        const particle = textParticles[i];
        particle.Update();

        if(particle.alpha <= 0) {
            textParticles.splice(i, 1);
        }
    }
}