import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import {Subscription} from "rxjs"
import { playingFile } from "./audioState"

@customElement('audio-player')
export class AudioPlayer extends LitElement {
    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            width: 100vw;
            overflow: none;
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
        label, audio {
            flex: 1 1 50%;
        }
        label {
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `
    sub: Subscription | null = null

    connectedCallback() {
        super.connectedCallback()
        this.sub = playingFile.subscribe(file => {
            this.url = file.webpath
            this.label = file.name
            this.ext = file.ext
        })
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        if (this.sub) {
            this.sub.unsubscribe()
        }
    }
    @property({attribute: true})
    url = ""
    
    @property({attribute: true})
    label = ""

    @property({attribute: true})
    ext = ""
    render() {
        let label = this.label
        if (!this.url || !this.ext)
            label = "Not playing anything"
            
        return html`
            <div class="wrapper">
                <audio controls src="${this.url}" type="${this.ext}"></audio>
                <label>${label}</label>
            </div>
        `
    }
}

// declare global {
//     interface HTMLElementTagNameMap {
//         'my-element': MyElement
//     }
// }
