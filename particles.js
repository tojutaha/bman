import { ctx } from "./main.js";

export const textParticles = [];
export class FloatingTextParticle
{
    constructor(p, text) {
        this.p = {...p};
        this.text = text;
        this.alpha = 1;
        this.t = 0;
    }

    Update() {
        this.p.y -= 0.1;
        this.p.x += Math.sin(this.t) + (Math.random() - 0.5) / 10;
        this.alpha -= 0.0025;
        this.t += 0.025;
    }

    Render() {
        ctx.font = "14px Arial"; // TODO: Parempi fontti
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fillText(this.text, this.p.x, this.p.y);
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