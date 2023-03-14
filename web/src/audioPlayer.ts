import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement('audio-player')
export class AudioPlayer extends LitElement {
    static styles = css`
        :host {
            display: block;
        }
    `
    
    @property({attribute: true})
    url = ""
    
    @property({attribute: true})
    label = ""

    @property({attribute: true})
    ext = ""
    render() {
        if (!this.url || !this.ext)
            return html`
                <label>Not playing anything</label>
            `
        return html`
            <label>${this.label}</label>
            <audio controls src="${this.url}" type="${this.ext}"></audio>
        `
    }
}

// declare global {
//     interface HTMLElementTagNameMap {
//         'my-element': MyElement
//     }
// }
