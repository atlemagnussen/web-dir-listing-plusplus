import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"


@customElement('audio-link')
export class AudioLink extends LitElement {
    static styles = css`
        :host {
            display: block;
            color: var(--link-text);
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            cursor: pointer;
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
