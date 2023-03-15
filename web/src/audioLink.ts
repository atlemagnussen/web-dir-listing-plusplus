import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"


@customElement('audio-link')
export class AudioLink extends LitElement {
    static styles = css`
        :host {
            display: inline-flex;
            justify-content: left;
            max-width: 100%;
            color: var(--link-color);
        }
        label {
            cursor: pointer;
        }        
        
    `

    @property({attribute: false})
    name = ""

    render() {
        return html`
            <label>${this.name}</label>
        `
    }

}
