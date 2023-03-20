import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('audio-header')
export class AudioHeader extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            max-width: 100%;
            width: 100%;
            overflow-y: hidden;
            overflow-x: auto;
        }
        .wrapper {
            /* max-width: 100%;
            width: 100%;
            overflow: hidden; */
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 1rem;
            width: var(--default-width);
            max-width: var(--default-width);
        }
        h1 {
            flex: 1 1 auto;
            color: var(--headline-color);
            font-size: 1.6rem;
            margin-block-start: 0;
            margin-block-end: 0;
        }
        audio-link {
            flex: 1 1 auto;
            color: var(--headline-color);
            font-size: 1.2rem;
        }
        @media only screen and (max-width: 640px) {
            .wrapper {
                width: 100%;
                max-width: 100%;
            }
        }
    `
    
    @property({attribute: true})
    title = "No title yet"
    
    
    render() {
        
        return html`
            <div class="wrapper">
                <h1>${this.title}</h1>
                <!-- <audio-link .name="${this.title}"></audio-link> -->
            </div>
        `
    }
}
