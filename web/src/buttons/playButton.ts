import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('play-button')
export class PlayButton extends LitElement {
    static styles = css`
        :host {
            display: inline-flex;
            justify-content: center;
            overflow: none;
            height: var(--button-height, 4rem);
            width: var(--button-width, 4rem);
            color: var(--link-color);
            cursor: pointer;
        }
        svg {
            width: 100%;
            height: 100%;
        }
        .triangle {
            stroke-width: 5px;
            stroke: var(--link-color);
            fill: transparent;
        }
    `
    
    render() {
        
        return html`

            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <polygon class="triangle" stroke-linejoin="round" points="10,0 80,50 10, 100" />
            </svg>
        `
    }
}

