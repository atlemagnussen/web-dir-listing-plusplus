import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('audio-player')
export class AudioElement extends LitElement {
    
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

    static styles = css`
    :host {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem;
        text-align: center;
    }
  `
}

// declare global {
//     interface HTMLElementTagNameMap {
//         'my-element': MyElement
//     }
// }
