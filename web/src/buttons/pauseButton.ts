import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"

@customElement('pause-button')
export class PauseButton extends LitElement {
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
        .pause {
            fill: var(--link-color);
        }
    `
    
    render() {
        
        return html`

            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect class="pause" width="10" height="90" x="15" y="10" />
                <rect class="pause" width="10" height="90" x="65" y="10" />
            </svg>
        `
    }
}

