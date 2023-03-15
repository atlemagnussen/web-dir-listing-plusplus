import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('audio-header')
export class AudioHeader extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
        }
        .wrapper {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            width: var(--default-width);
            max-width: var(--default-width);
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
            </div>
        `
    }
}
