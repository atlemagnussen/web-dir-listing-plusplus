import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"


@customElement('audio-link')
export class AudioLink extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            max-width: 100%;
            color: var(--link-text);
        }
        * {
            box-sizing: border-box;
        }
        span {
            cursor: pointer;
            width: 100%;
            /* word-wrap: break-word; */
            overflow: hidden;
            text-overflow: ellipsis;
        }        
        
    `

    @property({attribute: false})
    name = ""

    render() {
        return html`
            <span title="${this.name}">${this.name}</span>
        `
    }

}
